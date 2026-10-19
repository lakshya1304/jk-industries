import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { put, del } from "@vercel/blob";
import { getAdminApiSession, unauthorizedResponse } from "@/lib/api-auth";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

/**
 * POST /api/admin/upload — image upload (admin only).
 *
 * Validates MIME type and size, then stores the file:
 *   - With `BLOB_READ_WRITE_TOKEN` set (Vercel Blob store) → uploaded to the
 *     Vercel Blob CDN — works on serverless platforms.
 *   - Otherwise → written to public/uploads (local/VPS filesystem only).
 * Filenames are random (timestamp + UUID) so they can never be guessed.
 *
 * DELETE /api/admin/upload?url=... — remove a previously uploaded image.
 * Only URLs produced by this route are accepted (Vercel Blob host or /uploads/).
 */
export async function POST(request: Request) {
  const session = await getAdminApiSession();
  if (!session) return unauthorizedResponse();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file was provided." }, { status: 400 });
  }

  const ext = EXT[file.type];
  if (!ext) {
    return Response.json(
      { error: "Unsupported file type. Use a JPG, PNG, WEBP, AVIF or GIF image." },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Image is too large. Maximum size is 10 MB." }, { status: 413 });
  }
  if (file.size === 0) {
    return Response.json({ error: "The uploaded file is empty." }, { status: 400 });
  }

  const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

  // 1) Vercel Blob (production / serverless) — preferred when configured.
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (blobToken) {
    try {
      const blob = await put(filename, file.stream(), {
        access: "public",
        token: blobToken,
      });
      return Response.json({ ok: true, url: blob.url }, { status: 201 });
    } catch (err) {
      console.error("[api/admin/upload] blob upload failed:", err);
      return Response.json(
        { error: "Could not store the image in blob storage. Please try again." },
        { status: 500 }
      );
    }
  }

  // 2) Local filesystem fallback (dev servers and persistent VPS hosting).
  const dir = path.join(process.cwd(), "public", "uploads");
  try {
    await mkdir(dir, { recursive: true });
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, filename), bytes);
  } catch (err) {
    console.error("[api/admin/upload] failed to write file:", err);
    return Response.json(
      {
        error:
          "Could not store the image. On Vercel, create a Blob store (Storage tab) so uploads use CDN storage.",
      },
      { status: 500 }
    );
  }

  return Response.json({ ok: true, url: `/uploads/${filename}` }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await getAdminApiSession();
  if (!session) return unauthorizedResponse();

  const url = new URL(request.url).searchParams.get("url") ?? "";
  if (!url) return Response.json({ error: "No image URL was provided." }, { status: 400 });

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  // Only allow deleting files this app created.
  if (url.startsWith("/uploads/")) {
    const filename = path.basename(url);
    if (!/^[\w.-]+$/.test(filename)) {
      return Response.json({ error: "Invalid image path." }, { status: 400 });
    }
    try {
      await unlink(path.join(process.cwd(), "public", "uploads", filename));
      return Response.json({ ok: true, deleted: true });
    } catch {
      // Already gone — treat as success so the UI can drop it from the list.
      return Response.json({ ok: true, deleted: false });
    }
  }

  if (blobToken && /^https:\/\/[\w-]+\.public\.blob\.vercel-storage\.com\//.test(url)) {
    try {
      await del(url, { token: blobToken });
      return Response.json({ ok: true, deleted: true });
    } catch (err) {
      console.error("[api/admin/upload] blob delete failed:", err);
      return Response.json({ error: "Could not delete the image from storage." }, { status: 500 });
    }
  }

  return Response.json(
    { error: "Only images uploaded here can be deleted from storage." },
    { status: 400 }
  );
}

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { getAdminApiSession, unauthorizedResponse } from "@/lib/api-auth";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/**
 * POST /api/admin/upload — image upload (admin only).
 *
 * Validates MIME type and size, then stores the file:
 *   - With `BLOB_READ_WRITE_TOKEN` set (Vercel Blob store) → uploaded to the
 *     Vercel Blob CDN — works on serverless platforms.
 *   - Otherwise → written to public/uploads (local/VPS filesystem only).
 * Filenames are random (timestamp + UUID) so they can never be guessed.
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
      { error: "Unsupported file type. Use a JPG, PNG, WEBP or AVIF image." },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Image is too large. Maximum size is 5 MB." }, { status: 413 });
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

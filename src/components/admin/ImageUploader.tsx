"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

const MAX_IMAGES = 6;

export function ImageUploader({
  images,
  onChange,
}: {
  images: string[];
  onChange: (next: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlValue, setUrlValue] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    const next = [...images];
    for (const file of Array.from(files)) {
      if (next.length >= MAX_IMAGES) {
        setError(`Maximum ${MAX_IMAGES} images allowed.`);
        break;
      }
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.error || "Upload failed.");
          continue;
        }
        next.push(data.url);
      } catch {
        setError("Upload failed due to a network error.");
      }
    }
    onChange(next.slice(0, MAX_IMAGES));
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function addUrl() {
    const url = urlValue.trim();
    if (!url) return;
    if (images.length >= MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed.`);
      return;
    }
    setError(null);
    onChange([...images, url].slice(0, MAX_IMAGES));
    setUrlValue("");
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((src, i) => (
          <div key={`${src}-${i}`} className="group relative aspect-square overflow-hidden rounded-xl border border-navy-900/10 bg-navy-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="size-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              aria-label="Remove image"
              className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1.5 text-red-600 opacity-0 shadow transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            >
              <Trash2 className="size-3.5" aria-hidden />
            </button>
          </div>
        ))}

        {images.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="grid aspect-square place-items-center rounded-xl border border-dashed border-navy-900/20 bg-white text-ink-mute transition-colors hover:border-fresh-600 hover:text-fresh-700 disabled:opacity-60"
          >
            <span className="flex flex-col items-center gap-1 text-[11px] font-semibold">
              <ImagePlus className="size-5" aria-hidden />
              {uploading ? "Uploading…" : "Upload"}
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex gap-2">
        <input
          type="url"
          value={urlValue}
          onChange={(e) => setUrlValue(e.target.value)}
          placeholder="…or paste an image URL"
          className="w-full rounded-xl border border-navy-900/12 bg-white px-3.5 py-2 text-xs text-navy-900 placeholder:text-slate-400 focus:border-fresh-600 focus:outline-none focus:ring-2 focus:ring-fresh-600/25"
        />
        <button
          type="button"
          onClick={addUrl}
          className="shrink-0 rounded-xl border border-navy-900/15 px-3.5 py-2 text-xs font-bold text-navy-900 transition-colors hover:bg-navy-50"
        >
          Add
        </button>
      </div>

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
      <p className="text-xs text-ink-mute">
        JPG, PNG, WEBP or AVIF up to 5 MB. The first image is used as the main photo.
      </p>
    </div>
  );
}

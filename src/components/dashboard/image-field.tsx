"use client";

import { useId, useRef, useState } from "react";
import { Input, Label } from "@/components/ui/field";
import { cn } from "@/lib/cn";

const accepted = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_BYTES = 4 * 1024 * 1024;

type ImageFieldProps = {
  name: string;
  label: string;
  defaultValue?: string | null;
  hint?: string;
  // "contain" for logos and flags, "cover" for photos.
  fit?: "cover" | "contain";
};

// An image address field with an Upload button. The server checks every file again; the
// checks here only save a wasted upload.
export function ImageField({ name, label, defaultValue, hint, fit = "cover" }: ImageFieldProps) {
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setError("");
    if (!accepted.includes(file.type)) return setError("Choose a JPG, PNG, WebP, GIF or AVIF image.");
    if (file.size > MAX_BYTES) return setError("The image is too large. The limit is 4 MB.");

    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/uploads/image", { method: "POST", body });
      const result = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!response.ok || !result.url) setError(result.error ?? "The upload failed. Please try again.");
      else setUrl(result.url);
    } catch {
      setError("The upload failed. Check your connection and try again.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-white/70 bg-white/70">
          {/* A plain img: the preview may show an address next/image is not set up for yet. */}
          {url && !error && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className={cn("size-full", fit === "contain" ? "object-contain p-1.5" : "object-cover")} />
          )}
          {busy && <span className="absolute inset-0 flex items-center justify-center bg-white/80 text-xs font-semibold text-brand-800">Uploading…</span>}
        </div>
        <div className="grid min-w-0 flex-1 gap-2">
          <Input id={id} name={name} type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://… or upload" />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className="h-8 rounded-full bg-brand-600/10 px-3 text-xs font-semibold text-brand-800 hover:bg-brand-600/20 disabled:opacity-50"
            >
              {url ? "Replace image" : "Upload image"}
            </button>
            {url && (
              <button type="button" disabled={busy} onClick={() => setUrl("")} className="h-8 rounded-full px-3 text-xs font-semibold text-red-700 hover:bg-red-500/10">
                Remove
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={accepted.join(",")}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />
        </div>
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 text-xs font-medium text-red-700">{error}</p>
      ) : (
        <p className="mt-1.5 text-xs text-muted">{hint ?? "JPG, PNG, WebP, GIF or AVIF, up to 4 MB."}</p>
      )}
    </div>
  );
}

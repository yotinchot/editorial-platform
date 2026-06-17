"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";

import type { EditorialImage } from "@/types/image";
import { uploadEditorialImage, validateImageFile } from "@/lib/upload-image";

// ── Props ───────────────────────────────────────────────────────────────────

interface CoverImageProps {
  value: EditorialImage | null;
  onChange: (image: EditorialImage | null) => void;
}

// ── Component ───────────────────────────────────────────────────────────────

/**
 * Cover image uploader for the post editor sidebar.
 *
 * Handles:
 *   - File selection via hidden <input type="file">
 *   - Type validation (JPEG / PNG / WEBP only)
 *   - Client-side compression before upload
 *   - Signed Cloudinary upload via server action
 *   - Preview after upload
 *   - Alt text editing
 *   - Image removal
 *   - Clear loading and error states
 *
 * Design: minimal and editorial — dashed border upload target, clean preview.
 */
export function CoverImage({ value, onChange }: CoverImageProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so the same file can be reselected after an error.
    e.target.value = "";
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const alt = window.prompt("ใส่ alt text สำหรับภาพหน้าปก:") ?? "";

    setError(null);
    setUploading(true);
    try {
      const image = await uploadEditorialImage(file, alt);
      onChange(image);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "อัพโหลดไม่สำเร็จ โปรดลองอีกครั้ง",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      {/* Label */}
      <p className="text-xs font-medium uppercase tracking-wide text-foreground/40">
        ภาพหน้าปก
      </p>

      {value ? (
        // ── Preview state ──────────────────────────────────────────────
        <div className="space-y-2">
          {/* Image preview */}
          <div className="relative aspect-video overflow-hidden rounded-sm border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.url}
              alt={value.alt}
              width={value.width}
              height={value.height}
              className="h-full w-full object-cover"
            />
            {/* Remove button */}
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="ลบภาพหน้าปก"
              className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-sm bg-background/90 text-foreground/50 transition-colors hover:text-destructive"
            >
              <X className="size-3" />
            </button>
          </div>

          {/* Alt text edit */}
          <input
            type="text"
            value={value.alt}
            onChange={(e) => onChange({ ...value, alt: e.target.value })}
            placeholder="Alt text…"
            aria-label="Alt text ของภาพหน้าปก"
            className="w-full border-0 bg-transparent px-0 text-xs text-foreground/60 placeholder:text-foreground/30 focus:outline-none"
          />

          {/* Replace */}
          <button
            type="button"
            onClick={triggerFileInput}
            disabled={uploading}
            className="text-xs text-foreground/35 underline-offset-2 transition-colors hover:text-foreground hover:underline disabled:pointer-events-none"
          >
            {uploading ? "กำลังอัพโหลด…" : "เปลี่ยนภาพ"}
          </button>
        </div>
      ) : (
        // ── Empty / uploading state ────────────────────────────────────
        <button
          type="button"
          onClick={triggerFileInput}
          disabled={uploading}
          aria-label="อัพโหลดภาพหน้าปก"
          className="flex w-full items-center justify-center gap-1.5 rounded-sm border border-dashed border-border py-5 text-xs text-foreground/40 transition-colors hover:border-foreground/25 hover:text-foreground/60 disabled:pointer-events-none disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              กำลังอัพโหลด…
            </>
          ) : (
            <>
              <ImagePlus className="size-3.5" />
              เพิ่มภาพหน้าปก
            </>
          )}
        </button>
      )}

      {/* Error */}
      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        aria-hidden="true"
      />
    </div>
  );
}

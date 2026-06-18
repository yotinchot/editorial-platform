"use client";

import { useRef, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { ImagePlus, Loader2, Map as MapIcon, Trash2, X } from "lucide-react";

import type {
  GalleryImage,
  GalleryLayout,
  TravelGalleryBlockAttrs,
} from "@/lib/tiptap-nodes/travel-gallery-block";
import { LAYOUT_MAX } from "@/lib/tiptap-nodes/travel-gallery-constants";
import { uploadEditorialImage, validateImageFile } from "@/lib/upload-image";

// ── Helpers ─────────────────────────────────────────────────────────────────

function stopProp(e: React.KeyboardEvent) {
  e.stopPropagation();
}

const LAYOUT_OPTIONS: { value: GalleryLayout; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "two-up", label: "Two up" },
  { value: "three-up", label: "Three up" },
  { value: "four-up", label: "Four up" },
];

// Tailwind grid class per layout (editor preview only — not used in renderHTML)
const GRID_CLASS: Record<GalleryLayout, string> = {
  single: "grid-cols-1",
  "two-up": "grid-cols-2",
  "three-up": "grid-cols-3",
  "four-up": "grid-cols-2",
};

// ── Component ────────────────────────────────────────────────────────────────

/**
 * React NodeView for TravelGalleryBlock.
 *
 * Slot positions are anchored by the `slotIndex` field on each GalleryImage,
 * not by array index. This ensures images remain in the correct visual
 * position after non-sequential uploads, removals, and editor reloads.
 */
export function TravelGalleryBlockView({
  node,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const a = node.attrs as TravelGalleryBlockAttrs;
  const layout: GalleryLayout = a.layout ?? "single";
  const images: GalleryImage[] = Array.isArray(a.images) ? a.images : [];

  // Per-slot upload state
  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const maxSlots = LAYOUT_MAX[layout];

  // ── Slot map ────────────────────────────────────────────────────────────
  // Key images by their canonical slotIndex rather than array position.
  // This is the fix for ISSUE-1: non-sequential uploads and removals no
  // longer corrupt the visual slot → image mapping on reload.
  const slotMap = new Map<number, GalleryImage>(
    images.map((img): [number, GalleryImage] => [img.slotIndex, img]),
  );
  const slots = Array.from(
    { length: maxSlots },
    (_, i) => slotMap.get(i) ?? null,
  );

  // ── Layout change (ISSUE-2) ─────────────────────────────────────────────
  const handleLayoutChange = (newLayout: GalleryLayout) => {
    const newMax = LAYOUT_MAX[newLayout];
    const toDiscard = images.filter((img) => img.slotIndex >= newMax);

    // Ask for confirmation before discarding any uploaded images (ISSUE-2).
    if (toDiscard.length > 0) {
      const ok = window.confirm(
        `การเปลี่ยน layout เป็น "${newLayout}" จะลบรูปภาพ ${toDiscard.length} ภาพที่เกินจำนวนช่อง ต้องการดำเนินการต่อไหม?`,
      );
      if (!ok) return;
    }

    // Clear per-slot errors whenever the layout changes (LOW-5).
    setErrors({});

    updateAttributes({
      layout: newLayout,
      images: images.filter((img) => img.slotIndex < newMax),
    });
  };

  // ── Image upload for a slot ─────────────────────────────────────────────
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    slotIndex: number,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setErrors((prev) => ({ ...prev, [slotIndex]: validationError }));
      return;
    }

    const alt = window.prompt("ใส่ alt text สำหรับภาพ:") ?? "";

    setErrors((prev) => ({ ...prev, [slotIndex]: "" }));
    setUploading((prev) => ({ ...prev, [slotIndex]: true }));

    try {
      const img = await uploadEditorialImage(file, alt);

      // ISSUE-1 fix: replace any existing image at this slot (by slotIndex),
      // then add the new image with its explicit slotIndex.
      // The array order is irrelevant — rendering uses slotMap.get(i).
      const newImages: GalleryImage[] = [
        ...images.filter((existing) => existing.slotIndex !== slotIndex),
        {
          url: img.url,
          alt: img.alt,
          caption: "",
          width: img.width,
          height: img.height,
          slotIndex,
          publicId: img.publicId,
        },
      ];

      updateAttributes({ images: newImages });
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [slotIndex]: err instanceof Error ? err.message : "อัพโหลดไม่สำเร็จ",
      }));
    } finally {
      setUploading((prev) => ({ ...prev, [slotIndex]: false }));
    }
  };

  // ── Update a single image field ─────────────────────────────────────────
  // ISSUE-1 fix: keyed by slotIndex, not array index.
  const updateImageField = (
    slotIndex: number,
    field: keyof GalleryImage,
    value: string,
  ) => {
    if (!slotMap.has(slotIndex)) return;
    updateAttributes({
      images: images.map((img) =>
        img.slotIndex === slotIndex ? { ...img, [field]: value } : img,
      ),
    });
  };

  // ── Remove an image from a slot ─────────────────────────────────────────
  // ISSUE-1 fix: filter by slotIndex so other slots keep their positions.
  const removeImage = (slotIndex: number) => {
    updateAttributes({
      images: images.filter((img) => img.slotIndex !== slotIndex),
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <NodeViewWrapper
      as="div"
      className="my-4 rounded-md border border-border bg-muted/20 p-4 text-sm"
      data-drag-handle
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-foreground/40">
            <MapIcon className="size-3.5" />
            Travel Gallery
          </div>

          {/* Layout selector */}
          <select
            value={layout}
            onChange={(e) => handleLayoutChange(e.target.value as GalleryLayout)}
            onKeyDown={stopProp}
            className="rounded-sm border border-border bg-background px-1.5 py-0.5 text-xs text-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {LAYOUT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={deleteNode}
          className="flex size-6 items-center justify-center rounded-sm text-foreground/30 transition-colors hover:text-destructive"
          title="Delete block"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {/* ── Image grid ─────────────────────────────────────────────────── */}
      <div className={`grid gap-2 ${GRID_CLASS[layout]}`}>
        {slots.map((slot, i) => (
          <div key={i} className="space-y-1.5">
            {slot?.url ? (
              // ── Filled slot ────────────────────────────────────────────
              <div className="space-y-1">
                <div className="group relative aspect-video overflow-hidden rounded-sm border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slot.url}
                    alt={slot.alt || ""}
                    className="h-full w-full object-cover"
                  />
                  {/* Replace / remove overlay */}
                  <div className="absolute inset-0 flex items-end justify-between gap-1 bg-black/40 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[i]?.click()}
                      disabled={uploading[i]}
                      className="flex items-center gap-1 rounded-sm bg-background/90 px-1.5 py-0.5 text-xs text-foreground/70 transition-colors hover:text-foreground"
                    >
                      {uploading[i] ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <ImagePlus className="size-3" />
                      )}
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="flex size-5 items-center justify-center rounded-sm bg-background/90 text-foreground/50 transition-colors hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                </div>

                {/* Alt text */}
                <input
                  type="text"
                  value={slot.alt || ""}
                  onChange={(e) => updateImageField(i, "alt", e.target.value)}
                  onKeyDown={stopProp}
                  placeholder="Alt text…"
                  className="w-full border-0 bg-transparent text-xs text-foreground/50 placeholder:text-foreground/25 focus:outline-none"
                />

                {/* Caption */}
                <input
                  type="text"
                  value={slot.caption || ""}
                  onChange={(e) => updateImageField(i, "caption", e.target.value)}
                  onKeyDown={stopProp}
                  placeholder="Caption…"
                  className="w-full border-0 bg-transparent text-xs italic text-foreground/40 placeholder:text-foreground/20 focus:outline-none"
                />
              </div>
            ) : (
              // ── Empty slot ─────────────────────────────────────────────
              <button
                type="button"
                onClick={() => fileInputRefs.current[i]?.click()}
                disabled={uploading[i]}
                className="flex aspect-video w-full items-center justify-center gap-1.5 rounded-sm border border-dashed border-border text-xs text-foreground/35 transition-colors hover:border-foreground/25 hover:text-foreground/55 disabled:opacity-50"
              >
                {uploading[i] ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    กำลังอัพโหลด…
                  </>
                ) : (
                  <>
                    <ImagePlus className="size-3.5" />
                    Image {i + 1}
                  </>
                )}
              </button>
            )}

            {errors[i] && (
              <p className="text-xs text-destructive">{errors[i]}</p>
            )}

            {/* Hidden file input per slot */}
            <input
              ref={(el) => {
                fileInputRefs.current[i] = el;
              }}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleFileChange(e, i)}
              aria-hidden="true"
            />
          </div>
        ))}
      </div>
    </NodeViewWrapper>
  );
}

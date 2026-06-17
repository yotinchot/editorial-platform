"use client";

import { useRef, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { BookOpen, Loader2, Trash2, X } from "lucide-react";

import type { ReadingBlockAttrs, ReadingBlockCover, ReadingStatus } from "@/lib/tiptap-nodes/reading-block";
import { uploadEditorialImage, validateImageFile } from "@/lib/upload-image";

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Prevent ProseMirror from handling keyboard events inside inputs. */
function stopProp(e: React.KeyboardEvent) {
  e.stopPropagation();
}

const STATUS_OPTIONS: { value: ReadingStatus; label: string }[] = [
  { value: "want-to-read", label: "Want to read" },
  { value: "reading", label: "Currently reading" },
  { value: "finished", label: "Finished" },
];

// ── Component ────────────────────────────────────────────────────────────────

/**
 * React NodeView for ReadingBlock.
 * All editing happens here; ProseMirror never sees the cursor inside.
 */
export function ReadingBlockView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const a = node.attrs as ReadingBlockAttrs;
  const takeaways: string[] = Array.isArray(a.keyTakeaways) ? a.keyTakeaways : [];

  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // ── Cover image upload ──────────────────────────────────────────────────
  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const err = validateImageFile(file);
    if (err) { setCoverError(err); return; }

    const alt = window.prompt("ใส่ alt text สำหรับปกหนังสือ:") ?? "";
    setCoverError(null);
    setCoverUploading(true);
    try {
      const img = await uploadEditorialImage(file, alt);
      updateAttributes({
        bookCover: {
          url: img.url,
          alt: img.alt,
          width: img.width,
          height: img.height,
          publicId: img.publicId,
        } satisfies ReadingBlockCover,
      });
    } catch (err) {
      setCoverError(err instanceof Error ? err.message : "อัพโหลดไม่สำเร็จ");
    } finally {
      setCoverUploading(false);
    }
  };

  // ── Takeaway helpers ────────────────────────────────────────────────────
  const updateTakeaway = (i: number, value: string) => {
    const next = [...takeaways];
    next[i] = value;
    updateAttributes({ keyTakeaways: next });
  };
  const addTakeaway = () => updateAttributes({ keyTakeaways: [...takeaways, ""] });
  const removeTakeaway = (i: number) =>
    updateAttributes({ keyTakeaways: takeaways.filter((_, idx) => idx !== i) });

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <NodeViewWrapper
      as="div"
      className="my-4 rounded-md border border-border bg-muted/20 p-4 text-sm"
      data-drag-handle
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-foreground/40">
          <BookOpen className="size-3.5" />
          Reading Block
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

      {/* ── Top row: cover + metadata ────────────────────────────────────── */}
      <div className="flex gap-4">
        {/* Cover image */}
        <div className="w-24 shrink-0">
          {a.bookCover?.url ? (
            <div className="group relative aspect-[2/3] overflow-hidden rounded-sm border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.bookCover.url}
                alt={a.bookCover.alt || ""}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => updateAttributes({ bookCover: null })}
                className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-sm bg-background/90 text-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
              >
                <X className="size-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={coverUploading}
              className="flex aspect-[2/3] w-full items-center justify-center rounded-sm border border-dashed border-border text-foreground/30 transition-colors hover:border-foreground/25 hover:text-foreground/50 disabled:opacity-50"
            >
              {coverUploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <BookOpen className="size-4" />
              )}
            </button>
          )}
          {coverError && (
            <p className="mt-1 text-xs text-destructive">{coverError}</p>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleCoverFileChange}
          />
        </div>

        {/* Metadata fields */}
        <div className="flex-1 space-y-2">
          <input
            type="text"
            value={a.bookTitle || ""}
            onChange={(e) => updateAttributes({ bookTitle: e.target.value })}
            onKeyDown={stopProp}
            placeholder="ชื่อหนังสือ"
            className="w-full border-0 bg-transparent text-sm font-medium text-foreground placeholder:text-foreground/30 focus:outline-none"
          />
          <input
            type="text"
            value={a.author || ""}
            onChange={(e) => updateAttributes({ author: e.target.value })}
            onKeyDown={stopProp}
            placeholder="ผู้แต่ง"
            className="w-full border-0 bg-transparent text-xs text-foreground/60 placeholder:text-foreground/30 focus:outline-none"
          />

          {/* Rating */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-foreground/40">Rating</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    updateAttributes({ rating: a.rating === n ? null : n })
                  }
                  className={`text-base leading-none transition-colors ${
                    (a.rating ?? 0) >= n
                      ? "text-amber-400"
                      : "text-foreground/20 hover:text-amber-300"
                  }`}
                  title={`${n} star${n > 1 ? "s" : ""}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Status + finished date */}
          <div className="flex items-center gap-2">
            <select
              value={a.readingStatus || "want-to-read"}
              onChange={(e) => {
                const next = e.target.value as ReadingStatus;
                updateAttributes({
                  readingStatus: next,
                  // LOW-3: clear the stored date when leaving "finished" so
                  // stale dates do not silently reappear if the user switches
                  // back to "finished" later.
                  ...(next !== "finished" ? { finishedDate: null } : {}),
                });
              }}
              onKeyDown={stopProp}
              className="border-0 bg-transparent text-xs text-foreground/60 focus:outline-none"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {a.readingStatus === "finished" && (
              <input
                type="date"
                value={a.finishedDate || ""}
                onChange={(e) =>
                  updateAttributes({ finishedDate: e.target.value || null })
                }
                onKeyDown={stopProp}
                className="border-0 bg-transparent text-xs text-foreground/50 focus:outline-none"
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Favorite quote ──────────────────────────────────────────────── */}
      <div className="mt-3">
        <textarea
          value={a.favoriteQuote || ""}
          onChange={(e) => updateAttributes({ favoriteQuote: e.target.value })}
          onKeyDown={stopProp}
          rows={2}
          placeholder="ประโยคโปรด…"
          className="w-full resize-none border-0 bg-transparent text-xs italic text-foreground/60 placeholder:text-foreground/25 focus:outline-none"
        />
      </div>

      {/* ── Key takeaways ───────────────────────────────────────────────── */}
      <div className="mt-3 space-y-1.5">
        <p className="text-xs font-medium text-foreground/40">Key takeaways</p>
        {takeaways.map((t, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="shrink-0 text-xs text-foreground/30">·</span>
            <input
              type="text"
              value={t}
              onChange={(e) => updateTakeaway(i, e.target.value)}
              onKeyDown={stopProp}
              placeholder="สิ่งที่ได้เรียนรู้…"
              className="min-w-0 flex-1 border-0 bg-transparent text-xs text-foreground/70 placeholder:text-foreground/25 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeTakeaway(i)}
              className="shrink-0 text-foreground/25 transition-colors hover:text-destructive"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addTakeaway}
          className="text-xs text-foreground/35 transition-colors hover:text-foreground/60"
        >
          + เพิ่ม takeaway
        </button>
      </div>

      {/* ── Who should read this ─────────────────────────────────────────── */}
      <div className="mt-3">
        <textarea
          value={a.whoShouldReadThis || ""}
          onChange={(e) => updateAttributes({ whoShouldReadThis: e.target.value })}
          onKeyDown={stopProp}
          rows={2}
          placeholder="เหมาะกับใคร…"
          className="w-full resize-none border-0 bg-transparent text-xs text-foreground/60 placeholder:text-foreground/25 focus:outline-none"
        />
      </div>
    </NodeViewWrapper>
  );
}

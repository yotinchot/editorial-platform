"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { JSONContent } from "@tiptap/react";

import { autosavePostDraft, deletePost, updatePost } from "@/actions/posts";
import {
  AutosaveIndicator,
  type AutosaveStatus,
} from "@/components/editor/autosave-indicator";
import { CoverImage } from "@/components/editor/cover-image";
import { Button } from "@/components/ui/button";
import type { Category, Post, PostCategory } from "@/db/schema";
import { titleToSlug } from "@/lib/slug-utils";
import { uploadEditorialImage, validateImageFile } from "@/lib/upload-image";
import type { EditorialImage } from "@/types/image";

// Load editor client-side only — TipTap requires a DOM.
const TipTapEditor = dynamic(
  () => import("@/components/editor/tiptap-editor"),
  { ssr: false },
);

// ── Types ──────────────────────────────────────────────────────────────────

export interface PostWithCategories extends Post {
  postCategories: Array<PostCategory & { category: Category }>;
}

interface PostEditorProps {
  post: PostWithCategories;
  allCategories: Category[];
}

// ── Component ──────────────────────────────────────────────────────────────

export function PostEditor({ post, allCategories }: PostEditorProps) {
  // ── Editable field state ────────────────────────────────────────────────
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [excerpt, setExcerpt] = useState(post.excerpt ?? "");
  const [type, setType] = useState<"travel" | "reading" | "essay">(post.type);
  const [status, setStatus] = useState<"draft" | "published">(
    post.status === "scheduled" ? "draft" : post.status,
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    post.postCategories.map((pc) => pc.category_id),
  );

  // ── Cover image state ──────────────────────────────────────────────────
  // Initialised from the post's stored cover_image (may be null).
  // Updated by the CoverImage sidebar component; persisted on manual save only.
  const [coverImage, setCoverImage] = useState<EditorialImage | null>(
    (post.cover_image as EditorialImage | null) ?? null,
  );

  // ── Initial editor content: draft takes priority over published ─────────
  // Declared before editorContentRef so it can seed the initial ref value.
  const initialContent = (post.draft_content_json ??
    post.content_json ??
    null) as JSONContent | null;

  // ── Editor content ref ──────────────────────────────────────────────────
  // Kept in a ref (not state) so the autosave timer always reads the latest
  // value without causing re-renders on every keystroke.
  //
  // CRIT-1 fix: seed from initialContent so that clicking Save without ever
  // typing in the editor sends the existing content — not null — to the DB.
  const editorContentRef = useRef<JSONContent | null>(initialContent);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Save state ──────────────────────────────────────────────────────────
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>({
    type: "idle",
  });
  const [isPending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Inline image upload handler ─────────────────────────────────────────
  // Passed down to TipTapEditor → EditorToolbar so the toolbar can trigger
  // a signed Cloudinary upload without needing direct server-action access.
  const handleInlineImageUpload = useCallback(
    async (file: File): Promise<EditorialImage> => {
      const validationError = validateImageFile(file);
      if (validationError) throw new Error(validationError);
      // alt text is prompted in the toolbar; pass "" here and let the toolbar
      // supply the user-entered alt after upload.
      return uploadEditorialImage(file, "");
    },
    [],
  );

  // ── Save version counter (CRIT-2) ───────────────────────────────────────
  // Incremented on every manual save. Autosave closures capture the version
  // at creation time and silently discard their result if the version has
  // advanced (i.e. a manual save completed while they were in-flight).
  const saveVersionRef = useRef(0);

  // ── Cleanup: cancel pending autosave timer on unmount ──────────────────
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, []);

  // ── Autosave ────────────────────────────────────────────────────────────
  const handleEditorChange = useCallback(
    (json: JSONContent) => {
      editorContentRef.current = json;
      setAutosaveStatus({ type: "unsaved" });

      // Reset the 3-second debounce timer on every change.
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

      // Capture the current save version so this closure can detect whether
      // a manual save has happened before or during the network request.
      const capturedVersion = saveVersionRef.current;

      autosaveTimerRef.current = setTimeout(async () => {
        // Abort if a manual save occurred after this timer was created.
        if (saveVersionRef.current !== capturedVersion) return;

        setAutosaveStatus({ type: "saving" });
        try {
          const result = await autosavePostDraft(post.id, {
            draft_content_json: json,
          });

          // Abort if a manual save completed while this request was in-flight.
          if (saveVersionRef.current !== capturedVersion) return;

          if ("error" in result) {
            setAutosaveStatus({ type: "error" });
          } else {
            setAutosaveStatus({ type: "saved", at: new Date(result.saved_at) });
          }
        } catch {
          if (saveVersionRef.current !== capturedVersion) return;
          setAutosaveStatus({ type: "error" });
        }
      }, 3000);
    },
    [post.id],
  );

  // ── Manual save ─────────────────────────────────────────────────────────
  const handleManualSave = useCallback(() => {
    // CRIT-2 fix: cancel any pending autosave timer and invalidate any
    // in-flight autosave request before starting the manual save.
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    saveVersionRef.current += 1;

    setSaveError(null);
    startTransition(async () => {
      const result = await updatePost(post.id, {
        title,
        slug,
        excerpt,
        type,
        status,
        category_ids: selectedCategoryIds,
        content_json: editorContentRef.current,
        cover_image: coverImage,
      });
      if ("error" in result) {
        setSaveError(result.error);
      } else {
        setAutosaveStatus({ type: "saved", at: new Date() });
      }
    });
  }, [post.id, title, slug, excerpt, type, status, selectedCategoryIds, coverImage]);

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = useCallback(() => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    startTransition(async () => {
      await deletePost(post.id);
      window.location.href = "/admin/posts";
    });
  }, [post.id]);

  // ── Category toggle ─────────────────────────────────────────────────────
  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  // ── Auto-update slug from title (only when slug is unchanged from default) ──
  const originalSlug = useRef(post.slug);
  const slugWasEdited = useRef(false);
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    // Auto-update slug only if user hasn't manually touched it.
    if (!slugWasEdited.current) {
      setSlug(titleToSlug(e.target.value) || originalSlug.current);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/admin/posts"
          className="text-sm text-foreground/50 transition-colors hover:text-foreground"
        >
          ← Posts
        </Link>
        <div className="flex items-center gap-4">
          <AutosaveIndicator status={autosaveStatus} />
          {saveError && (
            <span className="text-xs text-destructive">{saveError}</span>
          )}
          <Button
            onClick={handleManualSave}
            disabled={isPending}
            size="sm"
          >
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {/* ── Two-column layout ─────────────────────────────────────────── */}
      <div className="flex gap-10 items-start">
        {/* ── Editor column ─────────────────────────────────────────── */}
        <div className="min-w-0 flex-1 space-y-5">
          {/* Title */}
          <input
            value={title}
            onChange={handleTitleChange}
            className="w-full border-0 bg-transparent font-serif text-4xl text-foreground placeholder:text-foreground/25 focus:outline-none"
            placeholder="Untitled"
          />

          {/* Slug */}
          <div className="flex items-center gap-1 text-sm text-foreground/40 border-b border-border pb-4">
            <span className="shrink-0">/</span>
            <input
              value={slug}
              onChange={(e) => {
                slugWasEdited.current = true;
                setSlug(e.target.value);
              }}
              className="min-w-0 flex-1 border-0 bg-transparent text-foreground/55 focus:outline-none focus:text-foreground"
              placeholder="post-slug"
              spellCheck={false}
            />
          </div>

          {/* TipTap editor — SSR-safe via dynamic import */}
          <TipTapEditor
            initialContent={initialContent}
            onChange={handleEditorChange}
            onImageUpload={handleInlineImageUpload}
          />

          {/* Excerpt */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-wide text-foreground/40">
              Excerpt
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-sm border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="A short description shown in post listings…"
            />
          </div>
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────── */}
        <aside className="w-52 shrink-0 space-y-6 pt-1">
          {/* Cover image */}
          <CoverImage value={coverImage} onChange={setCoverImage} />

          {/* Type */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-foreground/40">
              Type
            </p>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="w-full rounded-sm border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="essay">Essay</option>
              <option value="travel">Travel</option>
              <option value="reading">Reading</option>
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-foreground/40">
              Status
            </p>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="w-full rounded-sm border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Categories */}
          {allCategories.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground/40">
                Categories
              </p>
              <div className="space-y-2">
                {allCategories.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground/65 transition-colors hover:text-foreground"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                      className="accent-accent"
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Danger zone */}
          <div className="border-t border-border pt-5">
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs text-foreground/35 transition-colors hover:text-destructive"
            >
              Delete post
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

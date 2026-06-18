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
import { TagInput } from "@/components/editor/tag-input";
import { Button } from "@/components/ui/button";
import type { Category, Post, PostCategory } from "@/db/schema";
import type { Tag, PostTag } from "@/db/schema";
import { titleToSlug } from "@/lib/slug-utils";
import { uploadEditorialImage, validateImageFile } from "@/lib/upload-image";
import type { EditorialImage } from "@/types/image";

const TipTapEditor = dynamic(
  () => import("@/components/editor/tiptap-editor"),
  { ssr: false },
);

// ── Types ──────────────────────────────────────────────────────────────────

export interface PostWithRelations extends Post {
  postCategories: Array<PostCategory & { category: Category }>;
  postTags: Array<PostTag & { tag: Tag }>;
}

interface PostEditorProps {
  post: PostWithRelations;
  allCategories: Category[];
}

// ── Component ──────────────────────────────────────────────────────────────

export function PostEditor({ post, allCategories }: PostEditorProps) {
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [excerpt, setExcerpt] = useState(post.excerpt ?? "");
  const [status, setStatus] = useState<"draft" | "published">(
    post.status === "scheduled" ? "draft" : post.status,
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    post.postCategories.map((pc) => pc.category_id),
  );
  const [tagNames, setTagNames] = useState<string[]>(
    post.postTags.map((pt) => pt.tag.name),
  );

  const [coverImage, setCoverImage] = useState<EditorialImage | null>(
    (post.cover_image as EditorialImage | null) ?? null,
  );

  const initialContent = (post.draft_content_json ??
    post.content_json ??
    null) as JSONContent | null;

  const editorContentRef = useRef<JSONContent | null>(initialContent);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>({
    type: "idle",
  });
  const [isPending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleInlineImageUpload = useCallback(
    async (file: File): Promise<EditorialImage> => {
      const validationError = validateImageFile(file);
      if (validationError) throw new Error(validationError);
      return uploadEditorialImage(file, "");
    },
    [],
  );

  const saveVersionRef = useRef(0);

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, []);

  const handleEditorChange = useCallback(
    (json: JSONContent) => {
      editorContentRef.current = json;
      setAutosaveStatus({ type: "unsaved" });

      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

      const capturedVersion = saveVersionRef.current;

      autosaveTimerRef.current = setTimeout(async () => {
        if (saveVersionRef.current !== capturedVersion) return;

        setAutosaveStatus({ type: "saving" });
        try {
          const result = await autosavePostDraft(post.id, {
            draft_content_json: JSON.parse(JSON.stringify(json)) as JSONContent,
          });

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

  const handleManualSave = useCallback(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    saveVersionRef.current += 1;

    setSaveError(null);
    startTransition(async () => {
      const contentToSave = editorContentRef.current
        ? (JSON.parse(JSON.stringify(editorContentRef.current)) as JSONContent)
        : null;
      const result = await updatePost(post.id, {
        title,
        slug,
        excerpt,
        status,
        category_ids: selectedCategoryIds,
        tag_names: tagNames,
        content_json: contentToSave,
        cover_image: coverImage,
      });
      if ("error" in result) {
        setSaveError(result.error);
      } else {
        setAutosaveStatus({ type: "saved", at: new Date() });
      }
    });
  }, [post.id, title, slug, excerpt, status, selectedCategoryIds, tagNames, coverImage]);

  const handleDelete = useCallback(() => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    startTransition(async () => {
      await deletePost(post.id);
      window.location.href = "/admin/posts";
    });
  }, [post.id]);

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const originalSlug = useRef(post.slug);
  const slugWasEdited = useRef(false);
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (!slugWasEdited.current) {
      setSlug(titleToSlug(e.target.value) || originalSlug.current);
    }
  };

  return (
    <div>
      {/* Top bar */}
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
          <Button onClick={handleManualSave} disabled={isPending} size="sm">
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-10 items-start">
        {/* Editor column */}
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

          {/* Editor */}
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

        {/* Sidebar */}
        <aside className="w-52 shrink-0 space-y-6 pt-1">
          {/* Cover image */}
          <CoverImage value={coverImage} onChange={setCoverImage} />

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

          {/* Tags */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-foreground/40">
              Tags
            </p>
            <TagInput value={tagNames} onChange={setTagNames} />
            <p className="text-[0.6rem] text-foreground/30">
              Enter or comma to add
            </p>
          </div>

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

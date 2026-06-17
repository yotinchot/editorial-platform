"use client";

import { useRef, useState } from "react";
import {
  Bold,
  BookOpen,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Map,
  Minus,
  Quote,
  Redo,
  Undo,
} from "lucide-react";

import { validateImageFile } from "@/lib/upload-image";
import { cn } from "@/lib/utils";
import type { EditorialImage } from "@/types/image";

// Import Editor type lazily to avoid bundling TipTap in non-editor contexts.
import type { Editor } from "@tiptap/react";

// ── Toolbar primitive ──────────────────────────────────────────────────────

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        // Prevent the editor from losing focus when the toolbar is clicked.
        e.preventDefault();
        if (!disabled) onClick();
      }}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={isActive}
      className={cn(
        "flex size-8 items-center justify-center rounded-sm transition-colors",
        "text-foreground/55 hover:bg-muted hover:text-foreground",
        "disabled:pointer-events-none disabled:opacity-35",
        isActive && "bg-muted text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className="mx-1 h-5 w-px bg-border" />;
}

// ── Toolbar ────────────────────────────────────────────────────────────────

interface EditorToolbarProps {
  editor: Editor | null;
  /** Provided by post-editor — handles compression + signed Cloudinary upload. */
  onImageUpload: (file: File) => Promise<EditorialImage>;
}

export function EditorToolbar({ editor, onImageUpload }: EditorToolbarProps) {
  const [imageUploading, setImageUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const handleImageButtonClick = () => imageInputRef.current?.click();

  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    // Reset so the same file can be reselected after an error.
    e.target.value = "";
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      window.alert(validationError);
      return;
    }

    const alt = window.prompt("ใส่ alt text สำหรับภาพ:") ?? "";

    setImageUploading(true);
    try {
      const image = await onImageUpload(file);
      // Use insertContent so custom attrs (width, height) flow through
      // without fighting setImage's narrower TypeScript signature.
      editor.chain().focus().insertContent({
        type: "image",
        attrs: {
          src: image.url,
          alt: image.alt || alt,
          width: String(image.width),
          height: String(image.height),
        },
      }).run();
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "อัพโหลดรูปไม่สำเร็จ โปรดลองอีกครั้ง",
      );
    } finally {
      setImageUploading(false);
    }
  };

  const handleLink = () => {
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt("Enter URL:");
    if (!url) return;

    // Reject javascript: and other unsafe protocols before passing to TipTap.
    const isAllowed = (() => {
      try {
        const parsed = new URL(url, window.location.href);
        return ["https:", "http:", "mailto:"].includes(parsed.protocol);
      } catch {
        return url.startsWith("/") || url.startsWith("#");
      }
    })();

    if (!isAllowed) {
      window.alert("Only https://, http://, mailto:, and relative URLs are allowed.");
      return;
    }

    editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 border-b border-border px-3 py-2"
      role="toolbar"
      aria-label="Text formatting"
    >
      {/* Hidden file input for inline image upload */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleImageFileChange}
        aria-hidden="true"
      />
      {/* History */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (⌘Z)"
      >
        <Undo className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (⌘⇧Z)"
      >
        <Redo className="size-3.5" />
      </ToolbarButton>

      <Separator />

      {/* Inline marks */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Bold (⌘B)"
      >
        <Bold className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Italic (⌘I)"
      >
        <Italic className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={handleLink}
        isActive={editor.isActive("link")}
        title="Link (⌘K)"
      >
        <Link2 className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={handleImageButtonClick}
        disabled={imageUploading}
        title="แทรกรูปภาพ"
      >
        {imageUploading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <ImagePlus className="size-3.5" />
        )}
      </ToolbarButton>

      <Separator />

      {/* Block types */}
      <ToolbarButton
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        isActive={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
        isActive={editor.isActive("heading", { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="size-3.5" />
      </ToolbarButton>

      <Separator />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title="Bullet list"
      >
        <List className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title="Ordered list"
      >
        <ListOrdered className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        title="Blockquote"
      >
        <Quote className="size-3.5" />
      </ToolbarButton>

      <Separator />

      {/* Misc */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal rule"
      >
        <Minus className="size-3.5" />
      </ToolbarButton>

      <Separator />

      {/* Phase 6 editorial blocks */}
      <ToolbarButton
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertContent({ type: "readingBlock", attrs: {} })
            .run()
        }
        title="Insert Reading Block"
      >
        <BookOpen className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertContent({ type: "travelGalleryBlock", attrs: {} })
            .run()
        }
        title="Insert Travel Gallery"
      >
        <Map className="size-3.5" />
      </ToolbarButton>
    </div>
  );
}

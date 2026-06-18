"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, X, Check } from "lucide-react";

import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/actions/categories";
import type { Category } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CategoriesManagerProps {
  initialCategories: (Category & { postCount: number })[];
}

// ── Inline edit row ──────────────────────────────────────────────────────────

function EditRow({
  category,
  onDone,
}: {
  category: Category & { postCount: number };
  onDone: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [description, setDescription] = useState(category.description ?? "");
  const [displayOrder, setDisplayOrder] = useState(category.display_order);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateCategory(category.id, {
        name,
        slug,
        description,
        display_order: displayOrder,
      });
      if ("error" in result) {
        setError(result.error);
      } else {
        onDone();
      }
    });
  };

  return (
    <tr className="bg-muted/20">
      <td className="px-4 py-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-sm border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </td>
      <td className="px-4 py-2">
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full rounded-sm border border-border bg-background px-2 py-1 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          spellCheck={false}
        />
      </td>
      <td className="px-4 py-2">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-sm border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Optional description"
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="number"
          min={0}
          value={displayOrder}
          onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
          className="w-16 rounded-sm border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </td>
      <td className="px-4 py-2 text-xs text-foreground/40">
        {category.postCount}
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-1.5">
          {error && <span className="text-xs text-destructive">{error}</span>}
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex size-6 items-center justify-center rounded-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            title="Save"
          >
            <Check className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onDone}
            disabled={isPending}
            className="flex size-6 items-center justify-center rounded-sm text-foreground/40 hover:text-foreground"
            title="Cancel"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function CategoriesManager({ initialCategories }: CategoriesManagerProps) {
  const [cats, setCats] = useState(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Create form state
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newOrder, setNewOrder] = useState(0);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const autoSlug = (name: string) =>
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = e.target.value;
    setNewName(n);
    setNewSlug(autoSlug(n));
  };

  const handleCreate = () => {
    setCreateError(null);
    startTransition(async () => {
      const result = await createCategory({
        name: newName.trim(),
        slug: newSlug.trim(),
        description: newDescription.trim(),
        display_order: newOrder,
      });
      if ("error" in result) {
        setCreateError(result.error);
      } else {
        setCats((prev) => [...prev, { ...result.category, postCount: 0 }]);
        setNewName("");
        setNewSlug("");
        setNewDescription("");
        setNewOrder(0);
      }
    });
  };

  const handleDelete = (cat: Category & { postCount: number }) => {
    const msg =
      cat.postCount > 0
        ? `"${cat.name}" has ${cat.postCount} published post${cat.postCount !== 1 ? "s" : ""}. Deleting it will remove those posts from this category. Continue?`
        : `Delete category "${cat.name}"?`;
    if (!confirm(msg)) return;
    startTransition(async () => {
      const result = await deleteCategory(cat.id);
      if ("error" in result) {
        alert(result.error);
      } else {
        setCats((prev) => prev.filter((c) => c.id !== cat.id));
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Table */}
      <div className="overflow-x-auto rounded-sm border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-foreground/50">
              <th className="px-4 py-2.5 text-left font-medium">Name</th>
              <th className="px-4 py-2.5 text-left font-medium">Slug</th>
              <th className="px-4 py-2.5 text-left font-medium">Description</th>
              <th className="px-4 py-2.5 text-left font-medium">Order</th>
              <th className="px-4 py-2.5 text-left font-medium">Posts</th>
              <th className="px-4 py-2.5 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {cats.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-foreground/40">
                  No categories yet.
                </td>
              </tr>
            )}
            {cats.map((cat) =>
              editingId === cat.id ? (
                <EditRow
                  key={cat.id}
                  category={cat}
                  onDone={() => {
                    setEditingId(null);
                    // Refresh page data after edit
                    window.location.reload();
                  }}
                />
              ) : (
                <tr
                  key={cat.id}
                  className="transition-colors hover:bg-muted/20"
                >
                  <td className="px-4 py-3 font-medium">{cat.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground/60">
                    /{cat.slug}
                  </td>
                  <td className="px-4 py-3 text-foreground/60">
                    {cat.description || <span className="text-foreground/30">—</span>}
                  </td>
                  <td className="px-4 py-3 text-foreground/60">{cat.display_order}</td>
                  <td className="px-4 py-3 text-foreground/60">{cat.postCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingId(cat.id)}
                        className="flex size-6 items-center justify-center rounded-sm text-foreground/40 hover:text-foreground"
                        title="Edit"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat)}
                        className={cn(
                          "flex size-6 items-center justify-center rounded-sm transition-colors",
                          cat.postCount > 0
                            ? "text-amber-500/70 hover:text-amber-600"
                            : "text-foreground/40 hover:text-destructive",
                        )}
                        title={cat.postCount > 0 ? `Has ${cat.postCount} posts` : "Delete"}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {/* Create form */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">New Category</h3>
        <div className="grid grid-cols-[1fr_1fr_2fr_5rem] gap-3">
          <div>
            <label className="mb-1 block text-xs text-foreground/50">Name *</label>
            <input
              value={newName}
              onChange={handleNameChange}
              placeholder="Essays"
              className="w-full rounded-sm border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-foreground/50">Slug *</label>
            <input
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="essays"
              className="w-full rounded-sm border border-border bg-background px-2.5 py-1.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              spellCheck={false}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-foreground/50">Description</label>
            <input
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-sm border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-foreground/50">Order</label>
            <input
              type="number"
              min={0}
              value={newOrder}
              onChange={(e) => setNewOrder(parseInt(e.target.value) || 0)}
              className="w-full rounded-sm border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        {createError && (
          <p className="text-xs text-destructive">{createError}</p>
        )}
        <Button
          onClick={handleCreate}
          disabled={isPending || !newName.trim() || !newSlug.trim()}
          size="sm"
        >
          {isPending ? "Creating…" : "Create Category"}
        </Button>
      </div>
    </div>
  );
}

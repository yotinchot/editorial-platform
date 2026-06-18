"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
}

export function TagInput({ value, onChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (raw: string) => {
    const name = raw.trim();
    if (!name) return;
    // Normalise: lowercase, collapse spaces
    const normalised = name.toLowerCase().replace(/\s+/g, " ");
    if (!value.includes(normalised)) {
      onChange([...value, normalised]);
    }
    setInputValue("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) addTag(inputValue);
  };

  return (
    <div
      className="flex min-h-[2rem] flex-wrap gap-1 rounded-sm border border-border bg-background px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-0.5 rounded-sm bg-muted px-1.5 py-0.5 text-xs text-foreground/70"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
            aria-label={`Remove tag ${tag}`}
            className="ml-0.5 text-foreground/40 hover:text-foreground"
          >
            <X className="size-2.5" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={value.length === 0 ? "Add tags…" : ""}
        className="min-w-0 flex-1 border-0 bg-transparent text-xs text-foreground placeholder:text-foreground/30 focus:outline-none"
        aria-label="Tag input"
      />
    </div>
  );
}

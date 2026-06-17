"use client";

import { useEffect, useState } from "react";

export type AutosaveStatus =
  | { type: "idle" }
  | { type: "unsaved" }
  | { type: "saving" }
  | { type: "saved"; at: Date }
  | { type: "error" };

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 15) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return "1 minute ago";
  if (minutes < 60) return `${minutes} minutes ago`;
  return "a while ago";
}

interface AutosaveIndicatorProps {
  status: AutosaveStatus;
}

export function AutosaveIndicator({ status }: AutosaveIndicatorProps) {
  // Re-render every 30 s so the relative timestamp stays fresh.
  const [, tick] = useState(0);
  useEffect(() => {
    if (status.type !== "saved") return;
    const id = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [status.type]);

  if (status.type === "idle") return null;

  const labels: Record<AutosaveStatus["type"], string> = {
    idle: "",
    unsaved: "Unsaved changes",
    saving: "Saving…",
    error: "Save failed — check your connection",
    saved:
      status.type === "saved"
        ? `Draft autosaved ${timeAgo(status.at)}`
        : "",
  };

  const colours: Record<AutosaveStatus["type"], string> = {
    idle: "",
    unsaved: "text-foreground/40",
    saving: "text-foreground/40",
    error: "text-destructive",
    saved: "text-foreground/40",
  };

  return (
    <span
      className={`text-xs tabular-nums transition-colors ${colours[status.type]}`}
    >
      {labels[status.type]}
    </span>
  );
}

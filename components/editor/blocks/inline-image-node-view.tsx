"use client";

import { useCallback, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";

type FitMode = "natural" | "cover" | "contain";

const FIT_MODES: FitMode[] = ["natural", "cover", "contain"];
const FIT_LABELS: Record<FitMode, string> = {
  natural: "Natural",
  cover: "Cover",
  contain: "Contain",
};

function stopProp(e: React.KeyboardEvent) {
  e.stopPropagation();
}

export function InlineImageNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const attrs = node.attrs as {
    src?: string;
    alt?: string | null;
    width?: string | number | null;
    height?: string | number | null;
    fitMode?: FitMode;
    focalX?: number;
    focalY?: number;
  };

  const {
    src = "",
    alt = "",
    fitMode = "natural",
    focalX = 0.5,
    focalY = 0.5,
  } = attrs;

  const [hovered, setHovered] = useState(false);
  const showControls = hovered || selected;

  const handleFocalClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (fitMode === "natural") return;
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.round(((e.clientX - rect.left) / rect.width) * 100) / 100;
      const y = Math.round(((e.clientY - rect.top) / rect.height) * 100) / 100;
      updateAttributes({ focalX: x, focalY: y });
    },
    [fitMode, updateAttributes],
  );

  return (
    <NodeViewWrapper
      as="figure"
      data-drag-handle
      className="editor-image-block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image container */}
      <div
        className={`editor-image-block__img-container editor-image-block__img-container--${fitMode}`}
        style={{ cursor: fitMode !== "natural" ? "crosshair" : undefined }}
        onClick={fitMode !== "natural" ? handleFocalClick : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt ?? ""}
          draggable={false}
          style={
            fitMode !== "natural"
              ? { objectPosition: `${Number(focalX) * 100}% ${Number(focalY) * 100}%` }
              : undefined
          }
        />
        {/* Focal point dot — only for cover / contain */}
        {fitMode !== "natural" && (
          <div
            className="editor-image-block__focal-dot"
            style={{
              left: `${Number(focalX) * 100}%`,
              top: `${Number(focalY) * 100}%`,
            }}
          />
        )}
      </div>

      {/* Control bar */}
      {showControls && (
        <div className="editor-image-block__controls" contentEditable={false}>
          <div className="editor-image-block__fitmode-group">
            {FIT_MODES.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateAttributes({ fitMode: mode });
                }}
                className={
                  "editor-image-block__fitmode-btn" +
                  (fitMode === mode ? " editor-image-block__fitmode-btn--active" : "")
                }
              >
                {FIT_LABELS[mode]}
              </button>
            ))}
          </div>
          {!alt && (
            <span className="editor-image-block__alt-warning">⚠ alt missing</span>
          )}
        </div>
      )}

      {/* Alt text input */}
      <figcaption className="editor-image-block__alt-row" contentEditable={false}>
        <input
          type="text"
          value={alt ?? ""}
          onChange={(e) => updateAttributes({ alt: e.target.value })}
          onKeyDown={stopProp}
          placeholder="Alt text…"
          className="editor-image-block__alt-input"
          aria-label="Image alt text"
        />
      </figcaption>
    </NodeViewWrapper>
  );
}

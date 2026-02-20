"use client";

import React from "react";
import { parseHighlightedText } from "./parse-text";

export interface DiffItemProps {
  content: string;
  color?: "red" | "lightgreen" | "yellow" | "blue";
  className?: string;
  searchQuery?: string;
}

/**
 * Single diff item display component
 * Shows highlighted text with optional background color
 */
export function DiffItem({
  content,
  color,
  className = "",
  searchQuery,
}: DiffItemProps) {
  const getColorStyle = () => {
    if (!color)
      return content ? { backgroundColor: "var(--diff-item-bg, #fff)" } : {};
    switch (color) {
      case "red":
        return { backgroundColor: "var(--diff-removed-bg, #fef2f2)" };
      case "lightgreen":
        return { backgroundColor: "var(--diff-added-bg, #bbf7d0)" };
      case "yellow":
        return { backgroundColor: "var(--diff-moved-bg, #fefce8)" };
      case "blue":
        return { backgroundColor: "var(--diff-aligned-bg, #eff6ff)" };
      default:
        return content ? { backgroundColor: "var(--diff-item-bg, #fff)" } : {};
    }
  };

  return (
    <div
      className={className}
      style={{
        flex: 1,
        borderRadius: "0.375rem",
        padding: "0.75rem",
        textAlign: "left",
        display: "flex",
        minHeight: "2.5rem",
        alignItems: "flex-start",
        ...getColorStyle(),
      }}
    >
      <div style={{ width: "100%" }}>
        {parseHighlightedText(content || "", searchQuery)}
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { DiffItem } from "./DiffItem";
import type { DiffItem as DiffItemType } from "../core";

export interface ComparisonProps {
  item: DiffItemType;
  className?: string;
  gap?: string;
}

/**
 * Side-by-side comparison of a single diff item
 * Shows left and right content with highlighting
 */
export function Comparison({
  item,
  className = "",
  gap = "1rem",
}: ComparisonProps) {
  const isAdded = item.right && !item.left && !item.leftBest;
  const isRemoved = item.left && !item.right && !item.rightBest;

  return (
    <div
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap,
        width: "100%",
      }}
    >
      {item.left ? (
        <DiffItem
          content={isRemoved ? item.left : item.leftHighlighted}
          color={isRemoved ? "red" : undefined}
        />
      ) : (
        <DiffItem content={item.leftHighlighted} />
      )}
      {item.right ? (
        <DiffItem
          content={isAdded ? item.right : item.rightHighlighted}
          color={isAdded ? "lightgreen" : undefined}
        />
      ) : (
        <DiffItem content={item.rightHighlighted} />
      )}
    </div>
  );
}

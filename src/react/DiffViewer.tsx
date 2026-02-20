"use client";

import React from "react";
import { Comparison } from "./Comparison";
import { DocumentHeader } from "./DocumentHeader";
import type { DiffResult } from "../core";
import type { UNDocumentMetadata } from "../un-fetcher";

export interface DiffViewerProps {
  data: DiffResult;
  left: {
    symbol: string;
    metadata?: UNDocumentMetadata;
    format?: "doc" | "pdf";
  };
  right: {
    symbol: string;
    metadata?: UNDocumentMetadata;
    format?: "doc" | "pdf";
  };
  className?: string;
  searchQuery?: string;
}

/**
 * Full diff viewer component with side-by-side comparison
 */
export function DiffViewer({
  data,
  left,
  right,
  className = "",
  searchQuery,
}: DiffViewerProps) {
  return (
    <div
      className={className}
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      {/* Document Headers */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}
      >
        <DocumentHeader
          symbol={left.symbol}
          metadata={left.metadata}
          format={left.format}
        />
        <DocumentHeader
          symbol={right.symbol}
          metadata={right.metadata}
          format={right.format}
        />
      </div>

      {/* Diff items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {data.items.map((item, index) => (
          <Comparison key={index} item={item} searchQuery={searchQuery} />
        ))}
      </div>
    </div>
  );
}

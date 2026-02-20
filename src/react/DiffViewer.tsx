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
  const [activeIndex, setActiveIndex] = React.useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const v = new URLSearchParams(window.location.search).get("index");
    return v !== null ? Number(v) : null;
  });

  return (
    <div
      className={className}
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      {/* Document Headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem",
        }}
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
      <style>{`
        .diff-row {
          position: relative;
        }
        .diff-row-anchor {
          position: absolute;
          left: -1.75rem;
          top: 0;
          bottom: 0;
          width: 1.75rem;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 0.375rem;
          font-size: 0.65rem;
          color: #9ca3af;
          text-decoration: none;
          opacity: 0;
          transition: opacity 0.15s;
          user-select: none;
        }
        .diff-row:hover .diff-row-anchor { opacity: 1; }
        .diff-row-anchor:hover { color: #009edb; }
      `}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {data.items.map((item, index) => (
          <div
            key={index}
            id={`${index + 1}`}
            className="diff-row"
            style={{
              scrollMarginTop: "4rem",
              outline:
                activeIndex === index + 1 ? "2px solid #009edb" : undefined,
              borderRadius: "0.375rem",
            }}
          >
            <a
              href={(() => {
                const p = new URLSearchParams(window.location.search);
                p.set("index", String(index + 1));
                return `?${p.toString()}`;
              })()}
              className="diff-row-anchor"
              aria-label={`Paragraph ${index + 1}`}
              title={`¶${index + 1}`}
              onClick={(e) => {
                e.preventDefault();
                const n = index + 1;
                const params = new URLSearchParams(window.location.search);
                params.set("index", String(n));
                const newUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
                history.pushState(null, "", `?${params.toString()}`);
                navigator.clipboard?.writeText(newUrl);
                setActiveIndex(n);
                const el = document.getElementById(String(n));
                if (el)
                  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
              }}
            >
              {index + 1}
            </a>
            <Comparison item={item} searchQuery={searchQuery} />
          </div>
        ))}
      </div>
    </div>
  );
}

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
  /** When true, paragraphs with score === 1 (identical) are hidden but their IDs/indices are preserved */
  hideIdentical?: boolean;
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
  hideIdentical = false,
}: DiffViewerProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const v = new URLSearchParams(window.location.search).get("index");
    return v !== null ? Number(v) : null;
  });

  // Tracks which collapsed groups have been manually expanded (by first item index)
  const [expandedGroups, setExpandedGroups] = React.useState<Set<number>>(new Set());
  const prevHideIdentical = React.useRef(hideIdentical);
  if (prevHideIdentical.current !== hideIdentical) {
    prevHideIdentical.current = hideIdentical;
    if (!hideIdentical) setExpandedGroups(new Set());
  }

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
        {(() => {
          // Build segments: runs of hidden-identical items are collapsed into one bar
          type Segment =
            | { kind: "visible"; item: (typeof data.items)[0]; index: number }
            | { kind: "hidden"; indices: number[] };

          const segments: Segment[] = [];
          for (let i = 0; i < data.items.length; i++) {
            const item = data.items[i];
            if (hideIdentical && item.score === 1) {
              const last = segments[segments.length - 1];
              if (last?.kind === "hidden") {
                last.indices.push(i);
              } else {
                segments.push({ kind: "hidden", indices: [i] });
              }
            } else {
              segments.push({ kind: "visible", item, index: i });
            }
          }

          return segments.map((seg, si) => {
            if (seg.kind === "hidden") {
              const count = seg.indices.length;
              const groupKey = seg.indices[0];
              const isExpanded = expandedGroups.has(groupKey);

              if (isExpanded) {
                // Render these items as normal visible rows
                return (
                  <React.Fragment key={`hidden-${si}`}>
                    {seg.indices.map((idx) => {
                      const item = data.items[idx];
                      return (
                        <div
                          key={idx}
                          id={`${idx + 1}`}
                          className="diff-row"
                          style={{
                            scrollMarginTop: "4rem",
                            outline:
                              activeIndex === idx + 1 ? "2px solid #009edb" : undefined,
                            borderRadius: "0.375rem",
                          }}
                        >
                          <a
                            href={(() => {
                              const s = window.location.search;
                              if (!s) return `?index=${idx + 1}`;
                              return /[?&]index=/.test(s)
                                ? s.replace(/([?&]index=)[^&]*/, `$1${idx + 1}`)
                                : `${s}&index=${idx + 1}`;
                            })()}
                            className="diff-row-anchor"
                            aria-label={`Paragraph ${idx + 1}`}
                            title={`¶${idx + 1}`}
                            onClick={(e) => {
                              e.preventDefault();
                              const n = idx + 1;
                              const s = window.location.search;
                              const newSearch = !s
                                ? `?index=${n}`
                                : /[?&]index=/.test(s)
                                  ? s.replace(/([?&]index=)[^&]*/, `$1${n}`)
                                  : `${s}&index=${n}`;
                              const newUrl = `${window.location.origin}${window.location.pathname}${newSearch}`;
                              history.pushState(null, "", newSearch);
                              navigator.clipboard?.writeText(newUrl);
                              setActiveIndex(n);
                              const el = document.getElementById(String(n));
                              if (el)
                                el.scrollIntoView({ behavior: "smooth", block: "nearest" });
                            }}
                          >
                            {idx + 1}
                          </a>
                          <Comparison item={item} searchQuery={searchQuery} />
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              }

              return (
                <div key={`hidden-${si}`} style={{ position: "relative" }}>
                  {/* Zero-size anchors preserving every original id */}
                  {seg.indices.map((idx) => (
                    <div
                      key={idx}
                      id={`${idx + 1}`}
                      style={{ scrollMarginTop: "4rem" }}
                    />
                  ))}
                  {/* Single thin collapsed bar — click to expand */}
                  <button
                    onClick={() =>
                      setExpandedGroups((prev) => new Set([...prev, groupKey]))
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      width: "100%",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "0.375rem",
                      border: "1px dashed #e5e7eb",
                      background: "transparent",
                      color: "#9ca3af",
                      fontSize: "0.7rem",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s, border-color 0.15s, color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#009edb";
                      (e.currentTarget as HTMLButtonElement).style.color = "#009edb";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb";
                      (e.currentTarget as HTMLButtonElement).style.color = "#9ca3af";
                    }}
                    title="Click to expand"
                  >
                    <svg
                      style={{ width: "0.75rem", height: "0.75rem", flexShrink: 0 }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 12h14M5 8h14M5 16h14"
                      />
                    </svg>
                    {count} identical paragraph{count !== 1 ? "s" : ""} — click to expand
                  </button>
                </div>
              );
            }

            const { item, index } = seg;
            return (
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
                    const s = window.location.search;
                    if (!s) return `?index=${index + 1}`;
                    return /[?&]index=/.test(s)
                      ? s.replace(/([?&]index=)[^&]*/, `$1${index + 1}`)
                      : `${s}&index=${index + 1}`;
                  })()}
                  className="diff-row-anchor"
                  aria-label={`Paragraph ${index + 1}`}
                  title={`¶${index + 1}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const n = index + 1;
                    const s = window.location.search;
                    const newSearch = !s
                      ? `?index=${n}`
                      : /[?&]index=/.test(s)
                        ? s.replace(/([?&]index=)[^&]*/, `$1${n}`)
                        : `${s}&index=${n}`;
                    const newUrl = `${window.location.origin}${window.location.pathname}${newSearch}`;
                    history.pushState(null, "", newSearch);
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
            );
          });
        })()}
      </div>
    </div>
  );
}

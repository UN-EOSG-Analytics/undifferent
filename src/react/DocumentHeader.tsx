"use client";

import React from "react";
import type { UNDocumentMetadata } from "../un-fetcher";

export interface DocumentHeaderProps {
  symbol: string;
  metadata?: UNDocumentMetadata;
  format?: "doc" | "pdf";
  className?: string;
}

/**
 * Document header showing symbol, date, PDF link, and optional metadata
 */
export function DocumentHeader({
  symbol,
  metadata,
  format,
  className = "",
}: DocumentHeaderProps) {
  const pdfUrl = `https://documents.un.org/api/symbol/access?s=${encodeURIComponent(symbol)}&l=en&t=pdf`;

  return (
    <div className={className} style={{ textAlign: "left" }}>
      <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>{symbol}</h3>

      {metadata?.date && (
        <p
          style={{
            marginTop: "0.25rem",
            fontSize: "0.875rem",
            color: "#4b5563",
          }}
        >
          {new Date(metadata.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      )}

      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-block",
          marginTop: "0.25rem",
          fontSize: "0.875rem",
          color: "var(--color-un-blue)",
          textDecoration: "none",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.textDecoration = "underline")
        }
        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
      >
        View PDF →
      </a>

      {metadata?.vote && (
        <p
          style={{
            marginTop: "0.25rem",
            fontSize: "0.75rem",
            color: "#6b7280",
          }}
        >
          Vote: {metadata.vote.inFavour}–{metadata.vote.against}–
          {metadata.vote.abstaining}
        </p>
      )}

      {format === "pdf" && (
        <p
          style={{
            marginTop: "0.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            fontSize: "0.75rem",
            color: "#d97706",
          }}
        >
          <svg
            style={{ width: "0.75rem", height: "0.75rem" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          PDF source (lower quality)
        </p>
      )}
    </div>
  );
}

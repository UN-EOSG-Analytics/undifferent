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
    <div
      className={className}
      style={{
        textAlign: "left",
        background: "#fff",
        borderRadius: "0.75rem",
        padding: "1rem 1.25rem",
        boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.07), 0 0 0 1px rgb(0 0 0 / 0.04)",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "0.65rem",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#9ca3af",
          marginBottom: "0.35rem",
        }}
      ></p>
      <h3
        style={{
          fontSize: "1.125rem",
          fontWeight: 700,
          margin: 0,
          letterSpacing: "-0.01em",
          color: "#111827",
        }}
      >
        {symbol}
      </h3>

      {metadata?.date && (
        <p
          style={{
            marginTop: "0.3rem",
            fontSize: "0.8125rem",
            color: "#6b7280",
          }}
        >
          {(() => {
            // Parse YYYY-MM-DD parts directly to avoid UTC→local timezone shift
            const [y, m, d] = metadata.date!.split("-").map(Number);
            return new Date(y, m - 1, d).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });
          })()}
        </p>
      )}

      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.25rem",
          marginTop: "0.6rem",
          fontSize: "0.8125rem",
          fontWeight: 500,
          color: "var(--color-un-blue, #009edb)",
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

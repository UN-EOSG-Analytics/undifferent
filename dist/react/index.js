"use client";

// src/react/parse-text.tsx
import { jsx } from "react/jsx-runtime";
function parseHighlightedText(text) {
  if (!text) return null;
  const parts = [];
  let remaining = text;
  let key = 0;
  while (remaining) {
    const strikeMatch = remaining.match(/~~([^~]+)~~/);
    const highlightMatch = remaining.match(/\*\*([^*]+)\*\*/);
    const strikeIndex = strikeMatch ? remaining.indexOf(strikeMatch[0]) : -1;
    const highlightIndex = highlightMatch ? remaining.indexOf(highlightMatch[0]) : -1;
    if (strikeIndex === -1 && highlightIndex === -1) {
      parts.push(/* @__PURE__ */ jsx("span", { children: remaining }, key));
      break;
    }
    const nextMatch = strikeIndex !== -1 && highlightIndex !== -1 ? strikeIndex < highlightIndex ? "strike" : "highlight" : strikeIndex !== -1 ? "strike" : "highlight";
    const matchIndex = nextMatch === "strike" ? strikeIndex : highlightIndex;
    const match = nextMatch === "strike" ? strikeMatch : highlightMatch;
    if (matchIndex > 0) {
      parts.push(/* @__PURE__ */ jsx("span", { children: remaining.substring(0, matchIndex) }, key++));
    }
    if (nextMatch === "strike" && match) {
      parts.push(
        /* @__PURE__ */ jsx(
          "span",
          {
            style: {
              backgroundColor: "color-mix(in srgb, red, transparent 70%)"
            },
            children: match[1]
          },
          key++
        )
      );
    } else if (match) {
      parts.push(
        /* @__PURE__ */ jsx(
          "span",
          {
            style: {
              backgroundColor: "color-mix(in srgb, lightgreen, transparent 70%)"
            },
            children: match[1]
          },
          key++
        )
      );
    }
    remaining = remaining.substring(matchIndex + (match?.[0]?.length || 0));
  }
  return parts;
}

// src/react/DiffItem.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
function DiffItem({ content, color, className = "" }) {
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
  return /* @__PURE__ */ jsx2(
    "div",
    {
      className,
      style: {
        flex: 1,
        borderRadius: "0.375rem",
        padding: "0.75rem",
        textAlign: "left",
        display: "flex",
        minHeight: "2.5rem",
        alignItems: "flex-start",
        ...getColorStyle()
      },
      children: /* @__PURE__ */ jsx2("div", { style: { width: "100%" }, children: parseHighlightedText(content || "") })
    }
  );
}

// src/react/Comparison.tsx
import { jsx as jsx3, jsxs } from "react/jsx-runtime";
function Comparison({
  item,
  className = "",
  gap = "1rem"
}) {
  const isAdded = item.right && !item.left && !item.leftBest;
  const isRemoved = item.left && !item.right && !item.rightBest;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className,
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap,
        width: "100%"
      },
      children: [
        item.left ? /* @__PURE__ */ jsx3(
          DiffItem,
          {
            content: isRemoved ? item.left : item.leftHighlighted,
            color: isRemoved ? "red" : void 0
          }
        ) : /* @__PURE__ */ jsx3(DiffItem, { content: item.leftHighlighted }),
        item.right ? /* @__PURE__ */ jsx3(
          DiffItem,
          {
            content: isAdded ? item.right : item.rightHighlighted,
            color: isAdded ? "lightgreen" : void 0
          }
        ) : /* @__PURE__ */ jsx3(DiffItem, { content: item.rightHighlighted })
      ]
    }
  );
}

// src/react/DocumentHeader.tsx
import { jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
function DocumentHeader({
  symbol,
  metadata,
  format,
  className = ""
}) {
  const pdfUrl = `https://documents.un.org/api/symbol/access?s=${encodeURIComponent(symbol)}&l=en&t=pdf`;
  return /* @__PURE__ */ jsxs2("div", { className, style: { textAlign: "left" }, children: [
    /* @__PURE__ */ jsx4("h3", { style: { fontSize: "1rem", fontWeight: 600, margin: 0 }, children: symbol }),
    metadata?.date && /* @__PURE__ */ jsx4(
      "p",
      {
        style: {
          marginTop: "0.25rem",
          fontSize: "0.875rem",
          color: "#4b5563"
        },
        children: new Date(metadata.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric"
        })
      }
    ),
    /* @__PURE__ */ jsx4(
      "a",
      {
        href: pdfUrl,
        target: "_blank",
        rel: "noopener noreferrer",
        style: {
          display: "inline-block",
          marginTop: "0.25rem",
          fontSize: "0.875rem",
          color: "var(--color-un-blue)",
          textDecoration: "none"
        },
        onMouseEnter: (e) => e.currentTarget.style.textDecoration = "underline",
        onMouseLeave: (e) => e.currentTarget.style.textDecoration = "none",
        children: "View PDF \u2192"
      }
    ),
    metadata?.vote && /* @__PURE__ */ jsxs2(
      "p",
      {
        style: {
          marginTop: "0.25rem",
          fontSize: "0.75rem",
          color: "#6b7280"
        },
        children: [
          "Vote: ",
          metadata.vote.inFavour,
          "\u2013",
          metadata.vote.against,
          "\u2013",
          metadata.vote.abstaining
        ]
      }
    ),
    format === "pdf" && /* @__PURE__ */ jsxs2(
      "p",
      {
        style: {
          marginTop: "0.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
          fontSize: "0.75rem",
          color: "#d97706"
        },
        children: [
          /* @__PURE__ */ jsx4(
            "svg",
            {
              style: { width: "0.75rem", height: "0.75rem" },
              fill: "none",
              viewBox: "0 0 24 24",
              stroke: "currentColor",
              strokeWidth: 2,
              children: /* @__PURE__ */ jsx4(
                "path",
                {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                }
              )
            }
          ),
          "PDF source (lower quality)"
        ]
      }
    )
  ] });
}

// src/react/DiffViewer.tsx
import { jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
function DiffViewer({
  data,
  left,
  right,
  className = ""
}) {
  return /* @__PURE__ */ jsxs3(
    "div",
    {
      className,
      style: { display: "flex", flexDirection: "column", gap: "1rem" },
      children: [
        /* @__PURE__ */ jsxs3(
          "div",
          {
            style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
            children: [
              /* @__PURE__ */ jsx5(
                DocumentHeader,
                {
                  symbol: left.symbol,
                  metadata: left.metadata,
                  format: left.format
                }
              ),
              /* @__PURE__ */ jsx5(
                DocumentHeader,
                {
                  symbol: right.symbol,
                  metadata: right.metadata,
                  format: right.format
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsx5("div", { style: { display: "flex", flexDirection: "column", gap: "0.5rem" }, children: data.items.map((item, index) => /* @__PURE__ */ jsx5(Comparison, { item }, index)) })
      ]
    }
  );
}
export {
  Comparison,
  DiffItem,
  DiffViewer,
  DocumentHeader,
  parseHighlightedText
};

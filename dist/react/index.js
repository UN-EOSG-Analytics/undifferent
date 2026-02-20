"use client";

// src/react/DiffViewer.tsx
import React from "react";

// src/react/parse-text.tsx
import { jsx } from "react/jsx-runtime";
function applySearchHighlight(text, query, keyOffset) {
  if (!query.trim())
    return { nodes: [/* @__PURE__ */ jsx("span", { children: text }, keyOffset)], count: 0 };
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "gi");
  const nodes = [];
  let lastIndex = 0;
  let k = keyOffset;
  let count = 0;
  for (const m of text.matchAll(regex)) {
    if (m.index > lastIndex) {
      nodes.push(/* @__PURE__ */ jsx("span", { children: text.slice(lastIndex, m.index) }, k++));
    }
    nodes.push(
      /* @__PURE__ */ jsx(
        "mark",
        {
          className: "search-highlight",
          style: {
            backgroundColor: "color-mix(in srgb, #009edb, transparent 65%)",
            color: "inherit",
            borderRadius: "2px",
            padding: "0 1px"
          },
          children: m[0]
        },
        k++
      )
    );
    lastIndex = m.index + m[0].length;
    count++;
  }
  if (lastIndex < text.length) {
    nodes.push(/* @__PURE__ */ jsx("span", { children: text.slice(lastIndex) }, k++));
  }
  return { nodes, count };
}
function parseHighlightedText(text, searchQuery) {
  if (!text) return null;
  const parts = [];
  let remaining = text;
  let key = 0;
  const textNode = (t) => {
    if (searchQuery) {
      const { nodes } = applySearchHighlight(t, searchQuery, key);
      key += nodes.length * 2 + 1;
      return nodes;
    }
    return [/* @__PURE__ */ jsx("span", { children: t }, key++)];
  };
  while (remaining) {
    const strikeMatch = remaining.match(/~~([^~]+)~~/);
    const highlightMatch = remaining.match(/\*\*([^*]+)\*\*/);
    const strikeIndex = strikeMatch ? remaining.indexOf(strikeMatch[0]) : -1;
    const highlightIndex = highlightMatch ? remaining.indexOf(highlightMatch[0]) : -1;
    if (strikeIndex === -1 && highlightIndex === -1) {
      parts.push(...textNode(remaining));
      break;
    }
    const nextMatch = strikeIndex !== -1 && highlightIndex !== -1 ? strikeIndex < highlightIndex ? "strike" : "highlight" : strikeIndex !== -1 ? "strike" : "highlight";
    const matchIndex = nextMatch === "strike" ? strikeIndex : highlightIndex;
    const match = nextMatch === "strike" ? strikeMatch : highlightMatch;
    if (matchIndex > 0) {
      parts.push(...textNode(remaining.substring(0, matchIndex)));
    }
    if (nextMatch === "strike" && match) {
      parts.push(
        /* @__PURE__ */ jsx(
          "span",
          {
            style: {
              backgroundColor: "color-mix(in srgb, red, transparent 70%)"
            },
            children: searchQuery ? applySearchHighlight(match[1], searchQuery, key).nodes : match[1]
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
            children: searchQuery ? applySearchHighlight(match[1], searchQuery, key).nodes : match[1]
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
function DiffItem({
  content,
  color,
  className = "",
  searchQuery
}) {
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
      children: /* @__PURE__ */ jsx2("div", { style: { width: "100%" }, children: parseHighlightedText(content || "", searchQuery) })
    }
  );
}

// src/react/Comparison.tsx
import { jsx as jsx3, jsxs } from "react/jsx-runtime";
function Comparison({
  item,
  className = "",
  gap = "1rem",
  searchQuery
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
            color: isRemoved ? "red" : void 0,
            searchQuery
          }
        ) : /* @__PURE__ */ jsx3(DiffItem, { content: item.leftHighlighted, searchQuery }),
        item.right ? /* @__PURE__ */ jsx3(
          DiffItem,
          {
            content: isAdded ? item.right : item.rightHighlighted,
            color: isAdded ? "lightgreen" : void 0,
            searchQuery
          }
        ) : /* @__PURE__ */ jsx3(DiffItem, { content: item.rightHighlighted, searchQuery })
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
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      className,
      style: {
        textAlign: "left",
        background: "#fff",
        borderRadius: "0.75rem",
        padding: "1rem 1.25rem",
        boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.07), 0 0 0 1px rgb(0 0 0 / 0.04)"
      },
      children: [
        /* @__PURE__ */ jsx4(
          "p",
          {
            style: {
              margin: 0,
              fontSize: "0.65rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#9ca3af",
              marginBottom: "0.35rem"
            }
          }
        ),
        /* @__PURE__ */ jsx4(
          "h3",
          {
            style: {
              fontSize: "1.125rem",
              fontWeight: 700,
              margin: 0,
              letterSpacing: "-0.01em",
              color: "#111827"
            },
            children: symbol
          }
        ),
        metadata?.date && /* @__PURE__ */ jsx4(
          "p",
          {
            style: {
              marginTop: "0.3rem",
              fontSize: "0.8125rem",
              color: "#6b7280"
            },
            children: (() => {
              const [y, m, d] = metadata.date.split("-").map(Number);
              return new Date(y, m - 1, d).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
              });
            })()
          }
        ),
        /* @__PURE__ */ jsx4(
          "a",
          {
            href: pdfUrl,
            target: "_blank",
            rel: "noopener noreferrer",
            style: {
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
              marginTop: "0.6rem",
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "var(--color-un-blue, #009edb)",
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
      ]
    }
  );
}

// src/react/DiffViewer.tsx
import { jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
function DiffViewer({
  data,
  left,
  right,
  className = "",
  searchQuery,
  hideIdentical = false
}) {
  const [activeIndex, setActiveIndex] = React.useState(() => {
    if (typeof window === "undefined") return null;
    const v = new URLSearchParams(window.location.search).get("index");
    return v !== null ? Number(v) : null;
  });
  const [expandedGroups, setExpandedGroups] = React.useState(/* @__PURE__ */ new Set());
  const prevHideIdentical = React.useRef(hideIdentical);
  if (prevHideIdentical.current !== hideIdentical) {
    prevHideIdentical.current = hideIdentical;
    if (!hideIdentical) setExpandedGroups(/* @__PURE__ */ new Set());
  }
  return /* @__PURE__ */ jsxs3(
    "div",
    {
      className,
      style: { display: "flex", flexDirection: "column", gap: "1rem" },
      children: [
        /* @__PURE__ */ jsxs3(
          "div",
          {
            style: {
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem"
            },
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
        /* @__PURE__ */ jsx5("style", { children: `
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
      ` }),
        /* @__PURE__ */ jsx5("div", { style: { display: "flex", flexDirection: "column", gap: "0.5rem" }, children: (() => {
          const segments = [];
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
                return /* @__PURE__ */ jsx5(React.Fragment, { children: seg.indices.map((idx) => {
                  const item2 = data.items[idx];
                  return /* @__PURE__ */ jsxs3(
                    "div",
                    {
                      id: `${idx + 1}`,
                      className: "diff-row",
                      style: {
                        scrollMarginTop: "4rem",
                        outline: activeIndex === idx + 1 ? "2px solid #009edb" : void 0,
                        borderRadius: "0.375rem"
                      },
                      children: [
                        /* @__PURE__ */ jsx5(
                          "a",
                          {
                            href: (() => {
                              const s = window.location.search;
                              if (!s) return `?index=${idx + 1}`;
                              return /[?&]index=/.test(s) ? s.replace(/([?&]index=)[^&]*/, `$1${idx + 1}`) : `${s}&index=${idx + 1}`;
                            })(),
                            className: "diff-row-anchor",
                            "aria-label": `Paragraph ${idx + 1}`,
                            title: `\xB6${idx + 1}`,
                            onClick: (e) => {
                              e.preventDefault();
                              const n = idx + 1;
                              const s = window.location.search;
                              const newSearch = !s ? `?index=${n}` : /[?&]index=/.test(s) ? s.replace(/([?&]index=)[^&]*/, `$1${n}`) : `${s}&index=${n}`;
                              const newUrl = `${window.location.origin}${window.location.pathname}${newSearch}`;
                              history.pushState(null, "", newSearch);
                              navigator.clipboard?.writeText(newUrl);
                              setActiveIndex(n);
                              const el = document.getElementById(String(n));
                              if (el)
                                el.scrollIntoView({ behavior: "smooth", block: "nearest" });
                            },
                            children: idx + 1
                          }
                        ),
                        /* @__PURE__ */ jsx5(Comparison, { item: item2, searchQuery })
                      ]
                    },
                    idx
                  );
                }) }, `hidden-${si}`);
              }
              return /* @__PURE__ */ jsxs3("div", { style: { position: "relative" }, children: [
                seg.indices.map((idx) => /* @__PURE__ */ jsx5(
                  "div",
                  {
                    id: `${idx + 1}`,
                    style: { scrollMarginTop: "4rem" }
                  },
                  idx
                )),
                /* @__PURE__ */ jsxs3(
                  "button",
                  {
                    onClick: () => setExpandedGroups((prev) => /* @__PURE__ */ new Set([...prev, groupKey])),
                    style: {
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
                      transition: "background 0.15s, border-color 0.15s, color 0.15s"
                    },
                    onMouseEnter: (e) => {
                      e.currentTarget.style.background = "#f9fafb";
                      e.currentTarget.style.borderColor = "#009edb";
                      e.currentTarget.style.color = "#009edb";
                    },
                    onMouseLeave: (e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.borderColor = "#e5e7eb";
                      e.currentTarget.style.color = "#9ca3af";
                    },
                    title: "Click to expand",
                    children: [
                      /* @__PURE__ */ jsx5(
                        "svg",
                        {
                          style: { width: "0.75rem", height: "0.75rem", flexShrink: 0 },
                          fill: "none",
                          viewBox: "0 0 24 24",
                          stroke: "currentColor",
                          strokeWidth: 2,
                          children: /* @__PURE__ */ jsx5(
                            "path",
                            {
                              strokeLinecap: "round",
                              strokeLinejoin: "round",
                              d: "M5 12h14M5 8h14M5 16h14"
                            }
                          )
                        }
                      ),
                      count,
                      " identical paragraph",
                      count !== 1 ? "s" : "",
                      " \u2014 click to expand"
                    ]
                  }
                )
              ] }, `hidden-${si}`);
            }
            const { item, index } = seg;
            return /* @__PURE__ */ jsxs3(
              "div",
              {
                id: `${index + 1}`,
                className: "diff-row",
                style: {
                  scrollMarginTop: "4rem",
                  outline: activeIndex === index + 1 ? "2px solid #009edb" : void 0,
                  borderRadius: "0.375rem"
                },
                children: [
                  /* @__PURE__ */ jsx5(
                    "a",
                    {
                      href: (() => {
                        const s = window.location.search;
                        if (!s) return `?index=${index + 1}`;
                        return /[?&]index=/.test(s) ? s.replace(/([?&]index=)[^&]*/, `$1${index + 1}`) : `${s}&index=${index + 1}`;
                      })(),
                      className: "diff-row-anchor",
                      "aria-label": `Paragraph ${index + 1}`,
                      title: `\xB6${index + 1}`,
                      onClick: (e) => {
                        e.preventDefault();
                        const n = index + 1;
                        const s = window.location.search;
                        const newSearch = !s ? `?index=${n}` : /[?&]index=/.test(s) ? s.replace(/([?&]index=)[^&]*/, `$1${n}`) : `${s}&index=${n}`;
                        const newUrl = `${window.location.origin}${window.location.pathname}${newSearch}`;
                        history.pushState(null, "", newSearch);
                        navigator.clipboard?.writeText(newUrl);
                        setActiveIndex(n);
                        const el = document.getElementById(String(n));
                        if (el)
                          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
                      },
                      children: index + 1
                    }
                  ),
                  /* @__PURE__ */ jsx5(Comparison, { item, searchQuery })
                ]
              },
              index
            );
          });
        })() })
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

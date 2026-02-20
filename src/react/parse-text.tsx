import React from "react";

/** Splits `text` at all case-insensitive occurrences of `query` and wraps
 *  matches in a <mark> element with UN blue highlighting. */
function applySearchHighlight(
  text: string,
  query: string,
  keyOffset: number,
): { nodes: React.ReactNode[]; count: number } {
  if (!query.trim())
    return { nodes: [<span key={keyOffset}>{text}</span>], count: 0 };

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "gi");
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let k = keyOffset;
  let count = 0;

  for (const m of text.matchAll(regex)) {
    if (m.index > lastIndex) {
      nodes.push(<span key={k++}>{text.slice(lastIndex, m.index)}</span>);
    }
    nodes.push(
      <mark
        key={k++}
        className="search-highlight"
        style={{
          backgroundColor: "color-mix(in srgb, #009edb, transparent 65%)",
          color: "inherit",
          borderRadius: "2px",
          padding: "0 1px",
        }}
      >
        {m[0]}
      </mark>,
    );
    lastIndex = m.index + m[0].length;
    count++;
  }

  if (lastIndex < text.length) {
    nodes.push(<span key={k++}>{text.slice(lastIndex)}</span>);
  }

  return { nodes, count };
}

/**
 * Parse diff markup text and return React elements with styling
 * Handles **added** and ~~removed~~ markup.
 * Pass `searchQuery` to additionally highlight fulltext search matches in UN blue.
 */
export function parseHighlightedText(
  text: string,
  searchQuery?: string,
): React.ReactNode {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  const textNode = (t: string) => {
    if (searchQuery) {
      const { nodes } = applySearchHighlight(t, searchQuery, key);
      key += nodes.length * 2 + 1;
      return nodes;
    }
    return [<span key={key++}>{t}</span>];
  };

  while (remaining) {
    // Find strikethrough
    const strikeMatch = remaining.match(/~~([^~]+)~~/);
    // Find highlight
    const highlightMatch = remaining.match(/\*\*([^*]+)\*\*/);

    const strikeIndex = strikeMatch ? remaining.indexOf(strikeMatch[0]) : -1;
    const highlightIndex = highlightMatch
      ? remaining.indexOf(highlightMatch[0])
      : -1;

    if (strikeIndex === -1 && highlightIndex === -1) {
      // No more matches, add remaining text
      parts.push(...textNode(remaining));
      break;
    }

    const nextMatch =
      strikeIndex !== -1 && highlightIndex !== -1
        ? strikeIndex < highlightIndex
          ? "strike"
          : "highlight"
        : strikeIndex !== -1
          ? "strike"
          : "highlight";

    const matchIndex = nextMatch === "strike" ? strikeIndex : highlightIndex;
    const match = nextMatch === "strike" ? strikeMatch : highlightMatch;

    // Add text before match
    if (matchIndex > 0) {
      parts.push(...textNode(remaining.substring(0, matchIndex)));
    }

    // Add styled match
    if (nextMatch === "strike" && match) {
      parts.push(
        <span
          key={key++}
          style={{
            backgroundColor: "color-mix(in srgb, red, transparent 70%)",
          }}
        >
          {searchQuery
            ? applySearchHighlight(match[1], searchQuery, key).nodes
            : match[1]}
        </span>,
      );
    } else if (match) {
      parts.push(
        <span
          key={key++}
          style={{
            backgroundColor: "color-mix(in srgb, lightgreen, transparent 70%)",
          }}
        >
          {searchQuery
            ? applySearchHighlight(match[1], searchQuery, key).nodes
            : match[1]}
        </span>,
      );
    }

    // Continue with remaining text
    remaining = remaining.substring(matchIndex + (match?.[0]?.length || 0));
  }

  return parts;
}

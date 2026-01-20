import React from 'react'

/**
 * Parse diff markup text and return React elements with styling
 * Handles **added** and ~~removed~~ markup
 */
export function parseHighlightedText(text: string): React.ReactNode {
  if (!text) return null

  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining) {
    // Find strikethrough
    const strikeMatch = remaining.match(/~~([^~]+)~~/)
    // Find highlight
    const highlightMatch = remaining.match(/\*\*([^*]+)\*\*/)

    const strikeIndex = strikeMatch ? remaining.indexOf(strikeMatch[0]) : -1
    const highlightIndex = highlightMatch
      ? remaining.indexOf(highlightMatch[0])
      : -1

    if (strikeIndex === -1 && highlightIndex === -1) {
      // No more matches, add remaining text
      parts.push(<span key={key}>{remaining}</span>)
      break
    }

    const nextMatch =
      strikeIndex !== -1 && highlightIndex !== -1
        ? strikeIndex < highlightIndex
          ? 'strike'
          : 'highlight'
        : strikeIndex !== -1
          ? 'strike'
          : 'highlight'

    const matchIndex = nextMatch === 'strike' ? strikeIndex : highlightIndex
    const match = nextMatch === 'strike' ? strikeMatch : highlightMatch

    // Add text before match
    if (matchIndex > 0) {
      parts.push(<span key={key++}>{remaining.substring(0, matchIndex)}</span>)
    }

    // Add styled match
    if (nextMatch === 'strike' && match) {
      parts.push(
        <span
          key={key++}
          style={{
            backgroundColor: 'color-mix(in srgb, red, transparent 70%)',
          }}
        >
          {match[1]}
        </span>
      )
    } else if (match) {
      parts.push(
        <span
          key={key++}
          style={{
            backgroundColor: 'color-mix(in srgb, lightgreen, transparent 70%)',
          }}
        >
          {match[1]}
        </span>
      )
    }

    // Continue with remaining text
    remaining = remaining.substring(matchIndex + (match?.[0]?.length || 0))
  }

  return parts
}

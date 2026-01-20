import * as Diff from 'diff'

export interface HighlightResult {
  left: string
  right: string
}

/**
 * Generate highlighted diff markup for two strings
 * Uses **text** for additions and ~~text~~ for removals
 */
export function highlight(a: string | null, b: string | null): HighlightResult {
  const left = a || ''
  const right = b || ''

  const changes = Diff.diffChars(left, right)
  let leftHighlighted = ''
  let rightHighlighted = ''

  for (const change of changes) {
    if (change.added) {
      rightHighlighted += `**${change.value}**`
    } else if (change.removed) {
      leftHighlighted += `~~${change.value}~~`
    } else {
      leftHighlighted += change.value
      rightHighlighted += change.value
    }
  }

  return {
    left: leftHighlighted,
    right: rightHighlighted,
  }
}

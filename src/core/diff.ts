import { similarity } from "./similarity";
import { highlight } from "./highlight";

export interface DiffItem {
  left: string | null;
  leftBest: string | null;
  leftHighlighted: string;
  leftNumber: number | string;
  right: string | null;
  rightBest: string | null;
  rightHighlighted: string;
  rightNumber: number | string;
  score: number | null;
}

export interface DiffResult {
  score: number;
  items: DiffItem[];
}

export interface DiffOptions {
  /** Similarity threshold for matching lines (0-1). Default: 0.8 */
  threshold?: number;
}

/**
 * Compute a structured diff between two arrays of lines
 * Aligns similar lines and highlights differences
 */
export function diff(
  linesA: string[],
  linesB: string[],
  options: DiffOptions = {},
): DiffResult {
  const { threshold = 0.8 } = options;

  const a = linesA;
  const b = linesB;

  let i = -1; // Start at -1 so first iteration checks from index 0
  let j = 0;
  const items: DiffItem[] = [];

  // Track which lines from A have been used
  const usedALines = new Set<number>();

  while (j < b.length) {
    const bb = b[j];
    let aa: string | null = null;
    let matchedI = -1;

    // Look for matching line in remaining 'a' lines (starting from i+1)
    for (let _i = i + 1; _i < a.length; _i++) {
      if (usedALines.has(_i)) continue;
      const _aa = a[_i];
      if (similarity(_aa, bb) > threshold) {
        // Process intermediate lines from A that don't have a direct match
        for (let __i = i + 1; __i < _i; __i++) {
          if (usedALines.has(__i)) continue;
          const __aa = a[__i];
          const bestMatch = b.reduce(
            (best: { line: string | null; ratio: number }, _bb: string) => {
              const currentRatio = similarity(__aa, _bb);
              return currentRatio > best.ratio
                ? { line: _bb, ratio: currentRatio }
                : best;
            },
            { line: null, ratio: 0 },
          );

          const bestMatchLine =
            bestMatch.ratio > threshold ? bestMatch.line : null;
          const highlighted = highlight(__aa, bestMatchLine);

          items.push({
            left: __aa,
            leftBest: null,
            leftHighlighted: highlighted.left,
            leftNumber: __i,
            right: null,
            rightBest: bestMatchLine,
            rightHighlighted: highlighted.right,
            rightNumber: "-",
            score: null,
          });
          usedALines.add(__i);
        }
        i = _i;
        matchedI = _i;
        aa = _aa;
        usedALines.add(_i);
        break;
      }
    }

    let bestMatch: string | null = null;
    if (!aa) {
      // No sequential match found, look for best match anywhere in A
      const bestMatchResult = a.reduce(
        (
          best: { line: string | null; ratio: number; index: number },
          _aa: string,
          idx: number,
        ) => {
          if (usedALines.has(idx)) return best;
          const currentRatio = similarity(_aa, bb);
          return currentRatio > best.ratio
            ? { line: _aa, ratio: currentRatio, index: idx }
            : best;
        },
        { line: null, ratio: 0, index: -1 },
      );

      bestMatch =
        bestMatchResult.ratio > threshold ? bestMatchResult.line : null;
    }

    const highlighted = highlight(aa || bestMatch, bb);

    items.push({
      left: aa,
      leftBest: bestMatch,
      leftHighlighted: highlighted.left,
      leftNumber: matchedI >= 0 ? matchedI : "-",
      right: bb,
      rightBest: null,
      rightHighlighted: highlighted.right,
      rightNumber: j,
      score: similarity(aa || bestMatch || "", bb),
    });

    j++;
  }

  // Add any remaining lines from A that weren't matched
  for (let k = 0; k < a.length; k++) {
    if (usedALines.has(k)) continue;
    const leftLine = a[k];
    const bestMatch = b.reduce(
      (best: { line: string | null; ratio: number }, _bb: string) => {
        const currentRatio = similarity(leftLine, _bb);
        return currentRatio > best.ratio
          ? { line: _bb, ratio: currentRatio }
          : best;
      },
      { line: null, ratio: 0 },
    );

    const bestMatchLine = bestMatch.ratio > threshold ? bestMatch.line : null;
    const highlighted = highlight(leftLine, bestMatchLine);

    items.push({
      left: leftLine,
      leftBest: null,
      leftHighlighted: highlighted.left,
      leftNumber: k,
      right: null,
      rightBest: bestMatchLine,
      rightHighlighted: highlighted.right,
      rightNumber: "-",
      score: null,
    });
  }

  // Calculate overall score
  const scores = items
    .filter((item) => item.score !== null)
    .map((item) => item.score as number);
  const score =
    scores.length > 0
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : 0;

  return { score, items };
}

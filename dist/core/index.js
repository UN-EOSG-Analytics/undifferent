// src/core/similarity.ts
import * as levenshtein from "fast-levenshtein";
function similarity(a, b) {
  const totalLen = a.length + b.length;
  if (totalLen === 0) return 1;
  const distance = levenshtein.get(a, b);
  return (totalLen - distance) / totalLen;
}

// src/core/highlight.ts
import * as Diff from "diff";
function highlight(a, b) {
  const left = a || "";
  const right = b || "";
  const changes = Diff.diffChars(left, right);
  let leftHighlighted = "";
  let rightHighlighted = "";
  for (const change of changes) {
    if (change.added) {
      rightHighlighted += `**${change.value}**`;
    } else if (change.removed) {
      leftHighlighted += `~~${change.value}~~`;
    } else {
      leftHighlighted += change.value;
      rightHighlighted += change.value;
    }
  }
  return {
    left: leftHighlighted,
    right: rightHighlighted
  };
}

// src/core/diff.ts
function diff(linesA, linesB, options = {}) {
  const { threshold = 0.8 } = options;
  const a = linesA;
  const b = linesB;
  let i = -1;
  let j = 0;
  const items = [];
  const usedALines = /* @__PURE__ */ new Set();
  while (j < b.length) {
    const bb = b[j];
    let aa = null;
    let matchedI = -1;
    for (let _i = i + 1; _i < a.length; _i++) {
      if (usedALines.has(_i)) continue;
      const _aa = a[_i];
      if (similarity(_aa, bb) > threshold) {
        for (let __i = i + 1; __i < _i; __i++) {
          if (usedALines.has(__i)) continue;
          const __aa = a[__i];
          const bestMatch2 = b.reduce(
            (best, _bb) => {
              const currentRatio = similarity(__aa, _bb);
              return currentRatio > best.ratio ? { line: _bb, ratio: currentRatio } : best;
            },
            { line: null, ratio: 0 }
          );
          const bestMatchLine = bestMatch2.ratio > threshold ? bestMatch2.line : null;
          const highlighted2 = highlight(__aa, bestMatchLine);
          items.push({
            left: __aa,
            leftBest: null,
            leftHighlighted: highlighted2.left,
            leftNumber: __i,
            right: null,
            rightBest: bestMatchLine,
            rightHighlighted: highlighted2.right,
            rightNumber: "-",
            score: null
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
    let bestMatch = null;
    if (!aa) {
      const bestMatchResult = a.reduce(
        (best, _aa, idx) => {
          if (usedALines.has(idx)) return best;
          const currentRatio = similarity(_aa, bb);
          return currentRatio > best.ratio ? { line: _aa, ratio: currentRatio, index: idx } : best;
        },
        { line: null, ratio: 0, index: -1 }
      );
      bestMatch = bestMatchResult.ratio > threshold ? bestMatchResult.line : null;
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
      score: similarity(aa || bestMatch || "", bb)
    });
    j++;
  }
  for (let k = 0; k < a.length; k++) {
    if (usedALines.has(k)) continue;
    const leftLine = a[k];
    const bestMatch = b.reduce(
      (best, _bb) => {
        const currentRatio = similarity(leftLine, _bb);
        return currentRatio > best.ratio ? { line: _bb, ratio: currentRatio } : best;
      },
      { line: null, ratio: 0 }
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
      score: null
    });
  }
  const scores = items.filter((item) => item.score !== null).map((item) => item.score);
  const score = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
  return { score, items };
}
export {
  diff,
  highlight,
  similarity
};

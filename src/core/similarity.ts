import * as levenshtein from "fast-levenshtein";

/**
 * Calculate similarity ratio (0-1) between two strings using Levenshtein distance
 */
export function similarity(a: string, b: string): number {
  const totalLen = a.length + b.length;
  if (totalLen === 0) return 1.0;
  const distance = levenshtein.get(a, b);
  return (totalLen - distance) / totalLen;
}

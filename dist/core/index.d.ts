export { D as DiffItem, a as DiffOptions, b as DiffResult, d as diff } from '../diff-DpdOk6Nu.js';

/**
 * Calculate similarity ratio (0-1) between two strings using Levenshtein distance
 */
declare function similarity(a: string, b: string): number;

interface HighlightResult {
    left: string;
    right: string;
}
/**
 * Generate highlighted diff markup for two strings
 * Uses **text** for additions and ~~text~~ for removals
 */
declare function highlight(a: string | null, b: string | null): HighlightResult;

export { type HighlightResult, highlight, similarity };

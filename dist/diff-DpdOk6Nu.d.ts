interface DiffItem {
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
interface DiffResult {
    score: number;
    items: DiffItem[];
}
interface DiffOptions {
    /** Similarity threshold for matching lines (0-1). Default: 0.8 */
    threshold?: number;
}
/**
 * Compute a structured diff between two arrays of lines
 * Aligns similar lines and highlights differences
 */
declare function diff(linesA: string[], linesB: string[], options?: DiffOptions): DiffResult;

export { type DiffItem as D, type DiffOptions as a, type DiffResult as b, diff as d };

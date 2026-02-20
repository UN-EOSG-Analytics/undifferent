import * as react_jsx_runtime from 'react/jsx-runtime';
import { b as DiffResult, D as DiffItem$1 } from '../diff-DpdOk6Nu.js';
import { a as UNDocumentMetadata } from '../fetcher-CpJLlun5.js';
import React from 'react';

interface DiffViewerProps {
    data: DiffResult;
    left: {
        symbol: string;
        metadata?: UNDocumentMetadata;
        format?: "doc" | "pdf";
    };
    right: {
        symbol: string;
        metadata?: UNDocumentMetadata;
        format?: "doc" | "pdf";
    };
    className?: string;
}
/**
 * Full diff viewer component with side-by-side comparison
 */
declare function DiffViewer({ data, left, right, className, }: DiffViewerProps): react_jsx_runtime.JSX.Element;

interface DocumentHeaderProps {
    symbol: string;
    metadata?: UNDocumentMetadata;
    format?: "doc" | "pdf";
    className?: string;
}
/**
 * Document header showing symbol, date, PDF link, and optional metadata
 */
declare function DocumentHeader({ symbol, metadata, format, className, }: DocumentHeaderProps): react_jsx_runtime.JSX.Element;

interface ComparisonProps {
    item: DiffItem$1;
    className?: string;
    gap?: string;
}
/**
 * Side-by-side comparison of a single diff item
 * Shows left and right content with highlighting
 */
declare function Comparison({ item, className, gap, }: ComparisonProps): react_jsx_runtime.JSX.Element;

interface DiffItemProps {
    content: string;
    color?: "red" | "lightgreen" | "yellow" | "blue";
    className?: string;
}
/**
 * Single diff item display component
 * Shows highlighted text with optional background color
 */
declare function DiffItem({ content, color, className }: DiffItemProps): react_jsx_runtime.JSX.Element;

/**
 * Parse diff markup text and return React elements with styling
 * Handles **added** and ~~removed~~ markup
 */
declare function parseHighlightedText(text: string): React.ReactNode;

export { Comparison, type ComparisonProps, DiffItem, type DiffItemProps, DiffViewer, type DiffViewerProps, DocumentHeader, type DocumentHeaderProps, parseHighlightedText };

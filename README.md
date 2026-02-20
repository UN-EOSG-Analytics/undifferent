# undifferent

A diff algorithm and viewer for comparing documents, with special support for UN resolutions.

## Installation

```bash
npm install github:un-eosg-analytics/undifferent#release
```

## Usage

### Core Diff Algorithm

The core module provides a pure TypeScript diff algorithm with no React dependency:

```typescript
import { diff, similarity, highlight } from "undifferent/core";

// Compare two arrays of lines
const result = diff(linesA, linesB, { threshold: 0.8 });

console.log(result.score); // Overall similarity (0-1)
console.log(result.items); // Array of diff items with highlighting

// Calculate similarity between two strings
const score = similarity("hello world", "hello there");

// Get highlighted diff markup
const { left, right } = highlight("old text", "new text");
// left: "~~old~~ text"
// right: "**new** text"
```

### React Components

The react module provides components for displaying diffs:

```tsx
import { DiffViewer, Comparison, DiffItem } from "undifferent/react";
import type { DiffResult } from "undifferent/core";
import type { UNDocumentMetadata } from "undifferent/un-fetcher";

// Full viewer with document headers (symbol, date, PDF link, vote)
<DiffViewer
  data={diffResult}
  left={{
    symbol: "A/RES/77/16",
    metadata: leftMetadata, // UNDocumentMetadata from fetchDocumentMetadata
    format: "doc", // 'doc' | 'pdf'
  }}
  right={{
    symbol: "A/RES/79/326",
    metadata: rightMetadata,
    format: "doc",
  }}
/>;

// Or build your own UI with individual components
{
  diffResult.items.map((item, i) => <Comparison key={i} item={item} />);
}
```

### UN Document Fetching

The un-fetcher module provides utilities for fetching UN documents (server-side only):

```typescript
import { fetchUNDocument, fetchDocumentMetadata } from "undifferent/un-fetcher";

// Fetch a UN document by symbol
const doc = await fetchUNDocument("A/RES/77/16");
console.log(doc.lines); // Array of text lines
console.log(doc.format); // 'doc' or 'pdf'

// Fetch document metadata from UN Digital Library
const meta = await fetchDocumentMetadata("A/HRC/RES/50/13");
console.log(meta.title); // "Access to medicines, vaccines..."
console.log(meta.date); // "2022-07-14"
console.log(meta.year); // 2022
console.log(meta.subjects); // ["RIGHT TO HEALTH", "VACCINES", ...]
console.log(meta.vote); // { inFavour: 29, against: 15, abstaining: 3 }
console.log(meta.agendaInfo); // "Agenda item 134" (optional)
```

## Styling

The React components use CSS variables for theming:

```css
:root {
  --diff-item-bg: #ffffff;
  --diff-added-bg: #bbf7d0;
  --diff-removed-bg: #fef2f2;
  --diff-moved-bg: #fefce8;
  --diff-aligned-bg: #eff6ff;
}
```

## API Reference

### Core

- `diff(linesA, linesB, options?)` - Compute structured diff
- `similarity(a, b)` - Calculate Levenshtein similarity ratio
- `highlight(a, b)` - Generate diff markup

### React

- `<DiffViewer>` - Full diff viewer with document headers and diff items
- `<DocumentHeader>` - Document metadata display (symbol, date, PDF link, vote)
- `<Comparison>` - Single diff row (left + right)
- `<DiffItem>` - Single side content
- `parseHighlightedText(text)` - Parse diff markup to React elements

### UN Fetcher

- `fetchUNDocument(symbol)` - Fetch UN document content by symbol from [ODS](https://documents.un.org)
- `fetchDocumentMetadata(symbol)` - Fetch metadata (title, date, year, subjects, vote, agendaInfo) from [UN Digital Library](https://digitallibrary.un.org)

## Project Structure

```
undifferent/
├── src/                    # LIBRARY CODE - edit here for features
│   ├── core/               # Pure TypeScript diff algorithm (no React)
│   │   ├── diff.ts         # Main diff algorithm
│   │   ├── similarity.ts   # Levenshtein similarity
│   │   └── highlight.ts    # Diff markup generation
│   ├── react/              # React components for displaying diffs
│   │   ├── DiffViewer.tsx  # Main viewer component
│   │   ├── DocumentHeader.tsx # Document metadata display
│   │   ├── Comparison.tsx  # Single diff row (left + right)
│   │   └── DiffItem.tsx    # Single side content
│   └── un-fetcher/         # UN document fetching (server-side)
│       ├── fetcher.ts      # Fetch documents from ODS
│       └── parser.ts       # Parse UN symbols
├── app/                    # DEMO APP ONLY - just consumes the library
│   ├── page.tsx            # Demo page with example comparisons
│   └── api/diff/route.ts   # API endpoint using un-fetcher
└── dist/                   # Built library output (generated on the release branch)
```

**Note:** The `app/` directory is the production web app hosted at [diff.un-two-zero.dev](https://diff.un-two-zero.dev). All reusable diff features, UI components, and logic should be implemented in `src/` (the library). The app should only:

- Provide the user-facing UI and example comparisons
- Call the API and pass data to library components
- Handle routing/navigation

## License

MIT

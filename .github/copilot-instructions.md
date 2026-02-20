# undifferent – Copilot Instructions

## Architecture Overview

This repo is **both a publishable npm library and a Next.js demo app** living in the same workspace.

| Layer                | Location                | Purpose                                                                                                                                  |
| -------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Library – core       | `src/core/`             | Pure TypeScript diff algorithm; no React, no Node.js APIs                                                                                |
| Library – react      | `src/react/`            | React components for rendering diffs; no server/Node.js                                                                                  |
| Library – un-fetcher | `src/un-fetcher/`       | Server-side UN document fetcher/parser; uses `server-only`                                                                               |
| Demo app             | `app/`                  | Production web app deployed on Vercel (live at [diff.un-two-zero.dev](https://diff.un-two-zero.dev)); imports directly from `../src/...` |
| API route            | `app/api/diff/route.ts` | Next.js Route Handler; calls `src/un-fetcher` + `src/core`                                                                               |

The library exposes three package sub-paths defined in `package.json#exports`:  
`undifferent/core`, `undifferent/react`, `undifferent/un-fetcher`

**Tech stack:** Next.js 16 · React 19 · Tailwind CSS 4 · TypeScript 5 · tsup (library bundler)

## Key Build Commands

```bash
pnpm dev           # Next.js dev server only (does NOT rebuild the library)
pnpm build:lib     # Build library to dist/ via tsup (uses tsconfig.lib.json)
pnpm build         # tsup + next build (full production build)
pnpm typecheck     # tsc --noEmit (catches type errors without emitting)
```

- **tsup** bundles `src/{core,react,un-fetcher}` → `dist/` (ESM + `.d.ts`)
- `tsconfig.lib.json` extends `tsconfig.json` with `incremental: false` for library builds
- The app imports from `../src/...` directly, so you don't need to rebuild the library during development

## Core Diff Algorithm (`src/core/`)

- `similarity(a, b)` – Levenshtein ratio returning 0–1 (`fast-levenshtein`)
- `highlight(a, b)` – character-level diff producing `**added**` / `~~removed~~` markdown markup (`diff` package)
- `diff(linesA, linesB, { threshold?: number })` – main entry; default threshold `0.8`. Aligns similar lines, emits `DiffItem[]` with pre-computed highlighted strings and line numbers

## UN Fetcher (`src/un-fetcher/`)

- Marked `server-only` – never import in client components or `src/react/`
- `fetchUNDocument(symbol)` – tries `documents.un.org/api/symbol/access` for Word (.doc) and PDF; uses `word-extractor` / `unpdf` for text extraction; writes temp files to `os.tmpdir()` for Word parsing
- `fetchDocumentMetadata(symbol)` – queries the UN Digital Library OAI-PMH XML endpoint; **must use `User-Agent: curl/8.7.1`** to bypass AWS WAF
- `parseUNSymbol(symbol)` – parses symbols like `A/RES/79/1` into `{ body, session, number, type }`; session→year heuristic only reliable for GA resolutions (session N = 1945+N)

## React Components (`src/react/`)

- The `index.tsx` barrel has `"use client"` at the top – all components are client components
- `DiffViewer` is the top-level component; it composes `DocumentHeader` + `Comparison` (which uses `DiffItem`)
- Styling is driven purely by CSS variables – no Tailwind in the library components themselves:
  ```css
  --diff-added-bg, --diff-removed-bg, --diff-moved-bg, --diff-aligned-bg, --diff-item-bg
  ```
- `parseHighlightedText` converts the `**bold**`/`~~strike~~` markup from `highlight()` into React elements

## Demo App Patterns (`app/`)

- `page.tsx` uses `window.history.pushState` instead of Next.js router to preserve `/` characters in UN symbols (e.g., `A/RES/79/1`) – `router.push` would re-encode slashes
- URL params: `?symbol1=A/RES/77/16&symbol2=A/RES/79/1`
- The diff is fetched client-side via `POST /api/diff` with `{ symbolA, symbolB }` in the body

## Library Backwards Compatibility

The package is installed by external consumers via `npm install github:un-eosg-analytics/undifferent#release`. **Changes to `src/` can break those downstream projects**, not just the Vercel app.

The `release` branch is maintained automatically by `.github/workflows/release.yml`, which rebuilds `dist/` via tsup and force-pushes to `release` whenever `src/`, `tsup.config.ts`, `tsconfig.lib.json`, `package.json`, or `pnpm-lock.yaml` change on `main`. Never push to the `release` branch manually.

Before modifying anything under `src/`:

- **Exported types** (`DiffItem`, `DiffResult`, `UNDocument`, `UNDocumentMetadata`, `ParsedSymbol`, etc.) – adding optional fields is safe; removing or renaming fields is a breaking change
- **Exported function signatures** – adding optional parameters is safe; changing existing parameter types or return shapes is breaking
- **CSS variable names** in `src/react/` – renaming them breaks consumers who have set those variables in their own stylesheets
- **Sub-path exports** (`undifferent/core`, `undifferent/react`, `undifferent/un-fetcher`) – never remove or rename these

App-only changes (`app/`, `app/api/`) do not affect library consumers and can be made freely.

## Conventions

- All library source is strict TypeScript; exported types live alongside their implementations (no separate `types/` directory)
- `src/core` must remain dependency-free of React and Node.js built-ins to stay universally importable
- New UN fetcher utilities belong in `src/un-fetcher/fetcher.ts` or `parser.ts`; add exports via `src/un-fetcher/index.ts`

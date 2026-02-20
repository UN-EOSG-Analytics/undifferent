# Caching Brainstorm

## What's expensive today

Every `POST /api/diff` triggers, in parallel, for each of the two symbols:

1. HTTP download of the `.doc` or `.pdf` from `documents.un.org` (~500 KB–5 MB)
2. Word extraction (temp file → `word-extractor`) or PDF text extraction (`unpdf`)
3. HTTP fetch of XML metadata from `digitallibrary.un.org`
4. `diff()` over the two parsed line arrays

Steps 1–3 are pure I/O with no side-effects. **UN documents are immutable** — once assigned a symbol, the text never changes. **Metadata rarely changes** in practice (title/date/vote won't be amended). This makes everything a strong cache candidate.

### Vercel Data Cache behaviour

On Vercel, the Next.js Data Cache is backed by a **durable, globally shared** storage layer — not per-instance memory. This means:

- All lambda invocations worldwide share the same cache
- It persists across function cold starts
- It is **cleared on every new deployment** by default (no `expireTime` config)

Since deploys happen occasionally and UN content never changes, cache invalidation on deploy is acceptable — a re-query after deploying is fine.

---

## Option A — `unstable_cache` per symbol (server-side Data Cache)

Wrap `fetchUNDocument` and `fetchDocumentMetadata` in `unstable_cache` keyed by the symbol string. Results persist in the Next.js Data Cache across requests and deployments until explicitly revalidated.

```ts
import { unstable_cache } from "next/cache";

// Documents: truly immutable — never revalidate
const cachedFetchDocument = unstable_cache(fetchUNDocument, ["un-doc"], {
  revalidate: false,
});

// Metadata: rarely changes — revalidate once a day
const cachedFetchMetadata = unstable_cache(
  fetchDocumentMetadata,
  ["un-meta"],
  { revalidate: 86400 }, // 24 h
);
```

Different TTLs for different data: `false` for docs (immutable), `86400` for metadata (rarely changes but can).

**Pros**

- No infrastructure changes — works on Vercel out of the box, uses Vercel Data Cache
- Cache is per-symbol, not per-symbol-pair — A+B and A+C share the cached A
- On Vercel the Data Cache is shared across all lambda instances globally
- Covers the full expensive path: download + parse

**Cons**

- `unstable_cache` API is still marked unstable (widely used in production, but naming may change)
- Data Cache is cleared on each new deployment — first request after a deploy re-fetches
- The diff computation (`diff()` over parsed lines) is still re-run every request — though it's CPU-only and fast

---

## Option B — Switch `POST /api/diff` → `GET /api/diff`

Change the route to accept `?symbolA=...&symbolB=...` as query params. GET responses can be cached by Vercel's Edge Network and the browser.

```ts
// app/api/diff/route.ts
export async function GET(request: NextRequest) { ... }

// Add Cache-Control header to response:
return NextResponse.json(data, {
  headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" }
});
```

The client already has `encodeSymbol()` that preserves `/` in symbols for the UI URL; the same encoding works for the API query string.

**Pros**

- **Vercel Edge Cache** — GET responses with `Cache-Control: public, s-maxage=N` are cached at Vercel's CDN POPs globally. Repeated requests for the same symbol pair don't touch a lambda at all. This is included in all Vercel plans at no extra cost.
- Browser also caches the response — navigating back to a seen pair is instant
- Composable with Option A (A makes the first lambda call fast; B means subsequent calls skip the lambda entirely)
- UN docs are immutable → `s-maxage` can be very long (e.g. one year); metadata changes rarely → either use a shorter `s-maxage` for metadata or separate the two responses

**Cons**

- Requires changing the client from `POST` to `GET` and updating URL construction
- UN symbols contain `/` — must use `encodeURIComponent` (encoding `/` as `%2F`) in the query string so the URL is unambiguous; the UI URL trick doesn't apply here
- Can't easily set different cache TTLs for the doc content vs. metadata in a single combined response

---

## Option C — `force-cache` on raw `fetch` calls in `fetcher.ts`

Add `cache: 'force-cache'` to the `fetch` calls inside `fetchUNDocument` and `fetchDocumentMetadata`. This caches the raw HTTP response in Next.js's Data Cache.

```ts
const docResponse = await fetch(docUrl, {
  cache: "force-cache",
  headers: { ... },
});
```

**Pros**

- One-line change per fetch call
- Deduplicates the actual network download

**Cons**

- Only caches the raw HTTP bytes — `word-extractor` and `unpdf` parsing still run every time
- Does **not** help with the metadata XML parsing
- Less explicit than `unstable_cache`; harder to reason about TTL/invalidation

---

## Option D — Client-side in-memory cache (React useRef/useState)

Memoize diff results in the client component, keyed by `${symbolA}::${symbolB}`. Already sort-of implicit in that React state persists during a session, but could be made explicit with a `useRef` map.

**Pros**

- Zero server changes
- Instant re-render when the user switches back to a previously seen pair in the same session

**Cons**

- Lost on page refresh and between users
- Doesn't help with the actual server-side cost at all

---

## Option E — Vercel KV (Redis) persistent cache

Explicitly cache parsed documents and/or full diff results in Vercel KV, keyed by symbol or symbol pair.

**Pros**

- Survives deployments (unlike Next.js Data Cache which clears on redeploy)
- Shared across all lambda instances immediately

**Cons**

- Adds an external dependency and cost
- Extra latency on KV reads (~1–5 ms) vs in-process Data Cache
- **Probably not worth it**: documents are immutable so re-fetching after a deploy is fine; if B (Edge Cache) is in place, the lambda is rarely hit anyway; KV would only matter if cold-start lambda calls after deploys are a visible problem

---

## Recommendation

| Option                              | Effort   | Scope               | Impact                                             |
| ----------------------------------- | -------- | ------------------- | -------------------------------------------------- |
| **A** — `unstable_cache` per symbol | Low      | Server (Data Cache) | High — documents + metadata parsed once per deploy |
| **B** — GET + Vercel Edge Cache     | Medium   | CDN + Browser       | Very High — repeat pairs never hit lambda          |
| **D** — Client-side memo            | Very Low | Browser session     | Medium — free win for same-session revisits        |
| C — `force-cache` on fetch          | Low      | Server              | Low — redundant if A is in place                   |
| E — Vercel KV                       | High     | Server              | Low marginal gain; overkill here                   |

### The call: A now, B later

**Option A — implemented.** `unstable_cache` on both `fetchUNDocument` (revalidate: false) and `fetchDocumentMetadata` (revalidate: 86400) means:

- First request after a deploy does the full work
- Every subsequent request for a symbol the server has seen hits the Vercel Data Cache — no re-download, no re-parse
- Metadata refreshes daily without a deploy needed

**Option B — deferred.** POST → GET migration is the bigger architectural change. Skipping for now.

**Option D — implemented.** The page now has a two-level client cache:
- **In-memory** (`useRef` Map): instant within the same tab session
- **`localStorage`**: survives page refresh and re-opening the same URL in a new tab

Both are keyed by `${symbolA}::${symbolB}` under the `undiff::` prefix. Writes to `localStorage` are wrapped in try/catch so quota-exceeded and private-mode environments degrade gracefully to session-only caching.

**E (KV) — skip.** Overkill given A covers the main cases.

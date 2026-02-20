"use client";

import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from "react";
import type { DiffResult } from "../src/core";
import { DiffViewer } from "../src/react";
import type { UNDocumentMetadata } from "../src/un-fetcher";

interface DiffResponse extends DiffResult {
  formats?: {
    left: "doc" | "pdf";
    right: "doc" | "pdf";
  };
  metadata?: {
    left: UNDocumentMetadata;
    right: UNDocumentMetadata;
  };
}

function HomeContent() {
  const searchParams = useSearchParams();
  const [symbol1, setSymbol1] = useState(searchParams.get("symbol1") || "");
  const [symbol2, setSymbol2] = useState(searchParams.get("symbol2") || "");
  const [diffData, setDiffData] = useState<DiffResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const searchQuery = useDeferredValue(searchInput);
  const diffContainerRef = useRef<HTMLDivElement>(null);
  const sessionCacheRef = useRef<Map<string, DiffResponse>>(new Map());

  // Count matches and reset index whenever the deferred query changes
  useEffect(() => {
    const container = diffContainerRef.current;
    if (!container) return;
    // RAF ensures the DOM has been updated after the deferred re-render
    const id = requestAnimationFrame(() => {
      const marks =
        container.querySelectorAll<HTMLElement>(".search-highlight");
      setMatchCount(marks.length);
      setCurrentMatchIndex(marks.length > 0 ? 0 : -1);
      if (marks.length > 0) {
        marks[0].scrollIntoView({ behavior: "smooth", block: "center" });
        marks[0].style.outline = "2px solid #009edb";
      }
    });
    return () => cancelAnimationFrame(id);
  }, [searchQuery]);

  const navigateMatch = useCallback(
    (dir: 1 | -1) => {
      const container = diffContainerRef.current;
      if (!container) return;
      const marks =
        container.querySelectorAll<HTMLElement>(".search-highlight");
      if (marks.length === 0) return;
      // Remove outline from previous
      marks.forEach((m) => (m.style.outline = ""));
      const next = (currentMatchIndex + dir + marks.length) % marks.length;
      setCurrentMatchIndex(next);
      marks[next].scrollIntoView({ behavior: "smooth", block: "center" });
      marks[next].style.outline = "2px solid #009edb";
    },
    [currentMatchIndex],
  );

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchDiff = async (sym1?: string, sym2?: string) => {
    const symbolA = sym1 || symbol1;
    const symbolB = sym2 || symbol2;

    if (!symbolA.trim() || !symbolB.trim()) {
      setError("Both document symbols are required");
      return;
    }

    setLoading(true);
    setError(null);
    setDiffData(null);
    setSearchInput("");

    const cacheKey = `${symbolA.trim()}::${symbolB.trim()}`;
    const cached = sessionCacheRef.current.get(cacheKey);
    if (cached) {
      setDiffData(cached);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/diff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbolA: symbolA.trim(),
          symbolB: symbolB.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch diff");
      }

      const data = await response.json();
      sessionCacheRef.current.set(cacheKey, data);
      setDiffData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Encode a symbol for use in a URL query string, preserving '/' so that
  // symbols like A/RES/60/152 remain legible. All other special chars that
  // are meaningful in URLs (spaces, &, =, [, ], …) are still percent-encoded.
  const encodeSymbol = (s: string) =>
    encodeURIComponent(s.trim()).replace(/%2F/gi, "/");

  const updateUrl = (sym1?: string, sym2?: string) => {
    const symbolA = sym1 || symbol1;
    const symbolB = sym2 || symbol2;
    const parts: string[] = [];
    if (symbolA.trim()) parts.push(`symbol1=${encodeSymbol(symbolA)}`);
    if (symbolB.trim()) parts.push(`symbol2=${encodeSymbol(symbolB)}`);
    // Use pushState directly — router.push re-encodes query param values
    // and would turn A/RES/60/152 back into A%2FRES%2F60%2F152.
    window.history.pushState(
      null,
      "",
      parts.length ? `/?${parts.join("&")}` : "/",
    );
  };

  useEffect(() => {
    const symbol1Param = searchParams.get("symbol1");
    const symbol2Param = searchParams.get("symbol2");

    if (symbol1Param) setSymbol1(symbol1Param);
    if (symbol2Param) setSymbol2(symbol2Param);

    if (symbol1Param && symbol2Param) {
      fetchDiff(symbol1Param, symbol2Param);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const hasQueryParams =
    searchParams.get("symbol1") || searchParams.get("symbol2");

  const exampleComparisons = [
    {
      symbol1: "A/RES/77/29",
      year1: "2022",
      symbol2: "A/RES/78/120",
      year2: "2023",
    },
    {
      symbol1: "A/RES/78/14",
      year1: "2023",
      symbol2: "A/RES/79/15",
      year2: "2024",
    },
    {
      symbol1: "A/RES/77/157",
      year1: "2022",
      symbol2: "A/RES/78/143",
      year2: "2023",
    },
    {
      symbol1: "A/RES/62/22",
      year1: "2007",
      symbol2: "A/RES/63/66",
      year2: "2008",
    },
    {
      symbol1: "A/RES/77/18",
      year1: "2022",
      symbol2: "A/RES/79/9",
      year2: "2024",
    },
    {
      symbol1: "A/HRC/RES/50/13",
      year1: "2022",
      symbol2: "A/HRC/RES/59/7",
      year2: "2025",
    },
  ];

  return (
    <main className="bg-gray-50 py-6">
      <div className="mx-auto max-w-6xl space-y-6 px-6">
        {!hasQueryParams && (
          <div className="space-y-6">
            {/* Input Section */}
            <div className="mt-12 rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                Compare Documents
                <span className="rounded-full bg-un-blue/10 px-2 py-0.5 text-xs font-medium tracking-wide text-un-blue">
                  BETA
                </span>
              </h2>
              <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium tracking-wide text-gray-500 uppercase">
                    Document Symbol 1
                  </label>
                  <input
                    type="text"
                    value={symbol1}
                    onChange={(e) => setSymbol1(e.target.value)}
                    placeholder="e.g., A/RES/77/29"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-un-blue focus:ring-1 focus:ring-un-blue focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium tracking-wide text-gray-500 uppercase">
                    Document Symbol 2
                  </label>
                  <input
                    type="text"
                    value={symbol2}
                    onChange={(e) => setSymbol2(e.target.value)}
                    placeholder="e.g., A/RES/78/120"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-un-blue focus:ring-1 focus:ring-un-blue focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  updateUrl();
                  fetchDiff();
                }}
                disabled={loading || !symbol1.trim() || !symbol2.trim()}
                className="flex items-center gap-2 rounded-md bg-un-blue px-4 py-2 text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {loading ? "Loading..." : "Compare Documents"}
              </button>
            </div>

            {/* Example Comparisons */}
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-1 text-lg font-semibold">
                Example Comparisons
              </h2>
              <p className="mb-5 text-sm text-gray-600">
                Click on any comparison below to see how documents have evolved
                over time:
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {exampleComparisons.map((example, index) => (
                  <a
                    key={index}
                    href={`/?symbol1=${encodeSymbol(example.symbol1)}&symbol2=${encodeSymbol(example.symbol2)}`}
                    className="group block rounded-lg border border-gray-200 p-3 transition-colors hover:border-un-blue hover:bg-blue-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-mono text-un-blue">
                          {example.symbol1}{" "}
                          <span className="font-normal text-gray-400">
                            ({example.year1})
                          </span>
                        </span>
                        <span className="text-gray-500">vs</span>
                        <span className="font-mono text-un-blue">
                          {example.symbol2}{" "}
                          <span className="font-normal text-gray-400">
                            ({example.year2})
                          </span>
                        </span>
                      </div>
                      <svg
                        className="h-4 w-4 shrink-0 text-gray-400 group-hover:text-un-blue"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        />
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {hasQueryParams && diffData && (
          <>
            {/* Sticky search bar */}
            <div className="sticky top-4 z-10 -mx-3">
              <div className="rounded-xl bg-white/95 px-4 py-2.5 shadow-md ring-1 ring-black/5 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <svg
                      className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          navigateMatch(e.shiftKey ? -1 : 1);
                        if (e.key === "Escape") setSearchInput("");
                      }}
                      placeholder="Search in documents…"
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pr-9 pl-9 text-sm transition-colors focus:border-un-blue focus:bg-white focus:ring-1 focus:ring-un-blue focus:outline-none"
                    />
                    {searchInput && (
                      <button
                        onClick={() => setSearchInput("")}
                        className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded text-gray-400 hover:text-gray-600"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  {searchQuery && (
                    <>
                      <span className="min-w-20 text-center text-xs text-gray-400 tabular-nums">
                        {matchCount === 0
                          ? "No matches"
                          : `${currentMatchIndex + 1} / ${matchCount}`}
                      </span>
                      <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 p-0.5">
                        <button
                          onClick={() => navigateMatch(-1)}
                          disabled={matchCount === 0}
                          title="Previous match (Shift+Enter)"
                          className="rounded-md p-1 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => navigateMatch(1)}
                          disabled={matchCount === 0}
                          title="Next match (Enter)"
                          className="rounded-md p-1 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div ref={diffContainerRef}>
              <DiffViewer
                data={diffData}
                searchQuery={searchQuery || undefined}
                left={{
                  symbol: symbol1,
                  metadata: diffData.metadata?.left,
                  format: diffData.formats?.left,
                }}
                right={{
                  symbol: symbol2,
                  metadata: diffData.metadata?.right,
                  format: diffData.formats?.right,
                }}
              />
            </div>
          </>
        )}

        {hasQueryParams && loading && !diffData && (
          <div className="py-8 text-center">
            <div className="inline-flex items-center gap-2 text-gray-600">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-un-blue"></div>
              Loading comparison...
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="bg-gray-50 py-6">
          <div className="mx-auto max-w-6xl px-6">
            <div className="py-8 text-center">
              <div className="inline-flex items-center gap-2 text-gray-600">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-un-blue"></div>
                Loading...
              </div>
            </div>
          </div>
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}

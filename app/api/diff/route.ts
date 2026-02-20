import { unstable_cache } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { diff } from "../../../src/core";
import {
  fetchUNDocument,
  fetchDocumentMetadata,
} from "../../../src/un-fetcher";

// Documents are immutable — cache forever (cleared on redeploy)
const cachedFetchDocument = unstable_cache(
  (symbol: string) => fetchUNDocument(symbol),
  ["un-doc"],
  { revalidate: false },
);

// Metadata rarely changes — revalidate once per day
const cachedFetchMetadata = unstable_cache(
  (symbol: string) => fetchDocumentMetadata(symbol),
  ["un-meta"],
  { revalidate: 86400 },
);

export async function POST(request: NextRequest) {
  try {
    const { symbolA, symbolB } = await request.json();

    if (!symbolA || !symbolB) {
      return NextResponse.json(
        { error: "Both symbolA and symbolB are required" },
        { status: 400 },
      );
    }

    // Fetch documents and metadata from UN API (results cached per symbol)
    const [docA, docB, metaA, metaB] = await Promise.all([
      cachedFetchDocument(symbolA),
      cachedFetchDocument(symbolB),
      cachedFetchMetadata(symbolA),
      cachedFetchMetadata(symbolB),
    ]);

    const result = diff(docA.lines, docB.lines);

    // Return the result directly - uses camelCase from core
    return NextResponse.json({
      score: result.score,
      items: result.items,
      formats: { left: docA.format, right: docB.format },
      metadata: {
        left: metaA,
        right: metaB,
      },
    });
  } catch (error) {
    console.error("Error processing diff:", error);
    return NextResponse.json(
      { error: "Failed to process diff" },
      { status: 500 },
    );
  }
}

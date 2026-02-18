export { U as UNDocument, a as UNDocumentMetadata, f as fetchDocumentMetadata, b as fetchUNDocument } from '../fetcher-VMD_ec_L.js';

interface ParsedSymbol {
    body: string;
    session: number | null;
    number: number | null;
    type: 'resolution' | 'document' | 'unknown';
}
/**
 * Parse a UN document symbol into its components
 * Examples:
 *   A/RES/77/16 -> { body: 'A', session: 77, number: 16, type: 'resolution' }
 *   A/C.2/79/L.8 -> { body: 'A/C.2', session: 79, number: 8, type: 'document' }
 */
declare function parseUNSymbol(symbol: string): ParsedSymbol;
/**
 * Extract year from UN document symbol using session number calculation
 *
 * NOTE: This is a heuristic that only works reliably for GA resolutions:
 *   - GA session N → year 1945 + N (e.g., session 77 = 2022)
 *   - Does NOT work for HRC resolutions (multiple sessions per year)
 *
 * For accurate years, use fetchDocumentMetadata() instead.
 */
declare function extractYear(symbol: string): number | null;

export { type ParsedSymbol, extractYear, parseUNSymbol };

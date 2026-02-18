interface UNDocument {
    symbol: string;
    text: string;
    lines: string[];
    lineCount: number;
    format: 'doc' | 'pdf';
}
interface UNDocumentMetadata {
    symbol: string;
    title: string;
    date: string | null;
    year: number | null;
    subjects: string[];
    vote?: {
        inFavour: number;
        against: number;
        abstaining: number;
    };
    agendaInfo?: string;
}
/**
 * Fetch document metadata from UN Digital Library
 * Returns title, date, year, subjects, vote info, and agenda for the given symbol
 */
declare function fetchDocumentMetadata(symbol: string): Promise<UNDocumentMetadata>;
/**
 * Fetch and parse a UN document by its symbol
 * Tries DOC format first, falls back to PDF
 */
declare function fetchUNDocument(symbol: string): Promise<UNDocument>;

export { type UNDocument as U, type UNDocumentMetadata as a, fetchUNDocument as b, fetchDocumentMetadata as f };

// src/un-fetcher/fetcher.ts
import WordExtractor from "word-extractor";
import { extractText } from "unpdf";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
async function fetchDocumentMetadata(symbol) {
  const encodedSymbol = encodeURIComponent(symbol);
  const url = `https://digitallibrary.un.org/search?ln=en&p=${encodedSymbol}&f=&rm=&sf=&so=d&rg=50&c=Resource+Type&c=UN+Bodies&c=&of=xm&fti=0&fti=0`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "curl/8.7.1",
      Accept: "*/*"
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch metadata for ${symbol}`);
  }
  const xml = await response.text();
  const recordMatches = xml.match(/<record>[\s\S]*?<\/record>/g);
  if (!recordMatches) {
    return { symbol, title: symbol, date: null, year: null, subjects: [] };
  }
  for (const record of recordMatches) {
    const tag191Match = record.match(
      /<datafield tag="191"[^>]*>([\s\S]*?)<\/datafield>/
    );
    if (!tag191Match) continue;
    const symbolSubfieldMatch = tag191Match[1].match(
      /<subfield code="a">([^<]+)<\/subfield>/
    );
    if (!symbolSubfieldMatch || symbolSubfieldMatch[1] !== symbol) {
      continue;
    }
    const tag245Match = record.match(
      /<datafield tag="245"[^>]*>([\s\S]*?)<\/datafield>/
    );
    let title = symbol;
    if (tag245Match) {
      const titleSubfieldMatch = tag245Match[1].match(
        /<subfield code="a">([^<]+)<\/subfield>/
      );
      if (titleSubfieldMatch) {
        title = titleSubfieldMatch[1].replace(/ :$/, "").trim();
      }
    }
    const tag269Match = record.match(
      /<datafield tag="269"[^>]*>([\s\S]*?)<\/datafield>/
    );
    let date = null;
    let year = null;
    if (tag269Match) {
      const dateSubfieldMatch = tag269Match[1].match(
        /<subfield code="a">(\d{4}-\d{2}-\d{2})<\/subfield>/
      );
      if (dateSubfieldMatch) {
        date = dateSubfieldMatch[1];
        year = parseInt(date.substring(0, 4));
      }
    }
    const subjects = [];
    const tag650Matches = record.matchAll(
      /<datafield tag="650"[^>]*>([\s\S]*?)<\/datafield>/g
    );
    for (const match of tag650Matches) {
      const subjectMatch = match[1].match(
        /<subfield code="a">([^<]+)<\/subfield>/
      );
      if (subjectMatch) {
        subjects.push(subjectMatch[1].trim());
      }
    }
    let vote = void 0;
    const tag996Match = record.match(
      /<datafield tag="996"[^>]*>([\s\S]*?)<\/datafield>/
    );
    if (tag996Match) {
      const inFavourMatch = tag996Match[1].match(
        /<subfield code="b">(\d+)<\/subfield>/
      );
      const againstMatch = tag996Match[1].match(
        /<subfield code="c">(\d+)<\/subfield>/
      );
      const abstainingMatch = tag996Match[1].match(
        /<subfield code="d">(\d+)<\/subfield>/
      );
      if (inFavourMatch || againstMatch || abstainingMatch) {
        vote = {
          inFavour: inFavourMatch ? parseInt(inFavourMatch[1]) : 0,
          against: againstMatch ? parseInt(againstMatch[1]) : 0,
          abstaining: abstainingMatch ? parseInt(abstainingMatch[1]) : 0
        };
      }
    }
    let agendaInfo = void 0;
    const tag991Match = record.match(
      /<datafield tag="991"[^>]*>([\s\S]*?)<\/datafield>/
    );
    if (tag991Match) {
      const agendaMatch = tag991Match[1].match(
        /<subfield code="[de]">([^<]+)<\/subfield>/
      );
      if (agendaMatch) {
        agendaInfo = agendaMatch[1].trim();
      }
    }
    return { symbol, title, date, year, subjects, vote, agendaInfo };
  }
  return { symbol, title: symbol, date: null, year: null, subjects: [] };
}
async function fetchUNDocument(symbol) {
  const docUrl = `https://documents.un.org/api/symbol/access?s=${symbol}&l=en&t=doc`;
  const docResponse = await fetch(docUrl, {
    headers: {
      "User-Agent": "undifferent/0.1.0 (+https://diff.un-two-zero.dev)"
    }
  });
  if (docResponse.ok) {
    try {
      const result = await extractWordDocument(docResponse, symbol);
      console.log(`[${symbol}] Loaded as DOC (${result.lineCount} lines)`);
      return result;
    } catch {
    }
  }
  const pdfUrl = `https://documents.un.org/api/symbol/access?s=${symbol}&l=en&t=pdf`;
  const pdfResponse = await fetch(pdfUrl, {
    redirect: "follow",
    headers: {
      "User-Agent": "undifferent/0.1.0 (+https://diff.un-two-zero.dev)"
    }
  });
  if (pdfResponse.ok) {
    try {
      const result = await extractPdfDocument(pdfResponse, symbol);
      console.log(`[${symbol}] Loaded as PDF (${result.lineCount} lines)`);
      return result;
    } catch (err) {
      console.error(`[${symbol}] PDF extraction failed:`, err);
    }
  }
  throw new Error(
    `Failed to fetch document ${symbol}: No available format (tried doc, pdf)`
  );
}
async function extractWordDocument(response, symbol) {
  const format = "doc";
  const buffer = await response.arrayBuffer();
  const tempFilePath = join(
    tmpdir(),
    `${symbol.replace(/\//g, "_")}_${Date.now()}.${format}`
  );
  try {
    await writeFile(tempFilePath, Buffer.from(buffer));
    const extractor = new WordExtractor();
    const extracted = await extractor.extract(tempFilePath);
    const text = extracted.getBody();
    await unlink(tempFilePath);
    const lines = text.split("\n").map((line) => line.trim()).filter((line) => line);
    return {
      symbol,
      text,
      lines,
      lineCount: lines.length,
      format
    };
  } catch (extractError) {
    try {
      await unlink(tempFilePath);
    } catch {
    }
    throw extractError;
  }
}
async function extractPdfDocument(response, symbol) {
  const buffer = await response.arrayBuffer();
  const { text } = await extractText(new Uint8Array(buffer), {
    mergePages: true
  });
  const processedText = text.replace(/\s+/g, " ").replace(/ (\d+)\. ([A-Z])/g, "\n$1. $2").replace(/ ([A-E]) (\d+)/g, "\n$1\n$2").replace(/ (The General Assembly)/g, "\n$1").replace(/; (\d+)\./g, ";\n$1.").replace(/ (\([a-z]\) )/g, "\n$1");
  const lines = processedText.split("\n").map((line) => line.trim()).filter((line) => line && line.length > 15);
  return {
    symbol,
    text,
    lines,
    lineCount: lines.length,
    format: "pdf"
  };
}

// src/un-fetcher/parser.ts
function parseUNSymbol(symbol) {
  const resMatch = symbol.match(/^([A-Z])\/RES\/(\d+)\/(\d+)$/);
  if (resMatch) {
    return {
      body: resMatch[1],
      session: parseInt(resMatch[1] === "S" ? "0" : resMatch[2]),
      number: parseInt(resMatch[3]),
      type: "resolution"
    };
  }
  const scResMatch = symbol.match(/^S\/RES\/(\d+)/);
  if (scResMatch) {
    return {
      body: "S",
      session: null,
      number: parseInt(scResMatch[1]),
      type: "resolution"
    };
  }
  const docMatch = symbol.match(/^([A-Z](?:\/C\.\d+)?)\/(\d+)\/[A-Z]+\.(\d+)/);
  if (docMatch) {
    return {
      body: docMatch[1],
      session: parseInt(docMatch[2]),
      number: parseInt(docMatch[3]),
      type: "document"
    };
  }
  return {
    body: symbol.split("/")[0],
    session: null,
    number: null,
    type: "unknown"
  };
}
function extractYear(symbol) {
  const parsed = parseUNSymbol(symbol);
  if (parsed.session !== null && parsed.session < 200) {
    return 1945 + parsed.session;
  }
  if (parsed.session !== null && parsed.session > 1900) {
    return parsed.session;
  }
  return null;
}
export {
  extractYear,
  fetchDocumentMetadata,
  fetchUNDocument,
  parseUNSymbol
};

/**
 * The Rámáyan of Válmíki — Ralph T. H. Griffith's English verse translation
 * (Project Gutenberg #24869, 1870–1874, public domain).
 *
 * Griffith rendered Books I–VI (the six Kándas: Bála, Ayodhyá, Áraṇya,
 * Kishkindhá, Sundara, Yuddha). The text is organised as Cantos whose Roman
 * numbering RESETS to "I" at the start of each Book — we use that reset to
 * detect Book boundaries. Each Canto becomes one chapter (the natural unit
 * for recitation), numbered globally 1..N, titled "Book <n>, Canto <m> — …".
 *
 * The source is clean, proofread poetry. We preserve line breaks (it is
 * verse) and strip Griffith's inline footnote markers like "(7)".
 */
import { readFile } from "node:fs/promises";
import type { ScriptureImport } from "./lib";

const SOURCE_URL = "https://www.gutenberg.org/cache/epub/24869/pg24869.txt";
const LOCAL_CACHE_PATHS = [
  ".local/sources/pg24869.txt",
  "../.local/sources/pg24869.txt",
];

async function fetchText(url: string): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "noorjyoti-importer/1.0" },
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  // Gutenberg is occasionally unreachable from CI; fall back to a local cache
  // of the same file if one exists.
  for (const path of LOCAL_CACHE_PATHS) {
    try {
      return await readFile(path, "utf8");
    } catch {
      // try next candidate
    }
  }
  throw new Error(`Failed to fetch ${url} after retries: ${String(lastErr)}`);
}

const ROMAN: Record<string, number> = {
  I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000,
};
function romanToInt(s: string): number {
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const cur = ROMAN[s[i]];
    const next = ROMAN[s[i + 1]];
    if (next && cur < next) total -= cur;
    else total += cur;
  }
  return total;
}

const BOOK_NAMES = [
  "Bála Kánda (Book of Youth)",
  "Ayodhyá Kánda (Book of Ayodhyá)",
  "Áraṇya Kánda (Book of the Forest)",
  "Kishkindhá Kánda (Book of Kishkindhá)",
  "Sundara Kánda (Book of Beauty)",
  "Yuddha Kánda (Book of War)",
];

// "Canto LXXV. The Parle." — captures the Roman numeral and the title.
const CANTO_RE = /^Canto\s+([IVXLCDM]+)\.\s*(.*?)\s*$/gm;

function cleanVerse(s: string): string {
  return s
    .replace(/\(\d+\)/g, "") // drop inline footnote markers like (7)
    .replace(/[ \t]+\r?\n/g, "\n") // trim trailing spaces per line
    .replace(/\n{3,}/g, "\n\n") // collapse big gaps
    .replace(/^[ \t]+/gm, (m) => (m.length > 2 ? "  " : m)) // tame deep indents
    .trim();
}

export async function importRamayana(): Promise<ScriptureImport> {
  const raw = await fetchText(SOURCE_URL);
  const startIdx = raw.search(/\*\*\* START OF THE PROJECT GUTENBERG/);
  const endIdx = raw.search(/\*\*\* END OF THE PROJECT GUTENBERG/);
  if (startIdx < 0) throw new Error("Could not find Ramayana start marker");
  // Begin at the first body Book heading so we skip the table of contents.
  const bodyAnchor = raw.indexOf("BOOK I.", startIdx);
  if (bodyAnchor < 0) throw new Error("Could not find Ramayana Book I body");
  let body = raw.slice(bodyAnchor, endIdx >= 0 ? endIdx : raw.length);
  // The verse text is followed by APPENDIX / ADDITIONAL NOTES / INDEX /
  // FOOTNOTES — cut them so they don't bleed into the final canto. We cut at
  // the APPENDIX heading that appears after the last canto ("CXXX").
  const lastCantoIdx = body.lastIndexOf("\nCanto ");
  const appendixIdx = body.indexOf("\nAPPENDIX.", lastCantoIdx);
  if (appendixIdx >= 0) body = body.slice(0, appendixIdx);

  // Collect every canto marker position.
  CANTO_RE.lastIndex = 0;
  type Mark = { roman: number; title: string; start: number; bodyStart: number };
  const marks: Mark[] = [];
  let m: RegExpExecArray | null;
  while ((m = CANTO_RE.exec(body)) !== null) {
    const roman = romanToInt(m[1]);
    const title = m[2].replace(/\(\d+\)/g, "").trim();
    marks.push({
      roman,
      title,
      start: m.index,
      bodyStart: m.index + m[0].length,
    });
  }
  if (marks.length !== 493) {
    throw new Error(`Ramayana: found ${marks.length} cantos (expected exactly 493)`);
  }

  const chapters = marks.map((mk, j) => {
    const end = j + 1 < marks.length ? marks[j + 1].start : body.length;
    const passage = cleanVerse(body.slice(mk.bodyStart, end));
    return { roman: mk.roman, title: mk.title, passage };
  });

  // Assign Book numbers: a canto whose Roman value is 1 (after the first)
  // starts a new Book.
  let bookNum = 0;
  let prevRoman = Infinity;
  const out = chapters.map((c, i) => {
    if (c.roman === 1 && (i === 0 || prevRoman !== 1)) bookNum += 1;
    prevRoman = c.roman;
    const bookName = BOOK_NAMES[bookNum - 1] ?? `Book ${bookNum}`;
    const firstLine = c.passage.split("\n").find((l) => l.trim().length > 0) ?? "";
    return {
      number: i + 1,
      title: `Book ${bookNum}, Canto ${c.roman}${c.title ? ` — ${c.title}` : ""}`,
      summary: `${bookName}. ${firstLine.replace(/[“”"]/g, "").slice(0, 160)}`.trim(),
      passageEn: c.passage,
    };
  });

  if (bookNum !== 6) {
    throw new Error(`Ramayana: expected 6 Books, detected ${bookNum}`);
  }

  return {
    slug: "hinduism-ramayana",
    source:
      "Project Gutenberg #24869 — Ralph T. H. Griffith, The Rámáyan of Válmíki (1870–1874, public domain)",
    chapters: out,
  };
}

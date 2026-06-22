/**
 * Acaranga Sutra (Ayaramga Sutta) — the first Anga of the Jain Svetambara
 * canon, in Hermann Jacobi's public-domain English translation
 * (Sacred Books of the East, Vol. 22, 1884).
 *
 * The only available digital source is raw OCR of the page scans, so every
 * chapter is passed through the LLM OCR-cleaning pipeline (see ./ocr-lib and
 * ../clean-ocr/clean) which removes running headers / page marks / scholarly
 * footnotes and repairs scanning errors while preserving the verses verbatim.
 *
 * Structure: Book I has 8 lectures; Book II has 16 lectures spread over four
 * Parts. Each lecture becomes one chapter (24 total). Lecture dividers are the
 * spelled-out ordinal headings ("FIRST LECTURE", "Eighth Lecture", …); the
 * per-page "BOOK I, LECTURE I, LESSON n" lines are OCR running headers and are
 * NOT reliable dividers.
 */
import type { ScriptureImport } from "./lib";
import { fetchTextCached, cleanSections, type RawSection } from "./ocr-lib";

const SOURCE_URL =
  "https://archive.org/download/sbe22jainasutraspart1_202002/SBE%2022%20Jaina%20Sutras%20Part1_djvu.txt";
const CACHE_PATHS = [
  ".local/sources/acaranga_sbe22.txt",
  "../.local/sources/acaranga_sbe22.txt",
];

const ORDINALS = [
  "first", "second", "third", "fourth", "fifth", "sixth", "seventh",
  "eighth", "ninth", "tenth", "eleventh", "twelfth", "thirteenth",
  "fourteenth", "fifteenth", "sixteenth",
];
const ORD_RE = ORDINALS.join("|");
const LECTURE_RE = new RegExp(`^\\s*(${ORD_RE})\\s+lecture\\b`, "i");
const PART_RE = new RegExp(`^\\s*(${ORD_RE})\\s+part\\b`, "i");
const SECOND_BOOK_RE = /^\s*second\s+book\b/i;

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export async function importAcaranga(): Promise<ScriptureImport> {
  const raw = await fetchTextCached(SOURCE_URL, CACHE_PATHS);
  console.log(`  fetched ${raw.length} chars of source OCR`);

  // The verse text runs from the first lecture down to the Kalpa Sutra, which
  // is a separate work bound into the same SBE volume. Anchor past the table of
  // contents: the body proper starts at "FIRST BOOK 1 ." (the TOC entry is just
  // "FIRST BOOK."), and the first real lecture heading follows immediately.
  const bookBodyIdx = raw.search(/^\s*FIRST\s+BOOK\s+1\b/im);
  if (bookBodyIdx < 0) {
    throw new Error("Acaranga: could not locate start of Book I body");
  }
  const relLecture = raw.slice(bookBodyIdx).search(/^\s*FIRST\s+LECTURE\b/im);
  const bodyStart = relLecture < 0 ? bookBodyIdx : bookBodyIdx + relLecture;
  const kalpaIdx = raw.indexOf("THE KALPA SUTRA");
  if (kalpaIdx < 0) {
    throw new Error("Acaranga: could not locate end (Kalpa Sutra) boundary");
  }
  const body = raw.slice(bodyStart, kalpaIdx);
  const lines = body.split("\n");

  // Walk the lines, opening a new chapter at every lecture divider while
  // tracking which Book / Part we are in for the title.
  type Open = { title: string; startLine: number };
  const opens: Open[] = [];
  let book = "I";
  let part = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (SECOND_BOOK_RE.test(line)) {
      book = "II";
      continue;
    }
    if (book === "II") {
      const pm = line.match(PART_RE);
      if (pm) {
        part = cap(pm[1]);
        continue;
      }
    }
    const lm = line.match(LECTURE_RE);
    if (lm) {
      const ord = cap(lm[1]);
      const title =
        book === "I"
          ? `Book I — ${ord} Lecture`
          : `Book II${part ? ` (${part} Part)` : ""} — ${ord} Lecture`;
      opens.push({ title, startLine: i });
    }
  }
  // The lecture sub-heading sometimes appears twice in a row (a running-header
  // fragment immediately followed by the real heading). Merge consecutive
  // openings that share a title so each lecture is a single chapter.
  const merged: Open[] = [];
  for (const o of opens) {
    if (merged.length > 0 && merged[merged.length - 1].title === o.title) continue;
    merged.push(o);
  }
  // The canonical Acaranga has 8 lectures in Book I and 16 in Book II (24
  // total), but this OCR scan garbles the Thirteenth Lecture heading, so the
  // reliable detected count is 23. Guard against gross under/over-splitting and
  // log the detected structure so drift in the source is obvious.
  console.log(
    `  detected ${merged.length} lectures: ${merged.map((m) => m.title).join(" | ")}`,
  );
  if (merged.length < 20 || merged.length > 26) {
    throw new Error(
      `Acaranga: detected ${merged.length} lectures (expected 23–24); source OCR may have changed`,
    );
  }

  const sections: RawSection[] = merged.map((o, idx) => {
    const endLine =
      idx + 1 < merged.length ? merged[idx + 1].startLine : lines.length;
    return {
      number: idx + 1,
      title: o.title,
      summary: `${o.title} of the Ācārāṅga Sūtra (trans. Hermann Jacobi).`,
      raw: lines.slice(o.startLine, endLine).join("\n").trim(),
    };
  });

  console.log(`  sliced ${sections.length} lectures; cleaning via LLM…`);
  const chapters = await cleanSections(sections);
  if (chapters.length < 20) {
    throw new Error(
      `Acaranga: only ${chapters.length} chapters survived cleaning (expected ~24)`,
    );
  }

  return {
    slug: "jainism-acaranga-sutra",
    source:
      "Sacred Books of the East, Vol. 22 — Hermann Jacobi, trans., Jaina Sutras Part I: The Akaranga Sutra (1884, public domain); OCR cleaned with gpt-5.4.",
    chapters,
  };
}

/**
 * Bible importers using the wldeh static-CDN Bible JSON (KJV, public domain).
 * Served from jsdelivr — no rate limiting, plain static files.
 *
 * - Sermon on the Mount → Matthew 5, 6, 7  (3 chapters)
 * - Psalms of Comfort   → all 150 Psalms    (150 chapters)
 * - Holy Bible          → New Testament (Matthew → Revelation, 260 chapters)
 *
 * The "selections" slug names are kept for backwards compatibility with the
 * existing seed; the imported content is the full underlying text.
 */
import { fetchJson, sleep, type ScriptureImport, type ImportedChapter } from "./lib";

interface WldehChapterResponse {
  data: Array<{
    book: string;
    chapter: string;
    verse: string;
    text: string;
  }>;
}

/** wldeh uses lowercase canonical book ids with NO separators: "matthew", "psalms",
 *  "1corinthians", "2timothy" etc. */
function bookId(name: string): string {
  return name.toLowerCase().replace(/[\s-]+/g, "");
}

/** wldeh appends inline KJV footnotes like "...wicked.1.1 ungodly: or, wicked".
 *  Strip anything after the verse-final period that looks like "<n>.<n> ...". */
function cleanVerseText(raw: string): string {
  return raw
    .replace(/\s*\d+\.\d+\s+.*$/s, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchChapter(book: string, chapter: number): Promise<string[]> {
  const url = `https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/en-kjv/books/${bookId(book)}/chapters/${chapter}.json`;
  const data = await fetchJson<WldehChapterResponse>(url);
  return data.data.map((v) => cleanVerseText(v.text));
}

function makeChapter(
  n: number,
  title: string,
  verses: string[],
  summary?: string,
): ImportedChapter {
  return {
    number: n,
    title,
    summary: summary ?? verses[0]?.slice(0, 200) ?? title,
    passageEn: verses.map((t, i) => `${i + 1}. ${t}`).join("\n\n"),
  };
}

export async function importSermonOnTheMount(): Promise<ScriptureImport> {
  const chapters: ImportedChapter[] = [];
  for (let c = 5; c <= 7; c++) {
    const verses = await fetchChapter("matthew", c);
    chapters.push(makeChapter(c - 4, `Matthew ${c}`, verses));
    await sleep(20);
  }
  return {
    slug: "christianity-sermon-on-the-mount",
    source: "bible-api.com (KJV, public domain)",
    chapters,
  };
}

export async function importPsalms(): Promise<ScriptureImport> {
  const chapters: ImportedChapter[] = [];
  for (let c = 1; c <= 150; c++) {
    const verses = await fetchChapter("psalms", c);
    chapters.push(makeChapter(c, `Psalm ${c}`, verses));
    await sleep(20);
    if (c % 25 === 0) console.log(`  [psalms] fetched ${c}/150`);
  }
  return {
    slug: "christianity-psalms-of-comfort",
    source: "bible-api.com (KJV, public domain)",
    chapters,
  };
}

const NT_BOOKS: Array<{ book: string; display: string; chapters: number }> = [
  { book: "matthew", display: "Matthew", chapters: 28 },
  { book: "mark", display: "Mark", chapters: 16 },
  { book: "luke", display: "Luke", chapters: 24 },
  { book: "john", display: "John", chapters: 21 },
  { book: "acts", display: "Acts", chapters: 28 },
  { book: "romans", display: "Romans", chapters: 16 },
  { book: "1 corinthians", display: "1 Corinthians", chapters: 16 },
  { book: "2 corinthians", display: "2 Corinthians", chapters: 13 },
  { book: "galatians", display: "Galatians", chapters: 6 },
  { book: "ephesians", display: "Ephesians", chapters: 6 },
  { book: "philippians", display: "Philippians", chapters: 4 },
  { book: "colossians", display: "Colossians", chapters: 4 },
  { book: "1 thessalonians", display: "1 Thessalonians", chapters: 5 },
  { book: "2 thessalonians", display: "2 Thessalonians", chapters: 3 },
  { book: "1 timothy", display: "1 Timothy", chapters: 6 },
  { book: "2 timothy", display: "2 Timothy", chapters: 4 },
  { book: "titus", display: "Titus", chapters: 3 },
  { book: "philemon", display: "Philemon", chapters: 1 },
  { book: "hebrews", display: "Hebrews", chapters: 13 },
  { book: "james", display: "James", chapters: 5 },
  { book: "1 peter", display: "1 Peter", chapters: 5 },
  { book: "2 peter", display: "2 Peter", chapters: 3 },
  { book: "1 john", display: "1 John", chapters: 5 },
  { book: "2 john", display: "2 John", chapters: 1 },
  { book: "3 john", display: "3 John", chapters: 1 },
  { book: "jude", display: "Jude", chapters: 1 },
  { book: "revelation", display: "Revelation", chapters: 22 },
];

export async function importHolyBibleNT(): Promise<ScriptureImport> {
  const chapters: ImportedChapter[] = [];
  let n = 0;
  for (const b of NT_BOOKS) {
    for (let c = 1; c <= b.chapters; c++) {
      n += 1;
      const verses = await fetchChapter(b.book, c);
      chapters.push(makeChapter(n, `${b.display} ${c}`, verses));
      await sleep(20);
      if (n % 25 === 0) console.log(`  [bible-nt] fetched ${n}/260`);
    }
  }
  return {
    slug: "christianity-holy-bible",
    source: "bible-api.com (KJV New Testament, public domain)",
    chapters,
  };
}

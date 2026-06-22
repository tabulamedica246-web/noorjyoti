/**
 * The Bhagavad Gita — Edwin Arnold's "The Song Celestial" (1885), public domain.
 * Source: Project Gutenberg eBook #2388 — 18 chapters.
 *
 * Parsed by locating `  CHAPTER <roman>` headings and slicing the body of each
 * chapter up to the next heading (or end-of-text marker).
 */
import { fetchJson as _fj, type ScriptureImport, type ImportedChapter } from "./lib";

const SOURCE_URL = "https://www.gutenberg.org/cache/epub/2388/pg2388.txt";

const CHAPTER_TITLES: Record<number, string> = {
  1: "Arjuna-Vishada — The Distress of Arjuna",
  2: "Sankhya-Yoga — The Book of Doctrines",
  3: "Karma-Yoga — Virtue in Work",
  4: "Gyana-Yoga — The Religion of Knowledge",
  5: "Karma-Sannyasa-Yoga — Religion by Renunciation",
  6: "Atma-Sanyam-Yoga — Religion by Self-Restraint",
  7: "Vigyana-Yoga — Religion by Discernment",
  8: "Aksbara-Parabrahma-Yoga — Religion by the Imperishable",
  9: "Raja-Vidya-Raja-Guhya-Yoga — Religion by the Kingly Knowledge",
  10: "Vibhuti-Yoga — Religion by Heavenly Perfections",
  11: "Viswarupa-Darsanam — The Vision of the Universal Form",
  12: "Bhakti-Yoga — The Religion of Faith",
  13: "Kshetra-Kshetrajna-Vibhaga-Yoga — Religion by Separation of Matter and Spirit",
  14: "Gunatraya-Vibhaga-Yoga — Religion by Separation from the Qualities",
  15: "Purushottama-Yoga — Religion by Attaining the Supreme",
  16: "Daivasura-Sampad-Vibhaga-Yoga — The Separateness of the Divine and Undivine",
  17: "Sraddhatraya-Vibhaga-Yoga — Religion by the Threefold Faith",
  18: "Moksha-Sannyasa-Yoga — Religion by Deliverance and Renunciation",
};

const ROMAN: Record<string, number> = {
  I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9,
  X: 10, XI: 11, XII: 12, XIII: 13, XIV: 14, XV: 15, XVI: 16, XVII: 17, XVIII: 18,
};

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "user-agent": "NoorJyoti-importer/1.0" },
  });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return await res.text();
}

export async function importBhagavadGita(): Promise<ScriptureImport> {
  void _fj; // imported for shape symmetry; not used here (text endpoint, not JSON)
  const raw = await fetchText(SOURCE_URL);

  // Trim Gutenberg header/footer.
  const startMatch = raw.indexOf("CHAPTER I\n");
  const endMatch = raw.search(/\*\*\* END OF THE PROJECT GUTENBERG/);
  const body = raw.slice(
    startMatch >= 0 ? startMatch : 0,
    endMatch >= 0 ? endMatch : raw.length,
  );

  // Match both "CHAPTER I" (chapter 1 has no leading indent in source) and
  // "  CHAPTER II..XVIII" (subsequent chapters are indented).
  const headerRe = /^[ \t]*CHAPTER\s+(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII)\b\s*$/gm;
  const matches: Array<{ num: number; start: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = headerRe.exec(body)) !== null) {
    matches.push({ num: ROMAN[m[1]], start: m.index + m[0].length });
  }
  if (matches.length !== 18) {
    throw new Error(`Expected 18 Gita chapter headers, found ${matches.length}`);
  }

  const chapters: ImportedChapter[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].start;
    const end = i + 1 < matches.length ? matches[i + 1].start - 1 : body.length;
    let passage = body.slice(start, end).trim();
    // Strip the "HERE ENDETH CHAPTER N." trailer and the chapter subtitle that follows.
    passage = passage.replace(/\n\s*HERE END(?:ETH|S) CHAPTER[\s\S]*$/i, "").trim();
    // Remove leading indentation common to Gutenberg poetry layout.
    passage = passage
      .split("\n")
      .map((l) => l.replace(/^\s{2,}/, ""))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    const num = matches[i].num;
    chapters.push({
      number: num,
      title: `Chapter ${num} — ${CHAPTER_TITLES[num] ?? ""}`.trim(),
      summary: passage.split("\n").find((l) => l.trim().length > 30)?.slice(0, 200) ??
        CHAPTER_TITLES[num] ?? `Chapter ${num}`,
      passageEn: passage,
    });
  }

  return {
    slug: "hinduism-bhagavad-gita",
    source: "Project Gutenberg #2388 — Edwin Arnold, The Song Celestial (1885, PD)",
    chapters,
  };
}

/**
 * The Dhammapada — F. Max Müller's translation (Sacred Books of the East,
 * Vol. X, Part I, 1881). Public domain. 26 chapters.
 *
 * Source: Project Gutenberg eBook #2017.
 *
 * Parsed by `Chapter <Roman>. <Title>` headings, then numbered verses.
 */
import type { ScriptureImport, ImportedChapter } from "./lib";

const SOURCE_URL = "https://www.gutenberg.org/cache/epub/2017/pg2017.txt";

const ROMAN: Record<string, number> = {
  I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9,
  X: 10, XI: 11, XII: 12, XIII: 13, XIV: 14, XV: 15, XVI: 16, XVII: 17,
  XVIII: 18, XIX: 19, XX: 20, XXI: 21, XXII: 22, XXIII: 23, XXIV: 24,
  XXV: 25, XXVI: 26,
};

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "user-agent": "NoorJyoti-importer/1.0" },
  });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return await res.text();
}

export async function importDhammapada(): Promise<ScriptureImport> {
  const raw = await fetchText(SOURCE_URL);
  const startIdx = raw.search(/^Chapter I\. /m);
  const endIdx = raw.search(/\*\*\* END OF THE PROJECT GUTENBERG/);
  if (startIdx < 0) throw new Error("Could not find Dhammapada start");
  const body = raw.slice(startIdx, endIdx >= 0 ? endIdx : raw.length);

  const headerRe = /^Chapter\s+([IVX]+)\.\s+(.+?)\s*$/gm;
  type H = { num: number; title: string; headerStart: number; bodyStart: number };
  const matches: H[] = [];
  let m: RegExpExecArray | null;
  while ((m = headerRe.exec(body)) !== null) {
    matches.push({
      num: ROMAN[m[1]],
      title: m[2].trim(),
      headerStart: m.index,
      bodyStart: m.index + m[0].length,
    });
  }
  if (matches.length !== 26) {
    throw new Error(
      `Expected 26 Dhammapada chapter headers, found ${matches.length}`,
    );
  }

  const chapters: ImportedChapter[] = [];
  for (let i = 0; i < matches.length; i++) {
    const h = matches[i];
    // Stop BEFORE the next chapter's heading so it doesn't leak into the
    // current chapter's final verse.
    const end = i + 1 < matches.length ? matches[i + 1].headerStart : body.length;
    const raw_passage = body.slice(h.bodyStart, end).trim();

    // Verses are "<n>. <text>" continuing across wrapped lines until the next
    // verse marker at start of line. Müller's edition also has combined
    // markers like "58, 59." or "256, 257." for verses that share a single
    // prose block; we preserve those as one entry with the combined label.
    // We find every marker position then slice between them; this is robust
    // against blank lines inside a verse and against the trailing footer.
    const markerRe = /^(\d+(?:\s*,\s*\d+)*)\.\s+/gm;
    type V = { label: string; firstN: number; start: number; bodyStart: number };
    const ms: V[] = [];
    let vm: RegExpExecArray | null;
    while ((vm = markerRe.exec(raw_passage)) !== null) {
      const label = vm[1].replace(/\s+/g, " ");
      ms.push({
        label,
        firstN: Number(label.split(",")[0]),
        start: vm.index,
        bodyStart: vm.index + vm[0].length,
      });
    }
    // Sanity: markers must be monotonically increasing.
    for (let j = 1; j < ms.length; j++) {
      if (ms[j].firstN <= ms[j - 1].firstN) {
        throw new Error(
          `Dhammapada ch${h.num}: verse markers out of order (${ms[j - 1].label} → ${ms[j].label})`,
        );
      }
    }
    const verses = ms.map((mk, j) => {
      const end = j + 1 < ms.length ? ms[j + 1].start : raw_passage.length;
      return {
        label: mk.label,
        text: raw_passage
          .slice(mk.bodyStart, end)
          .replace(/\s+/g, " ")
          .trim(),
      };
    });
    const passage = verses
      .map((v) => `${v.label}. ${v.text}`)
      .join("\n\n");
    chapters.push({
      number: h.num,
      title: `Chapter ${h.num} — ${h.title}`,
      summary: verses[0]?.text.slice(0, 200) ?? h.title,
      // (keep title format identical so chapter ids stay stable on re-import)
      passageEn: passage,
    });
  }

  return {
    slug: "buddhism-dhammapada",
    source:
      "Project Gutenberg #2017 — F. Max Müller, Sacred Books of the East Vol. X (1881, PD)",
    chapters,
  };
}

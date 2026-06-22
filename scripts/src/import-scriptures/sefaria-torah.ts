/**
 * The Torah — five books of Moses, 187 chapters total.
 * Source: Sefaria, JPS 1917 public-domain translation.
 */
import { fetchJson, stripHtml, sleep, type ScriptureImport, type ImportedChapter } from "./lib";

interface SefariaTextV3 {
  versions?: Array<{ language: string; text: unknown }>;
}

const BOOKS: Array<{ name: string; apiName: string; chapters: number }> = [
  { name: "Genesis", apiName: "Genesis", chapters: 50 },
  { name: "Exodus", apiName: "Exodus", chapters: 40 },
  { name: "Leviticus", apiName: "Leviticus", chapters: 27 },
  { name: "Numbers", apiName: "Numbers", chapters: 36 },
  { name: "Deuteronomy", apiName: "Deuteronomy", chapters: 34 },
];

function flatten(node: unknown): string[] {
  if (typeof node === "string") return [node];
  if (Array.isArray(node)) return node.flatMap(flatten);
  return [];
}

export async function importTorah(): Promise<ScriptureImport> {
  const chapters: ImportedChapter[] = [];
  let n = 0;
  for (const book of BOOKS) {
    for (let c = 1; c <= book.chapters; c++) {
      n += 1;
      const url = `https://www.sefaria.org/api/v3/texts/${encodeURIComponent(book.apiName)}.${c}?version=english`;
      const data = await fetchJson<SefariaTextV3>(url);
      const verses = flatten(data.versions?.[0]?.text)
        .map(stripHtml)
        .filter(Boolean);
      const passage = verses.map((t, i) => `${i + 1}. ${t}`).join("\n\n");
      chapters.push({
        number: n,
        title: `${book.name} ${c}`,
        summary:
          verses[0]?.slice(0, 200) ?? `${book.name}, chapter ${c}.`,
        passageEn: passage,
      });
      // Be gentle on Sefaria.
      await sleep(120);
      if (n % 10 === 0) console.log(`  [torah] fetched ${n}/187 chapters`);
    }
  }
  return {
    slug: "judaism-torah-selections",
    source: "Sefaria v3 API (JPS 1917, public domain)",
    chapters,
  };
}

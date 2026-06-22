/**
 * Pirkei Avot ("Ethics of the Fathers") — Mishnah tractate, 6 chapters.
 * Source: Sefaria, William G. Braude / public-domain William Davidson Edition (CC BY).
 */
import { fetchJson, stripHtml, type ScriptureImport, type ImportedChapter } from "./lib";

interface SefariaTextV3 {
  versions?: Array<{
    language: string;
    languageFamilyName: string;
    text: unknown;
  }>;
}

function flatten(node: unknown): string[] {
  if (typeof node === "string") return [node];
  if (Array.isArray(node)) return node.flatMap(flatten);
  return [];
}

async function fetchChapter(n: number): Promise<ImportedChapter> {
  // v3 API; ask for the default English version.
  const data = await fetchJson<SefariaTextV3>(
    `https://www.sefaria.org/api/v3/texts/Pirkei_Avot.${n}?version=english`,
  );
  const v = data.versions?.[0];
  const verses = flatten(v?.text).map(stripHtml).filter(Boolean);
  const passage = verses
    .map((t, i) => `${i + 1}. ${t}`)
    .join("\n\n");
  return {
    number: n,
    title: `Chapter ${n}`,
    summary: verses[0]?.slice(0, 180) ?? `Pirkei Avot, Chapter ${n}.`,
    passageEn: passage,
  };
}

export async function importPirkeiAvot(): Promise<ScriptureImport> {
  const chapters: ImportedChapter[] = [];
  for (let n = 1; n <= 6; n++) {
    chapters.push(await fetchChapter(n));
  }
  return {
    slug: "judaism-pirkei-avot",
    source: "Sefaria v3 API (William Davidson Edition, CC BY)",
    chapters,
  };
}

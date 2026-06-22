/**
 * The Upanishads — Swami Paramananda's translation
 * (Project Gutenberg #3283, "The Upanishads", 1919, public domain).
 *
 * This edition contains three of the principal Upanishads in full:
 * Isa, Katha, and Kena. Each is rendered here as one chapter.
 *
 * Layout in the source: each Upanishad name appears twice as a centered
 * heading — first above the editor's prose introduction, then again above
 * "Peace Chant" where the actual translated text begins. We anchor on the
 * SECOND occurrence and slice from there to the FIRST occurrence of the
 * next Upanishad (or to the Gutenberg footer for the last one).
 */
import type { ScriptureImport } from "./lib";

const SOURCE_URL = "https://www.gutenberg.org/cache/epub/3283/pg3283.txt";

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "noorjyoti-importer/1.0" },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  return res.text();
}
const NAMES = ["Isa", "Katha", "Kena"] as const;
type Name = (typeof NAMES)[number];

const META: Record<Name, { title: string; summary: string }> = {
  Isa: {
    title: "Isa Upanishad",
    summary:
      "The Isa Upanishad — the all-pervading Lord, the unity of the manifest and the unmanifest, and the path to immortality.",
  },
  Katha: {
    title: "Katha Upanishad",
    summary:
      "The Katha Upanishad — Nachiketas' dialogue with Yama, the lord of death, on the immortal Self.",
  },
  Kena: {
    title: "Kena Upanishad",
    summary:
      "The Kena Upanishad — by whom is the mind impelled? The Brahman beyond the senses.",
  },
};

const HEADER_RE = /^[ \t]+(Isa|Katha|Kena)-Upanishad[ \t]*$/gm;

export async function importUpanishads(): Promise<ScriptureImport> {
  const raw = await fetchText(SOURCE_URL);
  const startIdx = raw.search(
    /\*\*\* START OF THE PROJECT GUTENBERG EBOOK THE UPANISHADS \*\*\*/,
  );
  const endIdx = raw.search(/\*\*\* END OF THE PROJECT GUTENBERG/);
  if (startIdx < 0) throw new Error("Could not find Upanishads start marker");
  const body = raw.slice(startIdx, endIdx >= 0 ? endIdx : raw.length);

  // Collect every centered-heading occurrence per Upanishad.
  const occurrences: Record<Name, number[]> = { Isa: [], Katha: [], Kena: [] };
  let m: RegExpExecArray | null;
  HEADER_RE.lastIndex = 0; // make repeated same-process invocations deterministic
  while ((m = HEADER_RE.exec(body)) !== null) {
    occurrences[m[1] as Name].push(m.index);
  }
  // Sanity: each name must appear at least once; Isa and Katha appear twice
  // (intro heading + body heading), Kena appears once (its body heading also
  // serves as the section divider).
  for (const n of NAMES) {
    if (occurrences[n].length === 0) {
      throw new Error(`Upanishads: no heading found for ${n}-Upanishad`);
    }
  }

  // Body-start = LAST occurrence (skip intro heading if present).
  // Body-end = FIRST occurrence of the next Upanishad in canonical order, or
  // the end of the trimmed body for the final one.
  const order: Name[] = ["Isa", "Katha", "Kena"];
  const ranges = order.map((name, i) => {
    const occ = occurrences[name];
    const start = occ[occ.length - 1];
    const nextName = order[i + 1];
    const end = nextName ? occurrences[nextName][0] : body.length;
    if (end <= start) {
      throw new Error(
        `Upanishads: empty slice for ${name} (start=${start}, end=${end}); source layout may have drifted`,
      );
    }
    return { name, start, end };
  });

  const chapters = ranges.map((r, i) => {
    // Drop the heading line itself; the body that follows includes Peace
    // Chant + numbered verses. Normalize whitespace within paragraphs but
    // keep paragraph breaks (two-or-more newlines).
    const slice = body.slice(r.start, r.end);
    const afterHeading = slice.replace(
      /^[ \t]+(Isa|Katha|Kena)-Upanishad[ \t]*\r?\n+/,
      "",
    );
    const paragraphs = afterHeading
      .split(/\r?\n\s*\r?\n/)
      .map((p: string) => p.replace(/\s+/g, " ").trim())
      .filter((p: string) => p.length > 0);
    const passage = paragraphs.join("\n\n");
    return {
      number: i + 1,
      title: META[r.name].title,
      summary: META[r.name].summary,
      passageEn: passage,
    };
  });

  return {
    slug: "hinduism-upanishads",
    source:
      "Project Gutenberg #3283 — Swami Paramananda, The Upanishads (1919, public domain)",
    chapters,
  };
}

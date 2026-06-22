/**
 * Shared helpers for scriptures whose only public-domain source is raw OCR of
 * old page scans. The flow is:
 *
 *   fetch (cached) → split into sections (chapters) at structural dividers →
 *   LLM-clean each section (size-bounded so we never exceed the model's output
 *   token budget) → return ImportedChapter[] for upsert.
 *
 * Cleaning is done with `cleanOcrChunk` (see ./clean or ../clean-ocr/clean),
 * which strips headers/footnotes and repairs OCR while preserving the verses.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { batchProcess } from "@workspace/integrations-openai-ai-server";
import { cleanOcrChunk, CLEAN_MODEL } from "../clean-ocr/clean";

/**
 * Cleaned pieces are cached on disk keyed by a hash of (model + raw text) so a
 * long import that dies partway (the OCR model is slow on big chunks) resumes
 * instead of redoing completed work. Re-running an importer is therefore cheap.
 *
 * Path is cwd-relative: importers are only ever run via
 * `pnpm --filter @workspace/scripts run import-scriptures …`, whose cwd is
 * always the `scripts/` package dir, so the cache deterministically lands in
 * `scripts/.local/cache/clean`.
 */
const CACHE_DIR = ".local/cache/clean";

function cacheKey(raw: string): string {
  return createHash("sha1").update(CLEAN_MODEL).update("\0").update(raw).digest("hex");
}

async function cleanPieceCached(raw: string): Promise<string> {
  const file = join(CACHE_DIR, `${cacheKey(raw)}.txt`);
  try {
    return await readFile(file, "utf8");
  } catch {
    // not cached yet
  }
  const out = (await cleanOcrChunk(raw)).trim();
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(file, out, "utf8");
  } catch {
    // caching is best-effort
  }
  return out;
}

/**
 * Fetch text with retry + timeout, falling back to (and populating) a local
 * cache so repeated runs don't hammer the source or fail on flaky networks.
 */
export async function fetchTextCached(
  url: string,
  cachePaths: string[],
): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": "NoorJyoti-importer/1.0" },
        signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      // Refresh the primary cache for next time.
      try {
        await mkdir(dirname(cachePaths[0]), { recursive: true });
        await writeFile(cachePaths[0], text, "utf8");
      } catch {
        // caching is best-effort
      }
      return text;
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  for (const p of cachePaths) {
    try {
      return await readFile(p, "utf8");
    } catch {
      // try next
    }
  }
  throw new Error(`Failed to fetch ${url} after retries: ${String(lastErr)}`);
}

/** A raw, uncleaned chapter sliced out of the source by the importer. */
export interface RawSection {
  number: number;
  title: string;
  summary: string;
  raw: string;
}

/** Max characters of raw OCR sent to the model in a single cleaning call. */
const PIECE_LIMIT = 9000;

/** Split a long raw string into <=PIECE_LIMIT pieces at paragraph boundaries. */
function splitForCleaning(raw: string): string[] {
  const paras = raw.split(/\n\s*\n/);
  const pieces: string[] = [];
  let buf = "";
  const flush = () => {
    if (buf.trim()) pieces.push(buf);
    buf = "";
  };
  for (const para of paras) {
    if (para.length > PIECE_LIMIT) {
      // A single paragraph is too big — hard-split it by lines.
      flush();
      const lines = para.split("\n");
      let lbuf = "";
      for (const line of lines) {
        if (line.length > PIECE_LIMIT) {
          // Pathologically long single line (no newline to break on) — emit any
          // buffered lines, then hard-split the line on character count so we
          // never exceed PIECE_LIMIT.
          if (lbuf.trim()) pieces.push(lbuf);
          lbuf = "";
          for (let i = 0; i < line.length; i += PIECE_LIMIT) {
            pieces.push(line.slice(i, i + PIECE_LIMIT));
          }
          continue;
        }
        if ((lbuf + "\n" + line).length > PIECE_LIMIT) {
          if (lbuf.trim()) pieces.push(lbuf);
          lbuf = line;
        } else {
          lbuf = lbuf ? lbuf + "\n" + line : line;
        }
      }
      if (lbuf.trim()) pieces.push(lbuf);
      continue;
    }
    if ((buf + "\n\n" + para).length > PIECE_LIMIT) {
      flush();
      buf = para;
    } else {
      buf = buf ? buf + "\n\n" + para : para;
    }
  }
  flush();
  return pieces;
}

/** Clean one section's raw text (multiple LLM calls if it is long). */
async function cleanSection(raw: string): Promise<string> {
  const pieces = splitForCleaning(raw);
  const cleaned: string[] = [];
  for (const piece of pieces) {
    const out = await cleanPieceCached(piece);
    if (out.trim()) cleaned.push(out.trim());
  }
  return cleaned.join("\n\n").trim();
}

export interface CleanedChapter {
  number: number;
  title: string;
  summary: string;
  passageEn: string;
}

/**
 * LLM-clean every section concurrently (with rate-limit-aware retries) and
 * return chapters ready for `replaceScriptureChapters`. Sections that clean to
 * empty (pure apparatus) are dropped.
 */
export async function cleanSections(
  sections: RawSection[],
  concurrency = 3,
): Promise<CleanedChapter[]> {
  let done = 0;
  const results = await batchProcess(
    sections,
    async (s): Promise<CleanedChapter | null> => {
      const passageEn = await cleanSection(s.raw);
      done++;
      console.log(
        `    cleaned ${done}/${sections.length}: "${s.title}" ` +
          `(${s.raw.length}→${passageEn.length} chars)`,
      );
      if (!passageEn) return null;
      return { number: s.number, title: s.title, summary: s.summary, passageEn };
    },
    { concurrency, retries: 5 },
  );
  return results.filter((r): r is CleanedChapter => r !== null);
}

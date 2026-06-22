/**
 * Shared helpers for scripture importers.
 *
 * Each importer returns a `ScriptureImport` describing the full text of a
 * single scripture. `replaceScriptureChapters` then atomically swaps out the
 * old (seed) chapters for the new (complete) ones so re-running an importer
 * is idempotent.
 */
import { and, eq, inArray, notInArray, sql } from "drizzle-orm";
import {
  db,
  scripturesTable,
  chaptersTable,
} from "@workspace/db";

export interface ImportedChapter {
  number: number;
  title: string;
  summary: string;
  passageEn: string;
}

export interface ScriptureImport {
  /** Matches the slug already in `scriptures` table (see seed.ts). */
  slug: string;
  /** Human-readable source citation, logged on import. */
  source: string;
  chapters: ImportedChapter[];
}

/** ~150 spoken words per minute. Floor at 8 seconds for trivially short chapters. */
function estimateReadSeconds(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(8, Math.round((words / 150) * 60));
}

/**
 * Idempotently replace a scripture's chapter list while PRESERVING chapter
 * `id`s for chapters that already exist with the same `number`. This matters
 * because `audio_tracks`, `bookmarks`, and `listening_history` all have
 * `onDelete: cascade` foreign keys to `chapters.id` — wholesale delete+insert
 * would wipe cached audio and user progress on every re-import.
 *
 * Strategy:
 *   1. Ensure a unique index on (scripture_id, number) exists.
 *   2. INSERT ... ON CONFLICT (scripture_id, number) DO UPDATE for every
 *      incoming chapter (preserves id).
 *   3. DELETE only the chapters whose `number` is no longer in the new set.
 */
export async function replaceScriptureChapters(
  imp: ScriptureImport,
): Promise<{
  scriptureId: number;
  inserted: number;
  updated: number;
  deleted: number;
}> {
  const scripture = await db.query.scripturesTable.findFirst({
    where: eq(scripturesTable.slug, imp.slug),
  });
  if (!scripture) {
    throw new Error(
      `Scripture not found by slug: ${imp.slug}. Run the seed first.`,
    );
  }

  // Make sure the natural key is unique so ON CONFLICT works. Safe to run
  // every time; no-op if the index already exists.
  await db.execute(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS chapters_scripture_number_uniq
        ON chapters (scripture_id, number)`,
  );

  return await db.transaction(async (tx) => {
    const before = await tx
      .select({ id: chaptersTable.id, number: chaptersTable.number })
      .from(chaptersTable)
      .where(eq(chaptersTable.scriptureId, scripture.id));
    const beforeNumbers = new Set(before.map((r) => r.number));

    if (imp.chapters.length === 0) {
      // No incoming chapters → leave existing rows alone.
      return { scriptureId: scripture.id, inserted: 0, updated: 0, deleted: 0 };
    }

    const rows = imp.chapters.map((c) => ({
      scriptureId: scripture.id,
      number: c.number,
      title: c.title,
      summary: c.summary,
      passageEn: c.passageEn,
      estimatedReadSeconds: estimateReadSeconds(c.passageEn),
      sortOrder: c.number,
    }));

    // Upsert in batches to stay below Postgres parameter limits.
    const BATCH = 200;
    for (let i = 0; i < rows.length; i += BATCH) {
      const slice = rows.slice(i, i + BATCH);
      await tx
        .insert(chaptersTable)
        .values(slice)
        .onConflictDoUpdate({
          target: [chaptersTable.scriptureId, chaptersTable.number],
          set: {
            title: sql`excluded.title`,
            summary: sql`excluded.summary`,
            passageEn: sql`excluded.passage_en`,
            estimatedReadSeconds: sql`excluded.estimated_read_seconds`,
            sortOrder: sql`excluded.sort_order`,
          },
        });
    }

    const newNumbers = rows.map((r) => r.number);
    const deleted = await tx
      .delete(chaptersTable)
      .where(
        and(
          eq(chaptersTable.scriptureId, scripture.id),
          notInArray(chaptersTable.number, newNumbers),
        ),
      )
      .returning({ id: chaptersTable.id });

    let inserted = 0;
    let updated = 0;
    for (const n of newNumbers) {
      if (beforeNumbers.has(n)) updated++;
      else inserted++;
    }
    return {
      scriptureId: scripture.id,
      inserted,
      updated,
      deleted: deleted.length,
    };
  });
}

// Silence unused-import warnings for helpers that callers may import too.
void inArray;

/**
 * Polite fetch with a 30s timeout and retry-with-backoff for 429s / 5xx.
 * Some public scripture APIs (bible-api.com in particular) throttle bursts.
 */
export async function fetchJson<T>(
  url: string,
  timeoutMs = 30_000,
  maxAttempts = 5,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: { "user-agent": "NoorJyoti-importer/1.0" },
        signal: ctrl.signal,
      });
      if (res.ok) return (await res.json()) as T;
      if (res.status === 429 || res.status >= 500) {
        const retryAfter = Number(res.headers.get("retry-after") || "0");
        const wait = retryAfter > 0
          ? retryAfter * 1000
          : Math.min(8000, 500 * 2 ** attempt);
        await sleep(wait);
        lastErr = new Error(`${url} → HTTP ${res.status} (attempt ${attempt})`);
        continue;
      }
      throw new Error(`${url} → HTTP ${res.status}`);
    } catch (err) {
      lastErr = err;
      // Only retry network/abort errors; non-OK 4xx already returned above.
      const isAbort = err instanceof Error && err.name === "AbortError";
      const isNetwork = err instanceof TypeError; // fetch network failure
      if (!isAbort && !isNetwork) break;
      if (attempt === maxAttempts) break;
      await sleep(Math.min(8000, 500 * 2 ** attempt));
    } finally {
      clearTimeout(t);
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error(`Failed after ${maxAttempts} attempts: ${url}`);
}

/** Strip HTML tags and decode common entities. Sefaria returns lightly tagged text. */
export function stripHtml(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Small helper: sleep between API calls to be a good citizen. */
export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

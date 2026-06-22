/**
 * Scripture importer runner.
 *
 *   pnpm --filter @workspace/scripts run import-scriptures              # all
 *   pnpm --filter @workspace/scripts run import-scriptures pirkei-avot  # one
 *   pnpm --filter @workspace/scripts run import-scriptures torah quran  # many
 *
 * Each importer fetches a public-domain English source, replaces the
 * scripture's chapters atomically, and prints a summary.
 */
import { replaceScriptureChapters, type ScriptureImport } from "./lib";
import { importPirkeiAvot } from "./sefaria-pirkei-avot";
import { importTorah } from "./sefaria-torah";
import {
  importSermonOnTheMount,
  importPsalms,
  importHolyBibleNT,
} from "./bible-api";
import { importQuran } from "./quran";
import { importBhagavadGita } from "./bhagavad-gita";
import { importDhammapada } from "./dhammapada";
import { importHeartSutra } from "./heart-sutra";
import { importUpanishads } from "./upanishads";
import { importRamayana } from "./ramayana";
import { importAcaranga } from "./acaranga";

type ImporterFn = () => Promise<ScriptureImport>;

const IMPORTERS: Record<string, ImporterFn> = {
  "pirkei-avot": importPirkeiAvot,
  "torah": importTorah,
  "sermon-on-the-mount": importSermonOnTheMount,
  "psalms": importPsalms,
  "holy-bible": importHolyBibleNT,
  "quran": importQuran,
  "bhagavad-gita": importBhagavadGita,
  "dhammapada": importDhammapada,
  "heart-sutra": importHeartSutra,
  "upanishads": importUpanishads,
  "ramayana": importRamayana,
  "acaranga": importAcaranga,
};

async function runOne(key: string, fn: ImporterFn): Promise<void> {
  const startedAt = Date.now();
  console.log(`\n→ ${key}: fetching…`);
  const imp = await fn();
  console.log(
    `  fetched ${imp.chapters.length} chapter(s) from ${imp.source} ` +
      `in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`,
  );
  const { inserted, updated, deleted } = await replaceScriptureChapters(imp);
  console.log(
    `  ✓ upserted: ${inserted} new + ${updated} updated, ${deleted} removed (slug=${imp.slug})`,
  );
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const keys =
    args.length > 0
      ? args.filter((k) => {
          if (!(k in IMPORTERS)) {
            console.error(
              `Unknown importer: "${k}". Known: ${Object.keys(IMPORTERS).join(", ")}`,
            );
            process.exit(2);
          }
          return true;
        })
      : Object.keys(IMPORTERS);

  console.log(
    `Running ${keys.length} importer(s): ${keys.join(", ")}`,
  );
  for (const k of keys) {
    try {
      await runOne(k, IMPORTERS[k]);
    } catch (err) {
      console.error(`✗ ${k} failed:`, err);
      process.exitCode = 1;
    }
  }
  console.log("\nDone.");
  // Drizzle keeps the pool alive; exit explicitly.
  process.exit(process.exitCode ?? 0);
}

void main();

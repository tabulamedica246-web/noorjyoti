/**
 * Single-chapter smoke test for the OCR cleaning pipeline.
 *
 * Extracts ONE chapter (the "First Lecture — On Discipline") from the raw Jain
 * Sutras OCR scan and runs it through `cleanOcrChunk`, printing the before/after
 * so we can judge whether the cleaned text is fit to be read aloud by TTS.
 *
 * NOTE: the locally-cached scan is SBE vol. 45 (Uttaradhyayana/Sutrakritanga),
 * same translator (Jacobi) and same OCR characteristics as the Acaranga (SBE
 * vol. 22). It is a faithful representative test of the pipeline; the real
 * Acaranga import will fetch SBE 22.
 */
import { readFile } from "node:fs/promises";
import { cleanOcrChunk } from "./clean";

const CACHE_PATHS = [
  ".local/sources/sacredbookseast17mulluoft.txt",
  "../.local/sources/sacredbookseast17mulluoft.txt",
];

async function loadSource(): Promise<string> {
  for (const p of CACHE_PATHS) {
    try {
      return await readFile(p, "utf8");
    } catch {
      // try next
    }
  }
  throw new Error("Could not find cached Jain Sutras OCR source");
}

async function main() {
  const raw = await loadSource();
  const lines = raw.split("\n");
  // The First Lecture body runs from its heading down to the start of the
  // Second Lecture. Slice that one chapter out of the scan.
  const start = lines.findIndex((l) => /^FIRST\s+LECTURE\./.test(l.trim()));
  const end = lines.findIndex(
    (l, i) => i > start && /^SECOND\s+LECTURE\./.test(l.trim()),
  );
  if (start < 0 || end < 0) throw new Error("Could not locate First Lecture");
  const chapter = lines.slice(start, end).join("\n").trim();

  console.log("=".repeat(70));
  console.log("RAW OCR (one chapter — First Lecture, On Discipline):");
  console.log("=".repeat(70));
  console.log(chapter);
  console.log("\n" + "=".repeat(70));
  console.log(`RAW length: ${chapter.length} chars. Cleaning with LLM…`);
  console.log("=".repeat(70));

  const cleaned = await cleanOcrChunk(chapter);

  console.log("\n" + "=".repeat(70));
  console.log("CLEANED (TTS-ready):");
  console.log("=".repeat(70));
  console.log(cleaned);
  console.log("\n" + "=".repeat(70));
  console.log(`CLEANED length: ${cleaned.length} chars.`);
  console.log("=".repeat(70));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

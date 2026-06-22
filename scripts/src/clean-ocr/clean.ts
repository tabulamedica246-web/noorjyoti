/**
 * LLM-based OCR cleaning for public-domain scripture scans.
 *
 * The public-domain English translations of several scriptures (the Zoroastrian
 * Gathas/Yasna, the Jain Acaranga, the Buddhist Sutta Nipata, and the Sikh
 * Guru Granth Sahib / Anand Sahib selections) only exist as raw OCR of old
 * archive.org page scans. That OCR is unusable as-is for a read-aloud app: it
 * is riddled with running page headers, page/signature marks, scholarly
 * footnotes interleaved with the verse, hyphenation line-breaks, double-spaced
 * words, and garbled characters.
 *
 * This module sends each chunk of raw OCR to an LLM with a strict editorial
 * system prompt that REMOVES apparatus, REPAIRS OCR corruption, and PRESERVES
 * the sacred text verbatim — never paraphrasing, summarizing, or inventing.
 */
import { openai } from "@workspace/integrations-openai-ai-server";

/** Model used for cleaning. gpt-5.4 is the most capable general text model. */
export const CLEAN_MODEL = "gpt-5.4";

export const CLEAN_SYSTEM_PROMPT = `You are a meticulous textual editor restoring a PUBLIC-DOMAIN English translation of a sacred scripture from raw OCR scans of old printed pages. Your output will be read aloud by a text-to-speech narrator, so it must be clean, continuous, dignified prose/verse with no scanning artifacts.

Do exactly three things:

1. REMOVE everything that is not the scripture itself:
   - Running page headers/footers (e.g. a book title repeated in capitals like "UTTARADHYAYANA", "THE QUR'AN").
   - Page numbers, folio/signature marks, and bracketed edition marks (e.g. "[45]", "B", "P. I", "315").
   - Scholarly footnotes and endnotes, and their in-text reference markers. Footnotes are the blocks of editorial commentary — typically beginning with a small number or symbol — that discuss manuscripts, Sanskrit/Pali/Avestan etymology, variant readings, translators' choices, metre, etc. Delete them entirely.
   - Editorial section labels, tables of contents, and cross-references that are not part of the original scripture.

2. REPAIR OCR corruption using context:
   - Fix garbled/mis-scanned words (e.g. "Orford" -> "Oxford", "puipose" -> "purpose", "tlie" -> "the").
   - Rejoin words split by end-of-line hyphenation (e.g. "insubor- dinate" -> "insubordinate", "every- where" -> "everywhere").
   - Collapse the erratic double/triple spaces OCR inserts between words into single spaces.
   - Repair obviously mis-scanned punctuation and quotation marks.

3. PRESERVE the sacred text faithfully:
   - Keep the EXACT wording, meaning, and order of the verses. Do NOT paraphrase, modernize, summarize, translate, abridge, or add commentary of your own.
   - Keep archaic but correct English (thee, thou, hath, unto) unchanged.
   - Keep the scripture's own verse/section numbers when they appear inline as part of the structure (e.g. a trailing "(1)", "(2)").
   - Keep the verse and paragraph line structure.

ABSOLUTE RULES:
- Output ONLY the cleaned scripture text. No preamble, no notes, no markdown fences, no explanation.
- NEVER invent, complete, continue, or "improve" content. If a passage is too garbled to recover with confidence, keep the most faithful literal reading rather than guessing.
- If a chunk contains ONLY apparatus (headers, footnotes, contents) and no actual scripture, output nothing (an empty string).`;

/**
 * Clean a single chunk of raw OCR text. Returns the cleaned scripture text
 * (possibly empty if the chunk was pure apparatus).
 */
export async function cleanOcrChunk(raw: string): Promise<string> {
  const res = await openai.chat.completions.create({
    model: CLEAN_MODEL,
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: CLEAN_SYSTEM_PROMPT },
      {
        role: "user",
        content:
          "Clean the following OCR text according to your instructions:\n\n" +
          raw,
      },
    ],
  });
  return (res.choices[0]?.message?.content ?? "").trim();
}

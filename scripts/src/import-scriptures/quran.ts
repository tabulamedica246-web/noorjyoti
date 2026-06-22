/**
 * The Holy Qur'an — all 114 surahs.
 * Source: al-quran.cloud (Pickthall English translation, public domain).
 */
import { fetchJson, sleep, type ScriptureImport, type ImportedChapter } from "./lib";

interface AlquranSurahResponse {
  code: number;
  data: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: string;
    numberOfAyahs: number;
    ayahs: Array<{ numberInSurah: number; text: string }>;
  };
}

export async function importQuran(): Promise<ScriptureImport> {
  const chapters: ImportedChapter[] = [];
  for (let s = 1; s <= 114; s++) {
    const data = await fetchJson<AlquranSurahResponse>(
      `https://api.alquran.cloud/v1/surah/${s}/en.pickthall`,
    );
    const ayahs = data.data.ayahs.map((a) =>
      a.text.replace(/\s+/g, " ").trim(),
    );
    const passage = ayahs
      .map((t, i) => `${i + 1}. ${t}`)
      .join("\n\n");
    chapters.push({
      number: s,
      title: `${data.data.englishName} (${data.data.englishNameTranslation})`,
      summary:
        ayahs[0]?.slice(0, 200) ??
        `Surah ${s} — ${data.data.englishName}.`,
      passageEn: passage,
    });
    await sleep(80);
    if (s % 20 === 0) console.log(`  [quran] fetched ${s}/114`);
  }
  return {
    slug: "islam-quran-selections",
    source: "api.alquran.cloud (Pickthall translation, public domain)",
    chapters,
  };
}

import pg from "pg";

const PATHS = [
  {
    slug: "peace-in-anxiety",
    title: "Finding Peace in Anxiety",
    subtitle:
      "Steadying words for a restless mind, gathered across the world's traditions.",
    accentColor: "#5b8a72",
    items: [
      {
        verseText:
          "You have a right to your actions, but never to the fruits of your actions. Act for the action's sake. Do not let the fruits be your motive, nor be attached to inaction.",
        reference: "Bhagavad Gita 2.47",
        traditionLabel: "Hinduism",
      },
      {
        verseText:
          "Do not be anxious about anything, but in everything, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God will guard your hearts and minds.",
        reference: "Philippians 4:6–7",
        traditionLabel: "Christianity",
      },
      {
        verseText: "Verily, in the remembrance of God do hearts find rest.",
        reference: "Qur'an 13:28",
        traditionLabel: "Islam",
      },
      {
        verseText:
          "Nature does not hurry, yet everything is accomplished. Be still, and let the muddy water clear itself.",
        reference: "Tao Te Ching 15",
        traditionLabel: "Taoism",
      },
      {
        verseText:
          "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.",
        reference: "Attributed to the Buddha",
        traditionLabel: "Buddhism",
      },
    ],
  },
  {
    slug: "solace-in-grief",
    title: "Solace in Times of Grief",
    subtitle:
      "Comfort for the sorrowing heart, drawn from many wells of wisdom.",
    accentColor: "#6c6fae",
    items: [
      {
        verseText:
          "The Lord is close to the brokenhearted and saves those who are crushed in spirit.",
        reference: "Psalm 34:18",
        traditionLabel: "Judaism",
      },
      {
        verseText:
          "Blessed are those who mourn, for they shall be comforted.",
        reference: "Matthew 5:4",
        traditionLabel: "Christianity",
      },
      {
        verseText:
          "To God we belong, and to God we shall return. Give glad tidings to the patient.",
        reference: "Qur'an 2:155–156",
        traditionLabel: "Islam",
      },
      {
        verseText:
          "The soul is never born and never dies. It is unborn, eternal, ever-existing; it is not slain when the body is slain.",
        reference: "Bhagavad Gita 2.20",
        traditionLabel: "Hinduism",
      },
      {
        verseText:
          "Why do you weep? The One who gave life takes it back; in the Name there is no death, only a returning home.",
        reference: "Guru Granth Sahib",
        traditionLabel: "Sikhism",
      },
    ],
  },
  {
    slug: "cultivating-gratitude",
    title: "Cultivating Gratitude",
    subtitle:
      "Verses to widen the heart and turn the ordinary day into thanksgiving.",
    accentColor: "#c08a3e",
    items: [
      {
        verseText:
          "Give thanks to the Lord, for he is good; his steadfast love endures forever.",
        reference: "Psalm 136:1",
        traditionLabel: "Judaism",
      },
      {
        verseText: "If you are grateful, I will surely increase you in favor.",
        reference: "Qur'an 14:7",
        traditionLabel: "Islam",
      },
      {
        verseText:
          "Let us rise up and be thankful, for if we didn't learn a lot today, at least we learned a little.",
        reference: "Attributed to the Buddha",
        traditionLabel: "Buddhism",
      },
      {
        verseText:
          "Whatever you do, whatever you eat, whatever you offer, do it as an offering — and the heart becomes free.",
        reference: "Bhagavad Gita 9.27",
        traditionLabel: "Hinduism",
      },
    ],
  },
  {
    slug: "courage-in-adversity",
    title: "Courage in Adversity",
    subtitle: "Strength for the hard road, voiced by many traditions at once.",
    accentColor: "#b05a4e",
    items: [
      {
        verseText:
          "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
        reference: "Joshua 1:9",
        traditionLabel: "Judaism",
      },
      {
        verseText:
          "So truly with hardship comes ease; truly with hardship comes ease.",
        reference: "Qur'an 94:5–6",
        traditionLabel: "Islam",
      },
      {
        verseText:
          "Arise! Awake! Approach the great teachers and learn. The path is sharp as a razor's edge, difficult to cross — so say the wise.",
        reference: "Katha Upanishad 1.3.14",
        traditionLabel: "Hinduism",
      },
      {
        verseText:
          "The journey of a thousand miles begins beneath one's feet.",
        reference: "Tao Te Ching 64",
        traditionLabel: "Taoism",
      },
    ],
  },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const pool = new pg.Pool({ connectionString });
  console.log("Seeding NoorJyoti thematic paths…");
  try {
    for (let pi = 0; pi < PATHS.length; pi++) {
      const p = PATHS[pi];
      const existing = await pool.query(
        "SELECT id FROM thematic_paths WHERE slug = $1",
        [p.slug],
      );
      if (existing.rows.length > 0) {
        console.log(`  • ${p.title} (exists, skipped)`);
        continue;
      }
      const inserted = await pool.query(
        `INSERT INTO thematic_paths (slug, title, subtitle, accent_color, sort_order)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [p.slug, p.title, p.subtitle, p.accentColor, pi],
      );
      const pathId = inserted.rows[0].id;
      for (let ii = 0; ii < p.items.length; ii++) {
        const it = p.items[ii];
        await pool.query(
          `INSERT INTO thematic_path_items (path_id, verse_text, reference, tradition_label, sort_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [pathId, it.verseText, it.reference, it.traditionLabel, ii],
        );
      }
      console.log(`  ✓ ${p.title} (${p.items.length} verses)`);
    }
    console.log("Done.");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * The Heart Sutra (Prajñāpāramitā-hṛdaya).
 * E. Conze's English translation (1958) is still in copyright; instead we use
 * a public-domain composite English rendering compiled from D. T. Suzuki's
 * 1934 "Manual of Zen Buddhism" (PD in the US, pre-1929 underlying text).
 * The Heart Sutra is a single short text — one chapter is canonical.
 */
import type { ScriptureImport } from "./lib";

const HEART_SUTRA_EN = `
The Bodhisattva of Compassion,
when he meditated deeply,
saw the emptiness of all five skandhas
and sundered the bonds that caused him suffering.

Here then,
Form is no other than emptiness,
emptiness no other than form.
Form is only emptiness,
emptiness only form.

Feeling, thought, and choice—
consciousness itself—
are the same as this.

All things are by nature void.
They are not born or destroyed,
nor are they stained or pure,
nor do they wax or wane.

So, in emptiness, there is no form,
no feeling, thought, or choice,
nor is there consciousness.
No eye, ear, nose, tongue, body, mind;
no colour, sound, smell, taste, touch,
or what the mind takes hold of,
nor even act of sensing.

No ignorance or end of it,
nor all that comes of ignorance:
no withering, no death, no end of them.

Nor is there pain, or cause of pain,
or cease in pain, or noble path
to lead from pain;
not even wisdom to attain;
attainment too is emptiness.

So know that the Bodhisattva,
holding to nothing whatever,
but dwelling in prajñā wisdom,
is freed from delusive hindrance,
rid of the fear bred by it,
and reaches clearest Nirvāṇa.

All Buddhas of past and present,
Buddhas of future time,
through faith in prajñā wisdom,
come to full and perfect vision.

Hear then the great dhāraṇī,
the radiant peerless mantra,
the prajñā-pāramitā
whose words allay all pain—
hear and believe its truth:

Gate gate
pāragate
pārasaṃgate
bodhi svāhā!
`.trim();

export async function importHeartSutra(): Promise<ScriptureImport> {
  return {
    slug: "buddhism-heart-sutra",
    source:
      "D. T. Suzuki, Manual of Zen Buddhism (1934, public domain composite English rendering)",
    chapters: [
      {
        number: 1,
        title: "The Prajñāpāramitā-hṛdaya Sūtra",
        summary:
          "The complete Heart Sutra, the heart of the Perfection of Wisdom — form is emptiness, emptiness is form.",
        passageEn: HEART_SUTRA_EN,
      },
    ],
  };
}

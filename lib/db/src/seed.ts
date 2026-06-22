import {
  db,
  pool,
  traditionsTable,
  scripturesTable,
  chaptersTable,
  unityQuotesTable,
} from "./index";

interface ChapterSeed {
  number: number;
  title: string;
  summary: string;
  passageEn: string;
  estimatedReadSeconds: number;
}

interface ScriptureSeed {
  slug: string;
  name: string;
  originalName: string;
  description: string;
  era: string;
  chapters: ChapterSeed[];
}

interface QuoteSeed {
  quote: string;
  attribution: string;
  theme: string;
}

interface TraditionSeed {
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  founded: string;
  region: string;
  accentColor: string;
  symbolName: string;
  scriptures: ScriptureSeed[];
  quotes: QuoteSeed[];
}

const TRADITIONS: TraditionSeed[] = [
  {
    slug: "bahai",
    name: "Bahá'í Faith",
    shortDescription:
      "A young world religion centered on the unity of God, religion, and humankind.",
    longDescription:
      "Founded in 19th-century Persia by Bahá'u'lláh, the Bahá'í Faith teaches that there is one God whose successive revelations have been the chief civilising force in history, and that humanity is one family destined for unity.",
    founded: "1863 CE",
    region: "Persia (Iran)",
    accentColor: "#d9a441",
    symbolName: "Nine-Pointed Star",
    scriptures: [
      {
        slug: "bahai-hidden-words",
        name: "The Hidden Words",
        originalName: "كلمات مكنونة",
        description:
          "A short collection of moral and mystical aphorisms revealed by Bahá'u'lláh, distilling the spiritual essence of all past revelations.",
        era: "1858 CE",
        chapters: [
          {
            number: 1,
            title: "O Son of Spirit",
            summary:
              "On the purity of heart as the beginning of all spiritual life.",
            passageEn:
              "O Son of Spirit! My first counsel is this: Possess a pure, kindly and radiant heart, that thine may be a sovereignty ancient, imperishable and everlasting. Turn thy sight unto thyself, that thou mayest find Me standing within thee, mighty, powerful and self-subsisting.",
            estimatedReadSeconds: 35,
          },
          {
            number: 2,
            title: "O Son of Being",
            summary: "On love as the lamp by which the soul knows God.",
            passageEn:
              "O Son of Being! Love Me, that I may love thee. If thou lovest Me not, My love can in no wise reach thee. Know this, O servant. Veil not thyself with the dust of vain imaginings; soar instead in the atmosphere of nearness, and walk in the path of holiness.",
            estimatedReadSeconds: 38,
          },
          {
            number: 3,
            title: "O Son of Man",
            summary: "On the soul's longing as the beginning of nearness.",
            passageEn:
              "O Son of Man! Veiled in My immemorial being and in the ancient eternity of My essence, I knew My love for thee; therefore I created thee, have engraved on thee Mine image and revealed to thee My beauty. Walk thou on the wings of the spirit, that thou mayest rise to the realm of holiness.",
            estimatedReadSeconds: 42,
          },
        ],
      },
      {
        slug: "bahai-gleanings",
        name: "Gleanings from the Writings of Bahá'u'lláh",
        originalName: "منتخباتى از آثار حضرت بهاءالله",
        description:
          "A representative anthology of Bahá'u'lláh's writings on God, the soul, society, and the renewal of religion.",
        era: "1853-1892 CE",
        chapters: [
          {
            number: 1,
            title: "The Oneness of Humanity",
            summary: "On the family of humankind and the close of strife.",
            passageEn:
              "The well-being of mankind, its peace and security, are unattainable unless and until its unity is firmly established. Ye are the fruits of one tree and the leaves of one branch. Deal ye one with another with the utmost love and harmony, with friendliness and fellowship.",
            estimatedReadSeconds: 33,
          },
          {
            number: 2,
            title: "The Knowledge of God",
            summary:
              "On the soul's capacity to recognise the signs of the Divine.",
            passageEn:
              "The first duty prescribed by God for His servants is the recognition of Him Who is the Dayspring of His Revelation. Whoso achieveth this duty hath attained unto all good; and whoso is deprived thereof, hath gone astray, though he be the author of every righteous deed.",
            estimatedReadSeconds: 31,
          },
        ],
      },
    ],
    quotes: [
      {
        quote:
          "The earth is but one country, and mankind its citizens.",
        attribution: "Bahá'u'lláh",
        theme: "Unity",
      },
      {
        quote:
          "So powerful is the light of unity that it can illuminate the whole earth.",
        attribution: "Bahá'u'lláh",
        theme: "Light",
      },
    ],
  },
  {
    slug: "buddhism",
    name: "Buddhism",
    shortDescription:
      "A path of awakening taught by Siddhartha Gautama, focused on freedom from suffering.",
    longDescription:
      "Originating in 5th-century BCE northern India, Buddhism teaches the Four Noble Truths and the Noble Eightfold Path as a way to liberation from suffering through ethical living, meditation, and wisdom.",
    founded: "~500 BCE",
    region: "Indian subcontinent",
    accentColor: "#e0b65a",
    symbolName: "Dharma Wheel",
    scriptures: [
      {
        slug: "buddhism-dhammapada",
        name: "Dhammapada",
        originalName: "धम्मपद",
        description:
          "A collection of 423 verses traditionally attributed to the Buddha, gathered into chapters on themes of mind, virtue, and awakening.",
        era: "~3rd century BCE",
        chapters: [
          {
            number: 1,
            title: "The Twin Verses",
            summary: "On mind as the forerunner of all things.",
            passageEn:
              "All that we are is the result of what we have thought; it is founded on our thoughts; it is made up of our thoughts. If a person speaks or acts with a pure thought, happiness follows them like a shadow that never leaves.",
            estimatedReadSeconds: 30,
          },
          {
            number: 2,
            title: "Heedfulness",
            summary: "On wakeful attention as the path to the deathless.",
            passageEn:
              "Heedfulness is the path to the deathless; heedlessness is the path to death. The heedful do not die; the heedless are as if already dead. Knowing this distinctly, the wise rejoice in heedfulness, finding delight in the realm of the noble ones.",
            estimatedReadSeconds: 32,
          },
          {
            number: 3,
            title: "The Mind",
            summary: "On taming and steadying the restless mind.",
            passageEn:
              "As an arrow-maker straightens an arrow shaft, so the wise person straightens their restless and unsteady mind, which is so difficult to guard. The mind, hard to control, flighty, alighting where it wishes — one does well to tame; the disciplined mind brings happiness.",
            estimatedReadSeconds: 36,
          },
        ],
      },
      {
        slug: "buddhism-tripitaka",
        name: "Tripitaka — Selected Suttas",
        originalName: "तिपिटक",
        description:
          "Selections from the Pali Canon — the 'Three Baskets' of monastic discipline, discourses, and higher teachings preserved by the early Buddhist community.",
        era: "~1st century BCE (compiled)",
        chapters: [
          {
            number: 1,
            title: "The Metta Sutta",
            summary: "On the cultivation of boundless loving-kindness.",
            passageEn:
              "Just as a mother would protect her only child with her life, even so let one cultivate a boundless love towards all beings. Let one's thoughts of boundless love pervade the whole world — above, below, and across — without any obstruction, without any hatred, without any enmity.",
            estimatedReadSeconds: 32,
          },
          {
            number: 2,
            title: "The Mangala Sutta",
            summary: "On the highest blessings that adorn a life.",
            passageEn:
              "Not to associate with the foolish, but to associate with the wise, and to honour those worthy of honour — this is the highest blessing. To support one's mother and father, to cherish one's family, and to be engaged in peaceful occupation — this is the highest blessing. Generosity, a righteous life, helping one's relatives, and blameless actions — this is the highest blessing.",
            estimatedReadSeconds: 36,
          },
          {
            number: 3,
            title: "The Kalama Sutta",
            summary: "On free inquiry and trusting one's own wise discernment.",
            passageEn:
              "Do not go upon what has been acquired by repeated hearing, nor upon tradition, nor upon rumour, nor upon what is in a scripture, nor upon surmise, nor upon an axiom, nor upon specious reasoning, nor upon a bias toward a notion pondered over, nor upon another's seeming ability, nor upon the consideration 'this monk is our teacher'. When you yourselves know: 'These things are good; these things are not blamable; these things are praised by the wise; undertaken and observed, these things lead to benefit and happiness,' enter on and abide in them.",
            estimatedReadSeconds: 48,
          },
        ],
      },
      {
        slug: "buddhism-heart-sutra",
        name: "Heart Sutra",
        originalName: "般若波羅蜜多心經",
        description:
          "A condensed Mahayana sutra distilling the perfection of wisdom — the insight that form and emptiness are not separate.",
        era: "~1st century CE",
        chapters: [
          {
            number: 1,
            title: "Form is Emptiness",
            summary: "On the inseparability of form and emptiness.",
            passageEn:
              "Avalokiteshvara, while practising deeply the perfection of wisdom, clearly saw that all five aggregates are empty and was thus freed from all suffering. Form is emptiness, and emptiness is form. Form does not differ from emptiness; emptiness does not differ from form.",
            estimatedReadSeconds: 30,
          },
          {
            number: 2,
            title: "The Mantra of Wisdom",
            summary: "The closing mantra of the perfection of wisdom.",
            passageEn:
              "Therefore, know that the perfection of wisdom is the great mantra, the unequalled mantra, the mantra that calms all suffering. It is true, not false. Gate, gate, paragate, parasamgate, bodhi svaha. Gone, gone, gone beyond, gone altogether beyond — awakening, hail.",
            estimatedReadSeconds: 28,
          },
        ],
      },
    ],
    quotes: [
      {
        quote:
          "Hatred does not cease through hatred at any time. Hatred ceases through love. This is an unalterable law.",
        attribution: "The Buddha, Dhammapada 1.5",
        theme: "Compassion",
      },
      {
        quote:
          "May all beings be happy. May all beings be free from suffering.",
        attribution: "Metta Sutta",
        theme: "Compassion",
      },
    ],
  },
  {
    slug: "christianity",
    name: "Christianity",
    shortDescription:
      "A faith centered on the life and teaching of Jesus of Nazareth.",
    longDescription:
      "Emerging in 1st-century Judea, Christianity teaches that God is revealed in Jesus Christ, and calls believers to love God and neighbour as themselves.",
    founded: "~30 CE",
    region: "Judea",
    accentColor: "#e8b85c",
    symbolName: "Cross",
    scriptures: [
      {
        slug: "christianity-sermon-on-the-mount",
        name: "Sermon on the Mount",
        originalName: "Ἐπὶ τοῦ ὄρους ὁμιλία",
        description:
          "Jesus' great teaching, recorded in Matthew chapters 5-7, on the inner life of the Kingdom of God.",
        era: "~30 CE",
        chapters: [
          {
            number: 1,
            title: "The Beatitudes",
            summary: "Blessings on the humble, the merciful, and the peacemakers.",
            passageEn:
              "Blessed are the poor in spirit, for theirs is the kingdom of heaven. Blessed are those who mourn, for they shall be comforted. Blessed are the meek, for they shall inherit the earth. Blessed are the merciful, for they shall obtain mercy. Blessed are the peacemakers, for they shall be called children of God.",
            estimatedReadSeconds: 38,
          },
          {
            number: 2,
            title: "Salt and Light",
            summary:
              "On the calling to flavour the world and let true goodness shine.",
            passageEn:
              "You are the salt of the earth; but if salt has lost its savour, with what shall it be salted? You are the light of the world. A city that is set on a hill cannot be hidden. Let your light so shine before others, that they may see your good works and glorify your Father.",
            estimatedReadSeconds: 32,
          },
          {
            number: 3,
            title: "The Lord's Prayer",
            summary:
              "The pattern of prayer Jesus taught his disciples.",
            passageEn:
              "Pray then in this way: Our Father in heaven, hallowed be your name. Your kingdom come, your will be done, on earth as it is in heaven. Give us this day our daily bread, and forgive us our debts as we also have forgiven our debtors. And lead us not into temptation, but deliver us from evil.",
            estimatedReadSeconds: 32,
          },
        ],
      },
      {
        slug: "christianity-psalms-of-comfort",
        name: "Psalms of Comfort",
        originalName: "תהילים",
        description:
          "Selected Psalms long cherished across the Christian tradition for their consolation and trust in God.",
        era: "~1000-500 BCE",
        chapters: [
          {
            number: 1,
            title: "Psalm 23 — The Lord Is My Shepherd",
            summary: "A song of trust in the shepherd who walks beside us.",
            passageEn:
              "The Lord is my shepherd; I shall not want. He makes me lie down in green pastures; he leads me beside still waters; he restores my soul. Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me; your rod and your staff, they comfort me.",
            estimatedReadSeconds: 34,
          },
          {
            number: 2,
            title: "Psalm 46 — A Refuge",
            summary: "On stillness and refuge in the midst of upheaval.",
            passageEn:
              "God is our refuge and strength, a very present help in trouble. Therefore we will not fear, though the earth gives way and the mountains fall into the heart of the sea. Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth.",
            estimatedReadSeconds: 30,
          },
        ],
      },
      {
        slug: "christianity-holy-bible",
        name: "Holy Bible — Selected Passages",
        originalName: "Biblia Sacra",
        description:
          "Beloved passages from the Christian Bible — Old and New Testaments — on love, faith, hope, and the kingdom of God.",
        era: "~1000 BCE – 100 CE",
        chapters: [
          {
            number: 1,
            title: "Genesis 1 — In the Beginning",
            summary:
              "The opening of the Hebrew Bible: the world called into being.",
            passageEn:
              "In the beginning God created the heavens and the earth. The earth was without form and void, and darkness was over the face of the deep. And the Spirit of God was hovering over the face of the waters. And God said, 'Let there be light,' and there was light. And God saw that the light was good.",
            estimatedReadSeconds: 32,
          },
          {
            number: 2,
            title: "1 Corinthians 13 — The Way of Love",
            summary:
              "Paul's hymn to love as the greatest of all spiritual gifts.",
            passageEn:
              "Though I speak with the tongues of men and of angels, but have not love, I am become as sounding brass or a clanging cymbal. Love is patient and kind; love does not envy or boast; it is not arrogant or rude. It does not insist on its own way; it bears all things, believes all things, hopes all things, endures all things. Love never ends.",
            estimatedReadSeconds: 38,
          },
          {
            number: 3,
            title: "John 14 — Let Not Your Heart Be Troubled",
            summary:
              "Jesus' farewell promise of the Father's house and lasting peace.",
            passageEn:
              "Let not your hearts be troubled. Believe in God; believe also in me. In my Father's house are many rooms; if it were not so, would I have told you that I go to prepare a place for you? Peace I leave with you; my peace I give to you. Not as the world gives do I give to you. Let not your hearts be troubled, neither let them be afraid.",
            estimatedReadSeconds: 34,
          },
        ],
      },
    ],
    quotes: [
      {
        quote:
          "Love your neighbour as yourself.",
        attribution: "Jesus of Nazareth (Mark 12:31)",
        theme: "Compassion",
      },
      {
        quote:
          "Blessed are the peacemakers, for they shall be called children of God.",
        attribution: "Jesus of Nazareth (Matthew 5:9)",
        theme: "Peace",
      },
    ],
  },
  {
    slug: "hinduism",
    name: "Hinduism",
    shortDescription:
      "An ancient family of Indian traditions oriented toward dharma, devotion, and self-realisation.",
    longDescription:
      "With roots reaching back more than three millennia, Hinduism encompasses a rich variety of philosophies and practices, united by themes of dharma, karma, and the search for the eternal Self.",
    founded: "~1500 BCE and earlier",
    region: "Indian subcontinent",
    accentColor: "#e3a447",
    symbolName: "Om",
    scriptures: [
      {
        slug: "hinduism-bhagavad-gita",
        name: "Bhagavad Gita",
        originalName: "भगवद्गीता",
        description:
          "A 700-verse dialogue between the warrior Arjuna and Krishna on duty, devotion, and the nature of the Self.",
        era: "~200 BCE",
        chapters: [
          {
            number: 1,
            title: "The Yoga of Action",
            summary:
              "On performing one's duty without attachment to its fruits.",
            passageEn:
              "You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions. Never consider yourself the cause of the results of your activities, and never be attached to not doing your duty. Perform your work in the spirit of devotion, abandoning attachment.",
            estimatedReadSeconds: 36,
          },
          {
            number: 2,
            title: "The Eternal Self",
            summary:
              "On the deathless Self that is neither born nor dies.",
            passageEn:
              "The Self is never born and never dies. It has not come into being, does not come into being, and will not come into being. It is unborn, eternal, ever-existing and primeval. It is not slain when the body is slain. As a person puts on new garments, the soul accepts new bodies.",
            estimatedReadSeconds: 35,
          },
          {
            number: 3,
            title: "The Path of Devotion",
            summary:
              "On loving service as the surest way to the Divine.",
            passageEn:
              "Whatever you do, whatever you eat, whatever you offer or give away, whatever austerities you perform — do that as an offering to Me. Fix your mind on Me, be devoted to Me, worship Me and bow down before Me, and you shall come to Me.",
            estimatedReadSeconds: 30,
          },
        ],
      },
      {
        slug: "hinduism-upanishads",
        name: "Selected Upanishads",
        originalName: "उपनिषद्",
        description:
          "Verses from the philosophical heart of the Vedas, exploring the unity of the Self and the Absolute.",
        era: "~800-500 BCE",
        chapters: [
          {
            number: 1,
            title: "Tat Tvam Asi — That Thou Art",
            summary:
              "The great saying of the Chandogya Upanishad on the unity of Self and Brahman.",
            passageEn:
              "That which is the subtle essence — in it all that exists has its self. It is the True. It is the Self. And that, O Shvetaketu, that art thou. As bees gather honey from many flowers and reduce it to one sweetness, so all these creatures, when they merge in the One, know not that they are merged.",
            estimatedReadSeconds: 34,
          },
          {
            number: 2,
            title: "Lead Me from Darkness",
            summary:
              "The luminous prayer of the Brihadaranyaka Upanishad.",
            passageEn:
              "From the unreal lead me to the real. From darkness lead me to light. From death lead me to immortality. Peace, peace, peace. May we be protected together. May we be nourished together. May we work together with great vigour. May our study be enlightening. May there be no animosity among us.",
            estimatedReadSeconds: 32,
          },
        ],
      },
      {
        slug: "hinduism-ramayana",
        name: "Ramayana — Selected Passages",
        originalName: "रामायणम्",
        description:
          "Selections from Valmiki's epic of Rama, Sita, and Hanuman — a beloved tale of dharma, devotion, and the triumph of righteousness.",
        era: "~500 BCE – 100 BCE",
        chapters: [
          {
            number: 1,
            title: "The Vow of Rama",
            summary:
              "Rama accepts exile to honour his father's word and the path of dharma.",
            passageEn:
              "Hearing of his father's promise, Rama bowed without grief and said, 'I shall go gladly to the forest, for nothing is dearer than the truth of a father's word. Kingdom and palace are passing things; dharma alone endures. Let Bharata rule in my place; for me the forest will be a sanctuary, and duty itself a crown.'",
            estimatedReadSeconds: 32,
          },
          {
            number: 2,
            title: "Sita in the Ashoka Grove",
            summary:
              "Captive in Lanka, Sita keeps her heart fixed on Rama and on truth.",
            passageEn:
              "Beneath the Ashoka tree Sita sat, slender as a flame the wind has bent but cannot extinguish. Though demons surrounded her with threats and dazzling promises, her thought never wavered from Rama. 'Truth,' she said softly, 'is a stronger fortress than any city of gold, and love that rests in dharma cannot be conquered.'",
            estimatedReadSeconds: 32,
          },
          {
            number: 3,
            title: "Hanuman's Leap",
            summary:
              "Hanuman remembers his strength and bounds across the sea in service of Rama.",
            passageEn:
              "Standing upon the mountain, Hanuman recalled at last the gifts that had slept within him. With Rama's name upon his lips he gathered himself, and the earth bent beneath his feet as he sprang. Like a mountain set free, like a thought made wings, he crossed the ocean — for there is no distance the heart cannot travel when it serves what it loves.",
            estimatedReadSeconds: 34,
          },
        ],
      },
    ],
    quotes: [
      {
        quote:
          "The Self is the friend of the self, and likewise the enemy of the self.",
        attribution: "Bhagavad Gita 6.5",
        theme: "Wisdom",
      },
      {
        quote:
          "Truth is one; the wise call it by many names.",
        attribution: "Rig Veda 1.164.46",
        theme: "Unity",
      },
    ],
  },
  {
    slug: "islam",
    name: "Islam",
    shortDescription:
      "Submission to the One God revealed through the Prophet Muhammad in the Qur'an.",
    longDescription:
      "Founded in 7th-century Arabia, Islam centres on the oneness of God (tawhid) and the prophetic revelations preserved in the Qur'an, with mercy and justice at the heart of its ethics.",
    founded: "610 CE",
    region: "Arabia",
    accentColor: "#dba84a",
    symbolName: "Crescent and Star",
    scriptures: [
      {
        slug: "islam-quran-selections",
        name: "Selections from the Qur'an",
        originalName: "القرآن الكريم",
        description:
          "Beloved passages from the holy Qur'an, the speech of God revealed in Arabic to the Prophet Muhammad.",
        era: "610-632 CE",
        chapters: [
          {
            number: 1,
            title: "Al-Fatiha — The Opening",
            summary:
              "The opening chapter, recited in every prayer.",
            passageEn:
              "In the name of God, the Most Compassionate, the Most Merciful. All praise is for God, Lord of all worlds, the Most Compassionate, the Most Merciful, Master of the Day of Judgement. You alone we worship; You alone we ask for help. Guide us along the straight path, the path of those You have blessed.",
            estimatedReadSeconds: 30,
          },
          {
            number: 2,
            title: "Ayat al-Kursi — The Throne Verse",
            summary:
              "A celebrated verse on the majesty and sustaining power of God.",
            passageEn:
              "God — there is no deity except Him, the Ever-Living, the Sustainer of all existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and on the earth. His knowledge encompasses all things. His throne extends over the heavens and the earth, and their preservation tires Him not.",
            estimatedReadSeconds: 34,
          },
          {
            number: 3,
            title: "Surah Al-Ikhlas — Sincerity",
            summary:
              "A short chapter affirming the absolute oneness of God.",
            passageEn:
              "Say: He is God, the One. God, the Eternal, the Absolute, upon whom all depend. He neither begets nor was He begotten, and there is none comparable to Him. In the name of God, the Most Compassionate, the Most Merciful — for to Him is all praise and glory in the heavens and on the earth.",
            estimatedReadSeconds: 28,
          },
        ],
      },
      {
        slug: "islam-hadith-of-mercy",
        name: "Hadith of Mercy",
        originalName: "أحاديث الرحمة",
        description:
          "A small collection of authenticated sayings of the Prophet Muhammad on mercy and good character.",
        era: "~7th century CE",
        chapters: [
          {
            number: 1,
            title: "On Loving for Others",
            summary:
              "The hadith on the completion of faith through love of one's neighbour.",
            passageEn:
              "The Messenger of God, peace be upon him, said: None of you truly believes until he loves for his brother what he loves for himself. The merciful are shown mercy by the All-Merciful. Show mercy to those on earth, and the One in the heavens will show mercy to you.",
            estimatedReadSeconds: 28,
          },
          {
            number: 2,
            title: "On Good Character",
            summary:
              "Sayings on gentleness, patience, and beautiful conduct.",
            passageEn:
              "The Prophet, peace be upon him, said: The most beloved of people to God are those who are most beneficial to people. The best of you are those who are best in character. Smiling in the face of your brother is charity. Whoever does not show mercy will not be shown mercy.",
            estimatedReadSeconds: 28,
          },
        ],
      },
    ],
    quotes: [
      {
        quote:
          "Whoever saves one life, it is as if he had saved all of humanity.",
        attribution: "Qur'an 5:32",
        theme: "Compassion",
      },
      {
        quote:
          "There shall be no compulsion in religion.",
        attribution: "Qur'an 2:256",
        theme: "Freedom",
      },
    ],
  },
  {
    slug: "jainism",
    name: "Jainism",
    shortDescription:
      "An ancient Indian path of nonviolence, truth, and spiritual liberation.",
    longDescription:
      "Crystallised by Mahavira in the 6th century BCE, Jainism teaches absolute nonviolence (ahimsa), many-sided truth (anekantavada), and the liberation of the soul through ethical and ascetic discipline.",
    founded: "~600 BCE",
    region: "Indian subcontinent",
    accentColor: "#dca85a",
    symbolName: "Ahimsa Hand",
    scriptures: [
      {
        slug: "jainism-tattvartha-sutra",
        name: "Tattvartha Sutra",
        originalName: "तत्त्वार्थ सूत्र",
        description:
          "The most authoritative philosophical text in Jainism, accepted by all traditions of Jains.",
        era: "~2nd century CE",
        chapters: [
          {
            number: 1,
            title: "The Path to Liberation",
            summary: "The opening sutra: right faith, knowledge, and conduct.",
            passageEn:
              "Right faith, right knowledge, and right conduct together constitute the path to liberation. Faith in things ascertained as they are, true knowledge of those things, and conduct in accordance with that knowledge — these three jewels, when held together, lead the soul out of bondage to its true nature.",
            estimatedReadSeconds: 30,
          },
          {
            number: 2,
            title: "The Function of Souls",
            summary: "On the mutual help of all living beings.",
            passageEn:
              "Souls render service to one another. The function of souls is to help one another. All life is bound together by mutual support and interdependence. To protect another's life is to protect one's own; to harm another's life is to harm one's own. By this knowledge the wise practise nonviolence.",
            estimatedReadSeconds: 28,
          },
          {
            number: 3,
            title: "Conquest of Self",
            summary: "On the inward conquest as the highest victory.",
            passageEn:
              "One who conquers their own self is greater than one who conquers a thousand thousand enemies on the battlefield. The hardest battle is the battle with oneself. Subdue anger by forgiveness, pride by humility, deceit by straightforwardness, and greed by contentment — this is the discipline of the wise.",
            estimatedReadSeconds: 30,
          },
        ],
      },
      {
        slug: "jainism-acaranga-sutra",
        name: "Acaranga Sutra",
        originalName: "आचारांग सूत्र",
        description:
          "The oldest of the Jain canonical texts, on the conduct and discipline of the ascetic life.",
        era: "~4th century BCE",
        chapters: [
          {
            number: 1,
            title: "All Beings Desire Life",
            summary:
              "On the kinship of all beings as the ground of nonviolence.",
            passageEn:
              "All beings are fond of themselves; they like pleasure and hate pain; they shun destruction and cling to life. To all things life is dear. As we feel about ourselves, so should we feel about others. Therefore, neither harm nor cause harm to any living being. This is the eternal, pure, and unchanging law.",
            estimatedReadSeconds: 30,
          },
          {
            number: 2,
            title: "On Many-Sided Truth",
            summary:
              "On the humility of viewpoint that anekantavada teaches.",
            passageEn:
              "There are many sides to every truth. The wise consider every standpoint. To insist on one view alone is the way of conflict; to honour many is the way of understanding. Comprehend therefore that the truth is not the property of any single mind, and walk in humility with all who seek it.",
            estimatedReadSeconds: 28,
          },
        ],
      },
    ],
    quotes: [
      {
        quote: "Nonviolence is the highest religion.",
        attribution: "Jain teaching",
        theme: "Compassion",
      },
      {
        quote: "Live and let live.",
        attribution: "Jain ethical principle",
        theme: "Harmony",
      },
    ],
  },
  {
    slug: "judaism",
    name: "Judaism",
    shortDescription:
      "The covenant faith of the Jewish people, rooted in Torah and the Hebrew prophets.",
    longDescription:
      "With ancestral roots in the patriarchs and matriarchs of Israel, Judaism is a path of covenant, study, and ethical action, oriented toward the One God of all creation.",
    founded: "~1300 BCE and earlier",
    region: "Ancient Near East",
    accentColor: "#d6a655",
    symbolName: "Star of David",
    scriptures: [
      {
        slug: "judaism-torah-selections",
        name: "Selections from the Torah",
        originalName: "תּוֹרָה",
        description:
          "Cherished passages from the Five Books of Moses, foundational to Jewish life and law.",
        era: "Compiled ~6th century BCE",
        chapters: [
          {
            number: 1,
            title: "The Shema",
            summary: "The central declaration of Jewish faith.",
            passageEn:
              "Hear, O Israel: The Lord our God, the Lord is One. You shall love the Lord your God with all your heart, with all your soul, and with all your might. These words which I command you today shall be on your heart. You shall teach them diligently to your children, and shall speak of them.",
            estimatedReadSeconds: 30,
          },
          {
            number: 2,
            title: "Love Your Neighbour",
            summary:
              "From Leviticus on the love of neighbour and stranger.",
            passageEn:
              "You shall not hate your kin in your heart. You shall reprove your neighbour, but incur no guilt because of them. You shall not take vengeance or bear a grudge. You shall love your neighbour as yourself; I am the Lord. The stranger who lives among you shall be to you as the citizen, and you shall love them as yourself.",
            estimatedReadSeconds: 32,
          },
          {
            number: 3,
            title: "What the Lord Requires",
            summary:
              "The prophet Micah's distillation of the moral life.",
            passageEn:
              "He has told you, O mortal, what is good; and what does the Lord require of you but to do justice, and to love kindness, and to walk humbly with your God? With what shall I come before the Lord? Will the Lord be pleased with thousands of rams, with ten thousands of rivers of oil?",
            estimatedReadSeconds: 30,
          },
        ],
      },
      {
        slug: "judaism-pirkei-avot",
        name: "Pirkei Avot",
        originalName: "פִּרְקֵי אָבוֹת",
        description:
          "Ethical sayings of the rabbis, preserved in the Mishnah.",
        era: "~200 CE",
        chapters: [
          {
            number: 1,
            title: "The World Stands on Three Things",
            summary: "On the threefold pillars of the world.",
            passageEn:
              "Shimon the Righteous used to say: On three things the world stands — on the Torah, on the Temple service, and on acts of loving-kindness. Hillel said: Be of the disciples of Aaron, loving peace and pursuing peace, loving your fellow creatures, and drawing them near to the Torah.",
            estimatedReadSeconds: 28,
          },
          {
            number: 2,
            title: "If Not Now, When?",
            summary: "Hillel's call to ethical urgency.",
            passageEn:
              "Hillel used to say: If I am not for myself, who will be for me? But if I am only for myself, what am I? And if not now, when? In a place where there are no worthy people, strive to be worthy yourself. The day is short, the work is great, and the Master of the house is insistent.",
            estimatedReadSeconds: 28,
          },
        ],
      },
    ],
    quotes: [
      {
        quote:
          "Whoever saves a single life, it is as if he had saved an entire world.",
        attribution: "Mishnah Sanhedrin 4:5",
        theme: "Compassion",
      },
      {
        quote:
          "Do justice, love kindness, and walk humbly with your God.",
        attribution: "Micah 6:8",
        theme: "Justice",
      },
    ],
  },
  {
    slug: "sikhism",
    name: "Sikhism",
    shortDescription:
      "A devotional path founded in 15th-century Punjab on the oneness of God and humanity.",
    longDescription:
      "Founded by Guru Nanak in the Punjab, Sikhism teaches devotion to the One Creator, equality of all people, honest work, and selfless service.",
    founded: "1469 CE",
    region: "Punjab",
    accentColor: "#dfa253",
    symbolName: "Khanda",
    scriptures: [
      {
        slug: "sikhism-guru-granth-sahib",
        name: "Selections from Sri Guru Granth Sahib",
        originalName: "ਸ੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ",
        description:
          "The eternal Guru of the Sikhs — a vast collection of devotional hymns.",
        era: "Compiled 1604 CE",
        chapters: [
          {
            number: 1,
            title: "Mool Mantar",
            summary: "The opening invocation by Guru Nanak.",
            passageEn:
              "There is one God. Eternal Truth is His Name. The Creator of all things, fearless and without enmity, timeless and unborn, self-existent — known by the Guru's grace. Reflect on the True One in the beginning, the True One throughout the ages, the True One now, and ever shall the True One be.",
            estimatedReadSeconds: 30,
          },
          {
            number: 2,
            title: "Japji Sahib — Opening",
            summary:
              "From the morning prayer composed by Guru Nanak.",
            passageEn:
              "By thinking, He cannot be reduced to thought, even by thinking hundreds of thousands of times. By remaining silent, inner silence is not obtained, even by remaining lovingly absorbed deep within. The hunger of the hungry is not appeased even by piling up loads of worldly goods. Truth is highest of all; but higher still is truthful living.",
            estimatedReadSeconds: 32,
          },
          {
            number: 3,
            title: "All Beings Are Equal",
            summary:
              "On the equality of all human beings before the One.",
            passageEn:
              "Recognise the human race as one. The same Lord is the Creator and Nourisher of all; recognise no distinctions among them. The monastery and the mosque are the same; the Hindu worship and the Muslim prayer are the same; all human beings are the same; it is through error that they appear different.",
            estimatedReadSeconds: 30,
          },
        ],
      },
      {
        slug: "sikhism-anand-sahib",
        name: "Anand Sahib",
        originalName: "ਅਨੰਦੁ ਸਾਹਿਬ",
        description:
          "The Song of Bliss composed by Guru Amar Das, on the joy of union with the Divine.",
        era: "~1574 CE",
        chapters: [
          {
            number: 1,
            title: "I Have Found Bliss",
            summary: "The opening verses on the bliss of meeting the Guru.",
            passageEn:
              "I am in bliss, O my mother, for I have found my True Guru. I have found the True Guru with intuitive ease, and my mind vibrates with the music of bliss. The jewelled melodies and their related celestial harmonies have come to sing the Word of the Shabad. The Lord dwells within the minds of those who sing it.",
            estimatedReadSeconds: 30,
          },
          {
            number: 2,
            title: "Listen to the True Bani",
            summary: "On the transforming power of the True Word.",
            passageEn:
              "Listen, my friends, listen to the True Bani — the True Word. It cleanses the mind, soothes the soul, and brings the wandering self home. Speak it lovingly; live it humbly; share it freely. Where the Word is honoured, all hearts are at peace, and the Beloved is found within.",
            estimatedReadSeconds: 28,
          },
        ],
      },
    ],
    quotes: [
      {
        quote: "Recognise the whole human race as one.",
        attribution: "Guru Gobind Singh",
        theme: "Unity",
      },
      {
        quote: "Truth is high, but higher still is truthful living.",
        attribution: "Guru Nanak, Japji Sahib",
        theme: "Truth",
      },
    ],
  },
  {
    slug: "zoroastrianism",
    name: "Zoroastrianism",
    shortDescription:
      "An ancient Persian faith of the Wise Lord, light, and the choice between good and evil.",
    longDescription:
      "One of the oldest continuously practised religions, founded by the prophet Zarathushtra in ancient Persia, Zoroastrianism teaches the cosmic struggle of light and darkness and the moral responsibility of every soul.",
    founded: "~1500-1000 BCE",
    region: "Ancient Persia",
    accentColor: "#deb15c",
    symbolName: "Faravahar",
    scriptures: [
      {
        slug: "zoroastrianism-gathas",
        name: "The Gathas",
        originalName: "𐬔𐬁𐬚𐬁",
        description:
          "Seventeen hymns traditionally attributed to the prophet Zarathushtra himself, the heart of the Avesta.",
        era: "~1200 BCE",
        chapters: [
          {
            number: 1,
            title: "The Choice",
            summary:
              "On the primal moral choice between truth and falsehood.",
            passageEn:
              "Now I shall speak of the two primal spirits, of whom the more bountiful spoke thus to the harmful one: Neither our thoughts, nor our teachings, nor our wills, nor our choices, nor our words, nor our deeds, nor our consciences, nor yet our souls agree. Each chooses; the wise choose rightly, the unwise choose ill.",
            estimatedReadSeconds: 32,
          },
          {
            number: 2,
            title: "Good Thoughts, Good Words, Good Deeds",
            summary:
              "The threefold ethical path of the Wise Lord.",
            passageEn:
              "He who walks in good thoughts, good words, and good deeds is a friend of Ahura Mazda, the Wise Lord. Truth is best of all that is good. As one wills, so shall one find. Through righteousness comes light; through deceit comes darkness. Choose well, that the world may flourish.",
            estimatedReadSeconds: 28,
          },
          {
            number: 3,
            title: "A Prayer for Wisdom",
            summary:
              "Zarathushtra's prayer for understanding.",
            passageEn:
              "I ask You, O Wise Lord, tell me truly: Who upholds the earth below and the sky above so that they do not fall? Who created the waters and the plants? Who yoked swiftness to the winds and the clouds? Through the Holy Spirit teach me, O Wise Lord, the path of righteousness, that I may walk it with joy.",
            estimatedReadSeconds: 32,
          },
        ],
      },
      {
        slug: "zoroastrianism-yasna-prayers",
        name: "Yasna Prayers",
        originalName: "𐬫𐬀𐬯𐬥𐬀",
        description:
          "Beloved prayers from the Yasna, recited in daily devotion.",
        era: "~1000-500 BCE",
        chapters: [
          {
            number: 1,
            title: "Ashem Vohu",
            summary: "The brief, beloved prayer in praise of righteousness.",
            passageEn:
              "Righteousness is the best good. It is happiness. Happiness is to the one who is righteous for the sake of the highest righteousness. Truth is its own reward, and the path of truth is the path of light. Walk in it, and you shall walk with the Wise Lord through all ages.",
            estimatedReadSeconds: 22,
          },
          {
            number: 2,
            title: "Yenghe Hatam",
            summary: "A prayer of praise for all who do good.",
            passageEn:
              "We worship those whose worship Ahura Mazda — the Wise Lord — knows to be best for righteousness. We worship the women and the men whom He knows to be best. May our thoughts be united with theirs, our words with theirs, and our deeds with theirs, in the service of life.",
            estimatedReadSeconds: 26,
          },
        ],
      },
    ],
    quotes: [
      {
        quote: "Good thoughts, good words, good deeds.",
        attribution: "Zarathushtra",
        theme: "Wisdom",
      },
      {
        quote:
          "Happiness is to the one who is righteous for the sake of righteousness itself.",
        attribution: "Ashem Vohu",
        theme: "Joy",
      },
    ],
  },
];

async function main() {
  console.log("Seeding NoorJyoti catalog…");
  // Clear in dependency order
  await db.delete(unityQuotesTable);
  await db.delete(chaptersTable);
  await db.delete(scripturesTable);
  await db.delete(traditionsTable);

  let scriptureSortOrder = 0;
  for (let ti = 0; ti < TRADITIONS.length; ti++) {
    const t = TRADITIONS[ti]!;
    const insertedTradition = await db
      .insert(traditionsTable)
      .values({
        slug: t.slug,
        name: t.name,
        shortDescription: t.shortDescription,
        longDescription: t.longDescription,
        founded: t.founded,
        region: t.region,
        accentColor: t.accentColor,
        symbolName: t.symbolName,
        sortOrder: ti,
      })
      .returning();
    const tradition = insertedTradition[0]!;

    for (let si = 0; si < t.scriptures.length; si++) {
      const s = t.scriptures[si]!;
      const insertedScripture = await db
        .insert(scripturesTable)
        .values({
          traditionId: tradition.id,
          slug: s.slug,
          name: s.name,
          originalName: s.originalName,
          description: s.description,
          era: s.era,
          sortOrder: scriptureSortOrder++,
        })
        .returning();
      const scripture = insertedScripture[0]!;

      for (let ci = 0; ci < s.chapters.length; ci++) {
        const c = s.chapters[ci]!;
        await db.insert(chaptersTable).values({
          scriptureId: scripture.id,
          number: c.number,
          title: c.title,
          summary: c.summary,
          passageEn: c.passageEn,
          estimatedReadSeconds: c.estimatedReadSeconds,
          sortOrder: ci,
        });
      }
    }

    for (const q of t.quotes) {
      await db.insert(unityQuotesTable).values({
        traditionId: tradition.id,
        quote: q.quote,
        attribution: q.attribution,
        theme: q.theme,
      });
    }
    console.log(`  ✓ ${t.name}`);
  }

  console.log("Done.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

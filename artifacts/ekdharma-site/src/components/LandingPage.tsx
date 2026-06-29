import React, { useEffect, useState } from "react";
import { Starfield } from "./Starfield";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { motion } from "framer-motion";
import type { Locale, TranslationDict } from "@/i18n";

interface Props {
  locale: Locale;
  t: TranslationDict;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

const scriptures = [
  { name: "Bhagavad Gita", chapters: "18 chapters", essence: "the eternal song of the soul", origin: "Hindu" },
  { name: "Ramayana", chapters: "7 Kands", essence: "the epic journey of Dharma", origin: "Hindu" },
  { name: "Holy Bible", chapters: "66 books", essence: "the foundation of Christian faith", origin: "Christian" },
  { name: "Quran", chapters: "114 Surahs", essence: "the divine revelation of Islam", origin: "Islamic" },
  { name: "Guru Granth Sahib", chapters: "1430 Angs", essence: "the eternal Sikh scripture", origin: "Sikh" },
  { name: "Torah", chapters: "5 books", essence: "the covenant of the Jewish people", origin: "Jewish" },
  { name: "Tripitaka", chapters: "3 Pitakas", essence: "the teachings of the Buddha", origin: "Buddhist" },
];

const voices = [
  { name: "Priya", type: "Female", desc: "Warm & soothing" },
  { name: "Devi", type: "Female", desc: "Crystal Clear" },
  { name: "Anaya", type: "Female", desc: "Expressive & lyrical" },
  { name: "Arjun", type: "Male", desc: "Deep & Calm" },
  { name: "Dev", type: "Male", desc: "Clear & Steady" },
  { name: "Rohan", type: "Male", desc: "Warm & Gentle" },
];

const languages = ["Hindi", "Punjabi", "Gujarati", "Telugu", "Malayalam", "Tamil", "Marathi", "Bengali", "English"];

const features = [
  { title: "Studio-quality HD AI recitation", desc: "Immerse yourself in crystal clear audio, beautifully paced for devotion." },
  { title: "Chapter-by-chapter navigation", desc: "Easily navigate through verses and chapters with seamless progress tracking." },
  { title: "Offline downloads", desc: "Download your favorite scriptures and listen anywhere, anytime, without an internet connection." },
  { title: "Bookmarks & favorites", desc: "Save meaningful verses across all scriptures to return to your moments of peace." },
];

function HeroOrnament() {
  return (
    <div className="relative w-64 h-64 mx-auto mb-12" aria-hidden="true">
      <div className="absolute inset-[-40px] rounded-full border border-[#C9933A]/10 animate-pulse-glow" style={{ animationDelay: '1s' }} />
      <div className="absolute inset-[-20px] rounded-full border border-[#C9933A]/20 animate-pulse-glow" />
      <svg viewBox="0 0 200 200" fill="none" focusable="false" role="presentation" className="w-full h-full text-[#E8A840] animate-float">
        <circle cx="100" cy="100" r="98" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
        <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="0.5" opacity="0.5" strokeDasharray="4 4" />
        <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="1" opacity="0.8" />
        <circle cx="100" cy="100" r="40" fill="#131629" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="20" fill="#C9933A" />
        <circle cx="100" cy="100" r="8" fill="#F5D06A" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <line key={i} x1="100" y1="60" x2="100" y2="20" stroke="currentColor" strokeWidth="1" opacity="0.6" transform={`rotate(${angle} 100 100)`} />
        ))}
      </svg>
    </div>
  );
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function LandingPage({ locale, t }: Props) {
  const reduceMotion = usePrefersReducedMotion();
  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
  const innerAppHref = `${base}/../ekdharma`.replace(/\/+$/, "") || "/ekdharma";
  // Locale-aware home: /ekdharma-site/ for English, /ekdharma-site/zh/ for zh, etc.
  const homeHref = locale === "en" ? `${base}/` : `${base}/${locale}/`;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative selection:bg-[#C9933A]/30 selection:text-white">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-md focus:bg-[#C9933A] focus:text-[#131629] focus:font-semibold">
        {t.nav.skipToContent}
      </a>
      <Starfield />

      <nav aria-label={t.nav.primaryAriaLabel} className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 h-20 flex items-center justify-between bg-[#080C1A]/80 backdrop-blur-md border-b border-[#C9933A]/20">
        <a href={homeHref} className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5D06A] rounded-md">
          <div aria-hidden="true" className="w-10 h-10 rounded-lg bg-[#C9933A] flex items-center justify-center text-[#131629]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" focusable="false">
              <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />
            </svg>
          </div>
          <span className="font-display font-bold text-xl tracking-widest text-[#F5D06A]">{t.brand.wordmark}</span>
        </a>
        <div className="hidden md:flex items-center gap-6">
          <a href="#scriptures" className="text-sm font-medium text-foreground/70 hover:text-[#F5D06A] transition-colors rounded-md px-1 py-1">{t.nav.scriptures}</a>
          <a href="#voices" className="text-sm font-medium text-foreground/70 hover:text-[#F5D06A] transition-colors rounded-md px-1 py-1">{t.nav.voices}</a>
          <a href="#features" className="text-sm font-medium text-foreground/70 hover:text-[#F5D06A] transition-colors rounded-md px-1 py-1">{t.nav.features}</a>
          <a href="#pricing" className="text-sm font-medium text-foreground/70 hover:text-[#F5D06A] transition-colors rounded-md px-1 py-1">{t.nav.pricing}</a>
          <LocaleSwitcher currentLocale={locale} label={t.localeSwitcher.label} />
          <a href={innerAppHref} className="px-6 py-2.5 rounded-full bg-[#C9933A] hover:bg-[#F5D06A] text-[#131629] text-sm font-semibold tracking-wide transition-all hover:scale-105">
            {t.nav.openApp}
          </a>
        </div>
        <div className="md:hidden flex items-center gap-2">
          <LocaleSwitcher currentLocale={locale} label={t.localeSwitcher.label} />
          <a href={innerAppHref} className="px-4 py-2 rounded-full bg-[#C9933A] hover:bg-[#F5D06A] text-[#131629] text-sm font-semibold tracking-wide transition-colors" aria-label={t.nav.openAriaLabel}>
            {t.nav.openShort}
          </a>
        </div>
      </nav>

      <main id="main">
        <section className="relative pt-40 pb-24 px-6 min-h-screen flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0D1025]/50 to-background pointer-events-none" />
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="relative z-10 w-full max-w-4xl mx-auto text-center flex flex-col items-center">
            <HeroOrnament />
            <motion.div variants={fadeIn} className="inline-block px-4 py-1.5 rounded-full border border-[#C9933A]/30 bg-[#C9933A]/10 text-[#E8A840] text-xs uppercase tracking-[0.3em] font-medium mb-8">
              {t.brand.tagline}
            </motion.div>
            <motion.h1 variants={fadeIn} className="font-display font-bold text-5xl md:text-7xl lg:text-8xl leading-tight mb-8 text-gradient-gold drop-shadow-2xl">
              {t.hero.title1}<br/>{t.hero.title2}
            </motion.h1>
            <motion.p variants={fadeIn} className="font-serif italic text-xl md:text-2xl text-foreground/80 leading-relaxed max-w-3xl mb-12">
              {t.hero.description}
            </motion.p>
            <motion.div variants={fadeIn} className="flex flex-wrap justify-center gap-3 mb-16 max-w-2xl">
              {languages.map(lang => (
                <span key={lang} className="px-4 py-1.5 rounded-full border border-[#C9933A]/20 bg-[#C9933A]/5 text-sm font-serif text-foreground/90">{lang}</span>
              ))}
            </motion.div>
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center gap-6">
              <a href={innerAppHref} className="px-10 py-4 rounded-full bg-[#C9933A] hover:bg-[#F5D06A] text-[#131629] font-display font-bold tracking-wider text-base transition-all hover:-translate-y-1 shadow-[0_0_40px_rgba(201,147,58,0.3)]">
                {t.hero.openApp}
              </a>
              <a href={innerAppHref} className="px-10 py-4 rounded-full border border-[#C9933A]/40 bg-[#C9933A]/5 hover:bg-[#C9933A]/10 hover:border-[#C9933A]/60 font-display text-[#E8A840] tracking-wider text-base transition-all">
                {t.hero.listenSample}
              </a>
            </motion.div>
          </motion.div>
        </section>

        <div aria-hidden="true" className="w-full border-y border-[#C9933A]/20 bg-[#C9933A]/5 py-4 overflow-hidden flex whitespace-nowrap">
          <motion.div className="flex gap-16 items-center px-8" animate={reduceMotion ? undefined : { x: [0, -1000] }} transition={reduceMotion ? undefined : { repeat: Infinity, duration: 30, ease: "linear" }}>
            {Array(4).fill(0).map((_, i) => (
              <React.Fragment key={i}>
                <span className="font-serif italic text-lg text-foreground/70 flex items-center gap-4">
                  <div aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-[#C9933A]" />
                  "{t.unityStrip.quote1}"
                </span>
                <span className="font-serif italic text-lg text-foreground/70 flex items-center gap-4">
                  <div aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-[#C9933A]" />
                  "{t.unityStrip.quote2}"
                </span>
              </React.Fragment>
            ))}
          </motion.div>
        </div>

        <section id="scriptures" className="py-32 px-6 max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="text-center mb-20">
            <h2 className="font-display font-bold text-4xl md:text-5xl text-[#F5D06A] mb-6">{t.scriptures.sectionTitle}</h2>
            <p className="font-serif italic text-xl text-foreground/70 max-w-2xl mx-auto">{t.scriptures.sectionDescription}</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scriptures.map((sc, i) => (
              <motion.a href={innerAppHref} key={sc.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="group block bg-[#131629] border border-[#C9933A]/10 rounded-2xl p-8 hover:bg-[#C9933A]/5 hover:border-[#C9933A]/40 transition-all duration-300 hover:-translate-y-2 relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 rounded-xl bg-[#C9933A]/10 border border-[#C9933A]/20">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E8A840" strokeWidth="1.5">
                      <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-xs uppercase tracking-widest font-medium text-[#C9933A] px-3 py-1 bg-[#C9933A]/10 rounded-full">{sc.origin}</span>
                </div>
                <h3 className="font-display font-semibold text-2xl text-[#F5D06A] mb-2">{sc.name}</h3>
                <p className="text-sm text-foreground/50 mb-6 font-medium">{sc.chapters}</p>
                <p className="font-serif italic text-foreground/80 leading-relaxed text-lg">"{sc.essence}"</p>
              </motion.a>
            ))}
          </div>
        </section>

        <section className="py-32 px-6 bg-gradient-to-b from-transparent via-[#0D1025] to-transparent">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20">
            <div id="voices">
              <h2 className="font-display font-bold text-3xl text-[#F5D06A] mb-4">{t.voices.sectionTitle}</h2>
              <p className="font-serif italic text-lg text-foreground/70 mb-10">{t.voices.sectionDescription}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {voices.map((voice) => (
                  <div key={voice.name} className="flex items-center gap-4 p-4 rounded-xl border border-[#C9933A]/10 bg-[#131629] hover:border-[#C9933A]/30 transition-colors">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-lg ${voice.type === 'Female' ? 'bg-[#D4537E]/10 text-[#D4537E] border border-[#D4537E]/30' : 'bg-[#378ADD]/10 text-[#378ADD] border border-[#378ADD]/30'}`}>
                      {voice.name[0]}
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-[#E8A840]">{voice.name}</h4>
                      <p className="text-xs text-foreground/60">{voice.type} · {voice.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div id="features">
              <h2 className="font-display font-bold text-3xl text-[#F5D06A] mb-4">{t.features.sectionTitle}</h2>
              <p className="font-serif italic text-lg text-foreground/70 mb-10">{t.features.sectionDescription}</p>
              <div className="space-y-6">
                {features.slice(0,4).map((feat) => (
                  <div key={feat.title} className="flex gap-4">
                    <div className="mt-1 w-6 h-6 rounded-full bg-[#C9933A]/20 flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-[#E8A840]" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">{feat.title}</h4>
                      <p className="text-sm text-foreground/60 leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="py-32 px-6 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-4xl text-[#F5D06A] mb-6">{t.pricing.sectionTitle}</h2>
            <p className="font-serif italic text-xl text-foreground/70">{t.pricing.sectionDescription}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="bg-[#131629] border border-[#C9933A]/20 rounded-3xl p-10">
              <h3 className="font-display font-bold text-2xl text-foreground mb-2">{t.pricing.free.name}</h3>
              <p className="text-foreground/60 mb-8">{t.pricing.free.forWhom}</p>
              <div className="text-4xl font-bold mb-8">$0<span className="text-lg font-normal text-foreground/50">{t.pricing.free.perMonth}</span></div>
              <ul className="space-y-4 mb-10">
                {t.pricing.free.items.map(item => (
                  <li key={item} className="flex items-center gap-3 text-foreground/80">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9933A" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <a href={innerAppHref} className="block w-full py-4 text-center rounded-full border border-[#C9933A]/40 text-[#E8A840] font-display tracking-wider hover:bg-[#C9933A]/10 transition-colors">{t.pricing.free.cta}</a>
            </div>
            <div className="bg-gradient-to-b from-[#131629] to-[#0D1025] border border-[#C9933A] rounded-3xl p-10 relative shadow-[0_0_50px_rgba(201,147,58,0.15)] transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#C9933A] text-[#131629] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
                {t.pricing.premium.badge}
              </div>
              <h3 className="font-display font-bold text-2xl text-[#F5D06A] mb-2">{t.pricing.premium.name}</h3>
              <p className="text-foreground/60 mb-8">{t.pricing.premium.forWhom}</p>
              <div className="text-4xl font-bold text-[#F5D06A] mb-8">$3.99<span className="text-lg font-normal text-foreground/50">{t.pricing.premium.perMonth}</span></div>
              <ul className="space-y-4 mb-10">
                {t.pricing.premium.items.map(item => (
                  <li key={item} className="flex items-center gap-3 text-foreground/90">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F5D06A" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <a href={innerAppHref} className="block w-full py-4 text-center rounded-full bg-[#C9933A] text-[#131629] font-display font-bold tracking-wider hover:bg-[#F5D06A] transition-colors shadow-lg shadow-[#C9933A]/20">{t.pricing.premium.cta}</a>
            </div>
          </div>
        </section>

        <section id="cta" className="py-32 px-6 text-center border-t border-[#C9933A]/10 bg-gradient-to-t from-[#131629]/50 to-transparent">
          <div className="max-w-2xl mx-auto">
            <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24 mx-auto mb-10 text-[#C9933A] opacity-60 animate-pulse-glow" aria-hidden="true" focusable="false">
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4"/>
              <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="2"/>
              <circle cx="50" cy="50" r="5" fill="#F5D06A"/>
            </svg>
            <h2 className="font-display font-bold text-4xl md:text-5xl text-[#F5D06A] mb-8 leading-tight">{t.cta.title}</h2>
            <p className="font-serif italic text-2xl text-foreground/80 mb-12">{t.cta.subtitle}</p>
            <a href={innerAppHref} className="inline-block px-12 py-5 rounded-full bg-gradient-to-r from-[#C9933A] to-[#E8A840] hover:from-[#E8A840] hover:to-[#F5D06A] text-[#131629] font-display font-bold tracking-widest text-lg transition-all hover:scale-105 shadow-[0_0_40px_rgba(201,147,58,0.4)]">
              {t.cta.button}
            </a>
            <div className="mt-24 pt-10 border-t border-[#C9933A]/10">
              <p className="font-display text-2xl text-[#E8A840] tracking-[0.2em] mb-4">{t.brand.blessingScript}</p>
              <p className="font-serif italic text-foreground/60 text-lg">{t.brand.blessingTranslation}</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-[#C9933A]/20 bg-[#080C1A] text-center">
        <div className="font-display font-bold text-2xl tracking-widest text-[#C9933A] mb-4">{t.brand.wordmark}</div>
        <p className="font-serif italic text-foreground/50 mb-8">{t.brand.tagline}</p>
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-8 text-sm text-foreground/60 font-medium px-4">
          <a href="mailto:hello@noorjyoti.app" className="hover:text-[#F5D06A] transition-colors rounded-md px-1 py-1">{t.footer.contactPrefix} hello@noorjyoti.app</a>
          <a href={innerAppHref} className="hover:text-[#F5D06A] transition-colors rounded-md px-1 py-1">{t.footer.openAppPrefix} /ekdharma</a>
          <a href="/privacy" className="hover:text-[#F5D06A] transition-colors rounded-md px-1 py-1">Privacy Policy</a>
          <a href="/terms" className="hover:text-[#F5D06A] transition-colors rounded-md px-1 py-1">Terms of Service</a>
        </div>
        <p className="mt-8 text-xs text-foreground/40 px-4">© {new Date().getFullYear()} NoorJyoti. Scripture texts are in the public domain; AI voice renderings and site design © NoorJyoti. All rights reserved.</p>
      </footer>
    </div>
  );
}

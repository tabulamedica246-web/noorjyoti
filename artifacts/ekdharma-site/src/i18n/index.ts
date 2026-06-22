import { en, type TranslationDict } from "./en";
import { es } from "./es";
import { zh } from "./zh";
import { fr } from "./fr";
import { yo } from "./yo";
import { he } from "./he";

export type { TranslationDict } from "./en";

export type Locale = "en" | "es" | "zh" | "fr" | "yo" | "he";

export const SUPPORTED_LOCALES: ReadonlyArray<{
  code: Locale;
  label: string;
  /** URL path prefix relative to the site base, with leading and trailing slashes. */
  path: string;
}> = [
  { code: "en", label: "English", path: "/" },
  { code: "es", label: "Español", path: "/es/" },
  { code: "fr", label: "Français", path: "/fr/" },
  { code: "zh", label: "中文", path: "/zh/" },
  { code: "yo", label: "Yorùbá", path: "/yo/" },
  { code: "he", label: "עברית", path: "/he/" },
];

export const DICTIONARIES: Record<Locale, TranslationDict> = {
  en, es, zh, fr, yo, he,
};

const RTL_LOCALES: ReadonlySet<Locale> = new Set(["he"]);

/** Each owned doorway domain maps to a default locale. */
const HOSTNAME_TO_LOCALE: Record<string, Locale> = {
  "noorjyoti.com": "en",
  "noorjyoti.app": "en",
  "noorjyoti.world": "en",
  "lumina-sacred.com": "es",
  "or-sacred.com": "fr",
  "guangming-app.com": "zh",
  "imole-app.com": "yo",
};

export function isLocale(value: unknown): value is Locale {
  return (
    value === "en" || value === "es" || value === "zh" ||
    value === "fr" || value === "yo" || value === "he"
  );
}

export function dirFor(locale: Locale): "ltr" | "rtl" {
  return RTL_LOCALES.has(locale) ? "rtl" : "ltr";
}

export function normalizeHost(host: string | null | undefined): string {
  if (!host) return "";
  // Strip port + www. prefix, lowercase.
  return host.toLowerCase().split(":")[0].replace(/^www\./, "");
}

export function localeForHost(host: string | null | undefined): Locale | null {
  const normalized = normalizeHost(host);
  return HOSTNAME_TO_LOCALE[normalized] ?? null;
}

/** Resolve the URL prefix for a given locale (under the site base path). */
export function pathForLocale(locale: Locale): string {
  const entry = SUPPORTED_LOCALES.find((l) => l.code === locale);
  return entry?.path ?? "/";
}

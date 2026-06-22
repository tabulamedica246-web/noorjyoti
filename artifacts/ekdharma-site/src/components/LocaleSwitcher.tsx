import { SUPPORTED_LOCALES, type Locale } from "@/i18n";

interface Props {
  currentLocale: Locale;
  label: string;
}

/**
 * Navigates to the per-locale URL so the server re-renders with the correct
 * <title>, <meta>, <html lang>, <html dir> baked into the HTML. This is the
 * whole point of SSR — no flash of wrong language, crawlers see the right
 * translation immediately.
 */
export function LocaleSwitcher({ currentLocale, label }: Props) {
  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as Locale;
    const entry = SUPPORTED_LOCALES.find((l) => l.code === next);
    if (!entry) return;
    try {
      window.localStorage.setItem("noorjyoti.locale", next);
    } catch {
      // ignore
    }
    window.location.href = `${base}${entry.path}`;
  };

  return (
    <label className="inline-flex items-center gap-2 text-xs text-foreground/60">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={currentLocale}
        onChange={onChange}
        className="bg-transparent border border-[#C9933A]/30 rounded-md px-2 py-1 text-foreground/80 hover:border-[#C9933A]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5D06A]"
      >
        {SUPPORTED_LOCALES.map((l) => (
          <option key={l.code} value={l.code} className="bg-[#080C1A]">
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}

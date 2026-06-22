import { useState, useEffect, useMemo } from "react";
import {
  useListUnityQuotes,
  useListScriptures,
  useListLanguages,
  useListVoices,
  useGetFeatured,
  useListMyHistory,
  useGetScripture,
  getGetScriptureQueryKey,
  useGetMyPreferences,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, History, Crown } from "lucide-react";
import { AudioPlayer } from "@/components/audio-player";
import { Link } from "wouter";

export default function Home() {
  const { data: quotes } = useListUnityQuotes();
  const { data: scriptures } = useListScriptures();
  const { data: languages } = useListLanguages();
  const { data: voices } = useListVoices();
  const { data: history } = useListMyHistory();
  const { data: featured } = useGetFeatured();
  const { data: prefs } = useGetMyPreferences();

  const [quoteIdx, setQuoteIdx] = useState(0);

  // Player state
  const [activeScriptureId, setActiveScriptureId] = useState<number | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<number | null>(null);
  const [activeLang, setActiveLang] = useState<string | null>(null);
  const [activeVoice, setActiveVoice] = useState<string | null>(null);

  // Apply server-side preferences once loaded (only if user hasn't picked yet)
  useEffect(() => {
    if (prefs?.defaultLanguage && activeLang === null) setActiveLang(prefs.defaultLanguage);
    if (prefs?.defaultVoice && activeVoice === null) setActiveVoice(prefs.defaultVoice);
  }, [prefs, activeLang, activeVoice]);

  // Fall back to first available language / voice from the catalog
  useEffect(() => {
    if (activeLang === null && languages?.length) {
      setActiveLang(languages.find((l) => l.code === "hi")?.code ?? languages[0].code);
    }
  }, [languages, activeLang]);
  useEffect(() => {
    if (activeVoice === null && voices?.length) {
      setActiveVoice(voices[0].id);
    }
  }, [voices, activeVoice]);

  // Cycle unity quotes
  useEffect(() => {
    if (!quotes?.length) return;
    const interval = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % quotes.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [quotes]);

  // Default to the first scripture once the catalog arrives
  useEffect(() => {
    if (scriptures?.length && activeScriptureId === null) {
      setActiveScriptureId(scriptures[0].id);
    }
  }, [scriptures, activeScriptureId]);

  // Fetch the active scripture's chapter list so we can pick a real chapter id
  const { data: activeScriptureDetail } = useGetScripture(activeScriptureId ?? 0, {
    query: {
      enabled: !!activeScriptureId,
      queryKey: getGetScriptureQueryKey(activeScriptureId ?? 0),
    },
  });

  // When the chapter list changes, reset to its first chapter (unless one already valid)
  useEffect(() => {
    const chapters = activeScriptureDetail?.chapters;
    if (!chapters?.length) return;
    if (!activeChapterId || !chapters.some((c) => c.id === activeChapterId)) {
      setActiveChapterId(chapters[0].id);
    }
  }, [activeScriptureDetail, activeChapterId]);

  const activeScripture = scriptures?.find((s) => s.id === activeScriptureId);
  const activeChapter = useMemo(
    () => activeScriptureDetail?.chapters?.find((c) => c.id === activeChapterId),
    [activeScriptureDetail, activeChapterId]
  );

  return (
    <div className="flex flex-col flex-1 animate-in fade-in duration-1000 pb-8">
      {/* Header */}
      <div className="pt-10 pb-4 px-6 text-center relative z-10">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary via-secondary to-primary shadow-[0_0_30px_rgba(201,147,58,0.3)] flex items-center justify-center">
          <Sparkles className="text-card w-7 h-7" />
        </div>
        <h1 className="font-display text-2xl font-bold bg-gradient-to-br from-secondary via-[#e8a840] to-secondary bg-clip-text text-transparent tracking-[0.2em] mb-1 uppercase">
          NoorJyoti
        </h1>
        <p className="font-sans text-xs uppercase tracking-[0.3em] text-primary">
          World Scriptures · One Soul · Many Voices
        </p>
      </div>

      {/* Unity Quote Banner */}
      <div
        className="px-5 mb-6 relative z-10 min-h-[90px]"
        aria-live="polite"
        aria-atomic="true"
      >
        {quotes?.length ? (
          <div className="border border-primary/20 rounded-xl bg-card/50 backdrop-blur-sm p-4 text-center">
            <p className="font-serif italic text-sm text-foreground/90 mb-2 leading-relaxed transition-opacity duration-1000">
              "{quotes[quoteIdx].quote}"
            </p>
            <p className="text-xs text-primary tracking-wider text-right uppercase font-sans">
              — {quotes[quoteIdx].attribution}
            </p>
          </div>
        ) : (
          <Skeleton className="w-full h-20 rounded-xl bg-card/50 border border-primary/10" />
        )}
      </div>

      {/* Settings Row */}
      <div className="px-5 mb-6 flex gap-3 z-10">
        <label className="flex-1">
          <span className="sr-only">Language</span>
          <select
            className="w-full bg-card border border-primary/20 rounded-lg py-2 px-3 text-xs font-sans text-foreground appearance-none outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-primary"
            value={activeLang ?? ""}
            onChange={(e) => setActiveLang(e.target.value)}
            aria-label="Recitation language"
            data-testid="select-language"
          >
            {languages?.map(l => (
              <option key={l.code} value={l.code}>{l.nativeName}</option>
            ))}
          </select>
        </label>
        <label className="flex-1">
          <span className="sr-only">Voice</span>
          <select
            className="w-full bg-card border border-primary/20 rounded-lg py-2 px-3 text-xs font-sans text-foreground appearance-none outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-primary"
            value={activeVoice ?? ""}
            onChange={(e) => setActiveVoice(e.target.value)}
            aria-label="Reciter voice"
            data-testid="select-voice"
          >
            {voices?.map(v => (
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Scripture Tabs */}
      <div
        className="pl-5 mb-6 overflow-x-auto hide-scrollbar flex gap-3 z-10 pb-2"
        role="tablist"
        aria-label="Scriptures"
      >
        {!scriptures ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="min-w-[80px] h-[78px] rounded-xl bg-card/50 border border-primary/10" />
          ))
        ) : scriptures.map(s => {
          const isActive = activeScriptureId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => { setActiveScriptureId(s.id); setActiveChapterId(null); }}
              data-testid={`button-scripture-${s.id}`}
              role="tab"
              aria-selected={isActive}
              aria-label={`Open ${s.name}`}
              className={`flex flex-col items-center justify-center min-w-[80px] p-3 rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isActive
                  ? 'bg-card border-primary/50 shadow-[0_0_15px_rgba(201,147,58,0.15)]'
                  : 'bg-card/50 border-primary/10 hover:border-primary/30 opacity-70'
              }`}
            >
              <div
                aria-hidden="true"
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-display mb-2 border border-white/5 bg-background"
                style={{ color: s.accentColor }}
              >
                {s.name.charAt(0)}
              </div>
              <span className="text-[11px] font-sans uppercase tracking-widest text-center truncate w-full">
                {s.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Player Card */}
      <div className="px-5 mb-8 z-10">
        {activeScripture && activeChapterId && activeChapter && activeLang && activeVoice && (
          <AudioPlayer
            chapterId={activeChapterId}
            scriptureId={activeScripture.id}
            language={activeLang}
            voice={activeVoice}
            accentColor={activeScripture.accentColor}
            title={activeScripture.name}
            subtitle={`Chapter ${activeChapter.number} · ${activeChapter.title}`}
            onTrackEnded={() => {
              // Auto-advance to the next chapter (by sortOrder) within the
              // same scripture so users can listen straight through.
              const chapters = activeScriptureDetail?.chapters;
              if (!chapters?.length) return false;
              const ordered = [...chapters].sort(
                (a, b) => a.number - b.number,
              );
              const idx = ordered.findIndex((c) => c.id === activeChapterId);
              if (idx === -1 || idx >= ordered.length - 1) return false;
              setActiveChapterId(ordered[idx + 1].id);
              return true;
            }}
          />
        )}
      </div>

      {/* Continue Listening */}
      {history && history.length > 0 && (
        <div className="px-5 mb-8 z-10">
          <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 mb-4">
            <History className="w-3 h-3" aria-hidden="true" /> Continue Journey
          </h3>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            {history.map(item => (
              <button
                type="button"
                key={`${item.scriptureId}-${item.chapterId}`}
                className="text-left min-w-[200px] p-3 rounded-xl bg-card border border-primary/10 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                onClick={() => {
                  setActiveScriptureId(item.scriptureId);
                  setActiveChapterId(item.chapterId);
                }}
                aria-label={`Continue ${item.scriptureName}, chapter ${item.chapterNumber}: ${item.chapterTitle}`}
              >
                <p className="font-display text-sm text-foreground truncate">{item.scriptureName}</p>
                <p className="font-sans text-xs text-muted-foreground truncate">Ch {item.chapterNumber}: {item.chapterTitle}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Featured / Daily Wisdom */}
      {featured && featured.length > 0 && (
        <div className="px-5 z-10">
          <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 mb-4">
            <Crown className="w-3 h-3 text-secondary" aria-hidden="true" /> Daily Wisdom
          </h3>
          <div className="space-y-3">
            {featured.map((f, i) => (
              <Link key={i} href={`/scripture/${f.scriptureId}`} className="block">
                <div className="p-4 rounded-xl bg-card border border-primary/10 hover:border-primary/30 flex items-center justify-between group">
                  <div className="flex-1">
                    <p className="font-serif italic text-sm text-foreground/90 mb-1">{f.tagline}</p>
                    <p className="font-sans text-xs uppercase tracking-widest text-primary">{f.traditionName} • {f.scriptureName}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

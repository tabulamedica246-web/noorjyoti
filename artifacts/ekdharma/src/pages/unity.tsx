import { useListUnityQuotes } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Unity() {
  const { data: quotes, isLoading } = useListUnityQuotes();

  return (
    <div className="flex-1 p-6 animate-in fade-in duration-500">
      <h2 className="font-display text-2xl text-secondary tracking-widest mb-2 text-center">Words of Unity</h2>
      <p className="font-serif italic text-center text-sm text-foreground/70 max-w-md mx-auto leading-relaxed mb-8">
        Every great scripture — no matter the faith — teaches the same truth:
        love, compassion, and the oneness of all life.
      </p>

      <div className="rounded-2xl border border-primary/15 bg-card/60 p-5 mb-8 text-center">
        <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-primary/70 mb-2">
          Our Mission
        </p>
        <p className="font-serif italic text-foreground/80 leading-relaxed">
          All scriptures are rivers flowing to the same ocean. When humanity
          hears the wisdom of every faith — in their own language, in a voice
          that feels like home — we remember what we always knew: we are one.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full bg-card border border-primary/10 rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {quotes?.map((quote) => (
            <div key={quote.id} className="p-6 rounded-2xl border border-primary/10 bg-card relative overflow-hidden group">
              <div 
                className="absolute top-0 left-0 w-1 h-full opacity-50"
                style={{ backgroundColor: quote.accentColor || 'var(--primary)' }}
              />
              <p className="font-serif italic text-lg text-foreground/90 leading-relaxed mb-4">
                "{quote.quote}"
              </p>
              <div className="flex justify-between items-end">
                <span className="text-xs font-sans text-muted-foreground tracking-widest uppercase">
                  {quote.traditionName}
                </span>
                <span className="text-sm font-sans text-primary/80 text-right">
                  {quote.attribution}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

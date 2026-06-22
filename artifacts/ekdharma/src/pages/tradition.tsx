import { useParams, Link } from "wouter";
import { useGetTradition, getGetTraditionQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Book, ChevronLeft } from "lucide-react";

export default function Tradition() {
  const { slug } = useParams<{ slug: string }>();
  const { data: tradition, isLoading } = useGetTradition(slug || "", {
    query: { enabled: !!slug, queryKey: getGetTraditionQueryKey(slug || "") },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4" data-testid="tradition-loading">
        <Skeleton className="h-32 w-full rounded-2xl bg-card border border-primary/10" />
        <Skeleton className="h-24 w-full rounded-2xl bg-card border border-primary/10" />
        <Skeleton className="h-24 w-full rounded-2xl bg-card border border-primary/10" />
      </div>
    );
  }

  if (!tradition) {
    return (
      <div className="p-10 text-center font-serif italic text-muted-foreground" data-testid="tradition-empty">
        This tradition rests beyond our shelves tonight.
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 animate-in fade-in duration-500">
      <Link
        href="/explore"
        className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-primary/70 hover:text-secondary mb-6"
        data-testid="link-back-explore"
      >
        <ChevronLeft className="w-3 h-3" /> All Traditions
      </Link>

      <div className="text-center mb-10">
        <div
          className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center bg-background border border-white/5"
          style={{ color: tradition.accentColor }}
        >
          <Book className="w-6 h-6" />
        </div>
        <h2
          className="font-display text-3xl tracking-widest mb-2"
          style={{ color: tradition.accentColor }}
          data-testid="text-tradition-name"
        >
          {tradition.name}
        </h2>
        <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">
          {tradition.region} · {tradition.founded}
        </p>
        <p className="font-serif italic text-foreground/80 max-w-md mx-auto leading-relaxed">
          {tradition.shortDescription}
        </p>
      </div>

      <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
        Sacred Scriptures
      </h3>

      <div className="space-y-3">
        {tradition.scriptures?.length ? (
          tradition.scriptures.map((s) => (
            <Link
              key={s.id}
              href={`/scripture/${s.id}`}
              className="block group"
              data-testid={`link-scripture-${s.id}`}
            >
              <div className="p-5 rounded-2xl border border-primary/10 bg-card hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <h4 className="font-display text-lg text-foreground group-hover:text-secondary transition-colors">
                      {s.name}
                    </h4>
                    <p className="font-serif italic text-xs text-muted-foreground">{s.originalName}</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-primary/70 whitespace-nowrap pt-1">
                    {s.chapterCount} ch
                  </span>
                </div>
                <p className="font-serif text-sm text-foreground/70 leading-relaxed line-clamp-2 mt-2">
                  {s.description}
                </p>
              </div>
            </Link>
          ))
        ) : (
          <p className="font-serif italic text-center text-muted-foreground py-8">
            No scriptures yet in this collection.
          </p>
        )}
      </div>
    </div>
  );
}

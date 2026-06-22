import { useParams, Link } from "wouter";
import { useGetScripture } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Scripture() {
  const { scriptureId } = useParams<{ scriptureId: string }>();
  const id = parseInt(scriptureId || "0", 10);
  const { data: scripture, isLoading } = useGetScripture(id, {
    query: { enabled: !!id, queryKey: ["/api/catalog/scriptures", id] },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-64 w-full rounded-2xl bg-card border border-primary/10" />
      </div>
    );
  }

  if (!scripture) {
    return (
      <div className="p-6 text-center font-serif text-muted-foreground">
        Scripture not found.
      </div>
    );
  }

  const orderedChapters = [...scripture.chapters].sort(
    (a, b) => a.number - b.number,
  );

  return (
    <div className="flex-1 p-6 animate-in fade-in duration-500 motion-reduce:animate-none">
      <header className="text-center mb-8">
        <h2 className="font-display text-3xl text-secondary mb-2">
          {scripture.name}
        </h2>
        <p className="font-serif italic text-muted-foreground">
          {scripture.originalName}
        </p>
        <p className="sr-only">
          {orderedChapters.length} chapter
          {orderedChapters.length === 1 ? "" : "s"} available.
        </p>
      </header>

      <ol
        className="space-y-4 list-none p-0"
        aria-label={`Chapters of ${scripture.name}`}
      >
        {orderedChapters.map((chapter) => (
          <li key={chapter.id}>
            <Link
              href={`/?scripture=${scripture.id}&chapter=${chapter.id}`}
              aria-label={`Open chapter ${chapter.number}, ${chapter.title}, ${Math.ceil(chapter.estimatedReadSeconds / 60)} minute read`}
              className="block p-4 rounded-xl border border-primary/10 bg-card hover:bg-primary/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
            >
              <div className="flex justify-between items-center mb-2 gap-3">
                <span className="font-display text-foreground">
                  Chapter {chapter.number}
                  {chapter.title ? (
                    <span className="text-muted-foreground font-sans text-sm normal-case ml-2">
                      · {chapter.title}
                    </span>
                  ) : null}
                </span>
                <span className="text-xs text-primary font-sans whitespace-nowrap">
                  {Math.ceil(chapter.estimatedReadSeconds / 60)} min
                </span>
              </div>
              <p className="font-serif text-sm text-muted-foreground line-clamp-2">
                {chapter.summary}
              </p>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

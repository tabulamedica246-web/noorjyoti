import { useListTraditions } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Book } from "lucide-react";

export default function Explore() {
  const { data: traditions, isLoading } = useListTraditions();

  return (
    <div className="flex-1 p-6 animate-in fade-in duration-500">
      <h2 className="font-display text-2xl text-secondary tracking-widest mb-6 text-center">Explore Traditions</h2>
      
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full bg-card border border-primary/10 rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {traditions?.map(tradition => (
            <Link key={tradition.id} href={`/tradition/${tradition.slug}`} className="block group">
              <div className="p-5 rounded-2xl border border-primary/10 bg-card hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-4 mb-2">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-background border border-white/5"
                    style={{ color: tradition.accentColor }}
                  >
                    <Book className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg text-foreground group-hover:text-secondary transition-colors">
                      {tradition.name}
                    </h3>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">
                      {tradition.region}
                    </p>
                  </div>
                </div>
                <p className="font-serif text-sm text-foreground/70 leading-relaxed mt-3 pl-16">
                  {tradition.shortDescription}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

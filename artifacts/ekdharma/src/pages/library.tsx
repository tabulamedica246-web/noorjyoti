import { useGetMyDashboard, useGetMySynthQuota } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Headphones, Star, Activity } from "lucide-react";
import { Link } from "wouter";

export default function Library() {
  const { data: dashboard, isLoading } = useGetMyDashboard();
  const { data: quota } = useGetMySynthQuota();

  const quotaPercent = quota ? (quota.remainingDay / quota.limitPerDay) * 100 : 100;

  return (
    <div className="flex-1 p-6 animate-in fade-in duration-500 relative z-10 pb-16">
      <h2 className="font-display text-2xl text-secondary tracking-widest mb-8 text-center uppercase">Sanctuary Library</h2>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Skeleton className="h-24 bg-card rounded-2xl border border-primary/10" />
          <Skeleton className="h-24 bg-card rounded-2xl border border-primary/10" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-5 rounded-2xl border border-primary/10 bg-card/50 backdrop-blur text-center shadow-sm">
            <Headphones className="w-5 h-5 text-primary mx-auto mb-2 opacity-70" />
            <div className="font-display text-3xl text-foreground">{dashboard?.chaptersCompleted || 0}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] mt-2">Verses Heard</div>
          </div>
          <div className="p-5 rounded-2xl border border-primary/10 bg-card/50 backdrop-blur text-center shadow-sm">
            <Star className="w-5 h-5 text-primary mx-auto mb-2 opacity-70" />
            <div className="font-display text-3xl text-foreground">{dashboard?.favoriteCount || 0}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] mt-2">Treasured</div>
          </div>
        </div>
      )}

      {/* Synth Quota Meter */}
      {quota && (
        <div className="mb-8 p-5 rounded-2xl border border-primary/20 bg-card/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-sans text-[10px] text-muted-foreground tracking-[0.2em] uppercase flex items-center gap-2">
              <Activity className="w-3 h-3 text-secondary" /> Voice Energy
            </h3>
            <span className="font-sans text-[10px] text-primary">{quota.remainingDay} remaining</span>
          </div>
          <div className="h-2 bg-background rounded-full overflow-hidden border border-primary/10">
            <div 
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000"
              style={{ width: `${quotaPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Recent History */}
      <div className="space-y-4">
        <h3 className="font-sans text-[10px] text-muted-foreground tracking-[0.2em] uppercase mb-4 pl-1">Recent Journey</h3>
        {dashboard?.recentHistory?.length ? (
          dashboard.recentHistory.map((item, i) => (
            <Link key={i} href={`/scripture/${item.scriptureId}`} className="block">
              <div className="p-4 rounded-xl bg-card/50 border border-primary/10 flex items-center justify-between hover:bg-card hover:border-primary/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-background border border-white/5 flex items-center justify-center text-xs font-display" style={{ color: item.accentColor }}>
                    {item.scriptureName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-display text-sm text-foreground group-hover:text-secondary transition-colors">{item.scriptureName}</p>
                    <p className="text-[10px] font-sans text-muted-foreground uppercase tracking-widest mt-1">Chapter {item.chapterNumber}</p>
                  </div>
                </div>
                <BookOpen className="w-4 h-4 text-primary/30 group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center p-8 rounded-2xl border border-dashed border-primary/20 bg-card/30">
            <p className="font-serif italic text-muted-foreground text-sm">Your journey is waiting to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}

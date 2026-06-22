import { useLocation } from "wouter";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-1000">
      <div className="w-24 h-24 rounded-full border border-primary/20 flex items-center justify-center mb-6 bg-card">
        <Compass className="w-12 h-12 text-primary opacity-50" />
      </div>
      <h1 className="text-4xl font-display text-primary mb-4 tracking-widest">
        Not Found
      </h1>
      <p className="text-muted-foreground font-serif text-lg mb-8 max-w-[280px]">
        The path you seek is not written in these stars.
      </p>
      <Button
        onClick={() => setLocation("/")}
        variant="outline"
        className="font-sans tracking-widest uppercase text-xs border-primary/30 text-secondary hover:bg-primary/10 hover:text-secondary rounded-full px-8 py-6"
        data-testid="link-home"
      >
        Return to Sanctuary
      </Button>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, Compass, Library, HeartHandshake, User } from "lucide-react";

export function Stars() {
  const [stars, setStars] = useState<any[]>([]);

  useEffect(() => {
    setStars(
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        size: Math.random() * 2 + 1,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 4,
        dur: 2 + Math.random() * 3,
      }))
    );
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden motion-reduce:hidden"
    >
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-[rgba(255,220,130,0.6)] animate-pulse"
          style={{
            width: s.size,
            height: s.size,
            left: `${s.x}%`,
            top: `${s.y}%`,
            animationDuration: `${s.dur}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export function BottomNav() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/explore", label: "Explore", icon: Compass },
    { href: "/library", label: "Library", icon: Library },
    { href: "/unity", label: "Unity", icon: HeartHandshake },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 w-full bg-background/90 backdrop-blur-xl border-t border-white/10 px-2 pb-safe pt-2 z-50"
    >
      <div className="flex justify-around items-center max-w-md mx-auto">
        {links.map((link) => {
          const isActive = location === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-label={link.label}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center gap-1 p-2 min-w-[64px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md motion-reduce:transition-none ${
                isActive
                  ? "text-secondary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon
                size={24}
                strokeWidth={isActive ? 2.5 : 2}
                aria-hidden="true"
                className={
                  isActive ? "animate-in zoom-in motion-reduce:animate-none" : ""
                }
              />
              <span className="text-xs font-sans tracking-wide uppercase">
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col w-full font-sans text-foreground bg-background">
      {/* Skip-to-content link — only visible when focused. */}
      <a
        href="#main-content"
        className="skip-link sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-md focus:bg-secondary focus:text-card focus:font-sans focus:text-sm focus:shadow-lg"
      >
        Skip to main content
      </a>
      <Stars />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 w-full max-w-md mx-auto relative z-10 flex flex-col pb-4 focus:outline-none"
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

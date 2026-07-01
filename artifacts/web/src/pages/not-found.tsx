import { Link } from "wouter";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 text-center">
      <div className="w-full max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Compass className="h-8 w-8" aria-hidden="true" />
        </div>
        <p className="font-serif text-5xl font-bold text-foreground">404</p>
        <h1 className="mt-4 font-serif text-2xl font-semibold text-foreground">
          This page could not be found
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The page you are looking for may have moved, or the link might be
          broken. Let's guide you back to the light.
        </p>
        <div className="mt-8">
          <Button asChild>
            <Link href="/">
              <Home className="h-4 w-4" aria-hidden="true" />
              Return home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

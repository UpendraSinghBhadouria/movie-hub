import Link from "next/link";
import { Clapperboard, Film, Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type AuthShellProps = {
  children: React.ReactNode;
  title: string;
  description: string;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
};

export function AuthShell({
  children,
  title,
  description,
  footerText,
  footerLinkText,
  footerLinkHref,
}: AuthShellProps) {
  return (
    <main className="relative min-h-[calc(100vh-140px)] overflow-hidden bg-background">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 size-96 rounded-full bg-primary/15 blur-3xl" />

        <div className="absolute -bottom-40 -right-32 size-112 rounded-full bg-pink-500/10 blur-3xl" />

        <div className="absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-140px)] w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border/60 bg-card/80 shadow-2xl shadow-primary/10 backdrop-blur-xl lg:grid-cols-[0.9fr_1.1fr]">
          {/* Branding section */}
          <div className="relative hidden overflow-hidden bg-linear-to-br from-primary/20 via-pink-500/10 to-background p-10 lg:flex lg:flex-col lg:justify-between">
            <div className="absolute -right-24 -top-24 size-64 rounded-full bg-primary/20 blur-3xl" />

            <div className="relative">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-lg font-bold"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                  <Clapperboard className="size-5" />
                </span>

                <span>
                  Movie<span className="text-primary">Hub</span>
                </span>
              </Link>
            </div>

            <div className="relative space-y-6">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <Film className="size-7" />
              </div>

              <div className="space-y-3">
                <h2 className="max-w-sm text-3xl font-bold tracking-tight">
                  Your movies,
                  <br />
                  your moments.
                </h2>

                <p className="max-w-md text-sm leading-6 text-muted-foreground">
                  Discover movies, events and shows around you. Book your seats
                  and enjoy the experience with MovieHub.
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="size-4 text-primary" />
                <span>Simple. Fast. Entertaining.</span>
              </div>
            </div>

            <p className="relative text-xs text-muted-foreground">
              © 2026 MovieHub
            </p>
          </div>

          {/* Form section */}
          <div className="p-6 sm:p-10">
            {/* <Card className="border-0 bg-transparent shadow-none"> */}
              {/* <CardContent className="p-0"> */}
                <div className="mx-auto w-full">
                  <div className="mb-8 space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                      {title}
                    </h1>

                    <p className="text-sm leading-6 text-muted-foreground">
                      {description}
                    </p>
                  </div>

                  {children}

                  <div className="mt-8 text-center text-sm text-muted-foreground">
                    {footerText}{" "}
                    <Link
                      href={footerLinkHref}
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {footerLinkText}
                    </Link>
                  </div>
                </div>
              {/* </CardContent> */}
            {/* </Card> */}
          </div>
        </div>
      </div>
    </main>
  );
}

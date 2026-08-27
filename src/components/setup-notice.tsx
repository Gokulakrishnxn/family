import { Database, TerminalSquare } from "lucide-react";
import { BrandWordmark } from "@/components/brand";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SetupStatus } from "@/lib/supabase";

const COPY: Record<Exclude<SetupStatus, "ready">, { title: string; description: string; steps: string[] }> = {
  unconfigured: {
    title: "Supabase is not configured",
    description: "The app needs to know which Supabase project to talk to.",
    steps: [
      "cp .env.example .env.local",
      "Fill in SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY",
      "Restart the dev server",
    ],
  },
  "no-schema": {
    title: "The database has no tables yet",
    description:
      "Supabase is reachable, but the members, expenses and settings tables have not been created.",
    steps: [
      "Put your database password into SUPABASE_DB_URL in .env.local",
      "Run: npm run db:push",
      "No password to hand? Paste supabase/migrations/*.sql into the dashboard's SQL Editor instead.",
    ],
  },
};

export function SetupNotice({ status }: { status: Exclude<SetupStatus, "ready"> }) {
  const copy = COPY[status];

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <BrandWordmark className="mb-2" />
          <CardTitle className="flex items-center gap-2">
            <Database className="size-4" aria-hidden="true" />
            {copy.title}
          </CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {copy.steps.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm">
                <span className="num flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">
                  {i + 1}
                </span>
                <span className="min-w-0 break-words">{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
            <TerminalSquare className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            This page disappears on its own once the check passes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

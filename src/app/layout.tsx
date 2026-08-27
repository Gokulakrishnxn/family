import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { SetupNotice } from "@/components/setup-notice";
import { Toaster } from "@/components/ui/sonner";
import { getActiveMember } from "@/lib/session";
import { setupStatus } from "@/lib/supabase";
import "./globals.css";

const sans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Family — household expenses",
    template: "%s · Family",
  },
  description:
    "A shared household expense tracker. Everyone in the family logs what they spend; the dashboard adds it up.",
  applicationName: "Family",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const status = await setupStatus();
  const member = status === "ready" ? await getActiveMember() : null;

  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable} antialiased`}>
      <body className="min-h-dvh bg-background text-foreground">
        {status === "ready" ? (
          <AppShell member={member}>{children}</AppShell>
        ) : (
          <SetupNotice status={status} />
        )}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}

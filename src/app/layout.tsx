import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { Toaster } from "@/components/ui/sonner";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable} antialiased`}>
      <body className="min-h-dvh bg-background text-foreground">
        <AppShell>{children}</AppShell>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}

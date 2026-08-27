import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { PwaProvider } from "@/components/pwa-provider";
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
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Family",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1f1f1" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
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
        <PwaProvider />
        <Toaster position="top-center" offset="max(12px, env(safe-area-inset-top))" />
      </body>
    </html>
  );
}

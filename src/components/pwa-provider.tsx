"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "family-install-dismissed";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Registers the service worker and, when the app is still running in a browser
 * tab, offers a one-tap path onto the home screen.
 */
export function PwaProvider() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Private mode or a blocked SW — the site still works in the browser.
      });
    }

    if (isStandalone()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      // Storage blocked — still offer install this session.
    }

    const iosDevice = isIos();
    setIos(iosDevice);
    if (iosDevice) {
      setVisible(true);
      return;
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    setVisible(false);
    setDeferred(null);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Fine — it will just come back next visit.
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  };

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-3 md:bottom-6">
      <div className="page-motion pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border bg-background p-3 shadow-lg">
        <BrandMark className="size-10 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Add Family to your home screen</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {ios ? (
              <>
                Tap <Share className="inline size-3 align-[-2px]" aria-label="Share" /> then{" "}
                <span className="font-medium text-foreground">Add to Home Screen</span>
              </>
            ) : (
              "Opens like an app, with the Family icon on your home screen."
            )}
          </p>
          {deferred ? (
            <Button type="button" size="sm" className="mt-2 h-9" onClick={install}>
              <Download className="size-3.5" />
              Add shortcut
            </Button>
          ) : null}
        </div>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Dismiss" onClick={dismiss}>
          <X className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

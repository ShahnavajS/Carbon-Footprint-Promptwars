"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import { Button } from "./button";
import { trackEvent } from "@/services/analytics";
import { useAuthStore } from "@/features/auth/store";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    // 1. Check if user previously dismissed banner in this session
    const isDismissed = sessionStorage.getItem("pwa_install_dismissed");
    if (isDismissed) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent browser's default minibar prompt
      e.preventDefault();
      // Store event for trigger later
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsVisible(true);

      // Track telemetry
      trackEvent("pwa_install_prompt_shown", { trigger: "banner" });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // If app is already installed
    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      trackEvent("pwa_installed", { userId: user?.uid });
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [user]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show native prompt
    await deferredPrompt.prompt();

    // Wait for user choice
    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === "accepted") {
      trackEvent("pwa_installed", { userId: user?.uid });
      setIsVisible(false);
    }

    // Reset prompt state
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("pwa_install_dismissed", "true");
  };

  if (!isVisible || !deferredPrompt) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 z-50 flex flex-col items-center justify-between gap-4 rounded-xl border border-emerald-100 bg-white/95 p-4 shadow-xl backdrop-blur-md sm:left-auto sm:right-4 sm:max-w-md sm:flex-row dark:border-emerald-900/30 dark:bg-slate-900/95"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
          <Download className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
            Install EcoScore App
          </h4>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Add EcoScore to your home screen for quick offline access and habit tracking.
          </p>
        </div>
      </div>

      <div className="flex w-full items-center gap-2 sm:w-auto">
        <Button
          size="sm"
          variant="primary"
          onClick={handleInstallClick}
          className="w-full sm:w-auto"
        >
          Install
        </Button>
        <button
          onClick={handleDismiss}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Dismiss app install banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default InstallAppBanner;

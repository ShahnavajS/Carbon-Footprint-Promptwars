"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/store";
import { startDemoSession } from "@/lib/demo-session";

export function HeroCtas() {
  const router = useRouter();
  const { user } = useAuthStore();

  const handleGetStarted = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/signup");
    }
  };

  const handleDemoMode = () => {
    // Persists the demo session client-side and navigates to the dashboard.
    startDemoSession();
    window.location.href = "/dashboard";
  };

  const handleLearnMore = () => {
    // Route to the awareness hub — the educational gateway into the mission.
    router.push("/learn");
  };

  return (
    <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <Button size="lg" variant="primary" id="cta-get-started" onClick={handleGetStarted}>
        Get Started Free
      </Button>
      <Button
        size="lg"
        variant="outline"
        id="cta-demo-mode"
        onClick={handleDemoMode}
        className="bg-emerald-50 text-emerald-700 border-forest-200 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 dark:hover:bg-emerald-950/40"
      >
        🌿 Explore Demo Mode
      </Button>
      <Button size="lg" variant="ghost" id="cta-learn-more" onClick={handleLearnMore}>
        Learn How It Works
      </Button>
    </div>
  );
}

export default HeroCtas;

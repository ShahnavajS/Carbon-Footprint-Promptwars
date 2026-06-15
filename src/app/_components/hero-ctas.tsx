"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/store";

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

  const handleLearnMore = () => {
    const section = document.getElementById("features-section");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <Button size="lg" variant="primary" id="cta-get-started" onClick={handleGetStarted}>
        Get Started Free
      </Button>
      <Button size="lg" variant="outline" id="cta-learn-more" onClick={handleLearnMore}>
        Learn How It Works
      </Button>
    </div>
  );
}

export default HeroCtas;

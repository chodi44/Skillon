import { createFileRoute, Link } from "@tanstack/react-router";
import { SkyShell, TopBar, PageHero, Panel } from "@/components/site-header";
import { useSkillon, slugify } from "@/lib/skillon-store";
import { ArrowRight, Sparkle, CheckCircle2, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Skillon — Crack GATE. Get the job." },
      { name: "description", content: "Daily learning OS for a 9-member cohort: curriculum, checkable items, cohort analytics." },
      { property: "og:title", content: "Skillon — Crack GATE. Get the job." },
      { property: "og:description", content: "Daily plan. Track progress. Beat GATE 2026." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { SkyShell } from "@/components/site-header";
import { Loader2 } from "lucide-react";

function Landing() {
  const { ready, user, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready) {
      if (!user) {
        navigate({ to: "/auth", replace: true });
      } else {
        navigate({ to: isSuperAdmin ? "/admin" : "/dashboard", replace: true });
      }
    }
  }, [ready, user, isSuperAdmin, navigate]);

  return (
    <SkyShell>
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    </SkyShell>
  );
}

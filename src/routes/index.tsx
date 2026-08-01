import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SkyShell } from "@/components/site-header";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Skillon — Crack GATE. Get the job." },
      { name: "description", content: "Daily learning OS for a 9-member cohort." },
    ],
  }),
  component: Landing,
});

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

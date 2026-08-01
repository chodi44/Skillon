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

function Landing() {
  const s = useSkillon();
  const me = s.currentMember;
  const totalItems = s.tracks.flatMap((t) => t.items).length;
  const myDone = s.completedItemsFor(s.currentMemberId).size;
  const myPct = totalItems ? Math.round((myDone / totalItems) * 100) : 0;
  const cohortDone = s.members.reduce((sum, m) => sum + s.completedItemsFor(m.id).size, 0);
  const cohortPct = totalItems ? Math.round((cohortDone / (totalItems * s.members.length)) * 100) : 0;

  return (
    <SkyShell>
      <TopBar />
      <main className="relative z-10 px-5 pb-32 pt-4 space-y-6">
        <PageHero
          eyebrow={`Hi ${me.name.split(" ")[0]} · GATE 2026`}
          title={<>Crack GATE. Get the job.</>}
          subtitle="Your daily learning OS. Admin ships curriculum, you check it off, cohort analytics stay live."
          stats={[
            { label: "You", value: `${myPct}%` },
            { label: "Cohort", value: `${cohortPct}%` },
            { label: "Tracks", value: s.tracks.length },
          ]}
        >
          <Link
            to="/dashboard"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 text-[15px] font-medium text-[#12121a] shadow-md active:scale-[0.99] transition"
          >
            Open today's plan <ArrowRight className="h-4 w-4" />
          </Link>
        </PageHero>

        <div className="grid gap-3">
          <Feature Icon={Sparkle} title="Curriculum from admin" body="Every 'learn this' arrives with notes, PDFs, links and a message." />
          <Feature Icon={CheckCircle2} title="Check what you finish" body="Every item is a tap. Progress flows into tracks, dashboard and analytics — private to your account." />
          <Feature Icon={Users} title="Your private space" body="Add your own skills, notes, timers and alarms in the Me tab — visible only to you." />
        </div>

        <Panel
          title="Tracks in play"
          action={<Link to="/learn" className="text-[11px] font-mono uppercase tracking-widest text-[#12121a]">All →</Link>}
        >
          <ul className="space-y-3">
            {s.tracks.slice(0, 5).map((t, i) => {
              const c = s.cohortCompletionForTrack(t.id);
              return (
                <li key={t.id}>
                  <Link
                    to="/learn/$track"
                    params={{ track: slugify(t.name) }}
                    className="flex items-center gap-4 rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-slate-200 transition hover:ring-[#12121a]"
                  >
                    <div className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-gradient-to-br from-[#ffd970] to-[#ffb84d] font-display text-lg text-white">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-[15px] text-slate-900">{t.name}</div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{t.items.length} items</span>
                        <span>·</span>
                        <span>{t.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-lg leading-none text-slate-900">{c.pct}%</div>
                      <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-slate-500">cohort</div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
      </main>
    </SkyShell>
  );
}

function Feature({ Icon, title, body }: { Icon: typeof Sparkle; title: string; body: string }) {
  return (
    <div className="flex gap-4 rounded-3xl bg-white/85 backdrop-blur p-5 shadow-sm ring-1 ring-slate-200">
      <div className="grid h-10 w-10 flex-none place-items-center rounded-2xl bg-gradient-to-br from-[#ffd970] to-[#ffb84d] text-white">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-[15px] font-medium text-slate-900">{title}</div>
        <div className="mt-1 text-sm text-slate-600">{body}</div>
      </div>
    </div>
  );
}

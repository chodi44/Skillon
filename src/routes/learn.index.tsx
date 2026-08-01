import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SkyShell, TopBar, PageHero } from "@/components/site-header";
import { useSkillon, slugify } from "@/lib/skillon-store";


export const Route = createFileRoute("/learn/")({
  head: () => ({
    meta: [
      { title: "Learn — Skillon" },
      { name: "description", content: "All tracks: GATE, career, personal skills." },
      { property: "og:title", content: "Learn — Skillon" },
      { property: "og:description", content: "All tracks in one place." },
    ],
  }),
  component: LearnIndex,
});

const CATEGORIES = ["All", "GATE", "Career", "Skill", "Custom"] as const;
type Cat = (typeof CATEGORIES)[number];

const CAT_META: Record<Exclude<Cat, "All">, { icon: string; tint: string }> = {
  GATE:   { icon: "◆", tint: "from-indigo-500 to-blue-600" },
  Career: { icon: "◇", tint: "from-sky-500 to-cyan-600" },
  Skill:  { icon: "✦", tint: "from-violet-500 to-fuchsia-600" },
  Custom: { icon: "✧", tint: "from-amber-500 to-orange-600" },
};

function LearnIndex() {
  const s = useSkillon();
  const [cat, setCat] = useState<Cat>("All");
  const [q, setQ] = useState("");

  const totalItems = s.tracks.flatMap((t) => t.items).length;
  const doneItems = s.tracks.reduce(
    (acc, t) => acc + s.completionForTrack(t.id, s.currentMemberId).done,
    0,
  );
  const overallPct = totalItems ? Math.round((doneItems / totalItems) * 100) : 0;

  const tracks = useMemo(() => {
    return s.tracks
      .filter((t) => (cat === "All" ? true : t.category === cat))
      .filter((t) =>
        q.trim() === ""
          ? true
          : (t.name + " " + t.description).toLowerCase().includes(q.toLowerCase()),
      );
  }, [s.tracks, cat, q]);

  const inProgress = s.tracks
    .map((t) => ({ t, c: s.completionForTrack(t.id, s.currentMemberId) }))
    .filter((x) => x.c.done > 0 && x.c.pct < 100)
    .sort((a, b) => b.c.pct - a.c.pct)
    .slice(0, 3);

  return (
    <SkyShell>
      <TopBar title="Learn" />
      <main className="relative z-10 px-5 pb-32 pt-4 space-y-5">
        <PageHero
          eyebrow="Your library"
          title={`${overallPct}% of everything, done.`}
          subtitle={`${doneItems} of ${totalItems} items across ${s.tracks.length} tracks.`}
        >
          <div className="h-2 rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${overallPct}%` }} />
          </div>
        </PageHero>


        {/* Search */}
        <div className="mt-5">
          <div className="flex items-center gap-2 rounded-2xl bg-white/80 backdrop-blur px-4 py-3 shadow-sm ring-1 ring-slate-200">
            <span className="text-slate-400">⌕</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search tracks, topics…"
              className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                clear
              </button>
            )}
          </div>
        </div>

        {/* Category chips */}
        <div className="mt-4 -mx-5 overflow-x-auto px-5">
          <div className="flex gap-2 pb-1 w-max">
            {CATEGORIES.map((c) => {
              const active = cat === c;
              const count =
                c === "All" ? s.tracks.length : s.tracks.filter((t) => t.category === c).length;
              return (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                    active
                      ? "bg-butter text-[#12121a] shadow"
                      : "bg-white/10 text-white ring-1 ring-white/10"
                  }`}
                >
                  <span>{c}</span>
                  <span
                    className={`rounded-full px-1.5 text-[10px] font-mono ${
                      active ? "bg-white/20 text-white" : "bg-white/20 text-white"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Continue learning */}
        {cat === "All" && q === "" && inProgress.length > 0 && (
          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="font-display text-lg text-white">Continue learning</h2>
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500">
                pick up where you left
              </span>
            </div>
            <div className="-mx-5 overflow-x-auto px-5">
              <div className="flex gap-3 w-max pb-1">
                {inProgress.map(({ t, c }) => {
                  const meta = CAT_META[t.category as Exclude<Cat, "All">];
                  return (
                    <Link
                      key={t.id}
                      to="/learn/$track"
                      params={{ track: slugify(t.name) }}
                      className={`relative w-64 flex-none overflow-hidden rounded-3xl bg-gradient-to-br ${meta.tint} p-5 text-white shadow-md`}
                    >
                      <div className="text-2xl">{meta.icon}</div>
                      <div className="mt-4 text-[10px] font-mono uppercase tracking-widest text-white/80">
                        {t.category}
                      </div>
                      <div className="mt-1 line-clamp-2 text-[15px] font-medium">{t.name}</div>
                      <div className="mt-4 flex items-end justify-between">
                        <div className="font-display text-3xl leading-none">{c.pct}%</div>
                        <div className="text-[11px] text-white/80">
                          {c.done}/{c.total}
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-white/25 overflow-hidden">
                        <div className="h-full bg-white" style={{ width: `${c.pct}%` }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Tracks list */}
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="font-display text-lg text-white">
              {cat === "All" ? "All tracks" : `${cat} tracks`}
            </h2>
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500">
              {tracks.length} shown
            </span>
          </div>

          {tracks.length === 0 ? (
            <div className="rounded-3xl bg-white/80 p-8 text-center ring-1 ring-slate-200">
              <div className="text-3xl">◌</div>
              <div className="mt-2 text-sm text-slate-600">No tracks match your filter.</div>
            </div>
          ) : (
            <ul className="space-y-3">
              {tracks.map((t) => {
                const mine = s.completionForTrack(t.id, s.currentMemberId);
                const meta = CAT_META[t.category as Exclude<Cat, "All">];
                const done = mine.pct === 100;
                return (
                  <li key={t.id}>
                    <Link
                      to="/learn/$track"
                      params={{ track: slugify(t.name) }}
                      className="group flex items-stretch gap-3 rounded-3xl bg-white/85 backdrop-blur p-3 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md hover:ring-[#12121a]"
                    >
                      <div
                        className={`grid w-16 flex-none place-items-center rounded-2xl bg-gradient-to-br ${meta.tint} text-2xl text-white`}
                      >
                        {meta.icon}
                      </div>
                      <div className="min-w-0 flex-1 py-1">
                        <div className="flex items-center gap-2">
                          <span className="pill bg-slate-100 text-slate-600">{t.category}</span>
                          {done && (
                            <span className="pill bg-emerald-100 text-emerald-700">✓ Done</span>
                          )}
                          {t.items.length === 0 && (
                            <span className="pill bg-amber-100 text-amber-700">Empty</span>
                          )}
                        </div>
                        <div className="mt-1.5 truncate text-[15px] font-medium text-slate-900">
                          {t.name}
                        </div>
                        <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                          {t.description}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-[#12121a] transition-all"
                              style={{ width: `${mine.pct}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono text-slate-500">
                            {mine.done}/{mine.total}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-none items-center pr-2 text-slate-300 group-hover:text-[#12121a]">
                        →
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </SkyShell>
  );
}

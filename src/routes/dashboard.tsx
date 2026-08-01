import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { SkyShell, TopBar, PageHero, Panel } from "@/components/site-header";
import { useSkillon, slugify, type Track } from "@/lib/skillon-store";
import { ActivityFeed } from "@/components/activity-feed";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Today — Skillon" },
      { name: "description", content: "Your daily learning plan, tracks and progress." },
      { property: "og:title", content: "Today — Skillon" },
      { property: "og:description", content: "Track GATE and career progress, daily." },
    ],
  }),
  component: Dashboard,
});

const PLANS = [
  { id: "day",   label: "Today",     sub: "Daily plan" },
  { id: "week",  label: "This week", sub: "7-day sprint" },
  { id: "month", label: "Month",     sub: "30-day arc" },
] as const;

function Dashboard() {
  const s = useSkillon();
  const me = s.currentMember;
  const [plan, setPlan] = useState<(typeof PLANS)[number]["id"]>("day");
  const [openTrack, setOpenTrack] = useState<string | null>(null);

  const completed = s.completedItemsFor(s.currentMemberId);
  const myTracks = s.tracks.filter((t) => !t.ownerId || t.ownerId === s.currentMemberId);
  const allItems = myTracks.flatMap((t) => t.items);
  const done = allItems.filter((i) => completed.has(i.id)).length;
  const pct = allItems.length ? Math.round((done / allItems.length) * 100) : 0;

  const focus = useMemo(() => {
    const pool = allItems.filter((i) => !completed.has(i.id));
    const n = plan === "day" ? 4 : plan === "week" ? 8 : 14;
    return pool.slice(0, n);
  }, [allItems, completed, plan]);

  return (
    <SkyShell>
      <TopBar title="Today" />
      <main className="relative z-10 px-5 pb-32 pt-4 space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <PageHero
          eyebrow={`${me.name.split(" ")[0]} · Day ${Math.max(1, done + 1)}`}
          title="Master skills, one day at a time."
          subtitle={`${done} of ${allItems.length} items complete · GATE + placement`}
          stats={[
            { label: "Done", value: pct + "%" },
            { label: "Focus", value: focus.length },
            { label: "Tracks", value: myTracks.length },
          ]}
        />
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <TodayTasks />
        </motion.div>



        <Panel
          title="Focus checklist"
          action={
            <div className="flex gap-1 rounded-full bg-slate-100 p-1">
              {PLANS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlan(p.id)}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                    plan === p.id ? "bg-white text-[#12121a] shadow-sm" : "text-slate-500"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          }
        >
          <ul className="space-y-3">
            {focus.length === 0 && (
              <li className="py-6 text-center text-sm text-slate-500">
                🎉 You're clear for {plan === "day" ? "today" : "this window"}.
              </li>
            )}
            {focus.map((it) => {
              const isDone = completed.has(it.id);
              return (
                <li key={it.id} className="flex items-start gap-3">
                  <button
                    onClick={() => s.toggleCompleted(it.id)}
                    aria-label="toggle"
                    className={`mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full border transition ${
                      isDone
                        ? "bg-[#12121a] border-[#12121a] text-white"
                        : "bg-white border-slate-300 text-transparent hover:border-blue-500"
                    }`}
                  >
                    ✓
                  </button>
                  <div className="flex-1">
                    <div className={`text-[15px] leading-snug ${isDone ? "line-through text-slate-400" : "text-slate-900"}`}>
                      {it.title}
                    </div>
                    {it.description && (
                      <div className="mt-0.5 line-clamp-2 text-xs text-slate-500">{it.description}</div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <Link
            to="/learn"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#12121a] py-3.5 text-[15px] font-medium text-white shadow-md active:scale-[0.99] transition"
          >
            Continue learning →
          </Link>
        </Panel>

        <Panel
          title="Your tracks"
          action={<span className="text-[11px] font-mono uppercase tracking-widest text-slate-500">{myTracks.length} active</span>}
        >
          <ul className="space-y-3">
            {myTracks.map((t) => (
              <TrackRow
                key={t.id}
                track={t}
                open={openTrack === t.id}
                onToggle={() => setOpenTrack(openTrack === t.id ? null : t.id)}
              />
            ))}
          </ul>
        </Panel>

        <AddSkillForm />

        <Panel title="Live Activity" action={<Link to="/doubts" className="text-xs text-blue-500 hover:underline">Q&A Forum</Link>}>
          <ActivityFeed />
        </Panel>
      </main>
    </SkyShell>
  );
}

function TrackRow({ track, open, onToggle }: { track: Track; open: boolean; onToggle: () => void }) {
  const s = useSkillon();
  const { done, total, pct } = s.completionForTrack(track.id, s.currentMemberId);
  return (
    <li className="overflow-hidden rounded-2xl bg-white/70 ring-1 ring-slate-200">
      <button onClick={onToggle} className="flex w-full items-center gap-4 px-4 py-3 text-left">
        <div className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-gradient-to-br from-[#ffd970] to-[#ffb84d] font-display text-lg text-white">
          {track.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="truncate text-[15px] text-slate-900">{track.name}</div>
          <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-[#12121a]" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-lg leading-none text-slate-900">{pct}%</div>
          <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-slate-500">{done}/{total}</div>
        </div>
      </button>
      {open && (
        <ul className="border-t border-slate-100 divide-y divide-slate-100">
          {track.items.length === 0 && (
            <li className="px-4 py-3 text-sm text-slate-500">No items yet.</li>
          )}
          {track.items.slice(0, 8).map((it) => {
            const isDone = s.isCompleted(s.currentMemberId, it.id);
            return (
              <li key={it.id} className="flex items-start gap-3 px-4 py-3">
                <button
                  onClick={() => s.toggleCompleted(it.id)}
                  className={`mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full border transition ${
                    isDone ? "bg-[#12121a] border-[#12121a] text-white" : "bg-white border-slate-300 text-transparent"
                  }`}
                >
                  ✓
                </button>
                <div className={`text-sm ${isDone ? "line-through text-slate-400" : "text-slate-800"}`}>
                  {it.title}
                </div>
              </li>
            );
          })}
          <li className="px-4 py-3">
            <Link
              to="/learn/$track"
              params={{ track: slugify(track.name) }}
              className="text-xs font-mono uppercase tracking-widest text-[#12121a]"
            >
              Open track →
            </Link>
          </li>
        </ul>
      )}
    </li>
  );
}

function AddSkillForm() {
  const s = useSkillon();
  const [trackId, setTrackId] = useState(s.tracks[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !trackId) return;
    s.addItem(trackId, { title: title.trim(), description: "", links: [], createdBy: s.currentMemberId });
    setTitle("");
    setFlash("Added ✓");
    setTimeout(() => setFlash(null), 1800);
  };

  return (
    <Panel title="Add a skill">
      <form onSubmit={submit} className="grid gap-3">
        <select
          value={trackId}
          onChange={(e) => setTrackId(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800"
        >
          {s.tracks.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Master SQL window functions"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400"
        />
        <div className="flex items-center gap-3">
          <button className="rounded-full bg-[#12121a] px-5 py-3 text-sm font-medium text-white shadow-md">
            Add skill
          </button>
          {flash && <span className="text-sm text-[#12121a]">{flash}</span>}
        </div>
      </form>
    </Panel>
  );
}

function TodayTasks() {
  const s = useSkillon();
  const list = s.tasksFor(s.currentMemberId);
  if (list.length === 0) return null;
  const done = list.filter((t) => s.isTaskDone(t.id, s.currentMemberId)).length;
  const pct = Math.round((done / list.length) * 100);
  return (
    <Panel title="Today's tasks" action={<span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{done}/{list.length} · {pct}%</span>}>
      <ul className="space-y-2">
        {list.map((t) => {
          const isDone = s.isTaskDone(t.id, s.currentMemberId);
          return (
            <li key={t.id} className="flex items-start gap-3 rounded-2xl bg-white/70 ring-1 ring-slate-200 p-3">
              <button
                onClick={() => s.toggleTaskComplete(t.id)}
                className={`mt-0.5 h-5 w-5 flex-none rounded-md border-2 grid place-items-center ${isDone ? "bg-[#12121a] border-[#12121a] text-white" : "border-slate-300 bg-white"}`}
                aria-label="toggle"
              >
                {isDone && "✓"}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${isDone ? "line-through text-slate-400" : "text-slate-900"}`}>{t.title}</div>
                {t.description && <div className="text-xs text-slate-500 mt-0.5">{t.description}</div>}
                {t.links.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {t.links.map((l, i) => (
                      <a key={i} href={l.url} target="_blank" rel="noreferrer" className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700">{l.label}</a>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right text-[10px] font-mono text-slate-500">
                <div>{t.estimatedMin}m</div>
                <div className="text-butter-foreground">+{t.xp}xp</div>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

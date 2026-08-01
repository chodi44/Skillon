import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/coding")({
  head: () => ({ meta: [{ title: "Coding tracker — Admin" }] }),
  component: AdminCoding,
});

const PLATFORMS = [
  { id: "leetcode", label: "LeetCode" },
  { id: "github", label: "GitHub" },
  { id: "gfg", label: "GeeksforGeeks" },
  { id: "hackerrank", label: "HackerRank" },
] as const;

function AdminCoding() {
  const statsQ = useQuery({
    queryKey: ["admin_coding_stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coding_stats")
        .select("user_id, platform, handle, total_solved, easy, medium, hard, streak, fetched_at, error");
      if (error) throw error;
      return data ?? [];
    },
  });
  const profilesQ = useQuery({
    queryKey: ["admin_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, email");
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = profilesQ.data ?? [];
  const stats = statsQ.data ?? [];
  const byUser = new Map<string, typeof stats>();
  for (const s of stats) {
    const arr = byUser.get(s.user_id) ?? [];
    arr.push(s);
    byUser.set(s.user_id, arr as any);
  }

  const cohort = rows.map((r) => {
    const mine = byUser.get(r.id) ?? [];
    const total = mine.reduce((s, x) => s + (x.total_solved ?? 0), 0);
    const easy = mine.reduce((s, x) => s + (x.easy ?? 0), 0);
    const medium = mine.reduce((s, x) => s + (x.medium ?? 0), 0);
    const hard = mine.reduce((s, x) => s + (x.hard ?? 0), 0);
    const streak = Math.max(0, ...mine.map((x) => x.streak ?? 0));
    const lastActive = mine
      .map((x) => x.fetched_at)
      .sort()
      .pop();
    return { r, total, easy, medium, hard, streak, lastActive, mine };
  });
  const cohortTotal = cohort.reduce((s, x) => s + x.total, 0);
  const leader = [...cohort].sort((a, b) => b.total - a.total)[0];

  return (
    <div className="grid gap-5">
      <div className="card-glass p-6">
        <div className="pill bg-[#fff4cf] text-[#12121a] inline-block">Cohort snapshot</div>
        <h2 className="mt-3 font-display text-2xl text-slate-900">Live coding data</h2>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat label="Total solved" value={cohortTotal} />
          <Stat label="Students tracked" value={cohort.filter((c) => c.mine.length > 0).length} />
          <Stat label="Top solver" value={leader && leader.total > 0 ? leader.r.full_name ?? "—" : "—"} />
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-[10px] font-mono uppercase tracking-widest text-slate-500 border-b border-slate-200">
                <th className="text-left py-2">Student</th>
                <th className="text-right">Total</th>
                <th className="text-right">E / M / H</th>
                <th className="text-right">Streak</th>
                <th className="text-right">Platforms</th>
                <th className="text-right">Last refresh</th>
              </tr>
            </thead>
            <tbody>
              {cohort.map(({ r, total, easy, medium, hard, streak, lastActive, mine }) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="py-2">
                    <div className="font-medium text-slate-900">{r.full_name ?? r.email}</div>
                    <div className="text-[11px] text-slate-500">{r.email}</div>
                  </td>
                  <td className="text-right font-mono">{total}</td>
                  <td className="text-right font-mono text-xs">{easy}/{medium}/{hard}</td>
                  <td className="text-right font-mono">{streak}🔥</td>
                  <td className="text-right text-xs text-slate-500">{mine.map((m) => m.platform).join(", ") || "—"}</td>
                  <td className="text-right text-xs text-slate-500">
                    {lastActive ? new Date(lastActive).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-glass p-6">
        <div className="pill bg-[#fff4cf] text-[#12121a] inline-block">Platform mix</div>
        <h2 className="mt-3 font-display text-2xl text-slate-900">Problems by platform</h2>
        <div className="mt-4 grid gap-2">
          {PLATFORMS.map((p) => {
            const total = stats.filter((s) => s.platform === p.id).reduce((s, x) => s + (x.total_solved ?? 0), 0);
            const max = Math.max(1, ...PLATFORMS.map((pp) =>
              stats.filter((s) => s.platform === pp.id).reduce((s, x) => s + (x.total_solved ?? 0), 0),
            ));
            return (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-32 text-sm text-slate-700">{p.label}</div>
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-[#12121a]" style={{ width: `${(total / max) * 100}%` }} />
                </div>
                <div className="w-12 text-right font-mono text-sm">{total}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-black/[0.03] p-3 ring-1 ring-black/5">
      <div className="font-display text-2xl leading-none text-[#12121a]">{value}</div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-black/50">{label}</div>
    </div>
  );
}

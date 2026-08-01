import { createFileRoute } from "@tanstack/react-router";
import { useSkillon } from "@/lib/skillon-store";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
} from "recharts";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Skillon Admin" },
      { name: "description", content: "Cohort-wide completion, member × track matrix." },
    ],
  }),
  component: Analytics,
});

function Analytics() {
  const s = useSkillon();
  const totalItems = s.tracks.flatMap((t) => t.items).length;
  const cohortDone = s.members.reduce((sum, m) => sum + s.completedItemsFor(m.id).size, 0);
  const cohortPct = totalItems ? Math.round((cohortDone / (totalItems * s.members.length)) * 100) : 0;

  const memberRanks = s.members
    .map((m) => {
      const done = s.completedItemsFor(m.id).size;
      return { 
        name: m.name.split(" ")[0], 
        pct: totalItems ? Math.round((done / totalItems) * 100) : 0 
      };
    })
    .sort((a, b) => b.pct - a.pct);

  const trackRanks = s.tracks
    .map((t) => ({ 
      subject: t.name.split(" ")[0], 
      A: s.cohortCompletionForTrack(t.id).pct,
      fullMark: 100 
    }));

  return (
    <div className="grid gap-6">
      <section className="card-glass p-6">
        <div className="pill bg-[#fff4cf] text-[#12121a] inline-block">Cohort · 9 members</div>
        <h1 className="mt-3 font-display text-3xl text-slate-900">Completion analytics</h1>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Kpi n={`${cohortPct}%`} l="Overall" tone="blue" />
          <Kpi n={String(cohortDone)} l="Completed" />
          <Kpi n={String(totalItems * s.members.length)} l="Possible" />
        </div>
      </section>

      {/* CHARTS */}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="card-glass p-5 flex flex-col">
          <h2 className="font-display text-lg text-slate-900">Member Progress</h2>
          <div className="flex-1 mt-4 h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberRanks} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip cursor={{ fill: "#f1f5f9" }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                  {memberRanks.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "#ffb84d" : "#12121a"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card-glass p-5 flex flex-col">
          <h2 className="font-display text-lg text-slate-900">Cohort Track Radar</h2>
          <div className="flex-1 mt-4 h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={trackRanks}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#64748b" }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="Cohort Avg %" dataKey="A" stroke="#12121a" fill="#ffd970" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* MATRIX */}
      <section className="card-glass p-5">
        <h2 className="font-display text-lg text-slate-900">Member × Track matrix</h2>
        <p className="text-xs text-slate-500 mt-1">Each cell shows that member's completion in that track.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500">
                <th className="text-left font-medium py-2 pr-3 sticky left-0 bg-white/80 backdrop-blur">Member</th>
                {s.tracks.map((t) => (
                  <th key={t.id} className="px-2 py-2 font-medium text-[10px] uppercase tracking-widest whitespace-nowrap">{t.name.split(" ")[0]}</th>
                ))}
                <th className="px-2 py-2 font-medium text-[10px] uppercase tracking-widest">Total</th>
              </tr>
            </thead>
            <tbody>
              {s.members.map((m) => {
                const cells = s.tracks.map((t) => s.completionForTrack(t.id, m.id));
                const total = cells.reduce((a, c) => a + c.done, 0);
                const totalPossible = cells.reduce((a, c) => a + c.total, 0);
                const pct = totalPossible ? Math.round((total / totalPossible) * 100) : 0;
                return (
                  <tr key={m.id} className="border-t border-slate-100">
                    <td className="py-2 pr-3 sticky left-0 bg-white/80 backdrop-blur">
                      <div className="text-slate-900 text-sm">{m.name}</div>
                      <div className="text-[10px] text-slate-500">{m.role}</div>
                    </td>
                    {cells.map((c, i) => (
                      <td key={i} className="px-2 py-2 whitespace-nowrap text-center">
                        <span
                          className="inline-block rounded-full px-2 py-0.5 text-white font-mono text-[10px]"
                          style={{
                            background: `hsl(${210 + Math.min(30, c.pct / 3)}, 80%, ${Math.max(45, 90 - c.pct / 2)}%)`,
                          }}
                        >
                          {c.done}/{c.total}
                        </span>
                      </td>
                    ))}
                    <td className="px-2 py-2 whitespace-nowrap text-center">
                      <span className="inline-block rounded-full bg-[#12121a] text-white px-2 py-0.5 font-mono text-[10px]">
                        {pct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Kpi({ n, l, tone }: { n: string; l: string; tone?: "blue" }) {
  return (
    <div className={`rounded-2xl p-3 text-center ${tone === "blue" ? "bg-[#12121a] text-white" : "bg-slate-50 text-slate-800"}`}>
      <div className="font-display text-xl leading-none">{n}</div>
      <div className={`mt-1 text-[9px] uppercase tracking-widest ${tone === "blue" ? "text-white/70" : "text-slate-500"}`}>{l}</div>
    </div>
  );
}

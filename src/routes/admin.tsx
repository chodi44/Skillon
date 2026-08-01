import { createFileRoute, Link, Navigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SkyShell, TopBar, PageHero, Panel } from "@/components/site-header";
import { useSkillon } from "@/lib/skillon-store";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Skillon" },
      { name: "description", content: "Super Admin control room for Skillon." },
      { property: "og:title", content: "Admin — Skillon" },
      { property: "og:description", content: "Publish curriculum, analyze cohort progress." },
    ],
  }),
  component: AdminShell,
});

const tabs = [
  { to: "/admin", label: "Overview" },
  { to: "/admin/content", label: "Curriculum" },
  { to: "/admin/tasks", label: "Tasks" },
  { to: "/admin/assessments", label: "Tests" },
  { to: "/admin/coding", label: "Coding" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/notifications", label: "Broadcast" },
  { to: "/admin/users", label: "Users" },
] as const;

function AdminShell() {
  const { ready, isAuthenticated, isSuperAdmin, user } = useAuth();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isOverview = pathname === "/admin";

  if (!ready) {
    return (
      <SkyShell>
        <main className="relative z-10 grid min-h-[70vh] place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-butter" />
        </main>
      </SkyShell>
    );
  }
  if (!isAuthenticated) return <Navigate to="/auth" replace />;

  if (!isSuperAdmin) {
    return (
      <SkyShell>
        <TopBar title="Admin" />
        <main className="relative z-10 mx-auto max-w-md px-5 pt-8 pb-32">
          <div className="card-glass p-6 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-100 text-red-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h1 className="mt-3 font-display text-2xl text-[#12121a]">Access denied</h1>
            <p className="mt-1 text-sm text-black/60">
              You're signed in as <b>{user?.email}</b>, but only the Super Admin can open this area.
            </p>
            <Link to="/dashboard" className="btn-primary mt-4 inline-flex">Back to dashboard</Link>
          </div>
        </main>
      </SkyShell>
    );
  }

  return (
    <SkyShell>
      <TopBar title="Admin" />
      <main className="relative z-10 px-5 pb-32 pt-4 space-y-6">
        {isOverview && <Overview />}

        <div className="-mx-5 overflow-x-auto px-5">
          <div className="flex gap-2 w-max pb-1">
            {tabs.map((t) => {
              const active = t.to === "/admin" ? pathname === "/admin" : pathname.startsWith(t.to);
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${
                    active
                      ? "bg-butter text-[#12121a] shadow"
                      : "bg-white/10 text-white ring-1 ring-white/10"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        </div>

        {!isOverview && <Outlet />}
      </main>
    </SkyShell>
  );
}


function Overview() {
  const s = useSkillon();
  const totalItems = s.tracks.flatMap((t) => t.items).length;
  const cohortDone = s.members.reduce((sum, m) => sum + s.completedItemsFor(m.id).size, 0);
  const cohortPct = totalItems ? Math.round((cohortDone / (totalItems * s.members.length)) * 100) : 0;
  const adminItems = s.tracks.flatMap((t) => t.items).filter((i) => i.createdBy === "admin").length;

  const { data: live, isLoading } = useQuery({
    queryKey: ["admin", "platform-stats"],
    queryFn: async () => {
      const since24h = new Date(Date.now() - 24 * 3600e3).toISOString();
      const since7d = new Date(Date.now() - 7 * 24 * 3600e3).toISOString();
      const [totalUsers, admins, recent, newToday] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "super_admin"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("updated_at", since7d),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", since24h),
      ]);
      return {
        totalUsers: totalUsers.count ?? 0,
        admins: admins.count ?? 0,
        activeWeek: recent.count ?? 0,
        newToday: newToday.count ?? 0,
      };
    },
    refetchInterval: 30_000,
  });

  return (
    <>
      <PageHero
        eyebrow="Control room"
        title="Platform overview."
        subtitle="Real-time statistics across every learner on Skillon."
        stats={[
          { label: "Students", value: isLoading ? "…" : (live?.totalUsers ?? 0) },
          { label: "Active 7d", value: isLoading ? "…" : (live?.activeWeek ?? 0) },
          { label: "New 24h", value: isLoading ? "…" : (live?.newToday ?? 0) },
          { label: "Admins", value: isLoading ? "…" : (live?.admins ?? 0) },
        ]}
      />

      <Panel title="Platform snapshot">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <StatCard label="Total students" value={live?.totalUsers ?? 0} loading={isLoading} />
          <StatCard label="Super Admin" value={live?.admins ?? 0} loading={isLoading} />
          <StatCard label="New today" value={live?.newToday ?? 0} loading={isLoading} />
          <StatCard label="Active 7d" value={live?.activeWeek ?? 0} loading={isLoading} />
          <StatCard label="Tracks" value={s.tracks.length} />
          <StatCard label="Lessons" value={totalItems} />
        </div>
      </Panel>

      <div className="grid gap-3">
        <ActionCard to="/admin/content" title="Publish a lesson" body="Add an item to any track — description, message, links." />
        <ActionCard to="/admin/analytics" title="Cohort analytics" body="Who finished what. Track-by-track matrix across every learner." />
        <ActionCard to="/admin/notifications" title="Broadcast" body="Send a message or resource to the cohort." />
        <ActionCard to="/admin/users" title="Manage users" body="View and manage every registered learner." />
      </div>

      <Panel title="Per-track completion" action={<span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">cohort · {adminItems} published</span>}>
        <ul className="space-y-3">
          {s.tracks.map((t) => {
            const c = s.cohortCompletionForTrack(t.id);
            return (
              <li key={t.id} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-slate-900">{t.name}</div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-[#12121a]" style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
                <div className="w-24 text-right">
                  <div className="font-mono text-sm text-slate-900">{c.pct}%</div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{c.done}/{c.total}</div>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 text-[10px] font-mono uppercase tracking-widest text-slate-400">
          Cohort avg · {cohortPct}%
        </div>
      </Panel>
    </>
  );
}

function StatCard({ label, value, loading }: { label: string; value: number | string; loading?: boolean }) {
  return (
    <div className="rounded-2xl bg-black/[0.03] p-3 ring-1 ring-black/5">
      <div className="font-display text-2xl leading-none text-[#12121a]">
        {loading ? <span className="text-black/30">…</span> : value}
      </div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-black/50">{label}</div>
    </div>
  );
}

function ActionCard({ to, title, body }: { to: string; title: string; body: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 rounded-3xl bg-white/85 backdrop-blur p-5 shadow-sm ring-1 ring-slate-200 transition hover:ring-[#12121a]"
    >
      <div className="flex-1">
        <div className="text-[15px] font-medium text-slate-900">{title}</div>
        <div className="mt-1 text-sm text-slate-600">{body}</div>
      </div>
      <span className="text-[#12121a]">→</span>
    </Link>
  );
}

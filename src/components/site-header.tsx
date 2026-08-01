import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

import { Home, BookOpen, LayoutDashboard, Bell, Shield, Grid2x2, Code2, User, ClipboardList, HelpCircle } from "lucide-react";
import { usePushSubscription } from "@/lib/push-client";

const nav = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/learn", label: "Learn", Icon: BookOpen },
  { to: "/dashboard", label: "Today", Icon: LayoutDashboard },
  { to: "/coding", label: "Code", Icon: Code2 },
  { to: "/mock", label: "Tests", Icon: ClipboardList },
  { to: "/me", label: "Me", Icon: User },
  { to: "/notifications", label: "Alerts", Icon: Bell },
] as const;

export function TopBar({ title, back }: { title?: string; back?: string }) {
  const { user, isSuperAdmin } = useAuth();
  const { state: pushState, requestSubscription } = usePushSubscription();
  return (
    <header className="relative z-20 flex items-center justify-between px-5 pt-6">
      {back ? (
        <Link
          to={back}
          className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-butter ring-1 ring-white/10 backdrop-blur"
        >
          ←
        </Link>
      ) : (
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10 backdrop-blur">
          <Grid2x2 className="h-4 w-4 text-butter" />
        </div>
      )}
      <div className="flex items-center gap-2">
        <img src="/logo.png" alt="Skillon Logo" className="h-8 w-8 rounded-lg object-cover shadow-sm ring-1 ring-white/10" />
        <div className="font-display text-[15px] text-foreground leading-none">{title ?? "Skillon"}</div>
      </div>
      <div className="flex items-center gap-1.5">
        {/* Push notification opt-in */}
        {pushState === "prompt" && (
          <button
            onClick={requestSubscription}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-butter ring-1 ring-white/10 backdrop-blur animate-pulse"
            title="Enable push notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
        )}
        {pushState === "subscribed" && (
          <div
            className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30 backdrop-blur"
            title="Push notifications enabled"
          >
            <Bell className="h-4 w-4" />
          </div>
        )}
        <Link
          to="/doubts"
          className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-butter ring-1 ring-white/10 backdrop-blur hover:bg-white/20 transition-colors"
          title="Q&A Forum"
        >
          <HelpCircle className="h-4 w-4" />
        </Link>
        <Link
          to="/auth"
          className={`grid h-10 w-10 place-items-center rounded-full ring-1 backdrop-blur ${
            isSuperAdmin
              ? "bg-butter text-[#12121a] ring-butter"
              : "bg-white/10 text-foreground ring-white/10"
          }`}
          title={user ? (isSuperAdmin ? "Super Admin — account" : "Account") : "Sign in"}
        >
          {user ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
        </Link>
      </div>
    </header>
  );
}


export function BottomNav() {
  const { isSuperAdmin } = useAuth();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const items = [...nav, ...(isSuperAdmin ? [{ to: "/admin", label: "Admin", Icon: Shield } as const] : [])];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 px-4 pb-4">
      <div className="mx-auto max-w-md rounded-full bg-[#14141a]/95 backdrop-blur shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7)] ring-1 ring-white/10 p-1.5 flex items-center justify-between">
        {items.map((n) => {
          const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-full transition ${
                active ? "bg-butter text-[#12121a]" : "text-white/60"
              }`}
            >
              <n.Icon className="h-4 w-4" />
              <span className="text-[10px] font-bold">{n.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Dark shell with soft warm blobs — used by every page */
export function SkyShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-sky-motion overflow-hidden text-foreground">
      {children}
      <BottomNav />
    </div>
  );
}

/** Dark hero card with butter accent — replaces the old blue gradient */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  stats,
  children,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  stats?: { label: string; value: React.ReactNode }[];
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden card-ink p-6">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-butter/25 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-14 -left-8 h-40 w-40 rounded-full bg-lilac/15 blur-2xl" />
      <div className="relative">
        {eyebrow && (
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-butter ring-1 ring-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-butter" />
            {eyebrow}
          </div>
        )}
        <h1 className="mt-4 font-display text-[34px] leading-[1.02] text-white">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-white/70">{subtitle}</p>}
        {stats && stats.length > 0 && (
          <div className={`mt-5 grid gap-2 ${stats.length >= 4 ? "grid-cols-4" : stats.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
            {stats.map((s, i) => (
              <div
                key={i}
                className={`rounded-2xl px-3 py-3 text-center ring-1 ${
                  i === 0
                    ? "bg-butter text-[#12121a] ring-butter/60"
                    : "bg-white/5 text-white ring-white/10"
                }`}
              >
                <div className="font-display text-2xl leading-none">{s.value}</div>
                <div className={`mt-1 text-[10px] font-bold uppercase tracking-[0.18em] ${i === 0 ? "text-[#12121a]/70" : "text-white/60"}`}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </section>
  );
}

/** White pillowy content block — used inside every route */
export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card-glass p-5 text-[#12121a] ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between">
          {title && <h2 className="font-display text-lg text-[#12121a]">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Legacy shims — some old routes still import these */
export function SiteHeader() {
  return <TopBar />;
}
export function SiteFooter() {
  return <div className="h-24" />;
}

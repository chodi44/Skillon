import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SkyShell, TopBar, PageHero, Panel } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Bell, ExternalLink, AlertTriangle, Megaphone } from "lucide-react";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Alerts — Skillon" },
      { name: "description", content: "Cohort updates, new curriculum, and admin messages." },
      { property: "og:title", content: "Alerts — Skillon" },
      { property: "og:description", content: "What's new for your cohort." },
    ],
  }),
  component: Notifications,
});

type LinkItem = { label: string; url: string };
type Row = {
  id: string;
  title: string;
  message: string;
  links: LinkItem[] | null;
  channel: string;
  priority: string;
  audience: string;
  created_at: string;
};

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Notifications() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [reads, setReads] = useState<Set<string>>(new Set());

  const load = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setRows((data as any) ?? []);
    if (user) {
      const { data: r } = await supabase
        .from("notification_reads")
        .select("notification_id")
        .eq("user_id", user.id);
      setReads(new Set((r ?? []).map((x: any) => x.notification_id)));
    }
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("student-notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Mark everything visible as read on mount
  useEffect(() => {
    if (!user || rows.length === 0) return;
    const unread = rows.filter((r) => !reads.has(r.id));
    if (unread.length === 0) return;
    supabase
      .from("notification_reads")
      .upsert(unread.map((r) => ({ notification_id: r.id, user_id: user.id })), {
        onConflict: "notification_id,user_id",
      })
      .then(() => {
        setReads((prev) => {
          const next = new Set(prev);
          unread.forEach((r) => next.add(r.id));
          return next;
        });
      });
  }, [rows, user?.id]);

  const unreadCount = useMemo(() => rows.filter((r) => !reads.has(r.id)).length, [rows, reads]);

  return (
    <SkyShell>
      <TopBar title="Alerts" />
      <main className="relative z-10 px-5 pb-32 pt-4 space-y-6">
        <PageHero
          eyebrow="Cohort feed"
          title="What's new."
          subtitle="Messages from your admin — live."
          stats={[
            { label: "Unread", value: unreadCount },
            { label: "Total", value: rows.length },
            { label: "Live", value: "●" },
          ]}
        />

        <Panel title="Announcements">
          <ul className="space-y-3">
            {rows.length === 0 && (
              <li className="py-6 text-center text-sm text-slate-500">No alerts yet.</li>
            )}
            {rows.map((r) => {
              const isUnread = !reads.has(r.id);
              const Icon =
                r.priority === "urgent" ? AlertTriangle : r.channel === "push" ? Megaphone : Bell;
              const tone =
                r.priority === "urgent"
                  ? "from-red-500 to-orange-500"
                  : r.priority === "important"
                  ? "from-[#ffd970] to-[#ffb84d]"
                  : "from-sky-400 to-indigo-500";
              return (
                <li
                  key={r.id}
                  className={`flex gap-3 rounded-2xl p-4 ring-1 ${
                    isUnread ? "bg-white ring-[#ffd970]" : "bg-white/70 ring-slate-200"
                  }`}
                >
                  <div
                    className={`grid h-10 w-10 flex-none place-items-center rounded-2xl bg-gradient-to-br ${tone} text-white`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-[10px] font-mono uppercase tracking-widest text-[#12121a]">
                        {r.priority} · {r.audience}
                      </div>
                      <div className="text-[10px] text-slate-400">{timeAgo(r.created_at)}</div>
                      {isUnread && <span className="h-1.5 w-1.5 rounded-full bg-signal" />}
                    </div>
                    <div className="mt-0.5 text-[15px] font-semibold text-slate-900">{r.title}</div>
                    <div className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{r.message}</div>
                    {r.links && r.links.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {r.links.map((l, i) => (
                          <a
                            key={i}
                            href={l.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-700"
                          >
                            {l.label || l.url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </main>
    </SkyShell>
  );
}

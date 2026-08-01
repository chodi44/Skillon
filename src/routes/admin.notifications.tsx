import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { sendPushNotification } from "@/lib/push.functions";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Skillon Admin" },
      { name: "description", content: "Send announcements, share links, and message students." },
    ],
  }),
  component: NotificationsPage,
});

type LinkItem = { label: string; url: string };
type Row = {
  id: string;
  title: string;
  message: string;
  links: LinkItem[];
  channel: string;
  priority: string;
  audience: string;
  created_at: string;
};

function NotificationsPage() {
  const { user } = useAuth();
  const sendPush = useServerFn(sendPushNotification);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState("in-app");
  const [priority, setPriority] = useState("normal");
  const [audience, setAudience] = useState("all");
  const [links, setLinks] = useState<LinkItem[]>([{ label: "", url: "" }]);
  const [flash, setFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(25);
    setRows((data as any) ?? []);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const updateLink = (i: number, patch: Partial<LinkItem>) =>
    setLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const addLink = () => setLinks((p) => [...p, { label: "", url: "" }]);
  const removeLink = (i: number) => setLinks((p) => p.filter((_, idx) => idx !== i));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const cleanLinks = links.filter((l) => l.url.trim());
    const { error } = await supabase.from("notifications").insert({
      title: title.trim(),
      message: message.trim(),
      channel,
      priority,
      audience,
      links: cleanLinks,
      created_by: user?.id ?? null,
    });
    
    if (!error && channel === "push") {
      try {
        await sendPush({
          data: {
            title: title.trim(),
            body: message.trim()
          }
        });
      } catch (pushErr: any) {
        console.error("Web push failed:", pushErr);
      }
    }

    setBusy(false);
    if (error) {
      setFlash(`Error: ${error.message}`);
    } else {
      setFlash(`Sent "${title}"`);
      setTitle("");
      setMessage("");
      setLinks([{ label: "", url: "" }]);
    }
    setTimeout(() => setFlash(null), 3000);
  };

  const del = async (id: string) => {
    if (!confirm("Delete this notification?")) return;
    await supabase.from("notifications").delete().eq("id", id);
  };

  return (
    <div>
      <div className="eyebrow">Admin · Notifications</div>
      <h1 className="mt-2 font-display text-4xl">Message students</h1>
      <p className="mt-2 text-muted-foreground">
        Send real announcements. Every signed-in student will see them live in their Alerts tab.
      </p>

      <form onSubmit={submit} className="hairline mt-8 rounded-lg p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <div className="eyebrow mb-2">Title</div>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} className="field" placeholder="e.g. GATE DA Mock #4 is live" />
          </label>

          <label className="block md:col-span-2">
            <div className="eyebrow mb-2">Message</div>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="field-textarea"
              placeholder="Write the full message students will see."
            />
          </label>

          <label className="block">
            <div className="eyebrow mb-2">Channel</div>
            <select value={channel} onChange={(e) => setChannel(e.target.value)} className="field">
              <option value="in-app">In-app</option>
              <option value="email">Email</option>
              <option value="push">Push</option>
            </select>
          </label>
          <label className="block">
            <div className="eyebrow mb-2">Priority</div>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="field">
              <option value="normal">Normal</option>
              <option value="important">Important</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>

          <label className="block md:col-span-2">
            <div className="eyebrow mb-2">Audience</div>
            <select value={audience} onChange={(e) => setAudience(e.target.value)} className="field">
              <option value="all">All students</option>
              <option value="gate-da">GATE DA track</option>
              <option value="placement">Placement tracks</option>
            </select>
          </label>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <div className="eyebrow">Attached links</div>
              <button type="button" onClick={addLink} className="hairline inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs hover:bg-surface-2">
                <Plus className="h-3 w-3" /> Add link
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {links.map((l, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <input value={l.label} onChange={(e) => updateLink(i, { label: e.target.value })} className="field col-span-4" placeholder="Label" />
                  <input value={l.url} onChange={(e) => updateLink(i, { url: e.target.value })} className="field col-span-7" placeholder="https://…" />
                  <button type="button" onClick={() => removeLink(i)} className="hairline col-span-1 grid place-items-center rounded-md hover:bg-surface-2" aria-label="Remove">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button type="submit" disabled={busy} className="btn-primary">{busy ? "Sending…" : "Send now"}</button>
          {flash && <span className="text-sm text-signal">{flash}</span>}
        </div>
      </form>

      <section className="mt-10">
        <div className="eyebrow">Sent ({rows.length})</div>
        <ul className="hairline-t mt-3 divide-y divide-border">
          {rows.length === 0 && <li className="py-6 text-sm text-muted-foreground">No notifications yet.</li>}
          {rows.map((r) => (
            <li key={r.id} className="grid grid-cols-12 items-baseline gap-3 py-4">
              <span className="col-span-6 text-sm">
                <span className="font-medium">{r.title}</span>
                <span className="ml-2 text-xs text-muted-foreground">{r.message.slice(0, 60)}{r.message.length > 60 ? "…" : ""}</span>
              </span>
              <span className="col-span-2 font-mono text-xs uppercase text-muted-foreground">{r.channel}</span>
              <span className="col-span-2 text-xs text-muted-foreground">{r.audience}</span>
              <span className="col-span-1 text-right font-mono text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
              <button onClick={() => del(r.id)} className="col-span-1 justify-self-end text-muted-foreground hover:text-signal">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

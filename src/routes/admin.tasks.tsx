import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useSkillon, TASK_CATEGORIES, type Link as LinkType, type TaskCategory, type Difficulty, type DailyTask, today } from "@/lib/skillon-store";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/tasks")({
  head: () => ({ meta: [{ title: "Daily tasks — Admin" }] }),
  component: AdminTasks,
});

function AdminTasks() {
  const s = useSkillon();
  const [form, setForm] = useState<Omit<DailyTask, "id" | "createdAt">>({
    title: "", description: "", category: "coding", trackId: undefined,
    difficulty: "medium", priority: "normal", dueDate: today(), dueTime: "",
    estimatedMin: 30, xp: 20, links: [], assignTo: "all",
  });
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [assignMode, setAssignMode] = useState<"all" | "select">("all");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const addLink = () => {
    if (!linkUrl.trim()) return;
    setForm({ ...form, links: [...form.links, { label: linkLabel.trim() || "Link", url: linkUrl.trim() }] });
    setLinkLabel(""); setLinkUrl("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    s.addTask({ ...form, assignTo: assignMode === "all" ? "all" : selectedMembers });
    setFlash(`Assigned "${form.title}"`);
    setTimeout(() => setFlash(null), 2000);
    setForm({ ...form, title: "", description: "", links: [] });
  };

  const stats = (t: DailyTask) => {
    const audience = t.assignTo === "all" ? s.members.map((m) => m.id) : t.assignTo;
    const done = audience.filter((mid) => s.isTaskDone(t.id, mid)).length;
    return { done, total: audience.length };
  };

  const todayTasks = s.tasks.filter((t) => t.dueDate === today());
  const upcoming = s.tasks.filter((t) => t.dueDate > today());
  const past = s.tasks.filter((t) => t.dueDate < today());

  return (
    <div className="grid gap-5">
      <form onSubmit={submit} className="card-glass p-6">
        <div className="pill bg-[#fff4cf] text-[#12121a] inline-block">Assign task</div>
        <h2 className="mt-3 font-display text-2xl text-slate-900">Create daily task</h2>
        <div className="mt-4 grid gap-3">
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Task title" className={inp} />
          <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description / instructions" className={`${inp} min-h-[80px]`} />

          <div className="grid grid-cols-2 gap-2">
            <Sel label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v as TaskCategory })}
              options={TASK_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))} />
            <Sel label="Track" value={form.trackId ?? ""} onChange={(v) => setForm({ ...form, trackId: v || undefined })}
              options={[{ value: "", label: "— none —" }, ...s.tracks.map((t) => ({ value: t.id, label: t.name }))]} />
            <Sel label="Difficulty" value={form.difficulty} onChange={(v) => setForm({ ...form, difficulty: v as Difficulty })}
              options={[{ value: "easy", label: "Easy" }, { value: "medium", label: "Medium" }, { value: "hard", label: "Hard" }]} />
            <Sel label="Priority" value={form.priority} onChange={(v) => setForm({ ...form, priority: v as DailyTask["priority"] })}
              options={[{ value: "low", label: "Low" }, { value: "normal", label: "Normal" }, { value: "high", label: "High" }]} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Due date"><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className={inp} /></Field>
            <Field label="Due time"><input type="time" value={form.dueTime ?? ""} onChange={(e) => setForm({ ...form, dueTime: e.target.value })} className={inp} /></Field>
            <Field label="Estimated (min)"><input type="number" min={5} value={form.estimatedMin} onChange={(e) => setForm({ ...form, estimatedMin: +e.target.value })} className={inp} /></Field>
            <Field label="XP reward"><input type="number" min={0} value={form.xp} onChange={(e) => setForm({ ...form, xp: +e.target.value })} className={inp} /></Field>
          </div>

          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Attachments</div>
            <div className="grid grid-cols-[1fr_2fr_auto] gap-2">
              <input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="Label (PDF/Video/Link)" className={inp} />
              <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" className={inp} />
              <button type="button" onClick={addLink} className="rounded-full bg-slate-100 px-3 text-slate-700 text-xs"><Plus className="h-3 w-3" /></button>
            </div>
            {form.links.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.links.map((l, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700">
                    {l.label}
                    <button type="button" onClick={() => setForm({ ...form, links: form.links.filter((_, idx) => idx !== i) })} className="text-slate-500">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Assign to</div>
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => setAssignMode("all")}
                className={`rounded-full px-3 py-1.5 text-xs ${assignMode === "all" ? "bg-[#12121a] text-white" : "bg-slate-100 text-slate-700"}`}>All students</button>
              <button type="button" onClick={() => setAssignMode("select")}
                className={`rounded-full px-3 py-1.5 text-xs ${assignMode === "select" ? "bg-[#12121a] text-white" : "bg-slate-100 text-slate-700"}`}>Select…</button>
            </div>
            {assignMode === "select" && (
              <div className="flex flex-wrap gap-1.5">
                {s.members.map((m) => {
                  const on = selectedMembers.includes(m.id);
                  return (
                    <button type="button" key={m.id}
                      onClick={() => setSelectedMembers((p) => on ? p.filter((x) => x !== m.id) : [...p, m.id])}
                      className={`rounded-full px-3 py-1.5 text-xs ${on ? "bg-[#12121a] text-white" : "bg-slate-100 text-slate-700"}`}>
                      {m.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button className="rounded-full bg-[#12121a] px-5 py-2.5 text-sm font-medium text-white" type="submit">Assign task</button>
            {flash && <span className="text-xs text-emerald-600">{flash}</span>}
          </div>
        </div>
      </form>

      <TaskSection title="Today" tasks={todayTasks} stats={stats} onDelete={s.removeTask} />
      <TaskSection title="Upcoming" tasks={upcoming} stats={stats} onDelete={s.removeTask} />
      <TaskSection title="Past" tasks={past} stats={stats} onDelete={s.removeTask} />
    </div>
  );
}

function TaskSection({ title, tasks, stats, onDelete }: {
  title: string; tasks: DailyTask[];
  stats: (t: DailyTask) => { done: number; total: number };
  onDelete: (id: string) => void;
}) {
  if (tasks.length === 0) return null;
  return (
    <div className="card-glass p-5">
      <h3 className="font-display text-lg text-slate-900 mb-3">{title} · {tasks.length}</h3>
      <ul className="divide-y divide-slate-100">
        {tasks.map((t) => {
          const st = stats(t);
          const pct = Math.round((st.done / Math.max(1, st.total)) * 100);
          return (
            <li key={t.id} className="py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    t.priority === "high" ? "bg-red-100 text-red-700" :
                    t.priority === "low" ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-700"
                  }`}>{t.priority}</span>
                  <div className="text-sm font-medium text-slate-900">{t.title}</div>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{t.description}</div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mt-1">
                  {t.dueDate}{t.dueTime ? ` · ${t.dueTime}` : ""} · {t.estimatedMin}min · {t.xp}xp · {t.assignTo === "all" ? "All" : `${t.assignTo.length} student(s)`}
                </div>
              </div>
              <div className="w-24 flex-none">
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-[#12121a]" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-1 text-[10px] font-mono text-slate-500 text-right">{st.done}/{st.total}</div>
              </div>
              <button onClick={() => onDelete(t.id)} className="rounded-full bg-red-50 text-red-600 p-1.5">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const inp = "w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#12121a]";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<label className="block"><div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">{label}</div>{children}</label>);
}
function Sel({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inp}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { SkyShell, TopBar, PageHero } from "@/components/site-header";
import { useAuth } from "@/lib/auth";
import {
  usePersonalTracks,
  usePersonalNotes,
  usePersonalAlarms,
  usePersonalTimetable,
  DAY_LABELS,
  type PersonalTrack,
} from "@/lib/personal-store";
import { Plus, Trash2, Pencil, Check, X, ExternalLink, Play, Pause, RotateCcw, Bell, Timer, Clock, StickyNote, Layers, CalendarDays, User, LogOut, Flag, SkipForward, Settings2, Globe, Zap, Mail, Send, Copy, Search, Pin, Tag, BookOpen, AlignLeft, Hash, Bold } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/me")({
  component: MePage,
  head: () => ({
    meta: [
      { title: "My Space · Skillon" },
      { name: "description", content: "Your private skills, tracks, notes, timetable, and focus tools." },
    ],
  }),
});

type Tab = "profile" | "tracks" | "notes" | "timetable" | "tools";

function MyBadges() {
  const { user } = useAuth();
  const [earned, setEarned] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_badges")
      .select("awarded_at, badges(name, description, icon)")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setEarned(data);
      });
  }, [user]);

  if (earned.length === 0) return null;

  return (
    <div className="card-ink p-4 rounded-2xl mb-4 border border-white/5 relative overflow-hidden text-left">
      <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-butter/10 blur-xl" />
      <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-butter mb-2">My Achievements</h3>
      <div className="flex flex-wrap gap-2">
        {earned.map((eb, idx) => (
          <div
            key={idx}
            className="flex items-center gap-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition border border-white/10 px-2.5 py-1 text-xs text-white"
            title={`${eb.badges?.name}: ${eb.badges?.description}`}
          >
            <span className="text-sm">{eb.badges?.icon}</span>
            <span className="font-medium text-[10px] tracking-wide">{eb.badges?.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileTab() {
  const { user, signOut } = useAuth();
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [learningTrack, setLearningTrack] = useState("");
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name || "");
          setAvatarUrl(data.avatar_url || "");
          setLearningTrack(data.learning_track || "");
        }
      });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        avatar_url: avatarUrl.trim(),
        learning_track: learningTrack.trim() || null,
      })
      .eq("id", user.id);

    setLoading(false);
    if (error) {
      alert(`Error saving profile: ${error.message}`);
    } else {
      setFlash("Profile updated successfully!");
      setTimeout(() => setFlash(null), 3000);
    }
  };

  return (
    <div className="card-glass p-5 text-slate-800 space-y-4">
      <h2 className="text-lg font-display text-slate-900 mb-1">Edit Profile</h2>
      <p className="text-xs text-slate-500">
        Update your personal details. This information is visible on the cohort dashboard and leaderboards.
      </p>
      <form onSubmit={handleSave} className="space-y-4">
        <label className="block">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1 block">Full Name</span>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none"
            placeholder="Your Name"
          />
        </label>

        <label className="block">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1 block">Avatar Image URL</span>
          <input
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none"
            placeholder="https://example.com/avatar.jpg"
          />
        </label>

        <label className="block">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1 block">Learning Track Focus</span>
          <select
            value={learningTrack}
            onChange={(e) => setLearningTrack(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none"
          >
            <option value="">No specific track</option>
            <option value="GATE DA">GATE Data Science & AI</option>
            <option value="GATE CS">GATE Computer Science</option>
            <option value="AI Engineering">AI Engineering</option>
            <option value="Full Stack">Full Stack Developer</option>
            <option value="SQL">SQL Developer</option>
            <option value="Cloud">Cloud Developer</option>
          </select>
        </label>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary rounded-xl px-4 py-2.5 text-xs font-semibold"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          {flash && <span className="text-xs text-emerald-600 font-medium">{flash}</span>}
        </div>
      </form>

      <hr className="border-slate-100 mt-4 mb-4" />

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-mono max-w-[200px] truncate">
          {user?.email}
        </span>
        <button
          type="button"
          onClick={() => signOut()}
          className="rounded-xl bg-red-50 hover:bg-red-100 px-3.5 py-2 text-xs font-semibold text-red-600 inline-flex items-center gap-1.5 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>
    </div>
  );
}

function MePage() {
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <SkyShell>
      <TopBar title="My Space" />
      <div className="px-5 pt-4 pb-28 max-w-md mx-auto">
        <PageHero
          eyebrow="Private · only you"
          title="Your space"
          subtitle="Personal tracks, notes, timetable, alarms and focus tools. Nothing here is visible to admins or peers."
        />

        <div className="mt-4">
          <MyBadges />
        </div>

        <div className="mt-4 grid grid-cols-5 gap-1 rounded-2xl bg-white/5 p-1 ring-1 ring-white/10">
          {(
            [
              { k: "profile", label: "Profile", Icon: User },
              { k: "tracks", label: "Tracks", Icon: Layers },
              { k: "notes", label: "Notes", Icon: StickyNote },
              { k: "timetable", label: "Table", Icon: CalendarDays },
              { k: "tools", label: "Tools", Icon: Timer },
            ] as const
          ).map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-bold transition ${
                tab === t.k ? "bg-butter text-[#12121a]" : "text-white/70"
              }`}
            >
              <t.Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {tab === "profile" && <ProfileTab />}
          {tab === "tracks" && <TracksTab />}
          {tab === "notes" && <NotesTab />}
          {tab === "timetable" && <TimetableTab />}
          {tab === "tools" && <ToolsTab />}
        </div>
      </div>
    </SkyShell>
  );
}

/* ---------------- TRACKS ---------------- */
function TracksTab() {
  const { tracks, addTrack, renameTrack, removeTrack, addItem, updateItem, removeItem } =
    usePersonalTracks();
  const [newName, setNewName] = useState("");

  return (
    <div className="space-y-4">
      <div className="card-glass p-4">
        <div className="text-[11px] font-black uppercase tracking-widest text-black/50">
          New skill / track
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. System Design, UPSC, Guitar…"
            className="flex-1 rounded-xl bg-black/5 px-3 py-2 text-[13px] text-black outline-none placeholder:text-black/40"
          />
          <button
            onClick={() => {
              if (!newName.trim()) return;
              addTrack(newName);
              setNewName("");
            }}
            className="btn-primary rounded-xl px-3 py-2 text-[12px]"
          >
            <Plus className="h-4 w-4 inline -mt-0.5" /> Add
          </button>
        </div>
      </div>

      {tracks.length === 0 && (
        <div className="card-glass p-6 text-center text-black/60 text-[13px]">
          You haven't added any personal tracks yet.
        </div>
      )}

      {tracks.map((t) => (
        <TrackCard
          key={t.id}
          track={t}
          onRename={(n) => renameTrack(t.id, n)}
          onRemove={() => removeTrack(t.id)}
          onAddItem={(item) => addItem(t.id, item)}
          onUpdateItem={(iid, patch) => updateItem(t.id, iid, patch)}
          onRemoveItem={(iid) => removeItem(t.id, iid)}
        />
      ))}
    </div>
  );
}

function TrackCard({
  track,
  onRename,
  onRemove,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
}: {
  track: PersonalTrack;
  onRename: (name: string) => void;
  onRemove: () => void;
  onAddItem: (i: { title: string; description?: string; link?: string }) => void;
  onUpdateItem: (iid: string, patch: any) => void;
  onRemoveItem: (iid: string) => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(track.name);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [link, setLink] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  // Edit Item form states
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editLink, setEditLink] = useState("");

  const done = track.items.filter((i) => i.done).length;
  const pct = track.items.length ? Math.round((done / track.items.length) * 100) : 0;

  return (
    <div className="card-glass p-4">
      <div className="flex items-start gap-3">
        <div
          className="h-10 w-10 rounded-2xl flex-shrink-0"
          style={{ backgroundColor: track.color }}
        />
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex gap-1">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 rounded-lg bg-black/5 px-2 py-1 text-[14px] font-bold text-black outline-none"
                autoFocus
              />
              <button
                onClick={() => {
                  onRename(name.trim() || track.name);
                  setEditingName(false);
                }}
                className="rounded-lg bg-black/10 p-1.5"
              >
                <Check className="h-4 w-4 text-black" />
              </button>
              <button
                onClick={() => {
                  setName(track.name);
                  setEditingName(false);
                }}
                className="rounded-lg bg-black/10 p-1.5"
              >
                <X className="h-4 w-4 text-black" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="font-display text-[18px] text-black leading-tight truncate">
                {track.name}
              </div>
              <button onClick={() => setEditingName(true)} className="text-black/40">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className="mt-1 text-[11px] text-black/50">
            {done}/{track.items.length} done · {pct}%
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-black/10 overflow-hidden">
            <div className="h-full bg-black" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <button
          onClick={() => {
            if (confirm(`Delete "${track.name}" and all its items?`)) onRemove();
          }}
          className="text-black/40"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {track.items.map((it) => {
          if (editingItemId === it.id) {
            return (
              <div key={it.id} className="rounded-2xl bg-black/[0.04] p-3 space-y-2 text-left">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Item title"
                  className="w-full rounded-lg bg-white px-3 py-2 text-[13px] text-black outline-none ring-1 ring-black/10"
                />
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full rounded-lg bg-white px-3 py-2 text-[12px] text-black outline-none ring-1 ring-black/10"
                />
                <input
                  value={editLink}
                  onChange={(e) => setEditLink(e.target.value)}
                  placeholder="Link (optional)"
                  className="w-full rounded-lg bg-white px-3 py-2 text-[12px] text-black outline-none ring-1 ring-black/10"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!editTitle.trim()) return;
                      onUpdateItem(it.id, {
                        title: editTitle.trim(),
                        description: editDesc.trim() || undefined,
                        link: editLink.trim() || undefined,
                      });
                      setEditingItemId(null);
                    }}
                    className="btn-primary rounded-xl px-3 py-1.5 text-[12px]"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingItemId(null)}
                    className="rounded-xl bg-black/10 px-3 py-1.5 text-[12px] font-bold text-black"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={it.id} className="rounded-2xl bg-black/[0.04] p-3">
              <div className="flex items-start gap-2">
                <button
                  onClick={() => onUpdateItem(it.id, { done: !it.done })}
                  className={`mt-0.5 grid h-5 w-5 place-items-center rounded-md ring-1 ${
                    it.done ? "bg-black ring-black" : "bg-white ring-black/20"
                  }`}
                >
                  {it.done && <Check className="h-3 w-3 text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-[13px] font-bold text-black ${
                      it.done ? "line-through opacity-50" : ""
                    }`}
                  >
                    {it.title}
                  </div>
                  {it.description && (
                    <div className="mt-0.5 text-[12px] text-black/60">{it.description}</div>
                  )}
                  {it.link && (
                    <a
                      href={it.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-black/70 underline"
                    >
                      <ExternalLink className="h-3 w-3" /> open
                    </a>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      setEditingItemId(it.id);
                      setEditTitle(it.title);
                      setEditDesc(it.description || "");
                      setEditLink(it.link || "");
                    }}
                    className="text-black/30 hover:text-black/60"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => onRemoveItem(it.id)} className="text-black/30 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showAdd ? (
        <div className="mt-3 rounded-2xl bg-black/[0.04] p-3 space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Item title"
            className="w-full rounded-lg bg-white px-3 py-2 text-[13px] text-black outline-none ring-1 ring-black/10"
          />
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full rounded-lg bg-white px-3 py-2 text-[12px] text-black outline-none ring-1 ring-black/10"
          />
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Link (optional)"
            className="w-full rounded-lg bg-white px-3 py-2 text-[12px] text-black outline-none ring-1 ring-black/10"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!title.trim()) return;
                onAddItem({
                  title: title.trim(),
                  description: desc.trim() || undefined,
                  link: link.trim() || undefined,
                });
                setTitle("");
                setDesc("");
                setLink("");
                setShowAdd(false);
              }}
              className="btn-primary rounded-xl px-3 py-1.5 text-[12px]"
            >
              Add item
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="rounded-xl bg-black/10 px-3 py-1.5 text-[12px] font-bold text-black"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="mt-3 w-full rounded-2xl bg-black/[0.04] py-2 text-[12px] font-bold text-black/70 ring-1 ring-dashed ring-black/15"
        >
          <Plus className="h-3.5 w-3.5 inline -mt-0.5" /> Add step / resource
        </button>
      )}
    </div>
  );
}

/* ---------------- NOTES ---------------- */
function NotesTab() {
  const { notes, addNote, updateNote, removeNote } = usePersonalNotes();
  const [openId, setOpenId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [search, setSearch] = useState("");

  const open = notes.find((n) => n.id === openId) ?? null;

  useEffect(() => {
    if (open) {
      setTitle(open.title);
      setBody(open.body);
    }
  }, [openId]);

  const filtered = notes.filter((n) =>
    (n.title + n.body).toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(`${title}\n\n${body}`);
    alert("Note copied to clipboard!");
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(title || "Skillon Note");
    const mailBody = encodeURIComponent(body);
    window.location.href = `mailto:?subject=${subject}&body=${mailBody}`;
  };

  return (
    <div className="space-y-4">
      {!open && (
        <>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes..."
                className="w-full rounded-2xl bg-white/40 pl-9 pr-3 py-3 text-[13px] text-black outline-none placeholder:text-black/40 ring-1 ring-black/5 focus:ring-black/20"
              />
            </div>
            <button
              onClick={() => {
                const id = addNote("New note", "");
                setOpenId(id);
              }}
              className="btn-primary rounded-2xl px-4 py-3 text-[13px] shrink-0 shadow-md shadow-butter/20"
            >
              <Plus className="h-4 w-4 inline -mt-0.5" />
            </button>
          </div>

          {notes.length === 0 && !search && (
            <div className="card-glass p-8 text-center border border-dashed border-black/10">
              <div className="mx-auto w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mb-3">
                <StickyNote className="h-6 w-6 text-black/30" />
              </div>
              <div className="text-[14px] font-bold text-black/70">No notes yet</div>
              <div className="text-[12px] text-black/50 mt-1">Jot down anything — only you can see this.</div>
            </div>
          )}

          {search && filtered.length === 0 && (
            <div className="text-center text-[12px] text-white/50 py-4">No matching notes found.</div>
          )}

          <div className="grid gap-3">
            {filtered.map((n) => (
              <button
                key={n.id}
                onClick={() => setOpenId(n.id)}
                className="w-full card-glass p-5 text-left group hover:ring-butter/50 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-display text-[17px] text-black leading-tight group-hover:text-[#12121a]">
                    {n.title || "Untitled"}
                  </div>
                  <div className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-black/40 whitespace-nowrap">
                    {new Date(n.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </div>
                </div>
                <div className="mt-2 text-[13px] text-black/60 line-clamp-3 leading-relaxed">
                  {n.body || <span className="italic text-black/30">Empty note</span>}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {open && (
        <div className="card-glass p-1 h-[calc(100vh-140px)] flex flex-col">
          <div className="flex items-center justify-between p-2 pb-3 border-b border-black/5">
            <button
              onClick={() => setOpenId(null)}
              className="rounded-lg bg-black/5 hover:bg-black/10 px-3 py-1.5 text-[12px] font-bold text-black transition-colors"
            >
              ← Back
            </button>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                title="Copy to clipboard"
                className="grid h-8 w-8 place-items-center rounded-lg bg-black/5 hover:bg-black/10 text-black/70 transition-colors"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                onClick={handleEmail}
                title="Send via Email"
                className="grid h-8 w-8 place-items-center rounded-lg bg-black/5 hover:bg-black/10 text-black/70 transition-colors"
              >
                <Mail className="h-4 w-4" />
              </button>
              <div className="w-px h-4 bg-black/10 mx-1" />
              <button
                onClick={() => {
                  if (confirm("Delete this note?")) {
                    removeNote(open.id);
                    setOpenId(null);
                  }
                }}
                title="Delete"
                className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col p-3 gap-2 overflow-y-auto">
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                updateNote(open.id, { title: e.target.value });
              }}
              className="w-full bg-transparent px-1 py-2 font-display text-[22px] text-black outline-none placeholder:text-black/30"
              placeholder="Note Title"
            />
            <textarea
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                updateNote(open.id, { body: e.target.value });
              }}
              className="w-full flex-1 resize-none bg-transparent px-1 py-2 text-[15px] text-black/80 leading-relaxed outline-none placeholder:text-black/30"
              placeholder="Write freely..."
            />
          </div>

          <div className="flex items-center justify-between p-3 border-t border-black/5 bg-black/[0.02] rounded-b-[20px]">
            <div className="text-[10px] font-bold uppercase tracking-widest text-black/40">
              {body.length > 0 ? body.trim().split(/\s+/).length : 0} words · {body.length} chars
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-black/40">
              Saved {new Date(open.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- TOOLS ---------------- */
type ToolKind = "stopwatch" | "timer" | "alarm" | "pomodoro";
type ToolInstance = { id: string; kind: ToolKind; label: string };

/* Shared SVG progress ring */
function ProgressRing({ pct, size = 110, stroke = 8, color = "#f5c842" }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(pct, 1);
  return (
    <svg width={size} height={size} className="absolute top-0 left-0" style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.4s cubic-bezier(.4,0,.2,1)" }} />
    </svg>
  );
}

/* ---------- CLOCK ---------- */
const ZONES = [
  { label: "Local", tz: "" },
  { label: "UTC", tz: "UTC" },
  { label: "New York", tz: "America/New_York" },
  { label: "London", tz: "Europe/London" },
  { label: "Tokyo", tz: "Asia/Tokyo" },
  { label: "Dubai", tz: "Asia/Dubai" },
];

function ClockCard() {
  const [now, setNow] = useState(new Date());
  const [zoneIdx, setZoneIdx] = useState(0);
  const [analog, setAnalog] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const zone = ZONES[zoneIdx];
  const opts: Intl.DateTimeFormatOptions = zone.tz
    ? { timeZone: zone.tz, hour: "2-digit", minute: "2-digit", second: "2-digit" }
    : { hour: "2-digit", minute: "2-digit", second: "2-digit" };
  const dateOpts: Intl.DateTimeFormatOptions = zone.tz
    ? { timeZone: zone.tz, weekday: "long", day: "numeric", month: "long", year: "numeric" }
    : { weekday: "long", day: "numeric", month: "long", year: "numeric" };

  const timeStr = now.toLocaleTimeString([], opts);
  const dateStr = now.toLocaleDateString([], dateOpts);

  // Analog hands
  const getHandAngles = () => {
    const ref = zone.tz ? new Date(now.toLocaleString("en-US", { timeZone: zone.tz })) : now;
    const h = ref.getHours() % 12;
    const m = ref.getMinutes();
    const s = ref.getSeconds();
    return {
      sec: s * 6,
      min: m * 6 + s * 0.1,
      hour: h * 30 + m * 0.5,
    };
  };
  const hands = getHandAngles();

  return (
    <div className="card-glass p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-black uppercase tracking-widest text-black/50 flex items-center gap-1">
          <Clock className="h-3 w-3" /> Local time
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setAnalog((a) => !a)} className={`rounded-lg px-2 py-0.5 text-[10px] font-bold transition ${analog ? "bg-[#12121a] text-butter" : "bg-black/10 text-black/60"}`}>
            {analog ? "Analog" : "Digital"}
          </button>
        </div>
      </div>

      {analog ? (
        <div className="flex justify-center my-2">
          <svg width={130} height={130} viewBox="0 0 130 130">
            <circle cx={65} cy={65} r={62} fill="rgba(0,0,0,0.04)" stroke="rgba(0,0,0,0.08)" strokeWidth={1.5} />
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i * 30 - 90) * (Math.PI / 180);
              const x1 = 65 + 52 * Math.cos(a);
              const y1 = 65 + 52 * Math.sin(a);
              const x2 = 65 + 58 * Math.cos(a);
              const y2 = 65 + 58 * Math.sin(a);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(0,0,0,0.3)" strokeWidth={i % 3 === 0 ? 2.5 : 1} />;
            })}
            {/* Hour */}
            <line x1={65} y1={65}
              x2={65 + 32 * Math.cos((hands.hour - 90) * Math.PI / 180)}
              y2={65 + 32 * Math.sin((hands.hour - 90) * Math.PI / 180)}
              stroke="#12121a" strokeWidth={4} strokeLinecap="round" />
            {/* Minute */}
            <line x1={65} y1={65}
              x2={65 + 44 * Math.cos((hands.min - 90) * Math.PI / 180)}
              y2={65 + 44 * Math.sin((hands.min - 90) * Math.PI / 180)}
              stroke="#12121a" strokeWidth={2.5} strokeLinecap="round" />
            {/* Second */}
            <line x1={65} y1={65}
              x2={65 + 50 * Math.cos((hands.sec - 90) * Math.PI / 180)}
              y2={65 + 50 * Math.sin((hands.sec - 90) * Math.PI / 180)}
              stroke="#f5c842" strokeWidth={1.5} strokeLinecap="round" />
            <circle cx={65} cy={65} r={3} fill="#f5c842" />
          </svg>
        </div>
      ) : (
        <div className="mt-1 font-display text-[42px] text-black leading-none tabular-nums text-center">
          {timeStr}
        </div>
      )}

      <div className="mt-1 text-[12px] text-black/60 text-center">{dateStr}</div>

      {/* Timezone strip */}
      <div className="mt-3 flex gap-1 flex-wrap">
        {ZONES.map((z, i) => (
          <button key={i} onClick={() => setZoneIdx(i)}
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition ${i === zoneIdx ? "bg-[#12121a] text-butter" : "bg-black/5 text-black/50 hover:bg-black/10"}`}>
            <Globe className="h-2.5 w-2.5 inline -mt-0.5 mr-0.5" />{z.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- fmt helper ---------- */
function fmt(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const cs = Math.floor((ms % 1000) / 10);
  return { h, m, s, cs };
}

/* ---------- beep ---------- */
function beep(times = 3, freq = 880) {
  try {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    let t = ctx.currentTime;
    for (let i = 0; i < times; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = freq;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      o.start(t); o.stop(t + 0.4);
      t += 0.5;
    }
    setTimeout(() => ctx.close(), (times + 1) * 500);
  } catch {}
}

/* ---------- STOPWATCH ---------- */
function StopwatchCard() {
  const [ms, setMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const startRef = useRef<number>(0);
  const baseRef = useRef<number>(0);

  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now();
    const id = setInterval(() => {
      setMs(baseRef.current + (performance.now() - startRef.current));
    }, 33);
    return () => clearInterval(id);
  }, [running]);

  const t = fmt(ms);

  // Lap deltas
  const lapDeltas = laps.map((l, i) => l - (laps[i + 1] ?? 0));
  const minDelta = lapDeltas.length ? Math.min(...lapDeltas) : -1;
  const maxDelta = lapDeltas.length ? Math.max(...lapDeltas) : -1;

  return (
    <div className="card-glass p-5">
      <div className="text-[10px] font-black uppercase tracking-widest text-black/50 mb-3">Stopwatch</div>
      <div className="font-display text-[48px] text-black tabular-nums leading-none text-center">
        {String(t.h).padStart(2, "0")}:{String(t.m).padStart(2, "0")}:
        {String(t.s).padStart(2, "0")}
        <span className="text-[24px] text-black/40">.{String(t.cs).padStart(2, "0")}</span>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => {
            if (running) { baseRef.current = ms; setRunning(false); }
            else setRunning(true);
          }}
          className="btn-primary rounded-xl px-4 py-2.5 text-[12px] flex-1 flex items-center justify-center gap-1.5"
        >
          {running ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Start</>}
        </button>
        <button
          onClick={() => { if (running) setLaps([ms, ...laps]); }}
          disabled={!running}
          className="rounded-xl bg-black/10 px-4 py-2.5 text-[12px] font-bold text-black disabled:opacity-40 flex items-center gap-1"
        >
          <Flag className="h-3.5 w-3.5" /> Lap
        </button>
        <button
          onClick={() => { setRunning(false); setMs(0); baseRef.current = 0; setLaps([]); }}
          className="rounded-xl bg-black/10 px-3 py-2.5 text-[12px] font-bold text-black"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {laps.length > 0 && (
        <div className="mt-3 max-h-44 overflow-y-auto space-y-1 rounded-xl bg-black/[0.03] p-2">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-black/40 px-1 pb-1">
            <span>Lap</span><span>Split</span><span>Total</span>
          </div>
          {laps.map((l, i) => {
            const delta = lapDeltas[i];
            const lt = fmt(delta);
            const tt = fmt(l);
            const isFastest = laps.length > 1 && delta === minDelta;
            const isSlowest = laps.length > 1 && delta === maxDelta;
            return (
              <div key={i} className={`flex justify-between text-[12px] font-bold tabular-nums px-1 py-0.5 rounded-lg ${isFastest ? "bg-emerald-500/10 text-emerald-700" : isSlowest ? "bg-red-400/10 text-red-600" : "text-black/70"}`}>
                <span className="w-10">#{laps.length - i}</span>
                <span>{String(lt.m).padStart(2,"0")}:{String(lt.s).padStart(2,"0")}.{String(lt.cs).padStart(2,"0")}</span>
                <span className="text-black/40">{String(tt.m).padStart(2,"0")}:{String(tt.s).padStart(2,"0")}.{String(tt.cs).padStart(2,"0")}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- TIMER ---------- */
const TIMER_PRESETS = [
  { label: "5m", ms: 5 * 60 * 1000 },
  { label: "10m", ms: 10 * 60 * 1000 },
  { label: "15m", ms: 15 * 60 * 1000 },
  { label: "25m", ms: 25 * 60 * 1000 },
  { label: "30m", ms: 30 * 60 * 1000 },
  { label: "1h", ms: 60 * 60 * 1000 },
];

function TimerCard() {
  const [mins, setMins] = useState(10);
  const [secs, setSecs] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!running || remaining === null) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r === null) return r;
        if (r <= 1000) { beep(4); setRunning(false); setDone(true); return 0; }
        return r - 1000;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, remaining]);

  const shown = remaining !== null ? fmt(remaining) : fmt((mins * 60 + secs) * 1000);
  const pct = total && remaining !== null ? (total - remaining) / total : 0;
  const ringSize = 120;

  const applyPreset = (ms: number) => {
    setRunning(false); setDone(false);
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    setMins(m); setSecs(s);
    setRemaining(null); setTotal(null);
  };

  return (
    <div className="card-glass p-5">
      <div className="text-[10px] font-black uppercase tracking-widest text-black/50 mb-2">Countdown timer</div>

      {/* Quick presets */}
      <div className="flex flex-wrap gap-1 mb-3">
        {TIMER_PRESETS.map((p) => (
          <button key={p.label} onClick={() => applyPreset(p.ms)}
            className="rounded-full bg-black/6 hover:bg-black/12 px-2.5 py-0.5 text-[10px] font-bold text-black/70 transition ring-1 ring-black/8">
            <Zap className="h-2.5 w-2.5 inline -mt-0.5 mr-0.5" />{p.label}
          </button>
        ))}
      </div>

      {/* Ring + time */}
      <div className="flex justify-center mb-3">
        <div className="relative" style={{ width: ringSize, height: ringSize }}>
          <ProgressRing pct={pct} size={ringSize} stroke={7} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`font-display text-[26px] tabular-nums leading-none ${done ? "text-emerald-600 animate-pulse" : "text-black"}`}>
              {String(shown.h > 0 ? shown.h : "").replace("", "")}
              {shown.h > 0 ? `${String(shown.h).padStart(2,"0")}:` : ""}
              {String(shown.m).padStart(2, "0")}:{String(shown.s).padStart(2, "0")}
            </div>
            {done && <div className="text-[10px] font-black text-emerald-600 mt-0.5 uppercase tracking-widest">Done!</div>}
          </div>
        </div>
      </div>

      {remaining === null && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <label className="text-[11px] font-bold text-black/60">
            Minutes
            <input type="number" min={0} value={mins} onChange={(e) => setMins(Math.max(0, +e.target.value))}
              className="mt-1 w-full rounded-lg bg-black/5 px-2 py-1.5 text-black outline-none" />
          </label>
          <label className="text-[11px] font-bold text-black/60">
            Seconds
            <input type="number" min={0} max={59} value={secs} onChange={(e) => setSecs(Math.max(0, Math.min(59, +e.target.value)))}
              className="mt-1 w-full rounded-lg bg-black/5 px-2 py-1.5 text-black outline-none" />
          </label>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => {
            if (done) { setDone(false); setRemaining(null); setTotal(null); return; }
            if (remaining === null) {
              const t = (mins * 60 + secs) * 1000;
              if (t <= 0) return;
              setTotal(t); setRemaining(t); setRunning(true);
            } else {
              setRunning((r) => !r);
            }
          }}
          className="btn-primary rounded-xl px-4 py-2 text-[12px] flex-1"
        >
          {done ? "Restart" : running ? "Pause" : remaining === null ? "Start" : "Resume"}
        </button>
        <button onClick={() => { setRunning(false); setRemaining(null); setTotal(null); setDone(false); }}
          className="rounded-xl bg-black/10 px-4 py-2 text-[12px] font-bold text-black">
          Reset
        </button>
      </div>
    </div>
  );
}

/* ---------- ALARMS ---------- */
function AlarmCard() {
  const { alarms, addAlarm, updateAlarm, removeAlarm } = usePersonalAlarms();
  const [time, setTime] = useState("");
  const [label, setLabel] = useState("");
  const [days, setDays] = useState<number[]>([]);
  const [snoozeIds, setSnoozeIds] = useState<Record<string, number>>({});
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const toggleDay = (d: number) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  // Next fire time for an alarm
  const nextFire = (a: { time: string; days: number[]; enabled: boolean }) => {
    if (!a.enabled) return null;
    const [hh, mm] = a.time.split(":").map(Number);
    const candidate = new Date(now);
    candidate.setHours(hh, mm, 0, 0);
    if (a.days.length === 0) {
      if (candidate <= now) candidate.setDate(candidate.getDate() + 1);
      return candidate;
    }
    // Find next matching weekday
    for (let offset = 0; offset < 8; offset++) {
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      d.setHours(hh, mm, 0, 0);
      if (a.days.includes(d.getDay()) && d > now) return d;
    }
    return null;
  };

  const formatCountdown = (target: Date) => {
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return "now";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div className="card-glass p-5">
      <div className="text-[10px] font-black uppercase tracking-widest text-black/50 mb-3 flex items-center gap-1">
        <Bell className="h-3 w-3" /> Alarms
      </div>

      {/* Add alarm */}
      <div className="grid grid-cols-[1fr_1.5fr_auto] gap-2">
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
          className="rounded-lg bg-black/5 px-2 py-1.5 text-[13px] text-black outline-none" />
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label"
          className="rounded-lg bg-black/5 px-2 py-1.5 text-[13px] text-black outline-none" />
        <button onClick={() => { if (!time) return; addAlarm(time, label, days); setTime(""); setLabel(""); setDays([]); }}
          className="btn-primary rounded-lg px-3 text-[12px]">Add</button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {DAY_LABELS.map((lbl, i) => (
          <button key={i} onClick={() => toggleDay(i)}
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-black/10 ${days.includes(i) ? "bg-[#12121a] text-butter" : "bg-black/5 text-black/60"}`}>
            {lbl}
          </button>
        ))}
        <span className="text-[10px] text-black/40 self-center ml-1">{days.length === 0 ? "One-shot" : "Repeats"}</span>
      </div>

      {/* Alarm list */}
      <div className="mt-3 space-y-2">
        {alarms.length === 0 && <div className="text-[12px] text-black/50">No alarms set. Add one above.</div>}
        {alarms.map((a) => {
          const nf = nextFire(a);
          const snoozedUntil = snoozeIds[a.id];
          return (
            <div key={a.id} className="rounded-xl bg-black/[0.04] px-3 py-2.5 space-y-1.5">
              <div className="flex items-center gap-2">
                <button onClick={() => updateAlarm(a.id, { enabled: !a.enabled })}
                  className={`h-6 w-10 rounded-full transition flex-shrink-0 ${a.enabled ? "bg-[#12121a]" : "bg-black/15"}`}>
                  <span className={`block h-5 w-5 translate-y-0.5 rounded-full bg-butter transition ${a.enabled ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
                <div className="font-display text-[20px] text-black tabular-nums">{a.time}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] text-black/70 truncate">{a.label || "—"}</div>
                  <div className="text-[10px] text-black/40">
                    {a.days.length === 0 ? "Once" : a.days.map((d) => DAY_LABELS[d]).join(" · ")}
                  </div>
                </div>
                <button onClick={() => removeAlarm(a.id)} className="text-black/40 hover:text-red-500 transition">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {nf && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-black/40">
                    ⏰ Rings in <span className="font-bold text-black/60">{formatCountdown(nf)}</span>
                  </span>
                  <button
                    onClick={() => {
                      const snoozeMs = 5 * 60 * 1000;
                      setSnoozeIds((s) => ({ ...s, [a.id]: Date.now() + snoozeMs }));
                      updateAlarm(a.id, { enabled: false });
                      setTimeout(() => { updateAlarm(a.id, { enabled: true }); }, snoozeMs);
                    }}
                    className="rounded-full bg-black/8 hover:bg-black/12 px-2 py-0.5 text-[10px] font-bold text-black/60 transition"
                  >
                    +5 Snooze
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-[10px] text-black/40">Rings anywhere in the app on this device.</div>
    </div>
  );
}

/* ---------- POMODORO ---------- */
type PomSession = { phase: "focus" | "break" | "long"; duration: number; completedAt: number };

function PomodoroCard() {
  const [focusMins, setFocusMins] = useState(25);
  const [breakMins, setBreakMins] = useState(5);
  const [longBreakMins, setLongBreakMins] = useState(15);
  const [longBreakEvery, setLongBreakEvery] = useState(4);
  const [showSettings, setShowSettings] = useState(false);

  const FOCUS = focusMins * 60 * 1000;
  const BREAK = breakMins * 60 * 1000;
  const LONG = longBreakMins * 60 * 1000;

  const [phase, setPhase] = useState<"focus" | "break" | "long">("focus");
  const [remaining, setRemaining] = useState(FOCUS);
  const [running, setRunning] = useState(false);
  const [rounds, setRounds] = useState(0);
  const [history, setHistory] = useState<PomSession[]>([]);

  // Reset when settings change
  useEffect(() => {
    setRunning(false);
    setPhase("focus");
    setRemaining(FOCUS);
  }, [focusMins, breakMins, longBreakMins]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1000) {
          beep(3);
          setHistory((h) => [...h, { phase, duration: phase === "focus" ? FOCUS : phase === "long" ? LONG : BREAK, completedAt: Date.now() }]);
          if (phase === "focus") {
            const newRounds = rounds + 1;
            setRounds(newRounds);
            if (newRounds % longBreakEvery === 0) {
              setPhase("long");
              return LONG;
            } else {
              setPhase("break");
              return BREAK;
            }
          } else {
            setPhase("focus");
            return FOCUS;
          }
        }
        return r - 1000;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, phase, rounds, FOCUS, BREAK, LONG, longBreakEvery]);

  const phaseTotal = phase === "focus" ? FOCUS : phase === "long" ? LONG : BREAK;
  const pct = (phaseTotal - remaining) / phaseTotal;
  const t = fmt(remaining);
  const ringSize = 130;
  const phaseColor = phase === "focus" ? "#f5c842" : phase === "long" ? "#60a5fa" : "#34d399";
  const phaseLabel = phase === "focus" ? "Focus" : phase === "long" ? "Long Break" : "Break";

  const skip = () => {
    setRunning(false);
    if (phase === "focus") {
      const newRounds = rounds + 1;
      setRounds(newRounds);
      if (newRounds % longBreakEvery === 0) { setPhase("long"); setRemaining(LONG); }
      else { setPhase("break"); setRemaining(BREAK); }
    } else {
      setPhase("focus"); setRemaining(FOCUS);
    }
  };

  const reset = () => {
    setRunning(false); setPhase("focus"); setRemaining(FOCUS); setRounds(0); setHistory([]);
  };

  const focusDone = history.filter((h) => h.phase === "focus").length;
  const totalFocusMins = Math.round(history.filter((h) => h.phase === "focus").reduce((a, b) => a + b.duration, 0) / 60000);

  return (
    <div className="card-glass p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-black uppercase tracking-widest text-black/50">
          Pomodoro · <span style={{ color: phaseColor }}>{phaseLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[11px] font-bold text-black/60">Round {rounds}</div>
          <button onClick={() => setShowSettings((s) => !s)} className={`rounded-lg p-1 transition ${showSettings ? "bg-[#12121a] text-butter" : "bg-black/10 text-black/60"}`}>
            <Settings2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="mb-3 rounded-xl bg-black/[0.04] p-3 grid grid-cols-2 gap-2">
          {[
            { label: "Focus (min)", val: focusMins, set: setFocusMins },
            { label: "Break (min)", val: breakMins, set: setBreakMins },
            { label: "Long break (min)", val: longBreakMins, set: setLongBreakMins },
            { label: "Long break every", val: longBreakEvery, set: setLongBreakEvery },
          ].map(({ label, val, set }) => (
            <label key={label} className="text-[10px] font-bold text-black/60">
              {label}
              <input type="number" min={1} max={120} value={val} onChange={(e) => set(Math.max(1, +e.target.value))}
                className="mt-1 w-full rounded-lg bg-black/5 px-2 py-1 text-[12px] text-black outline-none" />
            </label>
          ))}
        </div>
      )}

      {/* Ring */}
      <div className="flex justify-center mb-3">
        <div className="relative" style={{ width: ringSize, height: ringSize }}>
          <ProgressRing pct={pct} size={ringSize} stroke={8} color={phaseColor} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-display text-[34px] text-black tabular-nums leading-none">
              {String(t.m).padStart(2, "0")}:{String(t.s).padStart(2, "0")}
            </div>
            {/* Mini round dots */}
            <div className="flex gap-0.5 mt-1">
              {Array.from({ length: longBreakEvery }).map((_, i) => (
                <div key={i} className={`h-1.5 w-1.5 rounded-full transition ${i < (rounds % longBreakEvery) ? "bg-[#12121a]" : "bg-black/15"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setRunning((r) => !r)}
          className="btn-primary rounded-xl px-4 py-2.5 text-[12px] flex-1 flex items-center justify-center gap-1.5">
          {running ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Start</>}
        </button>
        <button onClick={skip} className="rounded-xl bg-black/10 px-3 py-2.5 text-[12px] font-bold text-black flex items-center gap-1">
          <SkipForward className="h-4 w-4" />
        </button>
        <button onClick={reset} className="rounded-xl bg-black/10 px-3 py-2.5 text-[12px] font-bold text-black">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Session summary */}
      {history.length > 0 && (
        <div className="mt-3 rounded-xl bg-black/[0.03] px-3 py-2 flex items-center justify-between">
          <div className="text-[11px] font-bold text-black/70">
            ✅ {focusDone} session{focusDone !== 1 ? "s" : ""} · {totalFocusMins}m focused today
          </div>
          <button onClick={() => setHistory([])} className="text-[10px] text-black/40 hover:text-black/60">Clear</button>
        </div>
      )}
    </div>
  );
}

function ToolsTab() {
  const { user } = useAuth();
  const uidKey = user?.id ?? "anon";
  const storageKey = `skillon.me.${uidKey}.tools`;
  const defaults: ToolInstance[] = [
    { id: "sw-1", kind: "stopwatch", label: "Stopwatch" },
    { id: "tm-1", kind: "timer", label: "Timer" },
    { id: "al-1", kind: "alarm", label: "Alarms" },
    { id: "pm-1", kind: "pomodoro", label: "Pomodoro" },
  ];
  const [tools, setTools] = useState<ToolInstance[]>(defaults);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setTools(raw ? JSON.parse(raw) : defaults);
    } catch { setTools(defaults); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(tools)); } catch {}
  }, [tools, storageKey]);

  const add = (kind: ToolKind) => {
    const labels = { stopwatch: "Stopwatch", timer: "Timer", alarm: "Alarms", pomodoro: "Pomodoro" };
    const count = tools.filter((t) => t.kind === kind).length + 1;
    setTools([...tools, { id: `${kind}-${Date.now()}`, kind, label: `${labels[kind]} ${count > 1 ? count : ""}`.trim() }]);
  };
  const remove = (id: string) => setTools(tools.filter((t) => t.id !== id));
  const rename = (id: string, label: string) => setTools(tools.map((t) => (t.id === id ? { ...t, label } : t)));

  return (
    <div className="space-y-4">
      <ClockCard />

      <div className="card-glass p-3">
        <div className="text-[11px] font-black uppercase tracking-widest text-black/50 mb-2">Add tool</div>
        <div className="grid grid-cols-2 gap-2">
          {(["stopwatch", "timer", "alarm", "pomodoro"] as ToolKind[]).map((k) => (
            <button key={k} onClick={() => add(k)}
              className="rounded-xl bg-black/[0.05] py-2 text-[12px] font-bold text-black capitalize ring-1 ring-dashed ring-black/15 hover:bg-black/10 transition">
              <Plus className="h-3.5 w-3.5 inline -mt-0.5" /> {k}
            </button>
          ))}
        </div>
      </div>

      {tools.map((t) => (
        <ToolShell key={t.id} tool={t} onRemove={() => remove(t.id)} onRename={(l) => rename(t.id, l)}>
          {t.kind === "stopwatch" && <StopwatchCard />}
          {t.kind === "timer" && <TimerCard />}
          {t.kind === "alarm" && <AlarmCard />}
          {t.kind === "pomodoro" && <PomodoroCard />}
        </ToolShell>
      ))}

      {tools.length === 0 && (
        <div className="card-glass p-6 text-center text-black/60 text-[13px]">
          No tools yet — add one above.
        </div>
      )}
    </div>
  );
}

function ToolShell({
  tool,
  onRemove,
  onRename,
  children,
}: {
  tool: ToolInstance;
  onRemove: () => void;
  onRename: (l: string) => void;
  children: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(tool.label);
  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-1 pb-1">
        {editing ? (
          <>
            <input value={val} onChange={(e) => setVal(e.target.value)}
              className="flex-1 rounded-lg bg-white/10 px-2 py-1 text-[12px] font-bold text-white outline-none" autoFocus />
            <button onClick={() => { onRename(val.trim() || tool.label); setEditing(false); }}
              className="rounded-lg bg-white/10 p-1">
              <Check className="h-3.5 w-3.5 text-white" />
            </button>
          </>
        ) : (
          <>
            <span className="text-[11px] font-black uppercase tracking-widest text-white/70 flex-1 truncate">{tool.label}</span>
            <button onClick={() => setEditing(true)} className="text-white/60 p-1"><Pencil className="h-3.5 w-3.5" /></button>
            <button onClick={() => { if (confirm(`Remove "${tool.label}"?`)) onRemove(); }} className="text-white/60 p-1">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
      {children}
    </div>
  );
}


function TimetableTab() {
  const { slots, addSlot, updateSlot, removeSlot } = usePersonalTimetable();
  const [day, setDay] = useState<number>(new Date().getDay());
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [notify, setNotify] = useState(true);

  const byDay = useMemo(() => {
    const m: Record<number, typeof slots> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    slots.forEach((s) => m[s.day].push(s));
    Object.values(m).forEach((arr) => arr.sort((a, b) => a.start.localeCompare(b.start)));
    return m;
  }, [slots]);

  return (
    <div className="space-y-4">
      <div className="card-glass p-5">
        <div className="text-[10px] font-black uppercase tracking-widest text-black/50">
          <CalendarDays className="h-3 w-3 inline -mt-0.5" /> New timetable slot
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1">
          {DAY_LABELS.map((lbl, i) => (
            <button
              key={i}
              onClick={() => setDay(i)}
              className={`rounded-lg py-1.5 text-[11px] font-bold ${
                day === i ? "bg-[#12121a] text-butter" : "bg-black/5 text-black/60"
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-lg bg-black/5 px-2 py-1.5 text-[13px] text-black outline-none" />
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded-lg bg-black/5 px-2 py-1.5 text-[13px] text-black outline-none" />
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Subject / activity"
          className="mt-2 w-full rounded-lg bg-black/5 px-2 py-1.5 text-[13px] text-black outline-none"
        />
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          className="mt-2 w-full rounded-lg bg-black/5 px-2 py-1.5 text-[13px] text-black outline-none"
        />
        <label className="mt-2 flex items-center gap-2 text-[12px] text-black/70">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
          Notify me when it starts
        </label>
        <button
          onClick={() => {
            if (!start || !end || !title.trim()) return;
            addSlot({ day, start, end, title: title.trim(), notes, notify });
            setStart("");
            setEnd("");
            setTitle("");
            setNotes("");
          }}
          className="btn-primary mt-3 w-full text-[13px]"
        >
          <Plus className="h-3.5 w-3.5 inline -mt-0.5 mr-1" />
          Add slot
        </button>
      </div>

      {DAY_LABELS.map((lbl, i) => {
        const list = byDay[i];
        if (!list.length) return null;
        const isToday = i === new Date().getDay();
        return (
          <div key={i} className="card-glass p-5">
            <div className="flex items-center justify-between">
              <div className="font-display text-[18px] text-black">
                {lbl}
                {isToday && (
                  <span className="ml-2 rounded-full bg-butter px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#12121a]">
                    Today
                  </span>
                )}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-black/40">
                {list.length} slot{list.length > 1 ? "s" : ""}
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              {list.map((s) => (
                <div key={s.id} className="flex items-center gap-2 rounded-xl bg-black/[0.04] px-3 py-2">
                  <div className="font-display text-[14px] text-black tabular-nums w-24">
                    {s.start}–{s.end}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] text-black truncate">{s.title}</div>
                    {s.notes && <div className="text-[11px] text-black/50 truncate">{s.notes}</div>}
                  </div>
                  <button
                    onClick={() => updateSlot(s.id, { notify: !s.notify })}
                    className={`text-[10px] font-bold px-2 py-1 rounded-full ${s.notify ? "bg-[#12121a] text-butter" : "bg-black/10 text-black/50"}`}
                  >
                    {s.notify ? "🔔" : "🔕"}
                  </button>
                  <button onClick={() => removeSlot(s.id)} className="text-black/40">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {slots.length === 0 && (
        <div className="text-center text-[12px] text-white/50 py-4">
          No timetable yet. Add subjects, classes or study blocks above.
        </div>
      )}
    </div>
  );
}


import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useSkillon, type Link as LinkType, type Item, type Track } from "@/lib/skillon-store";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Pencil, Check, X, Trash2, Plus, FileText, Video, Link as LinkIcon, HardDrive, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/admin/content")({
  head: () => ({
    meta: [
      { title: "Curriculum — Skillon Admin" },
      { name: "description", content: "Publish learning items to tracks." },
    ],
  }),
  component: ContentPage,
});

const BUCKET = "learning-assets";
const SIGN_EXPIRES = 60 * 60 * 24 * 365;
const DRIVE_FOLDER_ID = "1JfAYlv9Rt6Alm72rV_EgVIOTN-PvRRPP";

async function uploadFile(file: File): Promise<{ url: string; label: string } | null> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (upErr) { alert(`Upload failed: ${upErr.message}`); return null; }
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGN_EXPIRES);
  if (error || !data) { alert("Signed URL error"); return null; }
  return { url: data.signedUrl, label: file.name };
}

// ---------- Drive Preview ----------
function DrivePreview({ fileId, type }: { fileId: string; type: "pdf" | "video" }) {
  if (!fileId.trim()) return null;
  return (
    <div className="mt-2 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
      <div className="px-3 py-1.5 flex items-center gap-2 border-b border-slate-200 bg-white">
        <HardDrive className="h-3.5 w-3.5 text-[#4285F4]" />
        <span className="text-[11px] font-mono text-slate-500 truncate">
          {type === "video" ? "🎬" : "📄"} drive.google.com/file/d/{fileId.slice(0, 18)}…/preview
        </span>
        <a
          href={`https://drive.google.com/file/d/${fileId}/view`}
          target="_blank"
          rel="noreferrer"
          className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 hover:bg-slate-200 inline-flex items-center gap-1"
        >
          <ExternalLink className="h-2.5 w-2.5" /> Open
        </a>
      </div>
      <iframe
        src={`https://drive.google.com/file/d/${fileId}/preview`}
        title="Google Drive Preview"
        width="100%"
        height={type === "video" ? "320" : "400"}
        allow="autoplay"
        className="block"
      />
    </div>
  );
}

// ---------- Drive input section (reusable) ----------
function DriveSection({
  fileId, setFileId,
  driveType, setDriveType,
}: {
  fileId: string; setFileId: (v: string) => void;
  driveType: "pdf" | "video"; setDriveType: (v: "pdf" | "video") => void;
}) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1.5">
        <HardDrive className="h-3 w-3 text-[#4285F4]" /> Google Drive File
        <a
          href={`https://drive.google.com/drive/folders/${DRIVE_FOLDER_ID}`}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1 rounded-full bg-[#4285F4]/10 text-[#4285F4] px-2.5 py-0.5 text-[10px] hover:bg-[#4285F4]/20"
        >
          <ExternalLink className="h-2.5 w-2.5" /> Open Skillon Drive folder
        </a>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <input
          value={fileId}
          onChange={(e) => setFileId(e.target.value.trim())}
          className={inputClass}
          placeholder="Paste Google Drive File ID (e.g. 1abc…xyz)"
        />
        <select
          value={driveType}
          onChange={(e) => setDriveType(e.target.value as "pdf" | "video")}
          className={`${inputClass} w-28`}
        >
          <option value="pdf">📄 PDF</option>
          <option value="video">🎬 Video</option>
        </select>
      </div>
      {fileId && <DrivePreview fileId={fileId} type={driveType} />}
      {!fileId && (
        <p className="mt-1.5 text-[10px] text-slate-400">
          Upload a file to your Drive folder → right-click → Share → "Anyone with link" → copy the ID from the URL.
        </p>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────
function ContentPage() {
  const s = useSkillon();
  const [trackId, setTrackId] = useState(s.tracks[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState<LinkType[]>([{ label: "", url: "" }]);
  const [driveFileId, setDriveFileId] = useState("");
  const [driveType, setDriveType] = useState<"pdf" | "video">("pdf");
  const [flash, setFlash] = useState<string | null>(null);
  const [newTrackName, setNewTrackName] = useState("");
  const [newTrackDesc, setNewTrackDesc] = useState("");
  const [newTrackCat, setNewTrackCat] = useState<Track["category"]>("Career");
  const [uploading, setUploading] = useState(false);

  const updateLink = (i: number, patch: Partial<LinkType>) =>
    setLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const addLink = () => setLinks((p) => [...p, { label: "", url: "" }]);
  const removeLink = (i: number) => setLinks((p) => p.filter((_, idx) => idx !== i));

  const onFormFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    const res = await uploadFile(file);
    setUploading(false);
    if (res) setLinks((p) => [...p.filter((l) => l.url.trim()), res]);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackId || !title.trim()) return;
    const cleanLinks = links.filter((l) => l.url.trim()).map((l) => ({ label: l.label.trim() || "Link", url: l.url.trim() }));
    s.addItem(trackId, {
      title: title.trim(),
      description: description.trim(),
      links: cleanLinks,
      driveFileId: driveFileId.trim() || undefined,
      driveType: driveFileId.trim() ? driveType : undefined,
      createdBy: "admin",
    });
    setTitle(""); setDescription(""); setLinks([{ label: "", url: "" }]);
    setDriveFileId(""); setDriveType("pdf");
    setFlash(`Published "${title}".`);
    setTimeout(() => setFlash(null), 2500);
  };

  const createTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackName.trim()) return;
    const t = s.addTrack({ name: newTrackName.trim(), description: newTrackDesc.trim(), category: newTrackCat });
    setTrackId(t.id);
    setNewTrackName(""); setNewTrackDesc("");
    setFlash("Track created.");
    setTimeout(() => setFlash(null), 2500);
  };

  return (
    <div className="grid gap-6">
      {/* PUBLISH FORM */}
      <form onSubmit={submit} className="card-glass p-6">
        <div className="pill bg-[#fff4cf] text-[#12121a] inline-block">Publish item</div>
        <h2 className="mt-3 font-display text-2xl text-slate-900">Add "learn this"</h2>
        <p className="mt-1 text-xs text-slate-500">Choose a track, add a message, attach links, upload files, or embed a Google Drive PDF/video.</p>

        <div className="mt-4 grid gap-3">
          <Field label="Track">
            <select value={trackId} onChange={(e) => setTrackId(e.target.value)} className={inputClass}>
              {s.tracks.map((t) => (
                <option key={t.id} value={t.id}>{t.name} · {t.items.length} items</option>
              ))}
            </select>
          </Field>
          <Field label="Title">
            <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="e.g. Master SQL window functions" />
          </Field>
          <Field label="Description / message">
            <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputClass} min-h-[90px]`} placeholder="What this covers and why it matters." />
          </Field>

          {/* Drive section */}
          <DriveSection
            fileId={driveFileId} setFileId={setDriveFileId}
            driveType={driveType} setDriveType={setDriveType}
          />

          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">Links &amp; Files</div>
            <div className="grid gap-2">
              {links.map((l, i) => (
                <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2">
                  <input value={l.label} onChange={(e) => updateLink(i, { label: e.target.value })} className={inputClass} placeholder="Label" />
                  <input value={l.url} onChange={(e) => updateLink(i, { url: e.target.value })} className={inputClass} placeholder="https://…" />
                  <button type="button" onClick={() => removeLink(i)} className="rounded-full bg-slate-100 px-3 text-slate-600">×</button>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={addLink} className="rounded-full bg-slate-100 px-4 py-2 text-xs text-slate-700 inline-flex items-center gap-1">
                  <Plus className="h-3 w-3" /> Add link
                </button>
                <label className="rounded-full bg-[#12121a] px-4 py-2 text-xs text-white inline-flex items-center gap-1 cursor-pointer">
                  <Upload className="h-3 w-3" />
                  {uploading ? "Uploading…" : "Upload PDF / video"}
                  <input type="file" accept="application/pdf,video/*,image/*" onChange={onFormFile} className="hidden" disabled={uploading} />
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" className="rounded-full bg-[#12121a] px-5 py-3 text-sm font-medium text-white">Publish</button>
            {flash && <span className="text-sm text-[#12121a]">{flash}</span>}
          </div>
        </div>
      </form>

      {/* CREATE TRACK */}
      <form onSubmit={createTrack} className="card-glass p-6">
        <div className="pill bg-[#fff4cf] text-[#12121a] inline-block">New track</div>
        <h2 className="mt-3 font-display text-2xl text-slate-900">Create a track</h2>
        <div className="mt-4 grid gap-3">
          <input value={newTrackName} onChange={(e) => setNewTrackName(e.target.value)} className={inputClass} placeholder="Track name" />
          <textarea value={newTrackDesc} onChange={(e) => setNewTrackDesc(e.target.value)} className={`${inputClass} min-h-[80px]`} placeholder="Description" />
          <select value={newTrackCat} onChange={(e) => setNewTrackCat(e.target.value as Track["category"])} className={inputClass}>
            <option value="GATE">GATE</option>
            <option value="Career">Career</option>
            <option value="Skill">Skill</option>
            <option value="Custom">Custom</option>
          </select>
          <button className="w-fit rounded-full bg-[#12121a] px-5 py-3 text-sm font-medium text-white" type="submit">Create track</button>
        </div>
      </form>

      {/* EXISTING TRACKS */}
      <section className="grid gap-4">
        {s.tracks.map((t) => (
          <TrackEditor key={t.id} track={t} />
        ))}
      </section>
    </div>
  );
}

function TrackEditor({ track }: { track: Track }) {
  const s = useSkillon();
  const cohort = s.cohortCompletionForTrack(track.id);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(track.name);
  const [desc, setDesc] = useState(track.description);
  const [cat, setCat] = useState<Track["category"]>(track.category);

  const save = () => {
    s.updateTrack(track.id, { name: name.trim() || track.name, description: desc.trim(), category: cat });
    setEditing(false);
  };
  const del = () => {
    if (confirm(`Delete track "${track.name}" and all its items?`)) s.removeTrack(track.id);
  };

  return (
    <div className="card-glass overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between gap-3 border-b border-slate-100">
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="grid gap-2">
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className={`${inputClass} min-h-[60px]`} />
              <select value={cat} onChange={(e) => setCat(e.target.value as Track["category"])} className={inputClass}>
                <option value="GATE">GATE</option>
                <option value="Career">Career</option>
                <option value="Skill">Skill</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
          ) : (
            <>
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{track.category}</div>
              <div className="text-[15px] font-semibold text-slate-900 truncate">{track.name}</div>
              {track.description && <div className="text-xs text-slate-500">{track.description}</div>}
            </>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="text-right">
            <div className="font-display text-xl text-slate-900 leading-none">{cohort.pct}%</div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{cohort.done}/{cohort.total}</div>
          </div>
          <div className="flex gap-1">
            {editing ? (
              <>
                <button onClick={save} className="rounded-full bg-emerald-500 text-white p-1.5"><Check className="h-3.5 w-3.5" /></button>
                <button onClick={() => setEditing(false)} className="rounded-full bg-slate-200 text-slate-700 p-1.5"><X className="h-3.5 w-3.5" /></button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="rounded-full bg-slate-100 text-slate-700 p-1.5"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={del} className="rounded-full bg-red-50 text-red-600 p-1.5"><Trash2 className="h-3.5 w-3.5" /></button>
              </>
            )}
          </div>
        </div>
      </div>
      <ul className="divide-y divide-slate-100">
        {track.items.length === 0 && <li className="px-5 py-4 text-sm text-slate-500">No items yet.</li>}
        {track.items.map((it) => (
          <ItemEditor key={it.id} track={track} item={it} />
        ))}
      </ul>
    </div>
  );
}

function ItemEditor({ track, item }: { track: Track; item: Item }) {
  const s = useSkillon();
  const doneCount = s.members.filter((m) => s.isCompleted(m.id, item.id)).length;
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [desc, setDesc] = useState(item.description);
  const [links, setLinks] = useState<LinkType[]>(item.links.length ? item.links : [{ label: "", url: "" }]);
  const [driveFileId, setDriveFileId] = useState(item.driveFileId ?? "");
  const [driveType, setDriveType] = useState<"pdf" | "video">(item.driveType ?? "pdf");
  const [uploading, setUploading] = useState(false);

  const save = () => {
    const cleanLinks = links.filter((l) => l.url.trim()).map((l) => ({ label: l.label.trim() || "Link", url: l.url.trim() }));
    s.updateItem(track.id, item.id, {
      title: title.trim() || item.title,
      description: desc.trim(),
      links: cleanLinks,
      driveFileId: driveFileId.trim() || undefined,
      driveType: driveFileId.trim() ? driveType : undefined,
    });
    setEditing(false);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    const res = await uploadFile(file);
    setUploading(false);
    if (res) setLinks((p) => [...p.filter((l) => l.url.trim()), res]);
  };

  const guessIcon = (url: string) => {
    if (/\.(mp4|mov|webm|m4v)(\?|$)/i.test(url) || /youtu\.?be/.test(url)) return Video;
    if (/\.pdf(\?|$)/i.test(url)) return FileText;
    return LinkIcon;
  };

  if (editing) {
    return (
      <li className="px-5 py-4 grid gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className={`${inputClass} min-h-[70px]`} />

        {/* Drive editor */}
        <DriveSection
          fileId={driveFileId} setFileId={setDriveFileId}
          driveType={driveType} setDriveType={setDriveType}
        />

        <div className="grid gap-2">
          {links.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2">
              <input value={l.label} onChange={(e) => setLinks((p) => p.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} className={inputClass} placeholder="Label" />
              <input value={l.url} onChange={(e) => setLinks((p) => p.map((x, idx) => idx === i ? { ...x, url: e.target.value } : x))} className={inputClass} placeholder="https://…" />
              <button type="button" onClick={() => setLinks((p) => p.filter((_, idx) => idx !== i))} className="rounded-full bg-slate-100 px-3 text-slate-600">×</button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setLinks((p) => [...p, { label: "", url: "" }])} className="rounded-full bg-slate-100 px-4 py-2 text-xs text-slate-700 inline-flex items-center gap-1">
              <Plus className="h-3 w-3" /> Link
            </button>
            <label className="rounded-full bg-[#12121a] px-4 py-2 text-xs text-white inline-flex items-center gap-1 cursor-pointer">
              <Upload className="h-3 w-3" /> {uploading ? "Uploading…" : "Upload PDF/video"}
              <input type="file" accept="application/pdf,video/*,image/*" onChange={onFile} className="hidden" disabled={uploading} />
            </label>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="rounded-full bg-emerald-500 text-white px-3 py-1.5 text-xs inline-flex items-center gap-1"><Check className="h-3 w-3" /> Save</button>
          <button onClick={() => setEditing(false)} className="rounded-full bg-slate-200 text-slate-700 px-3 py-1.5 text-xs">Cancel</button>
        </div>
      </li>
    );
  }

  return (
    <li className="px-5 py-4 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm text-slate-900">{item.title}</div>
        {item.description && <div className="mt-1 text-xs text-slate-500">{item.description}</div>}
        {/* Drive badge */}
        {item.driveFileId && (
          <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#4285F4]/10 px-2.5 py-0.5 text-[11px] text-[#4285F4]">
            <HardDrive className="h-3 w-3" />
            {item.driveType === "video" ? "🎬 Drive video" : "📄 Drive PDF"}
          </div>
        )}
        {item.links.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.links.map((l, i) => {
              const Icon = guessIcon(l.url);
              return (
                <a key={i} href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700 hover:bg-slate-200">
                  <Icon className="h-3 w-3" /> {l.label || "Link"}
                </a>
              );
            })}
          </div>
        )}
      </div>
      <div className="w-24 flex-none">
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-[#12121a]" style={{ width: `${(doneCount / s.members.length) * 100}%` }} />
        </div>
        <div className="mt-1 text-[10px] font-mono text-slate-500 text-right">{doneCount}/{s.members.length}</div>
      </div>
      <div className="flex flex-col gap-1">
        <button onClick={() => setEditing(true)} className="rounded-full bg-slate-100 text-slate-700 p-1.5"><Pencil className="h-3 w-3" /></button>
        <button onClick={() => s.removeItem(track.id, item.id)} className="rounded-full bg-red-50 text-red-600 p-1.5"><Trash2 className="h-3 w-3" /></button>
      </div>
    </li>
  );
}

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#12121a]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">{label}</div>
      {children}
    </label>
  );
}

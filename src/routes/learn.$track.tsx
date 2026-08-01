import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SkyShell, TopBar } from "@/components/site-header";
import { useSkillon, slugify, type Item } from "@/lib/skillon-store";
import { HardDrive, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/learn/$track")({
  head: ({ params }) => {
    const title = titleize(params.track);
    return {
      meta: [
        { title: `${title} — Skillon` },
        { name: "description", content: `Learn ${title} on Skillon.` },
        { property: "og:title", content: `${title} — Skillon` },
        { property: "og:description", content: `Curriculum for ${title}.` },
      ],
    };
  },
  component: TrackPage,
});

function titleize(slug: string) {
  return slug.split("-").map((w) => (w[0]?.toUpperCase() ?? "") + w.slice(1)).join(" ");
}

// ── Drive viewer embedded in the curriculum item ──────────────────────────────
function DriveViewer({ item }: { item: Item }) {
  const [open, setOpen] = useState(false);
  if (!item.driveFileId) return null;

  const isVideo = item.driveType === "video";

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
          open
            ? "bg-[#4285F4] text-white"
            : "bg-[#4285F4]/10 text-[#4285F4] hover:bg-[#4285F4]/20"
        }`}
      >
        <HardDrive className="h-3 w-3" />
        {isVideo ? "🎬 Watch video" : "📄 Open PDF"}
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {open && (
        <div className="mt-2 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          {/* Toolbar */}
          <div className="flex items-center gap-2 bg-white border-b border-slate-100 px-3 py-1.5">
            <HardDrive className="h-3.5 w-3.5 text-[#4285F4] flex-none" />
            <span className="text-[10px] font-mono text-slate-400 truncate flex-1">
              {isVideo ? "Google Drive · Video" : "Google Drive · PDF"}
            </span>
            <a
              href={`https://drive.google.com/file/d/${item.driveFileId}/view`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 hover:bg-slate-200 flex-none"
            >
              <ExternalLink className="h-2.5 w-2.5" /> Open in Drive
            </a>
          </div>
          <iframe
            src={`https://drive.google.com/file/d/${item.driveFileId}/preview`}
            title={item.title}
            width="100%"
            height={isVideo ? "300" : "480"}
            allow="autoplay"
            className="block bg-slate-50"
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function TrackPage() {
  const { track } = Route.useParams();
  const s = useSkillon();
  const t = s.tracks.find((x) => slugify(x.name) === track);

  if (!t) {
    return (
      <SkyShell>
        <TopBar title="Not found" back="/learn" />
        <main className="relative z-10 px-5 pb-32 pt-6">
          <div className="card-glass p-6">
            <div className="pill bg-slate-100 text-slate-700 inline-block">404</div>
            <h1 className="mt-3 font-display text-2xl text-slate-900">No track named "{titleize(track)}"</h1>
            <Link to="/learn" className="mt-4 inline-flex rounded-full bg-[#12121a] px-5 py-3 text-sm text-white">
              Back to directory
            </Link>
          </div>
        </main>
      </SkyShell>
    );
  }

  const c = s.completionForTrack(t.id, s.currentMemberId);
  const cohort = s.cohortCompletionForTrack(t.id);

  return (
    <SkyShell>
      <TopBar title={t.name} back="/learn" />
      <main className="relative z-10 px-5 pb-32 pt-6">
        <section className="card-glass p-6">
          <div className="pill bg-[#fff4cf] text-[#12121a] inline-block">{t.category}</div>
          <h1 className="mt-3 font-display text-3xl text-slate-900">{t.name}</h1>
          <p className="mt-2 text-sm text-slate-600">{t.description}</p>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-[#12121a] p-4 text-white">
              <div className="text-[10px] uppercase tracking-widest text-white/70">You</div>
              <div className="mt-1 font-display text-3xl leading-none">{c.pct}%</div>
              <div className="mt-1 text-[11px] text-white/70">{c.done}/{c.total} done</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-slate-800">
              <div className="text-[10px] uppercase tracking-widest text-slate-500">Cohort</div>
              <div className="mt-1 font-display text-3xl leading-none">{cohort.pct}%</div>
              <div className="mt-1 text-[11px] text-slate-500">{cohort.done}/{cohort.total}</div>
            </div>
          </div>
        </section>

        <section className="mt-6 card-glass overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-slate-900">Curriculum</h2>
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              {t.items.length} items
            </span>
          </div>
          <ul className="divide-y divide-slate-100">
            {t.items.length === 0 && (
              <li className="px-5 py-6 text-sm text-slate-500">No items yet. Admin can publish here.</li>
            )}
            {t.items.map((it) => {
              const done = s.isCompleted(s.currentMemberId, it.id);
              return (
                <li key={it.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => s.toggleCompleted(it.id)}
                      aria-label={done ? "Mark incomplete" : "Mark complete"}
                      className={`mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full border transition ${
                        done ? "bg-[#12121a] border-[#12121a] text-white" : "bg-white border-slate-300 text-transparent"
                      }`}
                    >
                      ✓
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[15px] ${done ? "line-through text-slate-400" : "text-slate-900"}`}>
                        {it.title}
                      </div>
                      {it.description && (
                        <div className="mt-1 text-xs text-slate-500">{it.description}</div>
                      )}

                      {/* ── Google Drive viewer ── */}
                      <DriveViewer item={it} />

                      {it.links.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {it.links.map((l, k) => (
                            <a
                              key={k}
                              href={l.url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full bg-[#fff4cf] text-[#12121a] px-3 py-1 text-[11px]"
                            >
                              ↗ {l.label}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className={`pill flex-none ${it.createdBy === "admin" ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-700"}`}>
                      {it.createdBy === "admin" ? "Admin" : "Mine"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </SkyShell>
  );
}

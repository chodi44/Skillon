import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SkyShell, TopBar, PageHero, Panel } from "@/components/site-header";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { saveCodingProfile, refreshCodingStats, type CodingPlatform } from "@/lib/coding.functions";
import { RefreshCw, ExternalLink, Check, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/coding")({
  head: () => ({
    meta: [
      { title: "Coding — Skillon" },
      { name: "description", content: "Auto-tracked stats from LeetCode, GitHub, GFG and HackerRank." },
      { property: "og:title", content: "Coding tracker — Skillon" },
      { property: "og:description", content: "Live problem counts pulled from your public profiles." },
    ],
  }),
  component: CodingPage,
});

const PLATFORMS: {
  id: CodingPlatform;
  label: string;
  placeholder: string;
  profileUrl: (h: string) => string;
}[] = [
  { id: "leetcode", label: "LeetCode", placeholder: "leetcode.com/u/your-username", profileUrl: (h) => `https://leetcode.com/u/${h}` },
  { id: "github", label: "GitHub", placeholder: "github.com/your-username", profileUrl: (h) => `https://github.com/${h}` },
  { id: "gfg", label: "GeeksforGeeks", placeholder: "geeksforgeeks.org/user/your-handle", profileUrl: (h) => `https://auth.geeksforgeeks.org/user/${h}` },
  { id: "hackerrank", label: "HackerRank", placeholder: "hackerrank.com/profile/your-handle", profileUrl: (h) => `https://www.hackerrank.com/profile/${h}` },
];

function CodingPage() {
  const { isAuthenticated, user } = useAuth();
  const qc = useQueryClient();
  const save = useServerFn(saveCodingProfile);
  const refresh = useServerFn(refreshCodingStats);

  const profilesQ = useQuery({
    enabled: !!user,
    queryKey: ["coding_profiles", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coding_profiles")
        .select("platform, handle")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const statsQ = useQuery({
    enabled: !!user,
    queryKey: ["coding_stats", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coding_stats")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const saveMut = useMutation({
    mutationFn: (v: { platform: CodingPlatform; handle: string }) => save({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coding_profiles"] }),
  });

  const refreshMut = useMutation({
    mutationFn: (v: { platform?: CodingPlatform }) => refresh({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coding_stats"] }),
  });

  if (!isAuthenticated) return null;

  const handleFor = (p: CodingPlatform) =>
    profilesQ.data?.find((x) => x.platform === p)?.handle ?? "";
  const statFor = (p: CodingPlatform) =>
    statsQ.data?.find((x) => x.platform === p);

  const totalSolved = (statsQ.data ?? []).reduce((s, x) => s + (x.total_solved ?? 0), 0);
  const bestStreak = Math.max(0, ...(statsQ.data ?? []).map((x) => x.streak ?? 0));
  const easy = (statsQ.data ?? []).reduce((s, x) => s + (x.easy ?? 0), 0);
  const medium = (statsQ.data ?? []).reduce((s, x) => s + (x.medium ?? 0), 0);
  const hard = (statsQ.data ?? []).reduce((s, x) => s + (x.hard ?? 0), 0);

  return (
    <SkyShell>
      <TopBar title="Coding" />
      <main className="relative z-10 px-5 pt-4 pb-32 space-y-5">
        <PageHero
          eyebrow="Auto-tracked"
          title={<>{totalSolved}<span className="text-butter"> solved</span></>}
          subtitle={`Live from your public profiles · best streak ${bestStreak} days`}
          stats={[
            { label: "Easy", value: easy },
            { label: "Medium", value: medium },
            { label: "Hard", value: hard },
            { label: "Streak", value: bestStreak },
          ]}
        />

        <Panel
          title="Your profiles"
          action={
            <button
              onClick={() => refreshMut.mutate({})}
              disabled={refreshMut.isPending}
              className="rounded-full bg-[#12121a] px-3 py-1.5 text-xs font-medium text-white inline-flex items-center gap-1 disabled:opacity-60"
            >
              <RefreshCw className={`h-3 w-3 ${refreshMut.isPending ? "animate-spin" : ""}`} />
              Refresh all
            </button>
          }
        >
          <div className="grid gap-3">
            {PLATFORMS.map((p) => (
              <ProfileRow
                key={p.id}
                platform={p}
                initial={handleFor(p.id)}
                stat={statFor(p.id)}
                onSave={(h) => saveMut.mutate({ platform: p.id, handle: h })}
                onRefresh={() => refreshMut.mutate({ platform: p.id })}
                refreshing={refreshMut.isPending}
              />
            ))}
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            Enter your public profile URL or username. Stats update live from each platform — nothing manual.
          </p>
        </Panel>

        <Panel title="Platform breakdown">
          <div className="grid gap-2">
            {PLATFORMS.map((p) => {
              const s = statFor(p.id);
              const max = Math.max(1, ...(statsQ.data ?? []).map((x) => x.total_solved ?? 0));
              const total = s?.total_solved ?? 0;
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="w-28 text-sm text-slate-700">{p.label}</div>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-[#12121a]" style={{ width: `${(total / max) * 100}%` }} />
                  </div>
                  <div className="w-12 text-right font-mono text-sm">{total}</div>
                </div>
              );
            })}
          </div>
        </Panel>
      </main>
    </SkyShell>
  );
}

function ProfileRow({
  platform,
  initial,
  stat,
  onSave,
  onRefresh,
  refreshing,
}: {
  platform: (typeof PLATFORMS)[number];
  initial: string;
  stat: any;
  onSave: (h: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const [val, setVal] = useState(initial);
  useEffect(() => setVal(initial), [initial]);
  const dirty = val.trim() !== initial;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-slate-700">{platform.label}</div>
        {stat?.handle && (
          <a
            href={platform.profileUrl(stat.handle)}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-slate-500 inline-flex items-center gap-1 hover:text-slate-900"
          >
            {stat.handle} <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={platform.placeholder}
          className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#12121a]"
        />
        <button
          onClick={() => onSave(val)}
          disabled={!dirty}
          className="rounded-full bg-[#12121a] px-3 py-2 text-xs font-medium text-white disabled:opacity-40 inline-flex items-center gap-1"
        >
          <Check className="h-3 w-3" /> Save
        </button>
        <button
          onClick={onRefresh}
          disabled={refreshing || !stat?.handle}
          title="Refresh"
          className="rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-40 inline-flex items-center gap-1"
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>
      {stat ? (
        stat.error ? (
          <div className="mt-2 text-[11px] text-red-600 inline-flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> {stat.error}
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-600 font-mono">
            <span>Total: <b className="text-slate-900">{stat.total_solved}</b></span>
            {stat.easy > 0 && <span>E {stat.easy}</span>}
            {stat.medium > 0 && <span>M {stat.medium}</span>}
            {stat.hard > 0 && <span>H {stat.hard}</span>}
            {stat.streak > 0 && <span>🔥 {stat.streak}</span>}
            <span className="ml-auto text-slate-400">
              {new Date(stat.fetched_at).toLocaleString()}
            </span>
          </div>
        )
      ) : (
        <div className="mt-2 text-[11px] text-slate-400">No data yet — save a handle then Refresh.</div>
      )}
    </div>
  );
}

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CodingPlatform = "leetcode" | "github" | "gfg" | "hackerrank";

type FetchedStats = {
  total_solved: number;
  easy: number;
  medium: number;
  hard: number;
  streak: number;
  extra: Record<string, unknown>;
  error?: string;
};

async function fetchLeetcode(handle: string): Promise<FetchedStats> {
  const query = `query userProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile { ranking reputation }
      submitStatsGlobal { acSubmissionNum { difficulty count } }
    }
    userContestRanking(username: $username) { rating globalRanking }
  }`;
  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": "Mozilla/5.0" },
    body: JSON.stringify({ query, variables: { username: handle } }),
  });
  if (!res.ok) throw new Error(`LeetCode HTTP ${res.status}`);
  const json = (await res.json()) as any;
  const user = json?.data?.matchedUser;
  if (!user) throw new Error("LeetCode user not found");
  const nums = user.submitStatsGlobal?.acSubmissionNum ?? [];
  const by = (d: string) => Number(nums.find((n: any) => n.difficulty === d)?.count ?? 0);
  return {
    total_solved: by("All"),
    easy: by("Easy"),
    medium: by("Medium"),
    hard: by("Hard"),
    streak: 0,
    extra: {
      ranking: user.profile?.ranking ?? null,
      contest_rating: json?.data?.userContestRanking?.rating ?? null,
    },
  };
}

async function fetchGithub(handle: string): Promise<FetchedStats> {
  const [uRes, cRes] = await Promise.all([
    fetch(`https://api.github.com/users/${encodeURIComponent(handle)}`, {
      headers: { "user-agent": "skillon", accept: "application/vnd.github+json" },
    }),
    fetch(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(handle)}?y=last`, {
      headers: { "user-agent": "skillon" },
    }),
  ]);
  if (!uRes.ok) throw new Error(`GitHub HTTP ${uRes.status}`);
  const u = (await uRes.json()) as any;
  let total = 0;
  let streak = 0;
  if (cRes.ok) {
    const c = (await cRes.json()) as any;
    total = Number(c?.total?.lastYear ?? 0);
    // compute current streak from contribution days
    const days: Array<{ date: string; count: number }> = c?.contributions ?? [];
    const today = new Date().toISOString().slice(0, 10);
    let s = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].date > today) continue;
      if (days[i].count > 0) s++;
      else break;
    }
    streak = s;
  }
  return {
    total_solved: total,
    easy: 0,
    medium: 0,
    hard: 0,
    streak,
    extra: {
      public_repos: u.public_repos,
      followers: u.followers,
      avatar_url: u.avatar_url,
      name: u.name,
    },
  };
}

async function fetchGfg(handle: string): Promise<FetchedStats> {
  const res = await fetch(`https://geeks-for-geeks-api.vercel.app/${encodeURIComponent(handle)}`);
  if (!res.ok) throw new Error(`GFG HTTP ${res.status}`);
  const j = (await res.json()) as any;
  if (j?.error) throw new Error(String(j.error));
  const info = j?.info ?? {};
  const solved = j?.solvedStats ?? {};
  return {
    total_solved: Number(info.totalProblemsSolved ?? 0),
    easy: Number(solved.easy?.count ?? 0),
    medium: Number(solved.medium?.count ?? 0),
    hard: Number(solved.hard?.count ?? 0),
    streak: Number(info.currentStreak?.toString().split("/")?.[0] ?? 0),
    extra: {
      coding_score: info.codingScore ?? null,
      institution: info.institution ?? null,
      monthly_score: info.monthlyScore ?? null,
    },
  };
}

async function fetchHackerrank(handle: string): Promise<FetchedStats> {
  const res = await fetch(`https://www.hackerrank.com/rest/hackers/${encodeURIComponent(handle)}/profile`, {
    headers: { "user-agent": "Mozilla/5.0", accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HackerRank HTTP ${res.status}`);
  const j = (await res.json()) as any;
  const model = j?.model;
  if (!model) throw new Error("HackerRank user not found");
  // No public "solved count" endpoint reliable; use badges as proxy.
  const badgeRes = await fetch(
    `https://www.hackerrank.com/rest/hackers/${encodeURIComponent(handle)}/badges`,
    { headers: { "user-agent": "Mozilla/5.0", accept: "application/json" } },
  );
  let total = 0;
  const badges: any[] = badgeRes.ok ? ((await badgeRes.json()) as any)?.models ?? [] : [];
  for (const b of badges) total += Number(b.solved ?? 0);
  return {
    total_solved: total,
    easy: 0,
    medium: 0,
    hard: 0,
    streak: 0,
    extra: {
      name: model.name,
      country: model.country,
      badges: badges.map((b) => ({ name: b.badge_name, stars: b.stars, solved: b.solved })),
    },
  };
}

async function fetchByPlatform(p: CodingPlatform, handle: string): Promise<FetchedStats> {
  const clean = handle.trim().replace(/^@/, "").replace(/\/+$/, "").split("/").pop() ?? "";
  if (!clean) throw new Error("Empty handle");
  if (p === "leetcode") return fetchLeetcode(clean);
  if (p === "github") return fetchGithub(clean);
  if (p === "gfg") return fetchGfg(clean);
  return fetchHackerrank(clean);
}

export const saveCodingProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { platform: CodingPlatform; handle: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const handle = data.handle.trim();
    if (!handle) {
      await supabase.from("coding_profiles").delete().eq("user_id", userId).eq("platform", data.platform);
      await supabase.from("coding_stats").delete().eq("user_id", userId).eq("platform", data.platform);
      return { ok: true, deleted: true };
    }
    const { error } = await supabase.from("coding_profiles").upsert(
      { user_id: userId, platform: data.platform, handle },
      { onConflict: "user_id,platform" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const refreshCodingStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { platform?: CodingPlatform }) => d ?? {})
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const q = supabase.from("coding_profiles").select("platform, handle").eq("user_id", userId);
    if (data.platform) q.eq("platform", data.platform);
    const { data: profiles, error } = await q;
    if (error) throw new Error(error.message);
    const results: Array<{ platform: CodingPlatform; ok: boolean; error?: string }> = [];
    for (const p of profiles ?? []) {
      const platform = p.platform as CodingPlatform;
      try {
        const s = await fetchByPlatform(platform, p.handle);
        await supabase.from("coding_stats").upsert(
          {
            user_id: userId,
            platform,
            handle: p.handle,
            total_solved: s.total_solved,
            easy: s.easy,
            medium: s.medium,
            hard: s.hard,
            streak: s.streak,
            extra: s.extra as any,
            error: null,
            fetched_at: new Date().toISOString(),
          },
          { onConflict: "user_id,platform" },
        );
        results.push({ platform, ok: true });
      } catch (e: any) {
        await supabase.from("coding_stats").upsert(
          {
            user_id: userId,
            platform,
            handle: p.handle,
            error: String(e?.message ?? e),
            fetched_at: new Date().toISOString(),
          },
          { onConflict: "user_id,platform" },
        );
        results.push({ platform, ok: false, error: String(e?.message ?? e) });
      }
    }
    return { results };
  });

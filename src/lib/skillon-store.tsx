import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./auth";

export type Link = { label: string; url: string };
export type Item = {
  id: string;
  title: string;
  description: string;
  links: Link[];
  driveFileId?: string;          // Google Drive file ID
  driveType?: "pdf" | "video";   // tells the viewer which embed mode to use
  createdBy: "admin" | string;
  createdAt: number;
};
export type Track = {
  id: string;
  name: string;
  description: string;
  category: "GATE" | "Career" | "Skill" | "Custom";
  ownerId?: string;
  items: Item[];
};
export type Member = { id: string; name: string; role: string };

export type Platform = "leetcode" | "gfg" | "hackerrank" | "github";
export const PLATFORMS: { id: Platform; label: string; hint: string }[] = [
  { id: "leetcode", label: "LeetCode", hint: "leetcode.com/u/username" },
  { id: "gfg", label: "GeeksforGeeks", hint: "geeksforgeeks.org/user/username" },
  { id: "hackerrank", label: "HackerRank", hint: "hackerrank.com/username" },
  { id: "github", label: "GitHub", hint: "github.com/username" },
];

export type Difficulty = "easy" | "medium" | "hard";
export type CodingLog = {
  id: string;
  memberId: string;
  platform: Platform;
  difficulty: Difficulty;
  topic: string;
  count: number;
  date: string; // YYYY-MM-DD
  note?: string;
};

export type CodingGoals = {
  daily: number;
  weekly: number;
  monthly: number;
  perPlatform: Partial<Record<Platform, number>>; // daily per platform
};

export type TaskCategory =
  | "notes" | "pdf" | "video" | "quiz" | "coding" | "sql" | "ai"
  | "cloud" | "fullstack" | "aptitude" | "gate" | "cat" | "assignment"
  | "project" | "mock" | "revision";

export const TASK_CATEGORIES: { id: TaskCategory; label: string }[] = [
  { id: "notes", label: "Read notes" },
  { id: "pdf", label: "Read PDF" },
  { id: "video", label: "Watch video" },
  { id: "quiz", label: "Complete quiz" },
  { id: "coding", label: "Solve coding problems" },
  { id: "sql", label: "SQL practice" },
  { id: "ai", label: "AI practice" },
  { id: "cloud", label: "Cloud practice" },
  { id: "fullstack", label: "Full stack" },
  { id: "aptitude", label: "Aptitude" },
  { id: "gate", label: "GATE revision" },
  { id: "cat", label: "CAT revision" },
  { id: "assignment", label: "Assignment" },
  { id: "project", label: "Project" },
  { id: "mock", label: "Mock test" },
  { id: "revision", label: "Revision" },
];

export type DailyTask = {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  trackId?: string;
  difficulty: Difficulty;
  priority: "low" | "normal" | "high";
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  estimatedMin: number;
  xp: number;
  links: Link[];
  assignTo: "all" | string[]; // memberIds
  createdAt: number;
};

export type TaskCompletion = {
  taskId: string;
  memberId: string;
  completedAt: number;
  timeSpentMin?: number;
};

export const MEMBERS: Member[] = [
  { id: "m1", name: "Ishana", role: "24A31A43E2" },
  { id: "m2", name: "Hasini", role: "24A31A43E3" },
  { id: "m3", name: "Kruthika", role: "24A31A43D7" },
  { id: "m4", name: "Bhuvana", role: "24A31A43F0" },
  { id: "m5", name: "Praveen", role: "24A31A43G8" },
  { id: "m6", name: "Mourya", role: "24A31A43H3" },
  { id: "m7", name: "Masthan", role: "24A31A43H7" },
  { id: "m8", name: "Ganesh", role: "24A31A43I3" },
  { id: "m9", name: "Rahul", role: "24A31A43I6" },
];

const KEY_BASE = "skillon.store.v5";
const keyFor = (userId: string | null | undefined) => `${KEY_BASE}.${userId ?? "anon"}`;

const uid = () => Math.random().toString(36).slice(2, 10);
export const today = () => new Date().toISOString().slice(0, 10);

const seedTracks = (): Track[] => [
  {
    id: "gate-da", name: "GATE Data Science & AI",
    description: "Chapter-wise notes, PYQs, mock tests, weak-topic analysis.",
    category: "GATE",
    items: [
      { id: uid(), title: "Probability — Bayes' Theorem", description: "Bayes with worked examples and PYQ mapping.", links: [{ label: "Notes PDF", url: "https://example.com/bayes.pdf" }], createdBy: "admin", createdAt: Date.now() },
      { id: uid(), title: "Linear Algebra — Eigenvalues", description: "Definitions, diagonalization, PYQs 2018–2024.", links: [], createdBy: "admin", createdAt: Date.now() },
      { id: uid(), title: "DBMS — Normalization forms", description: "1NF → BCNF with reduction examples.", links: [], createdBy: "admin", createdAt: Date.now() },
      { id: uid(), title: "Machine Learning — Gradient Descent", description: "Batch / SGD / mini-batch.", links: [], createdBy: "admin", createdAt: Date.now() },
    ],
  },
  { id: "ai-engineer", name: "AI Engineer", description: "Python → ML → DL → NLP → LLMs → Agents.", category: "Career",
    items: [
      { id: uid(), title: "Python for ML", description: "NumPy, Pandas, vectorization.", links: [], createdBy: "admin", createdAt: Date.now() },
      { id: uid(), title: "Build a RAG pipeline", description: "Chunk, embed, retrieve, evaluate.", links: [], createdBy: "admin", createdAt: Date.now() },
    ] },
  { id: "full-stack", name: "Full Stack Developer", description: "HTML/CSS/JS → React → Node → DB → Deploy.", category: "Career",
    items: [
      { id: uid(), title: "JavaScript deep dive", description: "Closures, event loop, promises.", links: [], createdBy: "admin", createdAt: Date.now() },
      { id: uid(), title: "React + TanStack Query", description: "Data fetching, caching, mutations.", links: [], createdBy: "admin", createdAt: Date.now() },
    ] },
  { id: "sql", name: "SQL Developer", description: "Joins, procs, triggers, indexing.", category: "Career",
    items: [
      { id: uid(), title: "Joins mastery", description: "Inner, outer, cross, self.", links: [], createdBy: "admin", createdAt: Date.now() },
      { id: uid(), title: "Query optimization", description: "Explain plans, indexes.", links: [], createdBy: "admin", createdAt: Date.now() },
    ] },
];

const DEFAULT_GOALS: CodingGoals = {
  daily: 3, weekly: 20, monthly: 80,
  perPlatform: { leetcode: 2, gfg: 1, hackerrank: 0, github: 1 },
};

type Persisted = {
  tracks: Track[];
  completions: Record<string, string[]>;
  currentMemberId: string;
  codingLinks: Record<string, Partial<Record<Platform, string>>>;
  codingLogs: CodingLog[];
  codingGoals: CodingGoals;
  tasks: DailyTask[];
  taskCompletions: TaskCompletion[];
};

type StoreCtx = {
  tracks: Track[];
  members: Member[];
  currentMemberId: string;
  currentMember: Member;
  setCurrentMemberId: (id: string) => void;

  completedItemsFor: (memberId: string) => Set<string>;
  isCompleted: (memberId: string, itemId: string) => boolean;
  toggleCompleted: (itemId: string) => void;

  addTrack: (t: Omit<Track, "id" | "items"> & { items?: Item[] }) => Track;
  updateTrack: (trackId: string, patch: Partial<Pick<Track, "name" | "description" | "category">>) => void;
  removeTrack: (trackId: string) => void;
  addItem: (trackId: string, item: Omit<Item, "id" | "createdAt">) => Item;
  updateItem: (trackId: string, itemId: string, patch: Partial<Pick<Item, "title" | "description" | "links" | "driveFileId" | "driveType">>) => void;
  removeItem: (trackId: string, itemId: string) => void;

  completionForTrack: (trackId: string, memberId: string) => { done: number; total: number; pct: number };
  cohortCompletionForTrack: (trackId: string) => { done: number; total: number; pct: number };

  // Coding
  codingLinks: Record<string, Partial<Record<Platform, string>>>;
  setCodingLink: (memberId: string, platform: Platform, handle: string) => void;
  codingLogs: CodingLog[];
  addCodingLog: (log: Omit<CodingLog, "id">) => void;
  removeCodingLog: (id: string) => void;
  codingGoals: CodingGoals;
  setCodingGoals: (g: CodingGoals) => void;
  codingStatsFor: (memberId: string) => {
    total: number; easy: number; medium: number; hard: number;
    today: number; week: number; month: number;
    streak: number; longestStreak: number; lastActive?: string;
    perPlatform: Record<Platform, number>;
  };

  // Tasks
  tasks: DailyTask[];
  addTask: (t: Omit<DailyTask, "id" | "createdAt">) => DailyTask;
  removeTask: (id: string) => void;
  taskCompletions: TaskCompletion[];
  toggleTaskComplete: (taskId: string, memberId?: string) => void;
  tasksFor: (memberId: string, date?: string) => DailyTask[];
  isTaskDone: (taskId: string, memberId: string) => boolean;
};

const Ctx = createContext<StoreCtx | null>(null);

function seedLogs(): CodingLog[] {
  const logs: CodingLog[] = [];
  const platforms: Platform[] = ["leetcode", "gfg", "hackerrank", "github"];
  const topics = ["Arrays", "DP", "Graphs", "SQL", "Trees", "Strings"];
  MEMBERS.forEach((m, mi) => {
    for (let d = 0; d < 21; d++) {
      const date = new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
      const active = (d + mi) % 3 !== 0;
      if (!active) continue;
      const count = 1 + ((d + mi) % 3);
      logs.push({
        id: uid(), memberId: m.id,
        platform: platforms[(d + mi) % platforms.length],
        difficulty: (["easy", "medium", "hard"] as Difficulty[])[(d + mi) % 3],
        topic: topics[(d + mi) % topics.length],
        count, date,
      });
    }
  });
  return logs;
}

function memberFromUser(email: string | undefined | null): Member {
  const e = (email ?? "").toLowerCase();
  if (!e) return MEMBERS[0];
  if (e.startsWith("praveenadmin@")) return MEMBERS.find((m) => m.id === "m5")!;
  const local = e.split("@")[0];
  const match = MEMBERS.find((m) => m.role.toLowerCase() === local);
  return match ?? MEMBERS[0];
}

export function SkillonProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const currentMember = memberFromUser(user?.email);
  const currentMemberId = currentMember.id;

  const [tracks, setTracks] = useState<Track[]>(seedTracks);
  const [completions, setCompletions] = useState<Record<string, string[]>>({});
  const [codingLinks, setCodingLinks] = useState<Record<string, Partial<Record<Platform, string>>>>({});
  const [codingLogs, setCodingLogs] = useState<CodingLog[]>([]);
  const [codingGoals, setCodingGoalsState] = useState<CodingGoals>(DEFAULT_GOALS);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [taskCompletions, setTaskCompletions] = useState<TaskCompletion[]>([]);
  const [ready, setReady] = useState(false);

  const setCurrentMemberId = (_id: string) => {
    // Identity is bound to the signed-in user; ignore manual overrides.
  };

  useEffect(() => {
    setReady(false);
    const KEY = keyFor(user?.id);
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p: Persisted = JSON.parse(raw);
        setTracks(p.tracks?.length ? p.tracks : seedTracks());
        setCompletions(p.completions ?? {});
        setCodingLinks(p.codingLinks ?? {});
        setCodingLogs(p.codingLogs ?? []);
        setCodingGoalsState(p.codingGoals ?? DEFAULT_GOALS);
        setTasks(p.tasks ?? []);
        setTaskCompletions(p.taskCompletions ?? []);
      } else {
        const initial = seedTracks();
        setTracks(initial);
        setCompletions({ [currentMemberId]: [] });
        setCodingLinks({});
        setCodingLogs([]);
        setCodingGoalsState(DEFAULT_GOALS);
        setTasks([
          { id: uid(), title: "Solve 2 LeetCode problems", description: "One easy + one medium. Focus: arrays.", category: "coding", difficulty: "medium", priority: "high", dueDate: today(), estimatedMin: 45, xp: 40, links: [{ label: "LeetCode", url: "https://leetcode.com" }], assignTo: "all", createdAt: Date.now() },
          { id: uid(), title: "Read Probability notes", description: "Chapter on Bayes' Theorem.", category: "notes", difficulty: "easy", priority: "normal", dueDate: today(), estimatedMin: 30, xp: 20, links: [], assignTo: "all", createdAt: Date.now() },
          { id: uid(), title: "SQL Practice — Joins", description: "Solve 3 join problems on HackerRank.", category: "sql", difficulty: "medium", priority: "normal", dueDate: today(), estimatedMin: 40, xp: 30, links: [{ label: "HackerRank SQL", url: "https://hackerrank.com" }], assignTo: "all", createdAt: Date.now() },
        ]);
        setTaskCompletions([]);
      }
    } catch {}
    setReady(true);
  }, [user?.id]);

  useEffect(() => {
    if (!ready) return;
    const KEY = keyFor(user?.id);
    const p: Persisted = { tracks, completions, currentMemberId, codingLinks, codingLogs, codingGoals, tasks, taskCompletions };
    localStorage.setItem(KEY, JSON.stringify(p));
  }, [tracks, completions, currentMemberId, codingLinks, codingLogs, codingGoals, tasks, taskCompletions, ready, user?.id]);


  const value = useMemo<StoreCtx>(() => {
    const completedItemsFor = (memberId: string) => new Set(completions[memberId] ?? []);
    const isCompleted = (memberId: string, itemId: string) => (completions[memberId] ?? []).includes(itemId);

    const toggleCompleted = (itemId: string) => {
      setCompletions((prev) => {
        const list = prev[currentMemberId] ?? [];
        const next = list.includes(itemId) ? list.filter((i) => i !== itemId) : [...list, itemId];
        return { ...prev, [currentMemberId]: next };
      });
    };

    const addTrack: StoreCtx["addTrack"] = (t) => {
      const track: Track = { id: uid(), items: t.items ?? [], ...t } as Track;
      setTracks((p) => [...p, track]); return track;
    };
    const removeTrack = (trackId: string) => setTracks((p) => p.filter((t) => t.id !== trackId));
    const updateTrack: StoreCtx["updateTrack"] = (trackId, patch) => setTracks((p) => p.map((t) => t.id === trackId ? { ...t, ...patch } : t));
    const addItem: StoreCtx["addItem"] = (trackId, item) => {
      const full: Item = { id: uid(), createdAt: Date.now(), ...item };
      setTracks((p) => p.map((t) => t.id === trackId ? { ...t, items: [...t.items, full] } : t));
      return full;
    };
    const updateItem: StoreCtx["updateItem"] = (trackId, itemId, patch) =>
      setTracks((p) => p.map((t) => t.id === trackId ? { ...t, items: t.items.map((i) => i.id === itemId ? { ...i, ...patch } : i) } : t));
    const removeItem = (trackId: string, itemId: string) =>
      setTracks((p) => p.map((t) => t.id === trackId ? { ...t, items: t.items.filter((i) => i.id !== itemId) } : t));

    const completionForTrack = (trackId: string, memberId: string) => {
      const t = tracks.find((x) => x.id === trackId);
      if (!t) return { done: 0, total: 0, pct: 0 };
      const set = new Set(completions[memberId] ?? []);
      const done = t.items.filter((i) => set.has(i.id)).length;
      const total = t.items.length;
      return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
    };
    const cohortCompletionForTrack = (trackId: string) => {
      const t = tracks.find((x) => x.id === trackId);
      if (!t) return { done: 0, total: 0, pct: 0 };
      const total = t.items.length * MEMBERS.length;
      let done = 0;
      MEMBERS.forEach((m) => {
        const set = new Set(completions[m.id] ?? []);
        done += t.items.filter((i) => set.has(i.id)).length;
      });
      return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
    };

    // Coding
    const setCodingLink = (memberId: string, platform: Platform, handle: string) =>
      setCodingLinks((prev) => ({ ...prev, [memberId]: { ...(prev[memberId] ?? {}), [platform]: handle } }));
    const addCodingLog: StoreCtx["addCodingLog"] = (log) =>
      setCodingLogs((prev) => [...prev, { id: uid(), ...log }]);
    const removeCodingLog = (id: string) => setCodingLogs((prev) => prev.filter((l) => l.id !== id));
    const setCodingGoals = (g: CodingGoals) => setCodingGoalsState(g);

    const codingStatsFor: StoreCtx["codingStatsFor"] = (memberId) => {
      const logs = codingLogs.filter((l) => l.memberId === memberId);
      const t = today();
      const weekStart = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
      const monthStart = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
      const sum = (fn: (l: CodingLog) => boolean) => logs.filter(fn).reduce((s, l) => s + l.count, 0);
      const perPlatform: Record<Platform, number> = { leetcode: 0, gfg: 0, hackerrank: 0, github: 0 };
      logs.forEach((l) => { perPlatform[l.platform] += l.count; });
      // streak
      const dates = new Set(logs.map((l) => l.date));
      let streak = 0;
      for (let d = 0; d < 365; d++) {
        const day = new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
        if (dates.has(day)) streak++; else break;
      }
      // longest streak
      const sorted = [...dates].sort();
      let longest = 0, run = 0, prev = "";
      for (const day of sorted) {
        if (prev) {
          const diff = (new Date(day).getTime() - new Date(prev).getTime()) / 86400000;
          run = diff === 1 ? run + 1 : 1;
        } else run = 1;
        longest = Math.max(longest, run);
        prev = day;
      }
      const lastActive = sorted[sorted.length - 1];
      return {
        total: sum(() => true),
        easy: sum((l) => l.difficulty === "easy"),
        medium: sum((l) => l.difficulty === "medium"),
        hard: sum((l) => l.difficulty === "hard"),
        today: sum((l) => l.date === t),
        week: sum((l) => l.date >= weekStart),
        month: sum((l) => l.date >= monthStart),
        streak, longestStreak: longest, lastActive, perPlatform,
      };
    };

    // Tasks
    const addTask: StoreCtx["addTask"] = (t) => {
      const full: DailyTask = { id: uid(), createdAt: Date.now(), ...t };
      setTasks((p) => [...p, full]); return full;
    };
    const removeTask = (id: string) => setTasks((p) => p.filter((t) => t.id !== id));
    const toggleTaskComplete = (taskId: string, memberId?: string) => {
      const mid = memberId ?? currentMemberId;
      setTaskCompletions((prev) => {
        const exists = prev.find((c) => c.taskId === taskId && c.memberId === mid);
        if (exists) return prev.filter((c) => !(c.taskId === taskId && c.memberId === mid));
        return [...prev, { taskId, memberId: mid, completedAt: Date.now() }];
      });
    };
    const tasksFor = (memberId: string, date?: string) => {
      const d = date ?? today();
      return tasks.filter((t) => t.dueDate === d && (t.assignTo === "all" || t.assignTo.includes(memberId)));
    };
    const isTaskDone = (taskId: string, memberId: string) =>
      taskCompletions.some((c) => c.taskId === taskId && c.memberId === memberId);

    const currentMember = MEMBERS.find((m) => m.id === currentMemberId) ?? MEMBERS[0];

    return {
      tracks, members: MEMBERS, currentMemberId, currentMember, setCurrentMemberId,
      completedItemsFor, isCompleted, toggleCompleted,
      addTrack, updateTrack, removeTrack, addItem, updateItem, removeItem,
      completionForTrack, cohortCompletionForTrack,
      codingLinks, setCodingLink, codingLogs, addCodingLog, removeCodingLog,
      codingGoals, setCodingGoals, codingStatsFor,
      tasks, addTask, removeTask, taskCompletions, toggleTaskComplete, tasksFor, isTaskDone,
    };
  }, [tracks, completions, currentMemberId, codingLinks, codingLogs, codingGoals, tasks, taskCompletions]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSkillon() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSkillon must be used inside SkillonProvider");
  return c;
}

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

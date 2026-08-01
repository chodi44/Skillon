import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { SkyShell, TopBar, PageHero } from "@/components/site-header";
import { ClipboardList, Play, CheckCircle, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/mock/")({
  head: () => ({
    meta: [
      { title: "Mock Tests — Skillon" },
      { name: "description", content: "Practice with GATE-style mock exams and timed quizzes." },
    ],
  }),
  component: MockDirectory,
});

type TestWithAttempt = {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  total_marks: number;
  attempt?: {
    id: string;
    status: string;
    score: number | null;
  } | null;
};

function MockDirectory() {
  const { user, isAuthenticated } = useAuth();
  const [tests, setTests] = useState<TestWithAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Fetch published tests
      const { data: testData, error: testErr } = await supabase
        .from("mock_tests")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (testErr) throw testErr;

      // 2. Fetch user's attempts
      const { data: attemptData, error: attErr } = await supabase
        .from("mock_attempts")
        .select("id, test_id, status, score")
        .eq("user_id", user.id);

      if (attErr) throw attErr;

      const attemptsMap = (attemptData || []).reduce((acc: any, curr) => {
        // Keep the latest attempt for each test
        acc[curr.test_id] = curr;
        return acc;
      }, {});

      const combined = (testData || []).map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description || "",
        duration_minutes: t.duration_minutes,
        total_marks: t.total_marks,
        attempt: attemptsMap[t.id] || null,
      }));

      setTests(combined);
    } catch (err) {
      console.error("Error loading mock tests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  if (!isAuthenticated) return null;

  return (
    <SkyShell>
      <TopBar title="Mock Tests" />
      <main className="relative z-10 px-5 pt-4 pb-32 space-y-5">
        <PageHero
          eyebrow="Assessment Center"
          title={<>Mock <span className="text-butter">Tests</span></>}
          subtitle="Simulate real exam conditions. Timed sessions with live score analytics."
          stats={[
            { label: "Published", value: tests.length },
            { label: "Completed", value: tests.filter(t => t.attempt?.status === "SUBMITTED").length },
          ]}
        />

        <section className="card-glass p-5 text-[#12121a]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-[#12121a] flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-butter" /> Available Exams
            </h2>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              title="Reload tests"
            >
              <RefreshCw className={`h-4 w-4 text-slate-600 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">Loading tests...</div>
          ) : tests.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              No mock tests are currently published by the admin.
            </div>
          ) : (
            <div className="space-y-4">
              {tests.map((t) => {
                const isCompleted = t.attempt?.status === "SUBMITTED";
                const isInProgress = t.attempt?.status === "IN_PROGRESS";

                return (
                  <div
                    key={t.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition-all"
                  >
                    <div className="space-y-1 max-w-xl">
                      <h3 className="font-display font-medium text-slate-900 text-lg">{t.title}</h3>
                      {t.description && <p className="text-sm text-slate-500">{t.description}</p>}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2 font-mono">
                        <span>Duration: <b className="text-slate-700">{t.duration_minutes} mins</b></span>
                        <span>•</span>
                        <span>Total Marks: <b className="text-slate-700">{t.total_marks}</b></span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      {isCompleted ? (
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                            <CheckCircle className="h-3.5 w-3.5" /> Score: {t.attempt?.score ?? 0}
                          </span>
                          <Link
                            to={`/mock/${t.id}/analytics`}
                            className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                          >
                            View Analytics
                          </Link>
                        </div>
                      ) : isInProgress ? (
                        <Link
                          to={`/mock/${t.id}`}
                          className="rounded-full bg-amber-500 text-white px-5 py-2.5 text-xs font-semibold hover:bg-amber-600 transition-colors inline-flex items-center gap-1.5"
                        >
                          <Play className="h-3.5 w-3.5" /> Resume Test
                        </Link>
                      ) : (
                        <Link
                          to={`/mock/${t.id}`}
                          className="rounded-full bg-[#12121a] text-white px-5 py-2.5 text-xs font-semibold hover:bg-black transition-colors inline-flex items-center gap-1.5"
                        >
                          <Play className="h-3.5 w-3.5" /> Start Test
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </SkyShell>
  );
}

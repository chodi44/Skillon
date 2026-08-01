import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/mock/$testId/analytics")({
  component: MockTestAnalytics,
});

function MockTestAnalytics() {
  const { testId } = Route.useParams();
  const { user } = useAuth();
  
  const [test, setTest] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);

  useEffect(() => {
    async function load() {
      if (!user) return;
      
      const { data: t } = await supabase.from("mock_tests").select("*").eq("id", testId).single();
      if (t) setTest(t);
      
      const { data: a } = await supabase
        .from("mock_attempts")
        .select("*")
        .eq("test_id", testId)
        .eq("user_id", user.id)
        .eq("status", "SUBMITTED")
        .order("end_time", { ascending: false })
        .limit(1)
        .single();
        
      if (a) setAttempt(a);
    }
    load();
  }, [testId, user]);

  if (!test || !attempt) return <div className="p-8">Loading analytics...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8 py-16">
      <div className="text-center">
        <div className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-bold uppercase tracking-widest rounded-full mb-4">
          Test Submitted
        </div>
        <h1 className="font-display text-4xl text-slate-900 mb-2">{test.title}</h1>
        <p className="text-slate-500">You have successfully completed this mock test.</p>
      </div>
      
      <div className="mt-12 grid grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-sm">
          <div className="text-6xl font-display text-slate-900 mb-2">{attempt.score ?? 0}</div>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Score / {test.total_marks}</div>
        </div>
        
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-sm">
          <div className="text-6xl font-display text-blue-600 mb-2">
            {attempt.responses ? Object.keys(attempt.responses).length : 0}
          </div>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Attempted</div>
        </div>
        
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-sm flex flex-col items-center justify-center">
          <Link 
            to="/" 
            className="px-6 py-3 bg-[#12121a] text-white rounded-xl font-medium w-full hover:bg-black transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
      
      <div className="mt-12 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        <h2 className="font-display text-xl text-slate-900 mb-6">Performance Insights</h2>
        <div className="space-y-4 text-slate-600">
          <p>Detailed question-by-question analysis will be generated once the cohort completes the test.</p>
          <div className="h-40 bg-slate-50 rounded-xl border border-slate-100 grid place-items-center">
            <span className="text-sm text-slate-400 font-medium">Rankings Pending...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

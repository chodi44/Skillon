import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/mock/$testId")({
  component: MockTestSimulator,
});

function MockTestSimulator() {
  const { testId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  
  const [activeQ, setActiveQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      if (!user) return;
      
      const { data: t } = await supabase.from("mock_tests").select("*").eq("id", testId).single();
      if (!t) return;
      setTest(t);
      
      const { data: q } = await supabase.from("mock_questions").select("*").eq("test_id", testId);
      if (q) setQuestions(q);
      
      const { data: existing } = await supabase
        .from("mock_attempts")
        .select("*")
        .eq("test_id", testId)
        .eq("user_id", user.id)
        .eq("status", "IN_PROGRESS")
        .single();
        
      if (existing) {
        setAttemptId(existing.id);
        setResponses(existing.responses || {});
        const elapsed = (Date.now() - new Date(existing.start_time).getTime()) / 1000;
        const remaining = (t.duration_minutes * 60) - elapsed;
        setTimeLeft(Math.max(0, remaining));
      } else {
        const { data: newAtt } = await supabase
          .from("mock_attempts")
          .insert({ test_id: testId, user_id: user.id })
          .select()
          .single();
        if (newAtt) {
          setAttemptId(newAtt.id);
          setTimeLeft(t.duration_minutes * 60);
        }
      }
    }
    load();
  }, [testId, user]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) {
      if (timeLeft === 0 && attemptId) {
        submitTest();
      }
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(t => (t ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, attemptId]);

  const saveResponse = async (qId: string, val: string) => {
    if (!attemptId) return;
    const next = { ...responses, [qId]: val };
    setResponses(next);
    await supabase.from("mock_attempts").update({ responses: next }).eq("id", attemptId);
  };

  const submitTest = async () => {
    if (!attemptId) return;
    let score = 0;
    questions.forEach(q => {
      const ans = responses[q.id];
      if (ans) {
        if (ans === q.correct_answer) score += Number(q.positive_marks);
        else score -= Number(q.negative_marks);
      }
    });
    
    await supabase.from("mock_attempts").update({
      status: "SUBMITTED",
      end_time: new Date().toISOString(),
      score
    }).eq("id", attemptId);
    
    navigate({ to: `/mock/${testId}/analytics` });
  };

  if (!test) return <div className="h-screen grid place-items-center bg-slate-50">Loading test...</div>;

  const currentQ = questions[activeQ];
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="flex h-screen bg-white">
      {/* LEFT: Main test area */}
      <div className="flex-1 flex flex-col h-full border-r border-slate-200">
        <header className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-slate-50">
          <div className="font-display font-medium text-slate-800">{test.title}</div>
          <div className="font-mono text-red-600 font-bold tracking-widest bg-red-50 px-3 py-1 rounded">
            {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-8">
          {currentQ ? (
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="font-display text-xl text-slate-900">Question {activeQ + 1}</h2>
                <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                  [+{currentQ.positive_marks}, -{currentQ.negative_marks}]
                </span>
              </div>
              
              <div className="prose prose-slate max-w-none text-sm whitespace-pre-wrap">
                {currentQ.question_text}
              </div>
              
              <div className="mt-8 space-y-3">
                {currentQ.question_type === 'MCQ' && currentQ.options ? (
                  (currentQ.options as any[]).map((opt: string, i: number) => {
                    const letter = String.fromCharCode(65 + i);
                    const selected = responses[currentQ.id] === letter;
                    return (
                      <button
                        key={letter}
                        onClick={() => saveResponse(currentQ.id, letter)}
                        className={`w-full text-left p-4 rounded-xl border flex items-center gap-4 transition-colors ${
                          selected 
                            ? 'border-blue-600 bg-blue-50' 
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className={`grid place-items-center w-6 h-6 rounded-full text-xs font-medium border ${
                          selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-500 border-slate-300'
                        }`}>
                          {letter}
                        </div>
                        <span className="text-sm text-slate-700">{opt}</span>
                      </button>
                    )
                  })
                ) : (
                  <input 
                    type="text" 
                    value={responses[currentQ.id] || ""}
                    onChange={(e) => saveResponse(currentQ.id, e.target.value)}
                    placeholder="Enter numerical answer..."
                    className="w-full max-w-sm p-3 rounded-xl border border-slate-300 outline-none focus:border-blue-600"
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="text-slate-400 text-sm">No questions available.</div>
          )}
        </main>
        
        <footer className="h-16 border-t border-slate-200 flex items-center justify-between px-6 bg-slate-50">
          <div className="space-x-3">
            <button 
              disabled={activeQ === 0}
              onClick={() => setActiveQ(q => q - 1)}
              className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-sm font-medium disabled:opacity-50"
            >
              Previous
            </button>
            <button 
              disabled={activeQ === questions.length - 1}
              onClick={() => setActiveQ(q => q + 1)}
              className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-sm font-medium disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <button 
            onClick={() => setActiveQ(q => q + 1)}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            Save & Next
          </button>
        </footer>
      </div>
      
      {/* RIGHT: Palette */}
      <div className="w-80 h-full flex flex-col bg-slate-50">
        <div className="p-4 flex items-center gap-3 border-b border-slate-200">
          <div className="w-12 h-12 bg-slate-200 rounded overflow-hidden">
            {user?.user_metadata?.avatar_url && <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate text-slate-800">{user?.user_metadata?.full_name || 'Student'}</div>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          <h3 className="font-display text-sm text-slate-800 mb-3">Question Palette</h3>
          <div className="grid grid-cols-4 gap-2">
            {questions.map((q, i) => {
              const answered = !!responses[q.id];
              const isCurrent = activeQ === i;
              return (
                <button
                  key={q.id}
                  onClick={() => setActiveQ(i)}
                  className={`aspect-square grid place-items-center rounded-lg text-sm font-medium border-2 transition-all ${
                    isCurrent ? 'border-slate-800' : 'border-transparent'
                  } ${
                    answered ? 'bg-green-500 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-200">
          <button 
            onClick={submitTest}
            className="w-full py-3 rounded-xl bg-[#12121a] text-white font-medium hover:bg-black transition-colors"
          >
            Submit Test
          </button>
        </div>
      </div>
    </div>
  );
}

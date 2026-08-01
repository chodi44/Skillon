import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus, Pencil, Check, X, Eye, EyeOff, ClipboardList, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/admin/assessments")({
  head: () => ({
    meta: [
      { title: "Assessments — Skillon Admin" },
      { name: "description", content: "Create daily quizzes, chapter tests and mock exams." },
    ],
  }),
  component: AssessmentsPage,
});

type MockTest = {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  total_marks: number;
  is_published: boolean;
  created_at: string;
};

type MockQuestion = {
  id: string;
  test_id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  correct_answer: string;
  positive_marks: number;
  negative_marks: number;
  created_at: string;
};

function AssessmentsPage() {
  const [tests, setTests] = useState<MockTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<MockTest | null>(null);
  const [questions, setQuestions] = useState<MockQuestion[]>([]);

  // Create Test Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(180);
  const [totalMarks, setTotalMarks] = useState(100);

  // Question Form State
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState("MCQ"); // MCQ, NAT
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");
  const [correctMCQ, setCorrectMCQ] = useState("A");
  const [correctNAT, setCorrectNAT] = useState("");
  const [posMarks, setPosMarks] = useState(1);
  const [negMarks, setNegMarks] = useState(0.33);

  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const fetchTests = async () => {
    const { data, error } = await supabase
      .from("mock_tests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
    } else if (data) {
      setTests(data);
    }
  };

  const fetchQuestions = async (testId: string) => {
    const { data, error } = await supabase
      .from("mock_questions")
      .select("*")
      .eq("test_id", testId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error(error);
    } else if (data) {
      setQuestions(data as any);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  useEffect(() => {
    if (selectedTest) {
      fetchQuestions(selectedTest.id);
    }
  }, [selectedTest]);

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("mock_tests")
      .insert({
        title: title.trim(),
        description: description.trim(),
        duration_minutes: duration,
        total_marks: totalMarks,
        is_published: false,
      })
      .select()
      .single();

    setLoading(false);
    if (error) {
      alert(`Error creating test: ${error.message}`);
    } else if (data) {
      setTitle("");
      setDescription("");
      setDuration(180);
      setTotalMarks(100);
      setFlash("Mock test created successfully!");
      fetchTests();
      setTimeout(() => setFlash(null), 3000);
    }
  };

  const togglePublish = async (test: MockTest) => {
    const { error } = await supabase
      .from("mock_tests")
      .update({ is_published: !test.is_published })
      .eq("id", test.id);

    if (error) {
      alert(`Error updating test: ${error.message}`);
    } else {
      fetchTests();
      if (selectedTest?.id === test.id) {
        setSelectedTest({ ...selectedTest, is_published: !test.is_published });
      }
    }
  };

  const handleDeleteTest = async (id: string) => {
    if (!confirm("Are you sure you want to delete this test and all its questions?")) return;
    const { error } = await supabase.from("mock_tests").delete().eq("id", id);
    if (error) {
      alert(`Error deleting test: ${error.message}`);
    } else {
      if (selectedTest?.id === id) {
        setSelectedTest(null);
        setQuestions([]);
      }
      fetchTests();
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTest || !qText.trim()) return;

    let finalAnswer = "";
    let finalOptions: string[] | null = null;

    if (qType === "MCQ") {
      if (!optA.trim() || !optB.trim()) {
        alert("Please provide at least Option A and Option B.");
        return;
      }
      finalOptions = [optA.trim(), optB.trim(), optC.trim(), optD.trim()].filter(Boolean);
      finalAnswer = correctMCQ;
    } else {
      if (!correctNAT.trim()) {
        alert("Please provide the correct numerical answer.");
        return;
      }
      finalAnswer = correctNAT.trim();
    }

    setLoading(true);
    const { error } = await supabase.from("mock_questions").insert({
      test_id: selectedTest.id,
      question_text: qText.trim(),
      question_type: qType,
      options: finalOptions,
      correct_answer: finalAnswer,
      positive_marks: posMarks,
      negative_marks: negMarks,
    });

    setLoading(false);
    if (error) {
      alert(`Error adding question: ${error.message}`);
    } else {
      setQText("");
      setOptA("");
      setOptB("");
      setOptC("");
      setOptD("");
      setCorrectNAT("");
      fetchQuestions(selectedTest.id);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    const { error } = await supabase.from("mock_questions").delete().eq("id", id);
    if (error) {
      alert(`Error deleting question: ${error.message}`);
    } else if (selectedTest) {
      fetchQuestions(selectedTest.id);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12 items-start px-1 pb-32">
      {/* LEFT COLUMN: Manage & Create Tests */}
      <div className="lg:col-span-5 grid gap-6">
        {/* Create Test Form */}
        <form onSubmit={handleCreateTest} className="card-glass p-6">
          <div className="pill bg-[#fff4cf] text-[#12121a] inline-block mb-3">Create assessment</div>
          <h2 className="font-display text-2xl text-slate-900 mb-4">New Mock Test</h2>

          <div className="grid gap-3">
            <label className="block">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1 block">Test Title</span>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#12121a]"
                placeholder="e.g. GATE CS 2026 Grand Mock #1"
              />
            </label>

            <label className="block">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1 block">Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#12121a] min-h-[80px]"
                placeholder="Details or syllabus for the mock test..."
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1 block">Duration (mins)</span>
                <input
                  type="number"
                  required
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#12121a]"
                />
              </label>

              <label className="block">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1 block">Total Marks</span>
                <input
                  type="number"
                  required
                  min={1}
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(parseInt(e.target.value))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#12121a]"
                />
              </label>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-[#12121a] px-5 py-3 text-sm font-medium text-white hover:bg-black transition-colors"
              >
                Create Mock Test
              </button>
              {flash && <span className="text-sm text-emerald-600">{flash}</span>}
            </div>
          </div>
        </form>

        {/* Existing Tests List */}
        <section className="card-glass p-6">
          <h2 className="font-display text-xl text-slate-900 mb-4">Existing Tests ({tests.length})</h2>
          <div className="space-y-3">
            {tests.length === 0 && (
              <p className="text-sm text-slate-500">No mock tests created yet.</p>
            )}
            {tests.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTest(t)}
                className={`rounded-2xl border p-4 cursor-pointer transition-all ${
                  selectedTest?.id === t.id
                    ? "border-[#12121a] bg-slate-50/50 shadow-sm"
                    : "border-slate-100 bg-white hover:border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium text-slate-900">{t.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {t.duration_minutes} mins · {t.total_marks} marks
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => togglePublish(t)}
                      className={`p-1.5 rounded-full ${
                        t.is_published
                          ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          : "bg-amber-50 text-amber-600 hover:bg-amber-100"
                      }`}
                      title={t.is_published ? "Unpublish Test" : "Publish Test"}
                    >
                      {t.is_published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDeleteTest(t.id)}
                      className="p-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100"
                      title="Delete Test"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* RIGHT COLUMN: Question Manager for Selected Test */}
      <div className="lg:col-span-7">
        {selectedTest ? (
          <div className="grid gap-6">
            {/* Add Question Form */}
            <form onSubmit={handleAddQuestion} className="card-glass p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="pill bg-[#4285F4]/10 text-[#4285F4] inline-block mb-1">Question builder</div>
                  <h2 className="font-display text-xl text-slate-900 truncate max-w-md">
                    Questions for: {selectedTest.title}
                  </h2>
                </div>
                <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <ClipboardList className="h-3 w-3" /> {questions.length} total
                </span>
              </div>

              <div className="grid gap-3">
                <label className="block">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1 block">Question Text</span>
                  <textarea
                    required
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#12121a] min-h-[90px]"
                    placeholder="Enter the question text here..."
                  />
                </label>

                <div className="grid grid-cols-3 gap-3">
                  <label className="block">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1 block">Type</span>
                    <select
                      value={qType}
                      onChange={(e) => setQType(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#12121a]"
                    >
                      <option value="MCQ">MCQ (Single Choice)</option>
                      <option value="NAT">NAT (Numerical)</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1 block">Positive Marks</span>
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      required
                      value={posMarks}
                      onChange={(e) => setPosMarks(parseFloat(e.target.value))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#12121a]"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1 block">Negative Marks</span>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      required
                      value={negMarks}
                      onChange={(e) => setNegMarks(parseFloat(e.target.value))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#12121a]"
                    />
                  </label>
                </div>

                {/* Option fields for MCQ */}
                {qType === "MCQ" && (
                  <div className="grid gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">MCQ Options</div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        required
                        value={optA}
                        onChange={(e) => setOptA(e.target.value)}
                        placeholder="Option A"
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none"
                      />
                      <input
                        required
                        value={optB}
                        onChange={(e) => setOptB(e.target.value)}
                        placeholder="Option B"
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none"
                      />
                      <input
                        value={optC}
                        onChange={(e) => setOptC(e.target.value)}
                        placeholder="Option C (Optional)"
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none"
                      />
                      <input
                        value={optD}
                        onChange={(e) => setOptD(e.target.value)}
                        placeholder="Option D (Optional)"
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none"
                      />
                    </div>
                    <label className="block mt-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1 block">Correct Option Letter</span>
                      <select
                        value={correctMCQ}
                        onChange={(e) => setCorrectMCQ(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        {optC && <option value="C">C</option>}
                        {optD && <option value="D">D</option>}
                      </select>
                    </label>
                  </div>
                )}

                {/* Answer fields for NAT */}
                {qType === "NAT" && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <label className="block">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1 block">Correct Numerical Value</span>
                      <input
                        required
                        value={correctNAT}
                        onChange={(e) => setCorrectNAT(e.target.value)}
                        placeholder="e.g. 42 or 3.14"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none"
                      />
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-[#12121a] px-5 py-3 text-sm font-medium text-white hover:bg-black transition-colors mt-2"
                >
                  Add Question
                </button>
              </div>
            </form>

            {/* Questions List */}
            <div className="card-glass p-6">
              <h3 className="font-display text-lg text-slate-900 mb-4">Questions</h3>
              <div className="space-y-4 divide-y divide-slate-100">
                {questions.length === 0 && (
                  <p className="text-sm text-slate-500">No questions added yet. Use the builder above.</p>
                )}
                {questions.map((q, idx) => (
                  <div key={q.id} className={`pt-4 ${idx === 0 ? "pt-0" : ""}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">Q{idx + 1}</span>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {q.question_type}
                          </span>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            [+{q.positive_marks}, -{q.negative_marks}]
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{q.question_text}</p>
                        {q.options && (
                          <div className="grid grid-cols-2 gap-2 mt-2 pl-2">
                            {(q.options as string[]).map((opt, oIdx) => (
                              <div key={oIdx} className="text-xs text-slate-500">
                                <span className="font-bold">{String.fromCharCode(65 + oIdx)}.</span> {opt}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="text-xs text-emerald-600 font-mono mt-1">
                          Correct Answer: {q.correct_answer}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="card-glass p-12 text-center text-slate-500 flex flex-col items-center justify-center min-h-[400px]">
            <HelpCircle className="h-12 w-12 text-slate-300 mb-3" />
            <h3 className="font-display text-lg text-slate-700">No Mock Test Selected</h3>
            <p className="text-xs max-w-sm mt-1">
              Select an existing mock test from the left column to manage its questions or publish it to students.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

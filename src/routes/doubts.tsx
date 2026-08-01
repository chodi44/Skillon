import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, CheckCircle, HelpCircle, CornerDownRight, Send, Check, RefreshCw } from "lucide-react";
import { SkyShell, TopBar } from "@/components/site-header";

export const Route = createFileRoute("/doubts")({
  component: () => (
    <SkyShell>
      <TopBar title="Q&A Forum" back="/dashboard" />
      <DoubtsComponent />
    </SkyShell>
  ),
  head: () => ({
    meta: [
      { title: "Q&A Forum — Skillon" },
      { name: "description", content: "Discuss doubts with peers and instructors." },
    ],
  }),
});

function DoubtsComponent() {
  const { user } = useAuth();
  const [doubts, setDoubts] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [expandedDoubtId, setExpandedDoubtId] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, any[]>>({});
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchDoubts = async () => {
    const { data } = await supabase
      .from("peer_doubts")
      .select("*, profiles!peer_doubts_author_id_fkey(full_name, avatar_url)")
      .order("created_at", { ascending: false });
    if (data) setDoubts(data);
  };

  const fetchReplies = async (doubtId: string) => {
    const { data } = await supabase
      .from("peer_doubt_replies")
      .select("*, profiles!peer_doubt_replies_author_id_fkey(full_name, avatar_url)")
      .eq("doubt_id", doubtId)
      .order("created_at", { ascending: true });
    if (data) {
      setReplies((prev) => ({ ...prev, [doubtId]: data }));
    }
  };

  useEffect(() => {
    fetchDoubts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle.trim() || !newDesc.trim()) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("peer_doubts")
      .insert({
        author_id: user.id,
        title: newTitle.trim(),
        description: newDesc.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      // Create activity feed entry
      await supabase.from("activity_feed").insert({
        user_id: user.id,
        action_type: "asked a peer doubt",
        metadata: { title: newTitle.trim(), doubt_id: data.id },
      });

      setNewTitle("");
      setNewDesc("");
      fetchDoubts();
    }
    setLoading(false);
  };

  const handlePostReply = async (doubtId: string) => {
    if (!user || !replyText.trim()) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("peer_doubt_replies")
      .insert({
        doubt_id: doubtId,
        author_id: user.id,
        body: replyText.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      const doubt = doubts.find((d) => d.id === doubtId);
      // Create activity feed entry
      await supabase.from("activity_feed").insert({
        user_id: user.id,
        action_type: "replied to a doubt",
        metadata: { title: doubt?.title || "", doubt_id: doubtId },
      });

      setReplyText("");
      fetchReplies(doubtId);
    }
    setLoading(false);
  };

  const handleMarkAsSolution = async (doubtId: string, replyId: string) => {
    if (!user) return;
    setLoading(true);

    // Update reply to be solution
    const { error: replyErr } = await supabase
      .from("peer_doubt_replies")
      .update({ is_solution: true })
      .eq("id", replyId);

    if (!replyErr) {
      // Update doubt to resolved
      await supabase
        .from("peer_doubts")
        .update({ resolved: true })
        .eq("id", doubtId);

      const doubt = doubts.find((d) => d.id === doubtId);
      // Create activity feed entry
      await supabase.from("activity_feed").insert({
        user_id: user.id,
        action_type: "resolved a doubt",
        metadata: { title: doubt?.title || "", doubt_id: doubtId },
      });

      fetchDoubts();
      fetchReplies(doubtId);
    }
    setLoading(false);
  };

  const toggleExpandDoubt = (id: string) => {
    if (expandedDoubtId === id) {
      setExpandedDoubtId(null);
    } else {
      setExpandedDoubtId(id);
      fetchReplies(id);
    }
  };

  return (
    <div className="container mx-auto py-4 px-4 max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-butter">Peer Learning</span>
          <h1 className="text-3xl font-display font-medium text-white mt-1">Peer Doubts</h1>
        </div>
        <button
          onClick={fetchDoubts}
          className="p-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Ask Question Box */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-glass p-5 text-slate-800"
      >
        <h2 className="text-lg font-display text-slate-900 mb-3 flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-[#4285F4]" /> Ask a Question
        </h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <input
            type="text"
            required
            placeholder="Title (e.g. Help with LeetCode 75 - Merge Intervals)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#12121a]"
          />
          <textarea
            required
            placeholder="Provide context, code snippets, or error details..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#12121a]"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-[#12121a] text-white px-5 py-2 text-xs font-semibold hover:bg-black transition-colors"
          >
            Post Doubt
          </button>
        </form>
      </motion.div>

      {/* Doubts List */}
      <div className="space-y-4">
        {doubts.map((d, i) => {
          const isExpanded = expandedDoubtId === d.id;
          const doubtReplies = replies[d.id] || [];
          const isAuthor = user?.id === d.author_id;

          return (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card-glass p-5 text-slate-800"
            >
              <div
                className="cursor-pointer"
                onClick={() => toggleExpandDoubt(d.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="font-display font-medium text-slate-900 text-base flex items-center gap-2">
                      {d.title}
                      {d.resolved && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-mono rounded-full border border-emerald-100">
                          <CheckCircle className="h-3 w-3" /> Resolved
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 whitespace-pre-wrap">{d.description}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono pt-1">
                      <span className="font-semibold text-slate-600">
                        {d.profiles?.full_name || "Unknown"}
                      </span>
                      <span>•</span>
                      <span>{new Date(d.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-slate-400 hover:text-slate-600 flex flex-col items-center">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-[10px] font-bold">{doubtReplies.length || 0}</span>
                  </div>
                </div>
              </div>

              {/* Expanded Replies Section */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-4 pt-4 border-t border-slate-100 space-y-4"
                  >
                    {/* List of Replies */}
                    <div className="space-y-3 pl-3">
                      {doubtReplies.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No replies yet.</p>
                      ) : (
                        doubtReplies.map((r) => (
                          <div key={r.id} className="flex gap-2 items-start">
                            <CornerDownRight className="h-4 w-4 text-slate-300 mt-1 flex-none" />
                            <div
                              className={`flex-1 rounded-xl p-3 text-xs relative ${
                                r.is_solution
                                  ? "bg-emerald-50/70 border border-emerald-100 text-slate-800"
                                  : "bg-slate-50 text-slate-700"
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <span className="font-semibold text-slate-800">
                                  {r.profiles?.full_name || "Anonymous"}
                                </span>
                                {r.is_solution ? (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-mono text-emerald-600 bg-emerald-100/50 px-1.5 py-0.5 rounded-full">
                                    <Check className="h-2.5 w-2.5" /> Solution
                                  </span>
                                ) : (
                                  isAuthor && !d.resolved && (
                                    <button
                                      onClick={() => handleMarkAsSolution(d.id, r.id)}
                                      className="text-[9px] font-mono text-emerald-600 hover:underline inline-flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100"
                                    >
                                      Accept Solution
                                    </button>
                                  )
                                )}
                              </div>
                              <p className="mt-1 whitespace-pre-wrap">{r.body}</p>
                              <span className="text-[9px] text-slate-400 block mt-1">
                                {new Date(r.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Write Reply Form */}
                    <div className="flex gap-2 items-center pl-3">
                      <input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#12121a]"
                      />
                      <button
                        onClick={() => handlePostReply(d.id)}
                        disabled={loading}
                        className="p-2 rounded-full bg-[#12121a] text-white hover:bg-black transition-colors"
                      >
                        <Send className="h-3 w-3" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

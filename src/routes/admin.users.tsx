import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Award, Check, X, Search, Shield, User } from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Users — Skillon Admin" },
      { name: "description", content: "Manage students, tracks and roles." },
    ],
  }),
  component: UsersPage,
});

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  learning_track: string | null;
};

type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: string | null;
};

function UsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<Record<string, string[]>>({}); // userId -> badgeIds[]
  
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [managing, setManaging] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load profiles
      const { data: pData } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name", { ascending: true });
      if (pData) setProfiles(pData);

      // 2. Load roles
      const { data: rData } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rData) {
        const mapped = rData.reduce((acc: Record<string, string>, curr) => {
          acc[curr.user_id] = curr.role;
          return acc;
        }, {});
        setRoles(mapped);
      }

      // 3. Load badges
      const { data: bData } = await supabase
        .from("badges")
        .select("*");
      if (bData) setBadges(bData);

      // 4. Load awarded badges
      const { data: ubData } = await supabase
        .from("user_badges")
        .select("user_id, badge_id");
      if (ubData) {
        const mapped = ubData.reduce((acc: Record<string, string[]>, curr) => {
          acc[curr.user_id] = acc[curr.user_id] || [];
          acc[curr.user_id].push(curr.badge_id);
          return acc;
        }, {});
        setUserBadges(mapped);
      }

    } catch (err) {
      console.error("Error loading admin users page:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAwardBadge = async (userId: string, badgeId: string) => {
    setManaging(true);
    const alreadyHas = (userBadges[userId] || []).includes(badgeId);

    if (alreadyHas) {
      // Revoke badge
      const { error } = await supabase
        .from("user_badges")
        .delete()
        .eq("user_id", userId)
        .eq("badge_id", badgeId);
      
      if (error) {
        alert(error.message);
      } else {
        setUserBadges((prev) => ({
          ...prev,
          [userId]: (prev[userId] || []).filter((id) => id !== badgeId),
        }));
      }
    } else {
      // Award badge
      const { error } = await supabase
        .from("user_badges")
        .insert({ user_id: userId, badge_id: badgeId });
      
      if (error) {
        alert(error.message);
      } else {
        setUserBadges((prev) => ({
          ...prev,
          [userId]: [...(prev[userId] || []), badgeId],
        }));
      }
    }
    setManaging(false);
  };

  const filtered = profiles.filter((u) => {
    const text = (u.full_name || "" + u.email + (u.learning_track || "")).toLowerCase();
    return text.includes(q.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-butter" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12 px-1 pb-32 items-start">
      {/* Users Table */}
      <div className="lg:col-span-7 card-glass p-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-butter">Admin Panel</span>
            <h1 className="text-2xl font-display font-medium text-slate-900 mt-1">Students &amp; Staff</h1>
          </div>
          <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
            {filtered.length} total
          </span>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, or track..."
            className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#12121a]"
          />
        </div>

        <div className="overflow-hidden border border-slate-100 rounded-2xl">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 font-mono text-[10px] uppercase text-slate-500">User</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase text-slate-500">Track</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase text-slate-500">Role</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((u) => {
                const role = roles[u.id] || "student";
                return (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{u.full_name || "Unknown"}</div>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {u.learning_track || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] rounded-full border ${
                          role === "super_admin"
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {role === "super_admin" ? <Shield className="h-2.5 w-2.5" /> : <User className="h-2.5 w-2.5" />}
                        {role === "super_admin" ? "Admin" : "Student"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Badge Granting Side-Panel */}
      <div className="lg:col-span-5">
        {selectedUser ? (
          <div className="card-glass p-5 text-slate-800 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#4285F4]">User Management</span>
                <h2 className="text-xl font-display font-medium text-slate-900 mt-1">
                  {selectedUser.full_name || "Manage User"}
                </h2>
                <p className="text-xs text-slate-500">{selectedUser.email}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <hr className="border-slate-100" />

            <div>
              <h3 className="font-display font-medium text-sm text-slate-900 flex items-center gap-1.5 mb-2">
                <Award className="h-4 w-4 text-butter" /> Cohort Badges
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Toggle badges to award them to or revoke them from this user.
              </p>

              <div className="space-y-2">
                {badges.map((b) => {
                  const hasBadge = (userBadges[selectedUser.id] || []).includes(b.id);
                  return (
                    <button
                      key={b.id}
                      disabled={managing}
                      onClick={() => handleAwardBadge(selectedUser.id, b.id)}
                      className={`w-full text-left p-3 rounded-2xl border flex items-center gap-3 transition-colors ${
                        hasBadge
                          ? "bg-emerald-50 border-emerald-200 text-slate-900"
                          : "bg-white border-slate-100 hover:border-slate-200 text-slate-600"
                      }`}
                    >
                      <div className="text-2xl">{b.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs flex items-center gap-1.5">
                          {b.name}
                          {hasBadge && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-mono">
                              <Check className="h-2 w-2" /> Awarded
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">{b.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="card-glass p-12 text-center text-slate-500 flex flex-col items-center justify-center min-h-[300px]">
            <Award className="h-12 w-12 text-slate-300 mb-3" />
            <h3 className="font-display text-base text-slate-700">No User Selected</h3>
            <p className="text-xs max-w-sm mt-1">
              Select a user from the list to view their status and award achievement badges.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

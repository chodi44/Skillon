import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SkyShell } from "@/components/site-header";
import { Loader2, LogIn, LogOut } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Skillon" },
      { name: "description", content: "Sign in to Skillon to track GATE and placement readiness." },
      { property: "og:title", content: "Sign in — Skillon" },
      { property: "og:description", content: "Sign in to Skillon." },
    ],
  }),
  component: AuthPage,
});

// Roll-number usernames map to synthetic emails on the server.
function toEmail(input: string): string {
  const raw = input.trim();
  if (!raw) return "";
  if (raw.includes("@")) return raw.toLowerCase();
  return `${raw.toLowerCase()}@skillon.local`;
}

function AuthPage() {
  const navigate = useNavigate();
  const { user, isSuperAdmin, ready, signOut } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) {
      navigate({ to: isSuperAdmin ? "/admin" : "/dashboard", replace: true });
    }
  }, [ready, user, isSuperAdmin, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError("Enter your username and password");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: toEmail(username),
        password,
      });
      if (error) throw error;
    } catch (e: any) {
      setError(e?.message ?? "Invalid username or password");
    } finally {
      setBusy(false);
    }
  }

  if (ready && user) {
    return (
      <SkyShell>
        <main className="relative z-10 mx-auto max-w-md px-5 pt-16 pb-32">
          <div className="card-glass p-6 text-center">
            <h1 className="font-display text-2xl text-[#12121a]">Signed in</h1>
            <p className="mt-1 text-sm text-black/60">{user.email}</p>
            <button onClick={() => signOut()} className="btn-primary mt-4 inline-flex">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </main>
      </SkyShell>
    );
  }

  return (
    <SkyShell>
      <main className="relative z-10 mx-auto max-w-md px-5 pt-10 pb-32">
        <div className="mb-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-butter text-[#12121a] font-black">S</div>
          <h1 className="mt-3 font-display text-3xl text-white">Skillon</h1>
          <p className="mt-1 text-sm text-white/60">Crack GATE. Get the job.</p>
        </div>

        <div className="card-glass p-6">
          <h2 className="font-display text-lg text-[#12121a]">Sign in</h2>
          <p className="mt-1 text-xs text-black/50">
            Use your roll number as username. Admin signs in with the admin email.
          </p>

          <form onSubmit={submit} className="mt-4 space-y-3">
            <input
              className="field"
              placeholder="Username (roll number) or admin email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              maxLength={255}
              required
            />
            <input
              className="field"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              maxLength={72}
              required
            />

            {error && (
              <div className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 ring-1 ring-red-200">
                {error}
              </div>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Sign in
            </button>
          </form>

          <p className="mt-4 text-center text-[11px] text-black/50">
            Accounts are pre-provisioned. New sign-ups are disabled.
          </p>
        </div>

        <div className="card-glass p-5 mt-4">
          <h3 className="font-display text-xs uppercase tracking-wider text-slate-500 mb-3 text-center">
            Quick Login Helpers
          </h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              type="button"
              onClick={() => {
                setUsername("praveenadmin@chodi.com");
                setPassword("Chodi@765");
              }}
              className="col-span-2 rounded-xl bg-[#fff4cf] hover:bg-[#ffe69a] p-2.5 text-[13px] font-bold text-[#12121a] transition-colors shadow-sm ring-1 ring-black/5"
            >
              👑 Super Admin (Praveen)
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {[
              { roll: "24A31A43E2", pass: "ishana", name: "Ishana" },
              { roll: "24A31A43E3", pass: "hasini", name: "Hasini" },
              { roll: "24A31A43D7", pass: "kruthika", name: "Kruthika" },
              { roll: "24A31A43F0", pass: "bhuvana", name: "Bhuvana" },
              { roll: "24A31A43G8", pass: "praveen", name: "Praveen" },
              { roll: "24A31A43H3", pass: "mourya", name: "Mourya" },
              { roll: "24A31A43H7", pass: "masthan", name: "Masthan" },
              { roll: "24A31A43I3", pass: "ganeshneeli", name: "Ganesh" },
              { roll: "24A31A43I6", pass: "Rahul", name: "Rahul" },
            ].map((student) => (
              <button
                key={student.roll}
                type="button"
                onClick={() => {
                  setUsername(student.roll);
                  setPassword(student.pass);
                }}
                className="rounded-lg bg-white/70 hover:bg-white p-2 text-[11px] font-semibold text-slate-700 transition-colors shadow-sm ring-1 ring-black/5 truncate"
                title={`${student.name} (${student.roll})`}
              >
                {student.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs font-bold text-white/60 underline underline-offset-4">
            Back to home
          </Link>
        </div>
      </main>
    </SkyShell>
  );
}

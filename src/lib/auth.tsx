import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User as SbUser } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Role = "student" | "admin"; // "admin" == super_admin in DB

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar_url?: string | null;
};

type AuthCtx = {
  user: User | null;
  session: Session | null;
  ready: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

async function buildUser(sbUser: SbUser): Promise<User> {
  // profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, email")
    .eq("id", sbUser.id)
    .maybeSingle();

  // role
  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", sbUser.id)
    .eq("role", "super_admin")
    .maybeSingle();

  const role: Role = roleRow ? "admin" : "student";

  return {
    id: sbUser.id,
    email: profile?.email ?? sbUser.email ?? "",
    name:
      profile?.full_name ??
      (sbUser.user_metadata?.full_name as string | undefined) ??
      (sbUser.email ? sbUser.email.split("@")[0] : "Learner"),
    avatar_url: profile?.avatar_url ?? null,
    role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  async function hydrate(s: Session | null) {
    setSession(s);
    if (s?.user) {
      try {
        setUser(await buildUser(s.user));
      } catch (e) {
        console.error("Failed to hydrate user", e);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }

  useEffect(() => {
    // 1. subscribe first
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "TOKEN_REFRESHED") {
        setSession(s);
        return;
      }
      // defer to avoid deadlock inside the callback
      setTimeout(() => {
        void hydrate(s);
      }, 0);
    });

    // 2. then read initial session
    supabase.auth.getSession().then(async ({ data }) => {
      await hydrate(data.session);
      setReady(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthCtx = {
    user,
    session,
    ready,
    isAuthenticated: !!session,
    isSuperAdmin: user?.role === "admin",
    signOut: async () => {
      await supabase.auth.signOut();
    },
    refresh: async () => {
      const { data } = await supabase.auth.getSession();
      await hydrate(data.session);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}

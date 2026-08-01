
CREATE TABLE public.coding_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('leetcode','github','gfg','hackerrank')),
  handle text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coding_profiles TO authenticated;
GRANT ALL ON public.coding_profiles TO service_role;
ALTER TABLE public.coding_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coding_profiles_self_or_admin_select" ON public.coding_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'super_admin'));
CREATE POLICY "coding_profiles_self_insert" ON public.coding_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "coding_profiles_self_update" ON public.coding_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "coding_profiles_self_delete" ON public.coding_profiles
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER coding_profiles_updated BEFORE UPDATE ON public.coding_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.coding_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('leetcode','github','gfg','hackerrank')),
  handle text NOT NULL,
  total_solved integer NOT NULL DEFAULT 0,
  easy integer NOT NULL DEFAULT 0,
  medium integer NOT NULL DEFAULT 0,
  hard integer NOT NULL DEFAULT 0,
  streak integer NOT NULL DEFAULT 0,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coding_stats TO authenticated;
GRANT ALL ON public.coding_stats TO service_role;
ALTER TABLE public.coding_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coding_stats_self_or_admin_select" ON public.coding_stats
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'super_admin'));
CREATE POLICY "coding_stats_self_write" ON public.coding_stats
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER coding_stats_updated BEFORE UPDATE ON public.coding_stats
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

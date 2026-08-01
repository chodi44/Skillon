-- badges table (read-only for all authenticated users, inserted by admin)
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    criteria TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- user_badges table
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- activity_feed table
CREATE TABLE IF NOT EXISTS public.activity_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- peer_doubts table
CREATE TABLE IF NOT EXISTS public.peer_doubts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- peer_doubt_replies table
CREATE TABLE IF NOT EXISTS public.peer_doubt_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doubt_id UUID NOT NULL REFERENCES public.peer_doubts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    is_solution BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_doubts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_doubt_replies ENABLE ROW LEVEL SECURITY;

-- Policies for badges (everyone can read)
CREATE POLICY "Anyone can read badges"
    ON public.badges FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for user_badges (everyone can read, users can't insert their own directly usually, but for now we'll allow it or rely on functions)
CREATE POLICY "Anyone can read user_badges"
    ON public.user_badges FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert own badges"
    ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for activity_feed (everyone can read feed)
CREATE POLICY "Anyone can read activity_feed"
    ON public.activity_feed FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert own activity"
    ON public.activity_feed FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for peer_doubts (everyone can read, users can manage their own)
CREATE POLICY "Anyone can read doubts"
    ON public.peer_doubts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can create doubts"
    ON public.peer_doubts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own doubts"
    ON public.peer_doubts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own doubts"
    ON public.peer_doubts FOR DELETE USING (auth.uid() = author_id);

-- Policies for peer_doubt_replies
CREATE POLICY "Anyone can read replies"
    ON public.peer_doubt_replies FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can create replies"
    ON public.peer_doubt_replies FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own replies"
    ON public.peer_doubt_replies FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own replies"
    ON public.peer_doubt_replies FOR DELETE USING (auth.uid() = author_id);

-- Triggers for updated_at
CREATE TRIGGER update_peer_doubts_modtime
BEFORE UPDATE ON public.peer_doubts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_peer_doubt_replies_modtime
BEFORE UPDATE ON public.peer_doubt_replies
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

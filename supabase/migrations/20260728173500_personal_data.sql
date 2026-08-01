-- personal_tracks table
CREATE TABLE IF NOT EXISTS public.personal_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- personal_items table
CREATE TABLE IF NOT EXISTS public.personal_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL REFERENCES public.personal_tracks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link TEXT,
    done BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- personal_notes table
CREATE TABLE IF NOT EXISTS public.personal_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- personal_alarms table
CREATE TABLE IF NOT EXISTS public.personal_alarms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    time TEXT NOT NULL,
    label TEXT NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    days INTEGER[] DEFAULT '{}',
    last_fired TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- timetable_slots table
CREATE TABLE IF NOT EXISTS public.timetable_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    title TEXT NOT NULL,
    notes TEXT,
    notify BOOLEAN DEFAULT FALSE,
    last_notified TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.personal_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_slots ENABLE ROW LEVEL SECURITY;

-- Policies for personal_tracks
CREATE POLICY "Users can manage their own tracks"
    ON public.personal_tracks
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policies for personal_items
CREATE POLICY "Users can manage their own items via tracks"
    ON public.personal_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.personal_tracks 
            WHERE personal_tracks.id = personal_items.track_id 
            AND personal_tracks.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.personal_tracks 
            WHERE personal_tracks.id = personal_items.track_id 
            AND personal_tracks.user_id = auth.uid()
        )
    );

-- Policies for personal_notes
CREATE POLICY "Users can manage their own notes"
    ON public.personal_notes
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policies for personal_alarms
CREATE POLICY "Users can manage their own alarms"
    ON public.personal_alarms
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policies for timetable_slots
CREATE POLICY "Users can manage their own timetable"
    ON public.timetable_slots
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger for notes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_personal_notes_modtime
BEFORE UPDATE ON public.personal_notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

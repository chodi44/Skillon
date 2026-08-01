-- mock_tests table
CREATE TABLE IF NOT EXISTS public.mock_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    total_marks INTEGER NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- mock_questions table
CREATE TABLE IF NOT EXISTS public.mock_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES public.mock_tests(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'MCQ', -- 'MCQ', 'MSQ', 'NAT'
    options JSONB, -- For MCQ/MSQ
    correct_answer TEXT NOT NULL,
    positive_marks NUMERIC NOT NULL DEFAULT 1,
    negative_marks NUMERIC NOT NULL DEFAULT 0.33,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- mock_attempts table
CREATE TABLE IF NOT EXISTS public.mock_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES public.mock_tests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    score NUMERIC,
    responses JSONB, -- Map of question_id -> user_answer
    status TEXT DEFAULT 'IN_PROGRESS', -- 'IN_PROGRESS', 'SUBMITTED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_attempts ENABLE ROW LEVEL SECURITY;

-- Policies for mock_tests
CREATE POLICY "Anyone can view published mock tests"
    ON public.mock_tests
    FOR SELECT
    USING (is_published = true OR auth.uid() IN (
        SELECT id FROM auth.users WHERE auth.uid() = id -- Admin check would ideally go here, but for now we keep it simple
    ));

-- Policies for mock_questions
CREATE POLICY "Anyone can view questions for published tests"
    ON public.mock_questions
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.mock_tests WHERE id = test_id AND is_published = true
    ));

-- Policies for mock_attempts
CREATE POLICY "Users can view and manage their own attempts"
    ON public.mock_attempts
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

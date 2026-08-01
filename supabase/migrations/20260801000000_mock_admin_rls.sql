-- Add write policies for mock_tests (super_admin can do everything)
CREATE POLICY "Admins can insert mock tests"
    ON public.mock_tests
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can update mock tests"
    ON public.mock_tests
    FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'))
    WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can delete mock tests"
    ON public.mock_tests
    FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'));

-- Add write policies for mock_questions (super_admin can do everything)
CREATE POLICY "Admins can insert mock questions"
    ON public.mock_questions
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can update mock questions"
    ON public.mock_questions
    FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'))
    WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can delete mock questions"
    ON public.mock_questions
    FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'));

-- Make sure authenticated users can select all mock tests (so admin can see drafts too)
DROP POLICY IF EXISTS "Anyone can view published mock tests" ON public.mock_tests;
CREATE POLICY "Anyone can view published mock tests or admin views all"
    ON public.mock_tests
    FOR SELECT
    TO authenticated
    USING (is_published = true OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Anyone can view questions for published tests" ON public.mock_questions;
CREATE POLICY "Anyone can view questions for published tests or admin views all"
    ON public.mock_questions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.mock_tests WHERE id = test_id AND is_published = true
        ) OR public.has_role(auth.uid(), 'super_admin')
    );

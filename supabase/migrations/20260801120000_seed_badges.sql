-- Seed default badges
INSERT INTO public.badges (id, name, description, icon, criteria) VALUES
('b1111111-1111-1111-1111-111111111111', 'Code Warrior', 'Log 10+ coding platform problems solved.', '⚔️', 'Solve 10+ coding challenges'),
('b2222222-2222-2222-2222-222222222222', 'Exam Ace', 'Score 80%+ on any mock exam.', '🏆', 'Score 80%+ on a mock test'),
('b3333333-3333-3333-3333-333333333333', 'Bug Hunter', 'Answer or reply to 3+ peer doubts.', '👾', 'Post 3+ replies in Q&A Forum'),
('b4444444-4444-4444-4444-444444444444', 'Consistent Learner', 'Keep a 5-day active study streak.', '🔥', 'Maintain a 5-day study streak'),
('b5555555-5555-5555-5555-555555555555', 'First Steps', 'Mark your first curriculum item as completed.', '🌱', 'Complete your first track item')
ON CONFLICT (id) DO NOTHING;

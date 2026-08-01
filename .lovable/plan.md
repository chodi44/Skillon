# Skillon — Super Admin Workflow

This spec is enormous (homepage builder, dynamic block system, courses, roadmaps, quizzes, mock tests, notes, videos, certifications, notifications, calendar, analytics, leaderboard, users, reports, platform settings). Building it all in one pass is not realistic — it needs a real backend, file storage, auth, and roughly 15–20 admin pages plus matching student surfaces.

Before I start, a few decisions I need from you.

## Questions

1. **Backend** — Everything on this list (real users, uploads, tasks, analytics, one Super Admin) requires Lovable Cloud (Postgres + Auth + Storage). The current app is localStorage-only mock data. Do you want me to enable Lovable Cloud now? Without it none of this is real.

2. **Super Admin identity** — Only 1 Super Admin. How should we lock it down?
   - Hardcode a single email (you tell me which) → that account gets `super_admin` role on signup
   - Or: the first account to sign up becomes Super Admin, then admin signup is closed

3. **Scope for this turn** — Which slice should I build first? I recommend starting with the foundation and one vertical, then iterating. Pick one:
   - **A. Foundation** — Cloud + auth + roles + Admin Dashboard shell with real stat cards (Total Students, Active, Registrations, Storage, etc.) wired to the DB
   - **B. Learning Content** — Course → Module → Chapter → Topic → Lesson CRUD with Notes/PDF/Video/Link attachments (needs A first)
   - **C. Homepage Builder** — Dynamic sections + block builder with drag-and-drop (heaviest single feature)
   - **D. Tasks + Notifications** — Task creation, assignment, completion tracking, push notifications tab

## Recommended phased roadmap

```text
Phase 1  Foundation
         Lovable Cloud, auth, user_roles (super_admin/student),
         Admin shell, live dashboard stats

Phase 2  Users & Content Core
         User management, Course/Module/Chapter/Topic/Lesson,
         Notes/PDF/Video uploads (Storage)

Phase 3  Engagement
         Tasks + assignment + completion tracking,
         Notifications center, Calendar

Phase 4  Assessments
         Quizzes (MCQ/multi/coding/descriptive),
         Mock tests, Rankings

Phase 5  Roadmaps & Certifications
         Roadmap builder (steps, lock/unlock, resources),
         Certification catalog

Phase 6  Analytics & Reports
         Per-student profiles, activity, streaks,
         Leaderboard XP rules, PDF/Excel/CSV export

Phase 7  Homepage & Block Builder
         Section CRUD, drag-drop ordering, 20+ block types,
         schedule/visibility rules, publish

Phase 8  Platform Settings
         Branding, theme, templates, maintenance mode,
         API keys, integrations
```

## Technical notes (for reference)

- **Roles:** separate `user_roles` table with `app_role` enum (`super_admin`, `student`), `has_role()` security-definer function — never store role on profile. Route gate: `_authenticated/_super_admin/` layout using `has_role`.
- **Storage:** private `notes`, `pdfs`, `videos`, `certificates` buckets with RLS on `storage.objects`.
- **Homepage builder:** `sections` table (order, visibility, schedule) + `blocks` table (polymorphic `type` + `data jsonb`) — renderer switches on `type`.
- **Tasks:** `tasks`, `task_assignments` (per-user or per-track), `task_completions` (status, time_taken, submitted_at).
- **Realtime dashboard stats:** SQL views + Supabase realtime on key tables.
- **Analytics:** `activity_events` table (login, lesson_view, task_complete, quiz_submit) drives everything downstream.

## What I'll do next

Answer the 3 questions and I'll ship Phase 1 (or whichever slice you pick) end-to-end in the next turn — schema, RLS, grants, admin shell, and the working screens for that slice.

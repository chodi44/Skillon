# Skillon — Career Operating System

Skillon is a mobile-first career OS built for a fixed cohort of 9 students and 1 Super Admin. It tracks progress toward two primary goals — **cracking GATE** and **getting a job** — across learning tracks, coding platforms, daily tasks, mock tests, and personal skills.

---

## 1. Product vision

- **Primary goals:** GATE readiness + Job/placement readiness.
- **Modules tracked:** GATE (DA/CS), AI Engineering, Full Stack, SQL, Cloud, coding platforms (LeetCode, GFG, HackerRank, GitHub), and any custom skill a student adds.
- **Personas:**
  - **Super Admin** (single account) — `praveenadmin@chodi.com`. Publishes curriculum, tasks, broadcasts, analytics.
  - **Student** (9 fixed accounts) — private learning environment, coding logs, daily tasks, personal tools, notes.

---

## 2. Fixed accounts

Login page is at `/auth`. Public signup and Google OAuth are disabled.

### Super Admin
| Email | Password |
|---|---|
| `praveenadmin@chodi.com` | `Chodi@765` |

### Students (log in with roll number only; system appends `@skillon.local`)
| Roll number (username) | Password |
|---|---|
| 24A31A43E2 | ishana |
| 24A31A43E3 | hasini |
| 24A31A43D7 | kruthika |
| 24A31A43F0 | bhuvana |
| 24A31A43G8 | praveen |
| 24A31A43H3 | mourya |
| 24A31A43H7 | masthan |
| 24A31A43I3 | ganeshneeli |
| 24A31A43I6 | Rahul |

Identity is bound **end-to-end** to the signed-in Supabase user. The cohort member (name shown everywhere in the app — dashboard, learn, coding, notifications, /me) is derived directly from `auth.user.email` on every render — no stale localStorage override.

---

## 3. Feature map

### Student surfaces
- **`/` Landing** — hero + feature directory.
- **`/dashboard` Home** — readiness score, today's tasks, personal track progress, weak-topic surface.
- **`/learn`** — curriculum directory (GATE / Career / Skill tracks).
- **`/learn/$track`** — track detail with items (notes, PDF, video), completion toggles, admin-attached resources.
- **`/coding`** — link platform handles (LeetCode / GFG / HackerRank / GitHub), log daily solves (E/M/H + topic), goals & streaks.
- **`/notifications`** — real-time broadcasts from admin (Supabase Realtime), unread badges, auto-read receipts.
- **`/me`** — private space:
  - **Personal tracks** — student creates/edits their own skill tracks + items. Not visible to admin or other students.
  - **Notes** — private auto-saving notepad.
  - **Tools** — clock, and add/remove/rename multiple stopwatches, timers, alarms, pomodoros.

### Admin surfaces (`/admin/*`) — only visible to Super Admin
- **Overview** — live stats (total users, active 7d, new 24h, admins), per-track cohort completion.
- **Curriculum** — create/edit/delete tracks and items; upload PDFs and videos (Supabase Storage `learning-assets` bucket, 1-year signed URLs).
- **Tasks** — publish daily tasks across 16 categories (notes, PDF, video, quiz, coding, SQL, AI, cloud, full-stack, aptitude, GATE, CAT, assignment, project, mock, revision) with priority, XP, due date/time, assign-all or per-student.
- **Coding** — set cohort daily/weekly/monthly targets, per-platform goals, leaderboard with E/M/H split + streaks.
- **Analytics** — cohort matrix, per-track completion, per-student progress.
- **Broadcast** — publish real-time notifications (priority, audience). Delivered via Supabase Realtime to all logged-in students immediately.
- **Users** — view all 9 students, roles, activity.

---

## 4. Tech stack

- **Framework:** TanStack Start v1 (React 19, Vite 7), file-based routing under `src/routes/`.
- **Styling:** Tailwind v4 via `src/styles.css` (@theme). Fonts: Fraunces + Nunito + JetBrains Mono.
- **Backend:** Supabase (Postgres + Auth + Storage + Realtime).
- **Data fetching:** TanStack Query.
- **Auth:** Supabase Auth (email/password only; signups disabled; Google disabled).
- **Storage:** `learning-assets` bucket (private, signed URLs).

Server functions use `createServerFn` from `@tanstack/react-start`. No Supabase Edge Functions.

---

## 5. Database schema (public)

| Table | Purpose |
|---|---|
| `profiles` | id (→ `auth.users`), email, full_name, avatar_url, learning_track |
| `user_roles` | user_id, role (`super_admin` \| `student`) — separate from profiles to prevent privilege escalation |
| `notifications` | title, message, links (jsonb), channel, priority, audience, created_by |
| `notification_reads` | notification_id, user_id, read_at |

**RLS:** every table has policies scoped to `auth.uid()`. Only `super_admin` (checked via `has_role()` security-definer function) can insert/update/delete notifications and read all profiles. Students see only their own profile and role. Notifications table is readable by all authenticated users; `notification_reads` is self-owned.

**Trigger:** `handle_new_user()` on `auth.users` insert — creates `profiles` row and grants `super_admin` to the very first signup, `student` to everyone else. All 9 student accounts and the Super Admin are pre-seeded.

---

## 6. Local identity model (why Praveen shows as Praveen)

`SkillonProvider` (in `src/lib/skillon-store.tsx`) computes `currentMember` **synchronously from `useAuth().user.email` on every render**:

- `praveenadmin@*` → Praveen (m5, Super Admin).
- `<rollNo>@skillon.local` → the matching cohort member by roll number.

No localStorage override, no stale state. Per-user data (completions, coding logs, tasks done) is keyed by `memberId`, and personal tracks/notes/tools are keyed by `auth.user.id`.

---

## 7. Real-time notifications

- Admin creates a row in `public.notifications`.
- Students subscribe via Supabase Realtime on `notifications` — new alerts appear instantly.
- Read state persists per user in `notification_reads`.

---

## 8. Project structure

```
src/
├─ routes/                # TanStack Start file routes
│  ├─ __root.tsx          # AuthProvider + Skillon store + Theme
│  ├─ index.tsx           # Landing
│  ├─ auth.tsx            # Login (email/password, roll-number for students)
│  ├─ dashboard.tsx       # Student home
│  ├─ learn.tsx, learn.index.tsx, learn.$track.tsx
│  ├─ coding.tsx
│  ├─ notifications.tsx
│  ├─ me.tsx              # Private tracks / notes / tools
│  └─ admin.*.tsx         # Admin console (overview, content, tasks, coding, analytics, notifications, users)
├─ lib/
│  ├─ auth.tsx            # Supabase-backed auth context
│  ├─ skillon-store.tsx   # Cohort store; identity bound to signed-in user
│  ├─ personal-store.tsx  # Per-user private tracks/notes/tools
│  └─ theme.tsx
├─ components/site-header.tsx
├─ integrations/supabase/ # Auto-generated client + types (do not edit)
└─ styles.css
```

---

## 9. Development

```bash
npm install
npm run dev          # http://localhost:8080
```

Migrations live under `supabase/`. Schema changes go through the standard Supabase CLI migration flow.

---

## 10. Security

- Roles stored in dedicated `user_roles` table (never on `profiles`).
- `has_role(uuid, app_role)` is `SECURITY DEFINER` with fixed `search_path`.
- RLS enabled on every public table.
- All storage assets served via time-limited signed URLs (1 year).
- Signups disabled; no anonymous access.

---

## 11. Roadmap

All high-priority items completed:
- ✅ **Personal tracks/notes/timetable/alarms → Supabase** (fully synced on-save, cross-device).
- ✅ **Server-side coding log verification** (live graphQL/REST pulls for LeetCode, GitHub, GFG, HackerRank).
- ✅ **Push notifications (web push)** (fully integrated using WebPush VAPID key pairs, Service Worker push, and admin broadcast controls).
- ✅ **Mock test engine** (full test simulator, question builder CRUD inside Admin panel, NAT/MCQ grading, and automatic score analytics).
- ✅ **Google Drive cloud storage** (inline expandable PDF/video curriculum player, admin folder upload linkage).


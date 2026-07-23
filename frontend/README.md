# CampusAI — Frontend

Next.js (App Router) frontend wired to `campusai-backend`. Registration and
login, a role-aware dashboard, and every feature the backend exposes:
announcements + notifications, RAG chat with voice input, a per-course AI
tutor, AI study tools, a resume builder, a study planner, a campus
directory, an admin panel, and the full student loop (courses, enrollment,
grades with GPA, attendance with risk flagging).

## Design direction

Dark, technical, circuit-board-inspired — matching the PCB theme, not a
generic SaaS look:
- **Palette**: near-black background (`#0B0F14`), copper accent (`#C08552`)
  for primary actions/brand, signal-blue (`#5B8DEF`) for status
- **Type**: Space Grotesk (headings), Inter (body), JetBrains Mono
  (course codes, scores, dates — anything tabular/technical)
- **Signature element**: `TraceDivider` — a thin PCB-trace line with two
  solder-point dots, used between nav sections instead of a plain `<hr>`

## Project layout
```
app/
  layout.tsx           # fonts, global AuthProvider
  page.tsx               # redirects to /login or /dashboard
  login/page.tsx           # sign-in, links to /register
  register/page.tsx          # sign-up (student/teacher, optional department)
  dashboard/
    layout.tsx              # auth guard + sidebar (with unread notification badge)
    page.tsx                  # overview
    notifications/page.tsx      # list + mark-read
    announcements/page.tsx        # feed with category badges/pinning; staff post
    chat/page.tsx                   # RAG chat, department/course scope, mic input
    tutor/page.tsx                    # conversational per-course tutor with history
    study/page.tsx                      # summary/flashcards/quiz/key-concepts from a document
    planner/page.tsx                      # free-text deadlines -> generated schedule
    resume/page.tsx                         # free-text background -> resume draft
    campus/page.tsx                           # searchable location directory; admin add/remove
    courses/page.tsx                            # all courses; students enroll inline
    roster/page.tsx                               # teacher/admin: record attendance/grades
    documents/page.tsx                              # teacher/admin: upload text or PDF/PPTX
    admin/page.tsx                                    # admin: create departments/courses
    grades/page.tsx                                     # student's grades + overall GPA
    attendance/page.tsx                                   # student's attendance + risk flag
lib/
  api.ts                # typed fetch client for every backend endpoint
  auth-context.tsx        # token + current-user state, persisted to localStorage
components/
  Sidebar.tsx            # role-aware nav, unread notification count
  TraceDivider.tsx         # signature circuit-trace divider
```

## Setup

```bash
npm install
cp .env.local.example .env.local
# edit .env.local if your backend isn't at http://localhost:8000
npm run dev
```

`campusai-backend` must be running first, and needs `OPENAI_API_KEY` set for
chat, the tutor, study tools, voice, resume, and the planner to work — those
pages will surface the backend's "AI provider not configured" message
otherwise, rather than failing silently.

## What's deliberately deferred (and why)

- **No embedded interactive map** — the campus directory page is a working
  searchable list backed by a real `latitude`/`longitude`-capable schema, but
  there's no Google Maps/Mapbox embed. That needs your own API key and has
  usage costs, so it's a clean integration point rather than something
  guessed at with a placeholder key that wouldn't actually work.
- **Voice input needs a real browser mic and HTTPS (or localhost)** —
  `getUserMedia` requires a secure context. It'll prompt for mic permission
  the first time; if that's denied or unavailable, the chat page shows a
  clear inline error rather than failing silently.
- **Resume/study-plan results aren't saved** — refreshing the page loses
  them, matching the backend not persisting them either (see backend
  README). Copy/paste is the current workflow; a "save my drafts" feature
  would need real persistence added on both ends.

## Notes on design choices
- **Token in `localStorage`, not cookies** — simplest for local dev against
  a separately-hosted API; revisit if you need SSR-protected pages or
  stricter XSS hardening later (httpOnly cookies + a backend session route).
- **Tutor is a separate page from Chat**, not a mode toggle — the tutor
  requires picking one of your enrolled courses and keeps conversation
  history across turns; Chat is scope-flexible (department/course/
  everything) but stateless per question. Different enough interaction
  models that merging them would make both worse.
- **Department filter on `/courses` defaults to "All departments"** rather
  than the user's own — the platform serves every department equally, so
  browsing shouldn't default to a narrower scope than that.

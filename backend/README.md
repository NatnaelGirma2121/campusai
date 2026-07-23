# CampusAI — Backend

FastAPI + PostgreSQL backend for the CampusAI platform. Multi-department
support throughout (nothing hardcoded to ECE), auth, courses/enrollment,
attendance + grades (with GPA and attendance-risk aggregation), a
document-grounded AI chat assistant (RAG), AI study tools, a per-course AI
tutor, voice input, a resume builder, a study planner, announcements with
notification fan-out, and a campus location directory.

## Stack
- FastAPI, SQLAlchemy 2.0, Alembic, PostgreSQL
- JWT auth via `python-jose`, password hashing via `passlib[bcrypt]`
- AI features via any OpenAI-compatible chat/embeddings/transcription API (`httpx`)
- `pypdf` / `python-pptx` for document text extraction

## Project layout
```
app/
  core/
    config.py       # settings loaded from .env (incl. AI provider config)
    security.py      # password hashing, JWT create/decode
  db/
    base.py           # SQLAlchemy declarative base
    session.py         # engine + get_db() dependency
  models/
    department.py       # Department — any dept, not just ECE
    user.py               # User + UserRole enum, belongs to a Department
    course.py              # Course, scoped to a Department, has an instructor
    enrollment.py            # links a student User to a Course for a semester
    attendance.py             # per-day attendance, scoped to an Enrollment
    grade.py                   # per-component grades, scoped to an Enrollment
    document.py                 # Document + DocumentChunk for RAG chat
    announcement.py               # category + optional department scope + pinning
    campus_location.py             # directory entry, optional lat/lng for a future map
    notification.py                  # per-user, auto-generated (not user-posted)
  services/
    chunking.py          # paragraph-aware text chunking with overlap
    ai_provider.py         # embeddings, chat completion (+history), transcription, cosine similarity
    document_ingestion.py    # shared chunk+embed+store pipeline (text and file uploads)
    file_extraction.py         # PDF/PPTX text extraction
    study_tools.py               # study-tool prompt building + defensive JSON parsing
    retrieval.py                   # shared chunk-retrieval logic (used by /chat and /tutor)
    notifications.py                 # notification creation, announcement fan-out, attendance risk check
  schemas/                # Pydantic request/response models, one file per resource
  api/
    deps.py             # get_current_user, require_roles()
    routes/
      auth.py            # /register /login /refresh /me
      users.py            # /users (admin-only listing)
      departments.py       # /departments (GET is public — needed pre-registration)
      courses.py             # /courses (filterable by department and/or instructor)
      enrollments.py           # /enrollments (self-enroll; /course/{id} roster is
                                 #   teacher/admin-only, teachers see only their own courses)
      attendance.py             # /attendance (record; /me/summary has % + risk flag)
      grades.py                  # /grades (record; /me/summary computes weighted GPA)
      documents.py                 # /documents (raw text or PDF/PPTX upload, chunk+embed)
      chat.py                        # /chat (RAG, scoped to course/department/everything)
      tutor.py                         # /tutor (course-required, conversational, pedagogical prompt)
      study_tools.py                     # /study-tools (summary/flashcards/quiz/key-concepts)
      voice.py                             # /voice/transcribe (audio -> text)
      resume.py                             # /resume/generate (free text -> resume draft)
      study_planner.py                       # /study-planner/generate (free text -> schedule)
      announcements.py                         # /announcements (post, dept-aware feed, fan-out)
      campus_locations.py                        # /campus-locations (public directory, admin manages)
      notifications.py                             # /notifications (list own, mark read)
  main.py                # FastAPI app, CORS, router wiring
alembic/                  # migrations 0001-0005
```

## Setup

1. **Create a PostgreSQL database:**
   ```bash
   createdb campusai
   # or with Docker:
   docker run --name campusai-db -e POSTGRES_USER=campusai \
     -e POSTGRES_PASSWORD=campusai -e POSTGRES_DB=campusai \
     -p 5432:5432 -d postgres:16
   ```

2. **Install dependencies:**
   ```bash
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # set DATABASE_URL, a real SECRET_KEY, and OPENAI_API_KEY (needed for
   # every AI feature: chat, tutor, study tools, voice, resume, planner)
   # generate a secret key: python -c "import secrets; print(secrets.token_urlsafe(64))"
   ```

4. **Run migrations, then start the server:**
   ```bash
   alembic upgrade head
   uvicorn app.main:app --reload
   ```
   API docs at `http://localhost:8000/docs`.

## Try it

```bash
# Admin creates departments
curl -X POST http://localhost:8000/api/v1/departments/ \
  -H "Authorization: Bearer <admin_token>" -H "Content-Type: application/json" \
  -d '{"name":"Electrical and Computer Engineering","code":"ECE"}'

# Register, log in, browse/enroll — see the interactive docs at /docs
# for every endpoint with example payloads.

# The AI tutor: course-scoped, remembers conversation history
curl -X POST http://localhost:8000/api/v1/tutor/ \
  -H "Authorization: Bearer <student_token>" -H "Content-Type: application/json" \
  -d '{"course_id":"<course-uuid>","question":"Explain Ohms law","history":[]}'

# Voice input: upload a recording, get back text
curl -X POST http://localhost:8000/api/v1/voice/transcribe \
  -H "Authorization: Bearer <token>" -F "file=@question.webm"

# Resume / study plan: free text in, structured draft out — no persistence
curl -X POST http://localhost:8000/api/v1/resume/generate \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"background":"3rd-year ECE student, know Python and C, built a VLSI project..."}'

# Attendance risk: flags automatically once an enrollment has 3+ records
# and drops below 75% present — check a student's own view:
curl http://localhost:8000/api/v1/attendance/me/summary \
  -H "Authorization: Bearer <student_token>"

# Post an announcement — every affected user gets a Notification automatically
curl -X POST http://localhost:8000/api/v1/announcements/ \
  -H "Authorization: Bearer <admin_token>" -H "Content-Type: application/json" \
  -d '{"title":"Campus Closure","content":"Closed due to weather.","category":"emergency","is_pinned":true}'
```

## What's deliberately deferred (and why)

- **pgvector / Qdrant retrieval** — chat/tutor retrieval currently scores
  chunks in Python (cosine similarity over JSON-stored embeddings). That's
  fine at course/department scale and works identically on SQLite and
  Postgres with zero extra infrastructure — which is exactly why it wasn't
  swapped out: doing so needs a *running* vector database to build and
  verify against, and standing one up isn't something to do speculatively.
  The swap point is intentionally clean: replace `services/retrieval.py`'s
  Python scoring with a vector DB query; nothing else changes.
- **Real-time maps** — `campus_locations` has optional `latitude`/`longitude`
  columns and a working directory/search UI, but there's no embedded Google
  Maps or similar — that needs your own API key and comes with usage costs,
  so it's left as a deliberate integration point rather than baked in.
- **OCR for scanned documents/images** — PDF/PPTX extraction reads existing
  text layers; a scanned handbook with no text layer won't extract. Adding
  OCR (e.g. via the same OpenAI-compatible vision endpoint) is a contained
  addition to `file_extraction.py` if it's needed.

## Notes on design choices
- **UUID primary keys** everywhere — safer to expose in URLs, easier to
  merge/shard later.
- **Role stored directly on `User`**, not a separate roles table — simplest
  for three fixed roles; revisit only if you need dynamic/multiple roles.
- **Every scopable resource (Document, Announcement, CampusLocation) follows
  the same optional-department-and/or-course pattern** — nothing is
  hardcoded to one program, and "unscoped" consistently means
  "university-wide," not "hidden."
- **Access + refresh token pair** — 60 min access token, 7-day refresh.
- **Study tools and the tutor share retrieval logic** (`services/retrieval.py`)
  but use different system prompts — the tutor is pedagogical and keeps
  conversation history; `/chat` is a single-turn Q&A grounded strictly in
  documents.
- **Attendance risk is an explainable heuristic, not a trained model** —
  below 75% present after at least 3 records, checked after every
  attendance entry, deduped via `Notification.related_id` so a student
  doesn't get spammed while still below threshold and unacknowledged. This
  is intentionally transparent rather than a black-box "prediction."
- **AI provider is OpenAI-compatible, not OpenAI-specific** throughout
  (chat, embeddings, and now transcription) — `OPENAI_BASE_URL` can point at
  any compatible server, matching the original roadmap's "OpenAI API (or
  local LLM)" plan. Every AI route returns a clean `503` rather than an
  unhandled error when `OPENAI_API_KEY` isn't set.
- **Resume/study-planner are intentionally not persisted** — they're
  single-shot generations from what the user typed that turn, not a
  `Resume` or `StudyPlan` data model. Adding persistence (save/edit/version)
  would be a real, separate feature, not a natural extension of what's here.

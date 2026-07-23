# CampusAI

Your personal AI assistant for university life — a full-stack platform
covering every department (not just one), with auth, courses, attendance,
grades, a document-grounded RAG chat assistant, AI study tools, a per-course
AI tutor, voice input, a resume builder, a study planner, announcements
with notifications, and a campus location directory.

## Structure

- **`backend/`** — FastAPI + PostgreSQL API. See `backend/README.md` for
  setup, the full endpoint list, and design notes.
- **`frontend/`** — Next.js dashboard. See `frontend/README.md` for setup
  and page-by-page breakdown.

## Quick start

```bash
# 1. Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set DATABASE_URL, SECRET_KEY, OPENAI_API_KEY
alembic upgrade head
uvicorn app.main:app --reload

# 2. Frontend (separate terminal)
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Then open `http://localhost:3000`.

Each README documents what's deliberately deferred and why (pgvector/Qdrant
at scale, a real embedded map, OCR for scanned documents) — those are
intentional stopping points with clean extension paths, not gaps.

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.course import Course
from app.schemas.chat import ChatSource
from app.schemas.tutor import TutorRequest, TutorResponse
from app.services.ai_provider import get_chat_completion_with_history
from app.services.retrieval import build_context_block, retrieve_relevant_chunks

router = APIRouter(prefix="/tutor", tags=["tutor"])


def _tutor_system_prompt(course_title: str) -> str:
    return (
        f"You are an AI tutor for the course '{course_title}'. Your job is to help "
        "the student genuinely understand the material, not just get an answer. "
        "Explain concepts step by step, check understanding with a brief follow-up "
        "question when appropriate, and use the provided course document excerpts "
        "as your source of truth when they're relevant. If the excerpts don't cover "
        "the question, say so and answer from general knowledge of the subject, "
        "making clear which you're doing. Keep a patient, encouraging tone."
    )


@router.post("/", response_model=TutorResponse)
async def tutor(
    payload: TutorRequest,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> TutorResponse:
    course = db.get(Course, payload.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    top = await retrieve_relevant_chunks(db, payload.question, payload.course_id, None, payload.top_k)

    context = build_context_block(top) if top else "(No course documents uploaded yet.)"
    user_message = f"Course material excerpts:\n{context}\n\nStudent's question: {payload.question}"

    history = [{"role": m.role, "content": m.content} for m in payload.history]
    answer = await get_chat_completion_with_history(
        _tutor_system_prompt(course.title), history, user_message
    )

    sources = [
        ChatSource(
            document_id=c.document_id,
            document_title=c.document.title,
            chunk_content=c.content,
            similarity=round(score, 4),
        )
        for score, c in top
    ]
    return TutorResponse(answer=answer, sources=sources)

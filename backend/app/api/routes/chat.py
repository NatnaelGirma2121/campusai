from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.chat import ChatRequest, ChatResponse, ChatSource
from app.services.ai_provider import get_chat_completion
from app.services.retrieval import build_context_block, retrieve_relevant_chunks

router = APIRouter(prefix="/chat", tags=["chat"])

SYSTEM_PROMPT = (
    "You are CampusAI, a university assistant. Answer the student's or "
    "staff member's question using ONLY the provided context excerpts from "
    "university documents. If the context doesn't contain the answer, say "
    "so plainly instead of guessing. Be concise and cite which document an "
    "answer comes from when it's clear."
)


@router.post("/", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> ChatResponse:
    top = await retrieve_relevant_chunks(
        db, payload.question, payload.course_id, payload.department_id, payload.top_k
    )

    if not top:
        return ChatResponse(
            answer=(
                "I don't have any documents to draw from yet for this scope. "
                "Ask an instructor or admin to upload the relevant handbook, "
                "syllabus, or policy document."
            ),
            sources=[],
        )

    context = build_context_block(top)
    user_message = f"Context:\n{context}\n\nQuestion: {payload.question}"
    answer = await get_chat_completion(SYSTEM_PROMPT, user_message)

    sources = [
        ChatSource(
            document_id=c.document_id,
            document_title=c.document.title,
            chunk_content=c.content,
            similarity=round(score, 4),
        )
        for score, c in top
    ]
    return ChatResponse(answer=answer, sources=sources)

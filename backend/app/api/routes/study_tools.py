from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.document import Document
from app.schemas.study_tools import (
    Flashcard,
    KeyConcept,
    QuizQuestion,
    StudyToolRequest,
    StudyToolResponse,
)
from app.services.ai_provider import get_chat_completion
from app.services.study_tools import build_prompt, parse_response

router = APIRouter(prefix="/study-tools", tags=["study-tools"])

# LLM context has limits — cap how much of a document's chunks we send.
# Fine for handbooks/syllabi at this project's scale; a very large document
# would need a map-reduce summarization pass instead.
MAX_CONTENT_CHARS = 12000


@router.post("/", response_model=StudyToolResponse)
async def generate_study_tool(
    payload: StudyToolRequest,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> StudyToolResponse:
    document = db.get(Document, payload.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    if not document.chunks:
        raise HTTPException(status_code=400, detail="This document has no content to study from yet")

    content = "\n\n".join(c.content for c in document.chunks)[:MAX_CONTENT_CHARS]

    system_prompt, user_message = build_prompt(payload.mode, document.title, content)
    raw = await get_chat_completion(system_prompt, user_message)
    parsed = parse_response(payload.mode, raw)

    response = StudyToolResponse(
        mode=payload.mode, document_id=document.id, document_title=document.title
    )

    if payload.mode == "summary":
        response.summary = parsed.get("summary", "")
    elif payload.mode == "flashcards":
        response.flashcards = [Flashcard(**f) for f in parsed.get("flashcards", [])]
    elif payload.mode == "quiz":
        response.quiz = [QuizQuestion(**q) for q in parsed.get("questions", [])]
    elif payload.mode == "key_concepts":
        response.key_concepts = [KeyConcept(**c) for c in parsed.get("concepts", [])]

    return response

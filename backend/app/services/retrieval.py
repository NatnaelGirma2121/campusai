import uuid

from sqlalchemy.orm import Session

from app.models.document import Document, DocumentChunk
from app.services.ai_provider import cosine_similarity, deserialize_embedding, get_embedding


async def retrieve_relevant_chunks(
    db: Session,
    question: str,
    course_id: uuid.UUID | None,
    department_id: uuid.UUID | None,
    top_k: int,
) -> list[tuple[float, DocumentChunk]]:
    """Embed the question and return the top_k most similar chunks, scoped to
    a course, a department, or everything. Shared by /chat and /tutor so
    retrieval behavior stays identical between them."""
    question_embedding = await get_embedding(question)

    query = db.query(DocumentChunk).join(Document)
    if course_id:
        query = query.filter(Document.course_id == course_id)
    elif department_id:
        query = query.filter(Document.department_id == department_id)

    chunks = query.all()
    scored = [
        (cosine_similarity(question_embedding, deserialize_embedding(c.embedding_json)), c)
        for c in chunks
    ]
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return scored[:top_k]


def build_context_block(scored_chunks: list[tuple[float, DocumentChunk]]) -> str:
    return "\n\n---\n\n".join(f"[{c.document.title}]\n{c.content}" for _, c in scored_chunks)

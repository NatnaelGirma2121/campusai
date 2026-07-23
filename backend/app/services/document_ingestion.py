import uuid

from sqlalchemy.orm import Session

from app.models.document import Document, DocumentChunk
from app.services.ai_provider import get_embedding, serialize_embedding
from app.services.chunking import chunk_text


async def ingest_document(
    db: Session,
    title: str,
    content: str,
    department_id: uuid.UUID | None,
    course_id: uuid.UUID | None,
    uploaded_by_id: uuid.UUID | None,
) -> tuple[Document, int]:
    """Create a Document, chunk its text, and embed each chunk. Shared by the
    raw-text upload route and the file-upload route so both go through the
    same chunking/embedding path. Returns (document, chunk_count) since the
    ORM relationship isn't reliably populated until after commit+refresh."""
    document = Document(
        title=title,
        department_id=department_id,
        course_id=course_id,
        uploaded_by_id=uploaded_by_id,
    )
    db.add(document)
    db.flush()  # get document.id before creating chunks

    pieces = chunk_text(content)
    for index, piece in enumerate(pieces):
        embedding = await get_embedding(piece)
        db.add(
            DocumentChunk(
                document_id=document.id,
                chunk_index=index,
                content=piece,
                embedding_json=serialize_embedding(embedding),
            )
        )

    db.commit()
    db.refresh(document)
    return document, len(pieces)

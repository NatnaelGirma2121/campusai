import uuid

from pydantic import BaseModel


class ChatRequest(BaseModel):
    question: str
    course_id: uuid.UUID | None = None
    department_id: uuid.UUID | None = None
    top_k: int = 4


class ChatSource(BaseModel):
    document_id: uuid.UUID
    document_title: str
    chunk_content: str
    similarity: float


class ChatResponse(BaseModel):
    answer: str
    sources: list[ChatSource]

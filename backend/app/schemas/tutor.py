import uuid

from pydantic import BaseModel

from app.schemas.chat import ChatSource


class TutorMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class TutorRequest(BaseModel):
    course_id: uuid.UUID
    question: str
    history: list[TutorMessage] = []  # prior turns in this tutoring conversation, oldest first
    top_k: int = 4


class TutorResponse(BaseModel):
    answer: str
    sources: list[ChatSource]

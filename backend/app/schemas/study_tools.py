import uuid
from typing import Literal

from pydantic import BaseModel


class StudyToolRequest(BaseModel):
    document_id: uuid.UUID
    mode: Literal["summary", "flashcards", "quiz", "key_concepts"]


class Flashcard(BaseModel):
    front: str
    back: str


class QuizQuestion(BaseModel):
    question: str
    choices: list[str]
    correct_index: int


class KeyConcept(BaseModel):
    term: str
    explanation: str


class StudyToolResponse(BaseModel):
    mode: str
    document_id: uuid.UUID
    document_title: str
    summary: str | None = None
    flashcards: list[Flashcard] | None = None
    quiz: list[QuizQuestion] | None = None
    key_concepts: list[KeyConcept] | None = None

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentCreate(BaseModel):
    title: str
    content: str
    department_id: uuid.UUID | None = None
    course_id: uuid.UUID | None = None


class DocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    department_id: uuid.UUID | None
    course_id: uuid.UUID | None
    uploaded_by_id: uuid.UUID | None
    created_at: datetime
    chunk_count: int = 0

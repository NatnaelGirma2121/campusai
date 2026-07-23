import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.grade import GradeComponent


class GradeCreate(BaseModel):
    enrollment_id: uuid.UUID
    component: GradeComponent
    label: str
    score: float
    max_score: float = 100.0


class GradeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    enrollment_id: uuid.UUID
    component: GradeComponent
    label: str
    score: float
    max_score: float
    graded_by_id: uuid.UUID | None
    created_at: datetime

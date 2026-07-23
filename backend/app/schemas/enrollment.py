import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enrollment import EnrollmentStatus


class EnrollmentCreate(BaseModel):
    course_id: uuid.UUID
    semester: str


class EnrollmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    student_id: uuid.UUID
    course_id: uuid.UUID
    semester: str
    status: EnrollmentStatus
    enrolled_at: datetime


class RosterEntry(BaseModel):
    """An enrollment enriched with the student's name/email, for teacher/admin
    roster views — separate from EnrollmentRead so that endpoint isn't forced
    to join User for consumers that only need the raw enrollment record."""

    enrollment_id: uuid.UUID
    student_id: uuid.UUID
    student_name: str
    student_email: str
    semester: str
    status: EnrollmentStatus

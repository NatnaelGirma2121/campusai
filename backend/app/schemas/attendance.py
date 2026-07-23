import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.attendance import AttendanceStatus


class AttendanceCreate(BaseModel):
    enrollment_id: uuid.UUID
    date: date
    status: AttendanceStatus = AttendanceStatus.present
    note: str | None = None


class AttendanceSummaryEntry(BaseModel):
    enrollment_id: uuid.UUID
    course_id: uuid.UUID
    course_code: str
    course_title: str
    semester: str
    total_records: int
    present_count: int
    percentage: float | None  # None if no records yet
    is_at_risk: bool


class AttendanceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    enrollment_id: uuid.UUID
    date: date
    status: AttendanceStatus
    note: str | None
    recorded_by_id: uuid.UUID | None
    created_at: datetime

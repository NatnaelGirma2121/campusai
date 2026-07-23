import uuid

from pydantic import BaseModel


class CourseGradeSummary(BaseModel):
    enrollment_id: uuid.UUID
    course_id: uuid.UUID
    course_code: str
    course_title: str
    credit_hours: int
    semester: str
    average_percentage: float | None  # None if no grades recorded yet
    grade_points: float | None  # average_percentage mapped to a 4.0 scale


class GpaSummary(BaseModel):
    courses: list[CourseGradeSummary]
    overall_gpa: float | None  # credit-hour-weighted average of grade_points; None if no grades anywhere

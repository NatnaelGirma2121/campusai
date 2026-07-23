import uuid

from pydantic import BaseModel, ConfigDict


class CourseBase(BaseModel):
    code: str
    title: str
    credit_hours: int = 3
    department_id: uuid.UUID
    instructor_id: uuid.UUID | None = None


class CourseCreate(CourseBase):
    pass


class CourseRead(CourseBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID

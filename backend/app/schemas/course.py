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


class CourseUpdate(BaseModel):
    title: str | None = None
    credit_hours: int | None = None
    department_id: uuid.UUID | None = None
    instructor_id: uuid.UUID | None = None
    # explicit flag since instructor_id=None is ambiguous between "don't change it"
    # and "unassign the instructor" — the flag makes the intent unambiguous
    clear_instructor: bool = False


class CourseRead(CourseBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class GradeComponent(str, enum.Enum):
    assignment = "assignment"
    quiz = "quiz"
    midterm = "midterm"
    final = "final"
    project = "project"
    participation = "participation"


class Grade(Base):
    __tablename__ = "grades"
    __table_args__ = (
        UniqueConstraint("enrollment_id", "component", "label", name="uq_grade_enrollment_component_label"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    enrollment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("enrollments.id", ondelete="CASCADE"), nullable=False
    )
    enrollment: Mapped["Enrollment"] = relationship(back_populates="grades")

    component: Mapped[GradeComponent] = mapped_column(Enum(GradeComponent, name="grade_component"), nullable=False)
    # e.g. "Assignment 1", "Quiz 3" — distinguishes multiple grades of the same component
    label: Mapped[str] = mapped_column(String(100), nullable=False)

    score: Mapped[float] = mapped_column(Float, nullable=False)
    max_score: Mapped[float] = mapped_column(Float, nullable=False, default=100.0)

    graded_by_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    graded_by: Mapped["User | None"] = relationship(foreign_keys=[graded_by_id])

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class UserRole(str, enum.Enum):
    student = "student"
    teacher = "teacher"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"), default=UserRole.student, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Which department this user belongs to (relevant for students and teachers;
    # nullable so admins, or users not yet assigned, aren't forced to pick one).
    department_id: Mapped["uuid.UUID | None"] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )
    department: Mapped["Department | None"] = relationship(back_populates="users")

    # Login-attempt guarding: after MAX_FAILED_ATTEMPTS wrong passwords in a
    # row (see auth.py), the account locks for LOCKOUT_MINUTES. Both reset
    # to 0/None on a successful login.
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

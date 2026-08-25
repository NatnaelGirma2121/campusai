import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base import Base


class NotificationKind(str, enum.Enum):
    announcement = "announcement"
    attendance_risk = "attendance_risk"
    grade_posted = "grade_posted"
    general = "general"


class Notification(Base):
    """A per-user notification. Most are system-generated (fanned out when
    an announcement posts, or raised when attendance drops below a
    threshold) — those have created_by_id = None. Admins can also send
    notifications manually (see /notifications POST/PATCH/DELETE), which
    do carry a created_by_id for accountability."""

    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    kind: Mapped[NotificationKind] = mapped_column(
        Enum(NotificationKind, name="notification_kind"), default=NotificationKind.general
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)

    related_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)

    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

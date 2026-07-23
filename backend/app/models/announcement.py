import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class AnnouncementCategory(str, enum.Enum):
    academic = "academic"
    sports = "sports"
    scholarships = "scholarships"
    events = "events"
    emergency = "emergency"


class Announcement(Base):
    """A posted announcement. Optionally scoped to a department (e.g. an
    ECE-only scholarship deadline); left null it's university-wide, same
    scoping pattern used for Document."""

    __tablename__ = "announcements"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[AnnouncementCategory] = mapped_column(
        Enum(AnnouncementCategory, name="announcement_category"),
        default=AnnouncementCategory.academic,
        nullable=False,
    )

    department_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("departments.id", ondelete="CASCADE"), nullable=True
    )
    posted_by_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # emergency announcements are surfaced ahead of everything else in the UI
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

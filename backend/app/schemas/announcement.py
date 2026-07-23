import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.announcement import AnnouncementCategory


class AnnouncementCreate(BaseModel):
    title: str
    content: str
    category: AnnouncementCategory = AnnouncementCategory.academic
    department_id: uuid.UUID | None = None
    is_pinned: bool = False


class AnnouncementRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    content: str
    category: AnnouncementCategory
    department_id: uuid.UUID | None
    posted_by_id: uuid.UUID | None
    is_pinned: bool
    created_at: datetime

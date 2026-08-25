import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.notification import NotificationKind


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    kind: NotificationKind
    title: str
    body: str
    is_read: bool
    created_by_id: uuid.UUID | None
    created_at: datetime


class NotificationCreate(BaseModel):
    user_id: uuid.UUID
    title: str
    body: str
    kind: NotificationKind = NotificationKind.general


class NotificationUpdate(BaseModel):
    title: str | None = None
    body: str | None = None

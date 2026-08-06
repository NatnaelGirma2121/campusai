import re
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.user import UserRole


class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    role: UserRole = UserRole.student
    department_id: uuid.UUID | None = None


class UserCreate(BaseModel):
    """Public registration payload. Role is deliberately restricted to
    student/teacher here — admin cannot be self-granted through this
    endpoint. Promoting someone to admin is a separate, admin-only action
    (see PATCH /users/{user_id}/role)."""

    full_name: str
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Literal["student", "teacher"] = "student"
    department_id: uuid.UUID | None = None

    @field_validator("password")
    @classmethod
    def password_must_have_letter_and_digit(cls, value: str) -> str:
        if not re.search(r"[A-Za-z]", value) or not re.search(r"\d", value):
            raise ValueError("Password must contain at least one letter and one number")
        return value


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    is_active: bool
    created_at: datetime


class UserRoleUpdate(BaseModel):
    role: UserRole

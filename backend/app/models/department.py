import uuid

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    # short code, e.g. "ECE", "CS", "ME", "CIVIL" — used in course codes and UI
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)

    courses: Mapped[list["Course"]] = relationship(back_populates="department")
    users: Mapped[list["User"]] = relationship(back_populates="department")

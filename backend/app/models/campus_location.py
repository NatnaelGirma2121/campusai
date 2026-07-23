import enum
import uuid

from sqlalchemy import Enum, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class LocationCategory(str, enum.Enum):
    academic = "academic"
    lab = "lab"
    library = "library"
    cafeteria = "cafeteria"
    dormitory = "dormitory"
    administration = "administration"
    parking = "parking"
    other = "other"


class CampusLocation(Base):
    """A directory entry for a campus building/facility. lat/lng are
    optional — this works as a text-searchable directory on its own, and can
    back an actual interactive map later once a Maps API key is available
    (deliberately not embedding a specific mapping provider's SDK here)."""

    __tablename__ = "campus_locations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[LocationCategory] = mapped_column(
        Enum(LocationCategory, name="location_category"), default=LocationCategory.other
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # optional: which department this location is most associated with
    # (e.g. the ECE lab building) — not required, since many locations
    # (cafeteria, library) serve the whole university
    department_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )

    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

import uuid

from pydantic import BaseModel, ConfigDict

from app.models.campus_location import LocationCategory


class CampusLocationCreate(BaseModel):
    name: str
    category: LocationCategory = LocationCategory.other
    description: str | None = None
    department_id: uuid.UUID | None = None
    latitude: float | None = None
    longitude: float | None = None


class CampusLocationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    category: LocationCategory
    description: str | None
    department_id: uuid.UUID | None
    latitude: float | None
    longitude: float | None

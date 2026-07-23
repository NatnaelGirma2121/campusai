import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles
from app.models.campus_location import CampusLocation, LocationCategory
from app.models.user import UserRole
from app.schemas.campus_location import CampusLocationCreate, CampusLocationRead

router = APIRouter(prefix="/campus-locations", tags=["campus-locations"])


@router.get("/", response_model=list[CampusLocationRead])
def list_locations(
    q: str | None = Query(default=None, description="Search by name or description"),
    category: LocationCategory | None = Query(default=None),
    department_id: uuid.UUID | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[CampusLocation]:
    """Public — a campus directory isn't sensitive, and visitors/prospective
    students benefit from being able to look it up without an account."""
    query = db.query(CampusLocation)
    if category:
        query = query.filter(CampusLocation.category == category)
    if department_id:
        query = query.filter(CampusLocation.department_id == department_id)
    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(CampusLocation.name.ilike(like), CampusLocation.description.ilike(like))
        )
    return query.order_by(CampusLocation.name).all()


@router.post(
    "/",
    response_model=CampusLocationRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(UserRole.admin))],
)
def create_location(payload: CampusLocationCreate, db: Session = Depends(get_db)) -> CampusLocation:
    location = CampusLocation(**payload.model_dump())
    db.add(location)
    db.commit()
    db.refresh(location)
    return location


@router.delete(
    "/{location_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(UserRole.admin))],
)
def delete_location(location_id: uuid.UUID, db: Session = Depends(get_db)) -> None:
    location = db.get(CampusLocation, location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    db.delete(location)
    db.commit()

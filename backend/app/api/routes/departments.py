import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles
from app.models.department import Department
from app.models.user import UserRole
from app.schemas.department import DepartmentCreate, DepartmentRead

router = APIRouter(prefix="/departments", tags=["departments"])


@router.get("/", response_model=list[DepartmentRead])
def list_departments(db: Session = Depends(get_db)) -> list[Department]:
    """Every department in the university — not scoped to any single one.
    Deliberately public (no auth required): department names/codes aren't
    sensitive, and a new user needs this list *before* they have an account
    in order to pick a department during registration."""
    return db.query(Department).order_by(Department.name).all()


@router.post(
    "/",
    response_model=DepartmentRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(UserRole.admin))],
)
def create_department(payload: DepartmentCreate, db: Session = Depends(get_db)) -> Department:
    existing = db.query(Department).filter(
        (Department.code == payload.code) | (Department.name == payload.name)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department with this name or code already exists")

    department = Department(name=payload.name, code=payload.code)
    db.add(department)
    db.commit()
    db.refresh(department)
    return department


@router.delete(
    "/{department_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(UserRole.admin))],
)
def delete_department(department_id: uuid.UUID, db: Session = Depends(get_db)) -> None:
    department = db.get(Department, department_id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(department)
    db.commit()

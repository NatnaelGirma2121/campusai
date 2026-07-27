import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_roles
from app.models.course import Course
from app.models.department import Department
from app.models.user import User, UserRole
from app.schemas.course import CourseCreate, CourseRead, CourseUpdate

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("/", response_model=list[CourseRead])
def list_courses(
    department_id: uuid.UUID | None = Query(
        default=None, description="Filter to a single department; omit to see courses across all departments"
    ),
    instructor_id: uuid.UUID | None = Query(
        default=None, description="Filter to courses taught by a specific instructor"
    ),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> list[Course]:
    query = db.query(Course)
    if department_id:
        query = query.filter(Course.department_id == department_id)
    if instructor_id:
        query = query.filter(Course.instructor_id == instructor_id)
    return query.order_by(Course.code).all()


@router.post(
    "/",
    response_model=CourseRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(UserRole.admin))],
)
def create_course(payload: CourseCreate, db: Session = Depends(get_db)) -> Course:
    department = db.get(Department, payload.department_id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    existing = db.query(Course).filter(Course.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="A course with this code already exists")

    course = Course(**payload.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.patch(
    "/{course_id}",
    response_model=CourseRead,
    dependencies=[Depends(require_roles(UserRole.admin))],
)
def update_course(
    course_id: uuid.UUID, payload: CourseUpdate, db: Session = Depends(get_db)
) -> Course:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if payload.department_id is not None:
        department = db.get(Department, payload.department_id)
        if not department:
            raise HTTPException(status_code=404, detail="Department not found")
        course.department_id = payload.department_id

    if payload.title is not None:
        course.title = payload.title
    if payload.credit_hours is not None:
        course.credit_hours = payload.credit_hours

    if payload.clear_instructor:
        course.instructor_id = None
    elif payload.instructor_id is not None:
        instructor = db.get(User, payload.instructor_id)
        if not instructor or instructor.role != UserRole.teacher:
            raise HTTPException(status_code=400, detail="instructor_id must belong to a teacher")
        course.instructor_id = payload.instructor_id

    db.commit()
    db.refresh(course)
    return course

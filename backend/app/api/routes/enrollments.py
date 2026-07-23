import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_roles
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.user import User, UserRole
from app.schemas.enrollment import EnrollmentCreate, EnrollmentRead, RosterEntry

router = APIRouter(prefix="/enrollments", tags=["enrollments"])


@router.post(
    "/",
    response_model=EnrollmentRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(UserRole.student))],
)
def enroll_in_course(
    payload: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Enrollment:
    course = db.get(Course, payload.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    existing = (
        db.query(Enrollment)
        .filter(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == payload.course_id,
            Enrollment.semester == payload.semester,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled in this course for this semester")

    enrollment = Enrollment(
        student_id=current_user.id,
        course_id=payload.course_id,
        semester=payload.semester,
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.get("/me", response_model=list[EnrollmentRead])
def my_enrollments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Enrollment]:
    return db.query(Enrollment).filter(Enrollment.student_id == current_user.id).all()


@router.get(
    "/course/{course_id}",
    response_model=list[RosterEntry],
    dependencies=[Depends(require_roles(UserRole.teacher, UserRole.admin))],
)
def course_roster(
    course_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[RosterEntry]:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # a teacher may only view rosters for courses they instruct; admins see any
    if current_user.role == UserRole.teacher and course.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="You may only view rosters for your own courses")

    rows = (
        db.query(Enrollment, User)
        .join(User, Enrollment.student_id == User.id)
        .filter(Enrollment.course_id == course_id)
        .all()
    )
    return [
        RosterEntry(
            enrollment_id=enrollment.id,
            student_id=student.id,
            student_name=student.full_name,
            student_email=student.email,
            semester=enrollment.semester,
            status=enrollment.status,
        )
        for enrollment, student in rows
    ]

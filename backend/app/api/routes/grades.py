import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_roles
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.grade import Grade
from app.models.user import User, UserRole
from app.schemas.gpa import CourseGradeSummary, GpaSummary
from app.schemas.grade import GradeCreate, GradeRead

router = APIRouter(prefix="/grades", tags=["grades"])


def _percentage_to_grade_points(percentage: float) -> float:
    """Simple linear mapping onto a 4.0 scale, capped at 4.0.
    100% -> 4.0, 75% -> 3.0, 50% -> 2.0, etc. A department can swap this for
    a proper letter-grade breakpoint table later without changing callers."""
    return round(min(percentage / 25.0, 4.0), 2)


@router.get("/me/summary", response_model=GpaSummary)
def my_gpa_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GpaSummary:
    enrollments = (
        db.query(Enrollment, Course)
        .join(Course, Enrollment.course_id == Course.id)
        .filter(Enrollment.student_id == current_user.id)
        .all()
    )

    course_summaries: list[CourseGradeSummary] = []
    weighted_points_sum = 0.0
    total_credit_hours = 0

    for enrollment, course in enrollments:
        grades = db.query(Grade).filter(Grade.enrollment_id == enrollment.id).all()
        if grades:
            avg_percentage = sum(g.score / g.max_score * 100 for g in grades) / len(grades)
            grade_points = _percentage_to_grade_points(avg_percentage)
            weighted_points_sum += grade_points * course.credit_hours
            total_credit_hours += course.credit_hours
        else:
            avg_percentage = None
            grade_points = None

        course_summaries.append(
            CourseGradeSummary(
                enrollment_id=enrollment.id,
                course_id=course.id,
                course_code=course.code,
                course_title=course.title,
                credit_hours=course.credit_hours,
                semester=enrollment.semester,
                average_percentage=round(avg_percentage, 2) if avg_percentage is not None else None,
                grade_points=grade_points,
            )
        )

    overall_gpa = round(weighted_points_sum / total_credit_hours, 2) if total_credit_hours else None
    return GpaSummary(courses=course_summaries, overall_gpa=overall_gpa)


@router.post(
    "/",
    response_model=GradeRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(UserRole.teacher, UserRole.admin))],
)
def record_grade(
    payload: GradeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Grade:
    enrollment = db.get(Enrollment, payload.enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    grade = Grade(
        enrollment_id=payload.enrollment_id,
        component=payload.component,
        label=payload.label,
        score=payload.score,
        max_score=payload.max_score,
        graded_by_id=current_user.id,
    )
    db.add(grade)
    db.commit()
    db.refresh(grade)
    return grade


@router.get("/enrollment/{enrollment_id}", response_model=list[GradeRead])
def grades_for_enrollment(
    enrollment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Grade]:
    enrollment = db.get(Enrollment, enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    if current_user.role == UserRole.student and enrollment.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="You may only view your own grades")

    return db.query(Grade).filter(Grade.enrollment_id == enrollment_id).all()

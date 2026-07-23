import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_roles
from app.models.attendance import Attendance
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.user import User, UserRole
from app.schemas.attendance import AttendanceCreate, AttendanceRead, AttendanceSummaryEntry
from app.services.notifications import ATTENDANCE_RISK_THRESHOLD, check_attendance_risk

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.post(
    "/",
    response_model=AttendanceRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(UserRole.teacher, UserRole.admin))],
)
def record_attendance(
    payload: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Attendance:
    enrollment = db.get(Enrollment, payload.enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    existing = (
        db.query(Attendance)
        .filter(Attendance.enrollment_id == payload.enrollment_id, Attendance.date == payload.date)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Attendance for this date is already recorded")

    record = Attendance(
        enrollment_id=payload.enrollment_id,
        date=payload.date,
        status=payload.status,
        note=payload.note,
        recorded_by_id=current_user.id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    check_attendance_risk(db, payload.enrollment_id)
    return record


@router.get("/enrollment/{enrollment_id}", response_model=list[AttendanceRead])
def attendance_for_enrollment(
    enrollment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Attendance]:
    enrollment = db.get(Enrollment, enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    # students may only view their own attendance; teachers/admins may view any
    if current_user.role == UserRole.student and enrollment.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="You may only view your own attendance")

    return db.query(Attendance).filter(Attendance.enrollment_id == enrollment_id).order_by(Attendance.date).all()


@router.get("/me/summary", response_model=list[AttendanceSummaryEntry])
def my_attendance_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[AttendanceSummaryEntry]:
    enrollments = (
        db.query(Enrollment, Course)
        .join(Course, Enrollment.course_id == Course.id)
        .filter(Enrollment.student_id == current_user.id)
        .all()
    )

    summaries = []
    for enrollment, course in enrollments:
        records = db.query(Attendance).filter(Attendance.enrollment_id == enrollment.id).all()
        present_count = sum(1 for r in records if r.status.value == "present")
        percentage = (present_count / len(records) * 100) if records else None
        summaries.append(
            AttendanceSummaryEntry(
                enrollment_id=enrollment.id,
                course_id=course.id,
                course_code=course.code,
                course_title=course.title,
                semester=enrollment.semester,
                total_records=len(records),
                present_count=present_count,
                percentage=round(percentage, 1) if percentage is not None else None,
                is_at_risk=percentage is not None and percentage < ATTENDANCE_RISK_THRESHOLD,
            )
        )
    return summaries

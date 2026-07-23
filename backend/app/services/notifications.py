import uuid

from sqlalchemy.orm import Session

from app.models.attendance import Attendance, AttendanceStatus
from app.models.enrollment import Enrollment
from app.models.notification import Notification, NotificationKind
from app.models.user import User

# below this attendance percentage, flag the student — a simple, explainable
# heuristic (not a trained model) that surfaces students worth checking in on
ATTENDANCE_RISK_THRESHOLD = 75.0
MIN_RECORDS_BEFORE_FLAGGING = 3  # don't flag on day one of a course


def create_notification(
    db: Session,
    user_id: uuid.UUID,
    kind: NotificationKind,
    title: str,
    body: str,
    related_id: uuid.UUID | None = None,
) -> Notification:
    notification = Notification(user_id=user_id, kind=kind, title=title, body=body, related_id=related_id)
    db.add(notification)
    return notification


def fan_out_announcement(
    db: Session, announcement_id: uuid.UUID, title: str, body: str, department_id: uuid.UUID | None
) -> int:
    """Create a notification for everyone who should see an announcement:
    everyone if it's university-wide, otherwise just that department."""
    query = db.query(User)
    if department_id:
        query = query.filter(User.department_id == department_id)
    users = query.all()

    for user in users:
        create_notification(
            db,
            user.id,
            NotificationKind.announcement,
            f"New announcement: {title}",
            body,
            related_id=announcement_id,
        )
    db.commit()
    return len(users)


def check_attendance_risk(db: Session, enrollment_id: uuid.UUID) -> Notification | None:
    """After recording attendance, check whether this enrollment's attendance
    percentage has dropped below the risk threshold, and raise one
    notification if so — but only once per enrollment while it stays below
    threshold and unacknowledged, so recording attendance daily doesn't spam
    the student."""
    records = db.query(Attendance).filter(Attendance.enrollment_id == enrollment_id).all()
    if len(records) < MIN_RECORDS_BEFORE_FLAGGING:
        return None

    present_count = sum(1 for r in records if r.status == AttendanceStatus.present)
    percentage = present_count / len(records) * 100
    if percentage >= ATTENDANCE_RISK_THRESHOLD:
        return None

    enrollment = db.get(Enrollment, enrollment_id)
    if not enrollment:
        return None

    existing = (
        db.query(Notification)
        .filter(
            Notification.related_id == enrollment_id,
            Notification.kind == NotificationKind.attendance_risk,
            Notification.is_read.is_(False),
        )
        .first()
    )
    if existing:
        return None  # already flagged and not yet acknowledged

    notification = create_notification(
        db,
        enrollment.student_id,
        NotificationKind.attendance_risk,
        f"Attendance below {ATTENDANCE_RISK_THRESHOLD:.0f}%",
        f"Your attendance for this course is at {percentage:.1f}%. "
        "Reach out to your instructor if you're facing challenges attending.",
        related_id=enrollment_id,
    )
    db.commit()
    return notification

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import ensure_admin_department_access, get_current_user, get_db, require_roles
from app.models.notification import Notification
from app.models.user import User, UserRole
from app.schemas.notification import NotificationCreate, NotificationRead, NotificationUpdate

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=list[NotificationRead])
def my_notifications(
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Notification]:
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.is_read.is_(False))
    return query.order_by(Notification.created_at.desc()).all()


@router.post("/{notification_id}/read", response_model=NotificationRead)
def mark_read(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Notification:
    notification = db.get(Notification, notification_id)
    if not notification or notification.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


@router.post(
    "/",
    response_model=NotificationRead,
    status_code=201,
    dependencies=[Depends(require_roles(UserRole.admin))],
)
def create_notification(
    payload: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Notification:
    """Manually send a notification to a specific user. A department-scoped
    admin may only target users in their own department."""
    target_user = db.get(User, payload.user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    ensure_admin_department_access(current_user, target_user.department_id)

    notification = Notification(
        user_id=payload.user_id,
        kind=payload.kind,
        title=payload.title,
        body=payload.body,
        created_by_id=current_user.id,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


@router.patch(
    "/{notification_id}",
    response_model=NotificationRead,
    dependencies=[Depends(require_roles(UserRole.admin))],
)
def update_notification(
    notification_id: uuid.UUID,
    payload: NotificationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Notification:
    """Only manually-sent notifications can be edited (created_by_id set) —
    system-generated ones (announcement fan-out, attendance risk) stay as
    the system produced them, to keep that content trustworthy; delete and
    let the system re-raise it instead of editing its wording."""
    notification = db.get(Notification, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notification.created_by_id is None:
        raise HTTPException(status_code=400, detail="System-generated notifications can't be edited")

    target_user = db.get(User, notification.user_id)
    ensure_admin_department_access(current_user, target_user.department_id if target_user else None)

    if payload.title is not None:
        notification.title = payload.title
    if payload.body is not None:
        notification.body = payload.body

    db.commit()
    db.refresh(notification)
    return notification


@router.delete(
    "/{notification_id}",
    status_code=204,
    dependencies=[Depends(require_roles(UserRole.admin))],
)
def delete_notification(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    notification = db.get(Notification, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    target_user = db.get(User, notification.user_id)
    ensure_admin_department_access(current_user, target_user.department_id if target_user else None)

    db.delete(notification)
    db.commit()

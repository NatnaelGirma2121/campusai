
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status

from sqlalchemy import or_

from sqlalchemy.orm import Session

from app.api.deps import ensure_admin_department_access, get_current_user, get_db, require_roles

from app.models.announcement import Announcement, AnnouncementCategory

from app.models.user import User, UserRole

from app.schemas.announcement import AnnouncementCreate, AnnouncementRead

from app.services.notifications import fan_out_announcement

router = APIRouter(prefix="/announcements", tags=["announcements"])

@router.post(

    "/",

    response_model=AnnouncementRead,

    status_code=status.HTTP_201_CREATED,

    dependencies=[Depends(require_roles(UserRole.teacher, UserRole.admin))],

)

def create_announcement(

    payload: AnnouncementCreate,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user),

) -> Announcement:

    # A department-scoped admin can only post within their own department —

    # posting university-wide (department_id=None) is a super-admin action,

    # since that reaches every department at once. Teachers are unaffected;

    # this check only fires for the admin role.

    ensure_admin_department_access(current_user, payload.department_id)

    announcement = Announcement(

        title=payload.title,

        content=payload.content,

        category=payload.category,

        department_id=payload.department_id,

        is_pinned=payload.is_pinned,

        posted_by_id=current_user.id,

    )

    db.add(announcement)

    db.commit()

    db.refresh(announcement)

    fan_out_announcement(

        db, announcement.id, announcement.title, announcement.content, announcement.department_id

    )

    return announcement

@router.get("/", response_model=list[AnnouncementRead])

def list_announcements(

    department_id: uuid.UUID | None = Query(

        default=None,

        description="Show university-wide announcements plus this department's; omit for everything",

    ),

    category: AnnouncementCategory | None = Query(default=None),

    db: Session = Depends(get_db),

    _=Depends(get_current_user),

) -> list[Announcement]:

    query = db.query(Announcement)

    if department_id:

        query = query.filter(

            or_(Announcement.department_id == department_id, Announcement.department_id.is_(None))

        )

    if category:

        query = query.filter(Announcement.category == category)

    return query.order_by(Announcement.is_pinned.desc(), Announcement.created_at.desc()).all()

@router.delete(

    "/{announcement_id}",

    status_code=status.HTTP_204_NO_CONTENT,

    dependencies=[Depends(require_roles(UserRole.teacher, UserRole.admin))],

)

def delete_announcement(

    announcement_id: uuid.UUID,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user),

) -> None:

    announcement = db.get(Announcement, announcement_id)

    if not announcement:

        raise HTTPException(status_code=404, detail="Announcement not found")

    # a teacher may only delete their own posts; a department-scoped admin

    # may delete any post within their own department; a super-admin may

    # delete anything

    if current_user.role == UserRole.teacher and announcement.posted_by_id != current_user.id:

        raise HTTPException(status_code=403, detail="You may only delete your own announcements")

    if current_user.role == UserRole.admin:

        ensure_admin_department_access(current_user, announcement.department_id)

    db.delete(announcement)

    db.commit()


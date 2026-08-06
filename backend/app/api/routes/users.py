import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_roles
from app.models.user import User, UserRole
from app.schemas.user import UserRead, UserRoleUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[UserRead], dependencies=[Depends(require_roles(UserRole.admin))])
def list_users(db: Session = Depends(get_db)) -> list[User]:
    return db.query(User).order_by(User.created_at.desc()).all()


@router.patch(
    "/{user_id}/role",
    response_model=UserRead,
    dependencies=[Depends(require_roles(UserRole.admin))],
)
def update_user_role(
    user_id: uuid.UUID,
    payload: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    """The only way to grant admin — public registration can never create one
    (see UserCreate). An existing admin promotes someone here instead."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot change your own role")

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user

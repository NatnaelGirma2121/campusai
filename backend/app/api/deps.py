import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise credentials_exception
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.get(User, uuid.UUID(user_id))
    if user is None or not user.is_active:
        raise credentials_exception
    return user


def require_roles(*roles: UserRole):
    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return user

    return checker


def ensure_admin_department_access(current_user: User, department_id: "uuid.UUID | None") -> None:
    """An admin with no department_id is a super-admin (full access, every
    department). An admin WITH a department_id is scoped to only that one —
    call this after resolving which department a write operation targets,
    once you know it (e.g. after loading the Course/Announcement/User being
    modified). Raises 403 if a department-scoped admin is trying to act
    outside their own department; does nothing for super-admins or non-admins
    (route-level require_roles already handles the non-admin case)."""
    if current_user.role != UserRole.admin:
        return
    if current_user.department_id is not None and current_user.department_id != department_id:
        raise HTTPException(status_code=403, detail="You can only manage your own department")

def require_super_admin():

    """For actions that are global, not department-scoped — creating or

    deleting a department itself, for instance. A department-scoped admin

    (department_id set) manages their own department's contents, but

    shouldn't be able to create/delete departments outright."""

    def checker(user: User = Depends(get_current_user)) -> User:

        if user.role != UserRole.admin or user.department_id is not None:

            raise HTTPException(

                status_code=status.HTTP_403_FORBIDDEN,

                detail="Only a super-admin (admin with no department) can perform this action",

            )

        return user

    return checker


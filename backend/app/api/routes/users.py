
import uuid

from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from app.api.deps import ensure_admin_department_access, get_current_user, get_db, require_roles

from app.models.user import User, UserRole

from app.schemas.user import UserRead, UserRoleUpdate

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=list[UserRead], dependencies=[Depends(require_roles(UserRole.admin))])

def list_users(

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user),

) -> list[User]:

    """A department-scoped admin sees only users in their own department;

    a super-admin (department_id=None) sees everyone."""

    query = db.query(User)

    if current_user.department_id is not None:

        query = query.filter(User.department_id == current_user.department_id)

    return query.order_by(User.created_at.desc()).all()

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

    (see UserCreate). A department-scoped admin may only promote/change

    users within their own department, which also means anyone they promote

    to admin becomes a department admin for that same department, not a

    super-admin — the department stays whatever it already was, this

    endpoint only ever touches role."""

    if user_id == current_user.id:

        raise HTTPException(status_code=400, detail="You cannot change your own role")

    user = db.get(User, user_id)

    if not user:

        raise HTTPException(status_code=404, detail="User not found")

    ensure_admin_department_access(current_user, user.department_id)

    user.role = payload.role

    db.commit()

    db.refresh(user)

    return user


import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, RefreshRequest, Token
from app.schemas.user import UserCreate, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])

# Login-attempt guarding: after this many wrong passwords in a row, the
# account locks for LOCKOUT_MINUTES. Both counters reset to 0/None on a
# successful login. This is per-account, not per-IP — a real, contained
# fix for credential-stuffing against one account; broader per-IP rate
# limiting across all endpoints is a separate, later addition.
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> User:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=UserRole(payload.role),  # UserCreate.role is restricted to student/teacher —
        # admin can never come through here, see PATCH /users/{user_id}/role
        department_id=payload.department_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> Token:
    user = db.query(User).filter(User.email == payload.email).first()

    # Check lockout before verifying the password, so a locked account
    # doesn't leak whether the password would've been correct this time.
    if user and user.locked_until and datetime.now(timezone.utc) < user.locked_until:
        remaining = int((user.locked_until - datetime.now(timezone.utc)).total_seconds() / 60) + 1
        raise HTTPException(
            status_code=429,
            detail=f"Too many failed attempts. Try again in about {remaining} minute(s).",
        )

    if not user or not verify_password(payload.password, user.hashed_password):
        if user:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
                user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)
                user.failed_login_attempts = 0
            db.commit()
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    # successful login: clear any prior failed-attempt state
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    return Token(
        access_token=create_access_token(str(user.id), {"role": user.role.value}),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/refresh", response_model=Token)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> Token:
    try:
        data = decode_token(payload.refresh_token)
        if data.get("type") != "refresh":
            raise JWTError()
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db.get(User, uuid.UUID(data["sub"]))
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    return Token(
        access_token=create_access_token(str(user.id), {"role": user.role.value}),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user

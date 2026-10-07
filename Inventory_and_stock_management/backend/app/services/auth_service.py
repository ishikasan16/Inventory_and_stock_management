from sqlalchemy import func, select
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.models.user import User
from app.models.revoked_token import RevokedToken
from app.schemas.auth import UserRole

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,create_refresh_token,
    decode_access_token,decode_refresh_token
)


def register_user(
    db: Session,
    username: str,
    email: str,
    password: str,
    confirm_password: str
):
    email = email.lower()

    if password != confirm_password:
        raise ValueError("Passwords do not match")

    # --------------------------------
    # CHECK EMAIL
    # --------------------------------

    existing_user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing_user:
        raise ValueError(
            "Email already exists"
        )

    # --------------------------------
    # DETERMINE ROLE
    # --------------------------------
    # The first-ever user becomes SUPER_ADMIN; everyone else registers
    # as STAFF.

    user_count = db.scalar(
        select(func.count()).select_from(User)
    )

    role = (
        UserRole.SUPER_ADMIN
        if user_count == 0
        else UserRole.INVENTORY_STAFF
    )

    # --------------------------------
    # HASH PASSWORD
    # --------------------------------

    hashed_password = hash_password(password)

    # --------------------------------
    # CREATE USER
    # --------------------------------

    user = User(
        username=username,
        email=email,
        password_hash=hashed_password,
        role=role.value
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def authenticate_user(
    db: Session,
    email: str,
    password: str
):

  
    # FIND USER
    email = email.lower()

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        return None

   
    # VERIFY PASSWORD
   

    if not verify_password(
        password,
        user.password_hash
    ):
        return None

    return user

def login_user(
    db: Session,
    email: str,
    password: str
):

    user = authenticate_user(
        db,
        email,
        password
    )

    if not user:
        return None

    # CREATE ACCESS TOKEN

    access_token = create_access_token(
        {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role
        }
    )

    # CREATE REFRESH TOKEN

    refresh_token = create_refresh_token(
        {
            "sub": str(user.id),
            "email": user.email
        }
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username
    }


def refresh_access_token(
    db: Session,
    refresh_token: str
):

    payload = decode_refresh_token(
        refresh_token
    )

    if not payload:
        raise ValueError(
            "Invalid or expired refresh token"
        )

    # Make sure this is actually
    # a refresh token

    if payload.get("type") != "refresh":
        raise ValueError(
            "Invalid refresh token"
        )

    jti = payload.get("jti")

    if not jti:
        raise ValueError(
            "Invalid refresh token"
        )

    # Check whether token was revoked

    revoked_token = (
        db.query(RevokedToken)
        .filter(
            RevokedToken.jti == jti
        )
        .first()
    )

    if revoked_token:
        raise ValueError(
            "Refresh token has been revoked"
        )

    user_id = payload.get("sub")

    if not user_id:
        raise ValueError(
            "Invalid refresh token"
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise ValueError(
            "User not found"
        )

    # Create NEW access token

    new_access_token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role
    })

    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }

def logout_user(
    db: Session,
    access_token: str,
    refresh_token: str
):
    # --------------------------------
    # REVOKE ACCESS TOKEN
    # --------------------------------

    access_payload = decode_access_token(access_token)

    if not access_payload:
        raise ValueError(
            "Invalid or expired access token"
        )

    access_jti = access_payload.get("jti")
    access_exp = access_payload.get("exp")

    if not access_jti or not access_exp:
        raise ValueError(
            "Invalid access token"
        )

    # Check if access token is already revoked
    existing_access_token = (
        db.query(RevokedToken)
        .filter(
            RevokedToken.jti == access_jti
        )
        .first()
    )

    if not existing_access_token:

        revoked_access_token = RevokedToken(
            jti=access_jti,
            token_type="access",
            expires_at=datetime.fromtimestamp(
                access_exp,
                timezone.utc
            )
        )

        db.add(revoked_access_token)

    # --------------------------------
    # REVOKE REFRESH TOKEN
    # --------------------------------

    refresh_payload = decode_refresh_token(
        refresh_token
    )

    if not refresh_payload:
        raise ValueError(
            "Invalid or expired refresh token"
        )

    refresh_jti = refresh_payload.get("jti")
    refresh_exp = refresh_payload.get("exp")

    if not refresh_jti or not refresh_exp:
        raise ValueError(
            "Invalid refresh token"
        )

    # Check if refresh token is already revoked
    existing_refresh_token = (
        db.query(RevokedToken)
        .filter(
            RevokedToken.jti == refresh_jti
        )
        .first()
    )

    if not existing_refresh_token:

        revoked_refresh_token = RevokedToken(
            jti=refresh_jti,token_type="refresh",
            expires_at=datetime.fromtimestamp(
                refresh_exp,
                timezone.utc
            )
        )

        db.add(revoked_refresh_token)

    # --------------------------------
    # SAVE BOTH
    # --------------------------------

    db.commit()

    return {
        "message": "Logout successful"
    }
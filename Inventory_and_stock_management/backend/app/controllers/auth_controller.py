from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.services import auth_service
from app.services.auth_service import (
    refresh_access_token,
    register_user,
    login_user,
)


def register(
    db: Session,
    username: str,
    email: str,
    password: str,
    confirm_password: str
):
    try:
        user = register_user(
            db=db,
            username=username,
            email=email,
            password=password,
            confirm_password=confirm_password,
        )

        return user

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

def login(
    db: Session,
    email: str,
    password: str
):
    token = login_user( #stores whatever login_user() returns.
        db=db,
        email=email,
        password=password
    )

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    return token

def refresh_token(
    db: Session,
    refresh_token: str
):
    try:
        return refresh_access_token(
            db=db,
            refresh_token=refresh_token
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )




def logout(
    db: Session,
    access_token: str,
    refresh_token: str
):
    try:
        return auth_service.logout_user(
            db=db,
            access_token=access_token,
            refresh_token=refresh_token
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
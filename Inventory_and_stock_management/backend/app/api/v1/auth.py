from fastapi import (
    APIRouter,
    Depends,
    Response,
    Cookie,
    HTTPException,
    status
)

from sqlalchemy.orm import Session

from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer
)

from app.core.database import get_db

from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
    AccessTokenResponse
)

from app.controllers import auth_controller


security = HTTPBearer()


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# --------------------------------
# REGISTER
# --------------------------------

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db)
):
    return auth_controller.register(
        db=db,
        username=data.username,
        email=data.email,
        password=data.password,
        confirm_password=data.confirm_password,
    )


# --------------------------------
# LOGIN
# --------------------------------

@router.post(
    "/login",
    response_model=TokenResponse
)
def login(
    data: LoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    result = auth_controller.login(
        db=db,
        email=data.email,
        password=data.password
    )

    # Get refresh token from service result
    refresh_token = result["refresh_token"]

    # Store refresh token in HttpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,       # True in production with HTTPS
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
        path="/api/v1/auth"
    )

    # Do not send refresh token in JSON response
    result.pop("refresh_token")

    return result


# --------------------------------
# LOGOUT
# --------------------------------

@router.post("/logout")
def logout(
    response: Response,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    refresh_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db)
):
    # Get access token from Authorization header
    access_token = credentials.credentials

    # Check refresh token cookie
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found"
        )

    result = auth_controller.logout(
        db=db,
        access_token=access_token,
        refresh_token=refresh_token
    )

    # Delete refresh token cookie
    response.delete_cookie(
        key="refresh_token",
        path="/api/v1/auth"
    )

    return result


# --------------------------------
# REFRESH
# --------------------------------

@router.post(
    "/refresh",
    response_model=AccessTokenResponse
)
def refresh(
    refresh_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db)
):
    # Get refresh token from cookie
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found"
        )

    return auth_controller.refresh_token(
        db=db,
        refresh_token=refresh_token
    )
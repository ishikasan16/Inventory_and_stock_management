from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
import uuid

from app.core.database import get_db
from app.core.dependencies import (
    require_manager,
    require_super_admin,
)
from app.models.user import User

from app.schemas.auth import UserResponse
from app.schemas.user import RoleUpdateRequest, UserListResponse
from app.utils.constraints import (
    DEFAULT_PAGE,
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
)

from app.services import user_service

from app.utils.exceptions import (
    BadRequestException,
    ForbiddenException,
    NotFoundException,
)

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get(
    "/",
    response_model=UserListResponse
)
def get_users(
    page: int = Query(DEFAULT_PAGE, ge=1, description="Page number"),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    return user_service.get_users(
        db=db,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/team",
    response_model=UserListResponse
)
def get_team(
    page: int = Query(DEFAULT_PAGE, ge=1, description="Page number"),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    try:
        return user_service.get_team(
            db=db,
            manager=current_user,
            page=page,
            page_size=page_size,
        )

    except ForbiddenException as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=e.message
        )


@router.patch(
    "/{user_id}/role",
    response_model=UserResponse
)
def update_role(
    user_id: uuid.UUID,
    data: RoleUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    try:
        return user_service.update_role(
            db=db,
            user_id=user_id,
            new_role=data.role
        )

    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message
        )

    except BadRequestException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )
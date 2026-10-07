from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    ensure_create_access,
    ensure_record_access,
    get_covered_target_ids,
    get_current_user,
)
from app.models.user import User

from app.schemas.category import (
    CategoryCreate,
    CategoryListResponse,
    CategoryResponse,
    CategoryUpdate,
)
from app.utils.constraints import (
    DEFAULT_PAGE,
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
)
from app.schemas.task import TargetType

from app.controllers import category_controller
import uuid

router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)

CATEGORY_TYPE = TargetType.CATEGORY.value


@router.post(
    "/",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED
)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ensure_create_access(
        db, current_user, CATEGORY_TYPE
    )

    return category_controller.create_category(
        db=db,
        data=data
    )


@router.get(
    "/",
    response_model=CategoryListResponse
)
def get_categories(
    page: int = Query(DEFAULT_PAGE, ge=1, description="Page number"),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    covered_ids = get_covered_target_ids(
        db, current_user, CATEGORY_TYPE
    )

    return category_controller.get_categories(
        db=db,
        covered_ids=covered_ids,
        page=page,
        page_size=page_size
    )


@router.get(
    "/{category_id}",
    response_model=CategoryResponse
)
def get_category(
    category_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return category_controller.get_category(
        db=db,
        category_id=category_id
    )


@router.put(
    "/{category_id}",
    response_model=CategoryResponse
)
def update_category(
    category_id: uuid.UUID,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ensure_record_access(
        db, current_user, CATEGORY_TYPE, category_id
    )

    return category_controller.update_category(
        db=db,
        category_id=category_id,
        data=data
    )


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_category(
    category_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ensure_record_access(
        db, current_user, CATEGORY_TYPE, category_id
    )

    category_controller.delete_category(
        db=db,
        category_id=category_id
    )
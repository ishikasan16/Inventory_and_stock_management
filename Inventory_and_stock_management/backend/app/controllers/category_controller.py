from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.schemas.category import (
    CategoryCreate,
    CategoryUpdate,
)

from app.services import category_service

from app.utils.constraints import DEFAULT_PAGE, DEFAULT_PAGE_SIZE
from app.utils.exceptions import (
    ConflictException,
    NotFoundException,
)
import uuid

def create_category(
    db: Session,
    data: CategoryCreate
):
    try:
        return category_service.create_category(
            db,
            data
        )

    except ConflictException as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=e.message
        )


def get_categories(
    db: Session,
    covered_ids: list | None = None,
    page: int = DEFAULT_PAGE,
    page_size: int = DEFAULT_PAGE_SIZE,
):
    return category_service.get_categories(
        db,
        covered_ids=covered_ids,
        page=page,
        page_size=page_size,
    )



def get_category(
    db: Session,
    category_id: uuid.UUID
):
    try:
        return category_service.get_category(
            db,
            category_id
        )

    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message
        )


def update_category(
    db: Session,
    category_id: uuid.UUID,
    data: CategoryUpdate
):
    try:
        return category_service.update_category(
            db,
            category_id,
            data
        )

    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message
        )

    except ConflictException as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=e.message
        )


def delete_category(
    db: Session,
    category_id: uuid.UUID
):
    try:
        category_service.delete_category(
            db,
            category_id
        )

    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message
        )

    except ConflictException as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=e.message
        )
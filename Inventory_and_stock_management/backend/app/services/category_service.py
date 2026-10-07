from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.category import Category
from app.schemas.category import (
    CategoryCreate,
    CategoryUpdate,)
from app.utils.constraints import DEFAULT_PAGE, DEFAULT_PAGE_SIZE
from app.utils.exceptions import (
    ConflictException,
    NotFoundException,)

import uuid
def create_category(
    db: Session,
    data: CategoryCreate):
    existing = db.scalar(
        select(Category).where(
            Category.name == data.name))

    if existing:
        raise ConflictException(
            "Category with this name already exists" )

    category = Category(
        name=data.name,
        description=data.description)

    db.add(category)
    db.commit()
    db.refresh(category)

    return category

def get_categories(
    db: Session,
    covered_ids: list | None = None,
    page: int = DEFAULT_PAGE,
    page_size: int = DEFAULT_PAGE_SIZE,
):
    query = (
        db.query(Category)
        .filter(Category.is_deleted.is_(False))
    )

    if covered_ids is not None:
        query = query.filter(
            Category.id.in_(covered_ids))

    total = query.count()
    offset = (page - 1) * page_size
    items = query.order_by(Category.name.asc()).offset(offset).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def get_category(
    db: Session,
    category_id: uuid.UUID
):
    category = (
        db.query(Category)
        .filter(
            Category.id == category_id,
            Category.is_deleted.is_(False)
        )
        .first()
    )

    if not category:
        raise NotFoundException(
            "Category not found"
        )

    return category


def update_category(
    db: Session,
    category_id: uuid.UUID,
    data: CategoryUpdate):
    category = db.get(
        Category,
        category_id)

    if not category:
        raise NotFoundException(
            "Category not found")

    if data.name is not None:
        existing = db.scalar(
            select(Category).where(
                Category.name == data.name,
                Category.id != category_id ))

        if existing:
            raise ConflictException(
                "Category with this name already exists")

        category.name = data.name

    if data.description is not None:
        category.description = data.description

    db.commit()
    db.refresh(category)

    return category


def delete_category(
    db: Session,
    category_id: uuid.UUID):
    category = db.get(
        Category,
        category_id)

    if not category:
        raise NotFoundException(
            "Category not found")

    category.is_deleted = True

    db.commit()
    db.refresh(category)

    return category
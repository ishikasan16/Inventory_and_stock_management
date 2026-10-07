from sqlalchemy import func, select, or_, and_
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.auth import UserRole

from app.utils.constraints import DEFAULT_PAGE, DEFAULT_PAGE_SIZE
from app.utils.exceptions import (
    BadRequestException,
    ForbiddenException,
    NotFoundException,
)


def get_users(
    db: Session,
    page: int = DEFAULT_PAGE,
    page_size: int = DEFAULT_PAGE_SIZE,
):
    query = db.query(User)
    total = query.count()
    offset = (page - 1) * page_size
    items = query.order_by(User.username).offset(offset).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def get_team(
    db: Session,
    manager: User,
    page: int = DEFAULT_PAGE,
    page_size: int = DEFAULT_PAGE_SIZE,
):
    """
    Return staff members who are directly assigned to this manager,
    or available unassigned staff eligible for this manager's department.
    """
    if manager.role == UserRole.SUPER_ADMIN.value:
        query = db.query(User).filter(User.role != UserRole.SUPER_ADMIN.value)
    elif manager.role in {
        UserRole.INVENTORY_MANAGER.value,
        UserRole.ORDER_MANAGER.value,
    }:
        staff_role = (
            UserRole.INVENTORY_STAFF.value
            if manager.role == UserRole.INVENTORY_MANAGER.value
            else UserRole.ORDER_STAFF.value
        )
        query = db.query(User).filter(
            or_(
                User.manager_id == manager.id,
                and_(User.role == staff_role, User.manager_id.is_(None))
            )
        )
    else:
        raise ForbiddenException(
            "No team for this role"
        )

    total = query.count()
    offset = (page - 1) * page_size
    items = query.order_by(User.username).offset(offset).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }



def update_role(
    db: Session,
    user_id,
    new_role: UserRole
):
    user = db.get(User, user_id)

    if not user:
        raise NotFoundException(
            "User not found"
        )

    # --------------------------------
    # Protect against losing the last
    # SUPER_ADMIN
    # --------------------------------

    if (
        user.role == UserRole.SUPER_ADMIN.value
        and new_role.value != UserRole.SUPER_ADMIN.value
    ):
        super_admin_count = db.scalar(
            select(func.count()).select_from(
                User
            ).where(
                User.role == UserRole.SUPER_ADMIN.value
            )
        )

        if super_admin_count <= 1:
            raise BadRequestException(
                "Cannot demote the last SUPER_ADMIN"
            )

    # --------------------------------
    # UPDATE ROLE
    # --------------------------------

    user.role = new_role.value

    # --------------------------------
    # CLEAR MANAGER WHEN USER IS NOT
    # A STAFF MEMBER
    # --------------------------------

    if new_role in {
        UserRole.SUPER_ADMIN,
        UserRole.INVENTORY_MANAGER,
        UserRole.ORDER_MANAGER,
    }:
        user.manager_id = None

    db.commit()
    db.refresh(user)

    return user
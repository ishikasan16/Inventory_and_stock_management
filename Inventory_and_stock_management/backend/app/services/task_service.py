from datetime import datetime, timezone
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.task import Task
from app.models.user import User
from app.models.product import Product
from app.models.category import Category
from app.models.supplier import Supplier
from app.models.customer import Customer
from app.models.order import Order

from app.schemas.auth import UserRole
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TargetType,
)

from app.utils.constraints import DEFAULT_PAGE, DEFAULT_PAGE_SIZE
from app.utils.exceptions import (
    BadRequestException,
    ForbiddenException,
    NotFoundException,
)


# ============================================================
# ROLE CONFIGURATION
# ============================================================

MANAGER_ROLES = {
    UserRole.INVENTORY_MANAGER.value,
    UserRole.ORDER_MANAGER.value,
}


TASK_CREATORS = {
    UserRole.SUPER_ADMIN.value,
    UserRole.INVENTORY_MANAGER.value,
    UserRole.ORDER_MANAGER.value,
}


# A manager can assign tasks only to the corresponding staff role.
TEAM_MAP = {
    UserRole.INVENTORY_MANAGER.value:
        UserRole.INVENTORY_STAFF.value,

    UserRole.ORDER_MANAGER.value:
        UserRole.ORDER_STAFF.value,
}


# ============================================================
# TARGET MODELS
# ============================================================

TARGET_MODEL = {
    TargetType.PRODUCT.value: Product,
    TargetType.CATEGORY.value: Category,
    TargetType.SUPPLIER.value: Supplier,
    TargetType.CUSTOMER.value: Customer,
    TargetType.ORDER.value: Order,
}

MANAGER_ALLOWED_TARGETS = {
    UserRole.INVENTORY_MANAGER.value: {
        TargetType.NONE.value,
        TargetType.PRODUCT.value,
        TargetType.CATEGORY.value,
        TargetType.SUPPLIER.value,
    },
    UserRole.ORDER_MANAGER.value: {
        TargetType.NONE.value,
        TargetType.CUSTOMER.value,
        TargetType.ORDER.value,
    },
}


# ============================================================
# TARGET HELPERS
# ============================================================

def _normalize_target(
    target_type,
    target_id
):
    if isinstance(target_type, TargetType):
        target_type = target_type.value

    normalized_type = (
        target_type or TargetType.NONE.value
    )

    if normalized_type == TargetType.NONE.value:

        if target_id is not None:
            raise BadRequestException(
                "target_id must be null "
                "when target_type is NONE"
            )

        return normalized_type, None

    # target_type is provided.
    # target_id can be None because a task can apply
    # to an entire type, for example:
    # "Create a new product."

    return normalized_type, target_id


def _get_task(
    db: Session,
    task_id
):
    task = db.get(Task, task_id)

    if not task:
        raise NotFoundException(
            "Task not found"
        )

    return task


# ============================================================
# TASK PERMISSION HELPERS
# ============================================================

def _can_view(
    user: User,
    task: Task
) -> bool:

    # SUPER_ADMIN can view every task.
    if user.role == UserRole.SUPER_ADMIN.value:
        return True

    # Managers can view tasks they created.
    if user.role in MANAGER_ROLES:
        if task.assigned_by_id == user.id:
            return True

    # Staff can view tasks assigned to them.
    if task.assigned_to_id == user.id:
        return True

    return False


def _can_manage(
    user: User,
    task: Task
) -> bool:

    # SUPER_ADMIN can manage every task.
    if user.role == UserRole.SUPER_ADMIN.value:
        return True

    # Managers can manage tasks they created.
    if user.role in MANAGER_ROLES:
        if task.assigned_by_id == user.id:
            return True

    return False


# ============================================================
# ASSIGNEE VALIDATION
# ============================================================

def _validate_assignee(
    db: Session,
    assigner: User,
    assignee_id
):
    assignee = db.get(User, assignee_id)

    if not assignee:
        raise NotFoundException(
            "Assigned user not found"
        )

    # --------------------------------------------------------
    # SUPER_ADMIN
    # --------------------------------------------------------

    if assigner.role == UserRole.SUPER_ADMIN.value:

        # SUPER_ADMIN can assign to any manager or staff.
        if assignee.role not in {
            UserRole.INVENTORY_MANAGER.value,
            UserRole.INVENTORY_STAFF.value,
            UserRole.ORDER_MANAGER.value,
            UserRole.ORDER_STAFF.value,
        }:
            raise ForbiddenException(
                "SUPER_ADMIN can assign tasks only "
                "to managers or staff"
            )

        return assignee

    # --------------------------------------------------------
    # MANAGERS
    # --------------------------------------------------------

    allowed_role = TEAM_MAP.get(assigner.role)

    if allowed_role is None:
        raise ForbiddenException(
            "Only managers or the super admin "
            "can assign tasks"
        )

    # Manager can only assign to their staff type.
    if assignee.role != allowed_role:
        raise ForbiddenException(
            f"{assigner.role} can only assign tasks "
            f"to {allowed_role} users"
        )

    # --------------------------------------------------------
    # MANAGER RELATIONSHIP
    # --------------------------------------------------------

    # If the staff member already belongs to another manager,
    # don't allow a different manager to take over the staff
    # member through task assignment.
    if (
        assignee.manager_id is not None
        and assignee.manager_id != assigner.id
    ):
        raise ForbiddenException(
            "This staff member is already assigned "
            "to another manager"
        )

    return assignee


# ============================================================
# TARGET VALIDATION
# ============================================================

def _validate_target_exists(
    db: Session,
    normalized_type,
    normalized_id
):
    if normalized_type == TargetType.NONE.value:
        return

    model = TARGET_MODEL.get(normalized_type)

    if model is None:
        raise BadRequestException(
            f"Unsupported target type: {normalized_type}"
        )

    if normalized_id and not db.get(
        model,
        normalized_id
    ):
        raise NotFoundException(
            f"{normalized_type} not found"
        )


# ============================================================
# CREATE TASK
# ============================================================

def create_task(
    db: Session,
    current_user: User,
    data: TaskCreate
):
    if current_user.role not in TASK_CREATORS:
        raise ForbiddenException(
            "Only managers or the super admin "
            "can create tasks"
        )

    if data.due_date is not None:
        now = datetime.now(timezone.utc)
        due_utc = data.due_date if data.due_date.tzinfo else data.due_date.replace(tzinfo=timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        if due_utc < today_start:
            raise BadRequestException("Task due_date cannot be before today")

    assignee = _validate_assignee(
        db,
        current_user,
        data.assigned_to_id
    )

    normalized_type, normalized_id = (
        _normalize_target(
            data.target_type,
            data.target_id
        )
    )

    if current_user.role in MANAGER_ALLOWED_TARGETS:
        if normalized_type not in MANAGER_ALLOWED_TARGETS[current_user.role]:
            raise ForbiddenException(
                f"{current_user.role} cannot assign tasks with target type {normalized_type}"
            )

    _validate_target_exists(
        db,
        normalized_type,
        normalized_id
    )

    # --------------------------------------------------------
    # Assign manager to staff member
    # --------------------------------------------------------

    if current_user.role in MANAGER_ROLES:

        if assignee.manager_id is None:
            assignee.manager_id = current_user.id

    task = Task(
        title=data.title,
        description=data.description,
        priority=data.priority.value,
        status="PENDING",
        due_date=data.due_date,
        assigned_to_id=assignee.id,
        assigned_by_id=current_user.id,
        target_type=normalized_type,
        target_id=normalized_id,
    )

    db.add(task)

    db.commit()
    db.refresh(task)

    return task


# ============================================================
# LIST TASKS
# ============================================================

def list_tasks(
    db: Session,
    current_user: User,
    page: int = DEFAULT_PAGE,
    page_size: int = DEFAULT_PAGE_SIZE,
):
    # SUPER_ADMIN sees all tasks.
    if current_user.role == UserRole.SUPER_ADMIN.value:
        query = db.query(Task)
    # Managers see tasks they created or assigned to them.
    elif current_user.role in MANAGER_ROLES:
        query = db.query(Task).filter(
            or_(
                Task.assigned_by_id == current_user.id,
                Task.assigned_to_id == current_user.id,
            )
        )
    else:
        raise ForbiddenException("Access denied")

    total = query.count()
    offset = (page - 1) * page_size
    items = query.order_by(Task.created_at.desc()).offset(offset).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


# ============================================================
# MY TASKS
# ============================================================

def my_tasks(
    db: Session,
    current_user: User,
    page: int = DEFAULT_PAGE,
    page_size: int = DEFAULT_PAGE_SIZE,
):
    query = db.query(Task).filter(
        Task.assigned_to_id == current_user.id
    )
    total = query.count()
    offset = (page - 1) * page_size
    items = query.order_by(Task.created_at.desc()).offset(offset).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


# ============================================================
# GET TASK
# ============================================================

def get_task(
    db: Session,
    current_user: User,
    task_id
):
    task = _get_task(
        db,
        task_id
    )

    if not _can_view(
        current_user,
        task
    ):
        raise ForbiddenException(
            "Access denied"
        )

    return task


# ============================================================
# UPDATE TASK STATUS
# ============================================================

def update_task_status(
    db: Session,
    current_user: User,
    task_id,
    status
):
    task = _get_task(
        db,
        task_id
    )

    if not _can_view(
        current_user,
        task
    ):
        raise ForbiddenException(
            "Access denied"
        )

    task.status = status

    db.commit()
    db.refresh(task)

    return task


# ============================================================
# UPDATE TASK
# ============================================================

def update_task(
    db: Session,
    current_user: User,
    task_id,
    data: TaskUpdate
):
    task = _get_task(
        db,
        task_id
    )

    if not _can_manage(
        current_user,
        task
    ):
        raise ForbiddenException(
            "Access denied"
        )

    if data.due_date is not None:
        now = datetime.now(timezone.utc)
        due_utc = data.due_date if data.due_date.tzinfo else data.due_date.replace(tzinfo=timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        if due_utc < today_start:
            raise BadRequestException("Task due_date cannot be before today")

    update_data = data.model_dump(
        exclude_unset=True
    )

    # --------------------------------------------------------
    # Change assignee
    # --------------------------------------------------------

    if "assigned_to_id" in update_data:

        assignee = _validate_assignee(
            db,
            current_user,
            update_data["assigned_to_id"]
        )

        update_data["assigned_to_id"] = assignee.id

        # If a manager assigns a staff member and the staff
        # member does not yet have a manager, establish it.
        if (
            current_user.role in MANAGER_ROLES
            and assignee.manager_id is None
        ):
            assignee.manager_id = current_user.id

    # --------------------------------------------------------
    # Update target
    # --------------------------------------------------------

    if (
        "target_type" in update_data
        or "target_id" in update_data
    ):

        new_target_type = update_data.get(
            "target_type",
            task.target_type
        )

        new_target_id = update_data.get(
            "target_id",
            task.target_id
        )

        normalized_type, normalized_id = (
            _normalize_target(
                new_target_type,
                new_target_id
            )
        )

        if current_user.role in MANAGER_ALLOWED_TARGETS:
            if normalized_type not in MANAGER_ALLOWED_TARGETS[current_user.role]:
                raise ForbiddenException(
                    f"{current_user.role} cannot assign tasks with target type {normalized_type}"
                )

        _validate_target_exists(
            db,
            normalized_type,
            normalized_id
        )

        update_data["target_type"] = normalized_type
        update_data["target_id"] = normalized_id

    # --------------------------------------------------------
    # Apply updates
    # --------------------------------------------------------

    for field, value in update_data.items():

        if field in (
            "priority",
            "status"
        ):
            value = value.value

        setattr(
            task,
            field,
            value
        )

    db.commit()
    db.refresh(task)

    return task


# ============================================================
# DELETE TASK
# ============================================================

def delete_task(
    db: Session,
    current_user: User,
    task_id
):
    task = _get_task(
        db,
        task_id
    )

    if not _can_manage(
        current_user,
        task
    ):
        raise ForbiddenException(
            "Access denied"
        )

    db.delete(task)

    db.commit()
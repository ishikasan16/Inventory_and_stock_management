from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import uuid

from app.core.database import get_db
from app.core.security import decode_access_token

from app.models.user import User
from app.models.revoked_token import RevokedToken
from app.models.task import Task

from app.schemas.auth import UserRole


# ============================================================
# ROLES
# ============================================================

SUPER_ADMIN = UserRole.SUPER_ADMIN.value

INVENTORY_MANAGER = UserRole.INVENTORY_MANAGER.value
INVENTORY_STAFF = UserRole.INVENTORY_STAFF.value

ORDER_MANAGER = UserRole.ORDER_MANAGER.value
ORDER_STAFF = UserRole.ORDER_STAFF.value


# ============================================================
# ROLE GROUPS
# ============================================================

MANAGER_ROLES = {
    INVENTORY_MANAGER,
    ORDER_MANAGER,
}

UNRESTRICTED_ROLES = {
    SUPER_ADMIN,
    INVENTORY_MANAGER,
    ORDER_MANAGER,
}

WORKER_ROLES = {
    INVENTORY_STAFF,
    ORDER_STAFF,
}


# ============================================================
# SECURITY
# ============================================================

security = HTTPBearer()


# ============================================================
# GET CURRENT USER
# ============================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials

    payload = decode_access_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
        )

    jti = payload.get("jti")

    if not jti:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    # Check whether the access token has been revoked.
    revoked_token = (
        db.query(RevokedToken)
        .filter(
            RevokedToken.jti == jti
        )
        .first()
    )

    if revoked_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    # Convert token user ID into UUID.
    try:
        user_uuid = uuid.UUID(user_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token",
        )

    user = (
        db.query(User)
        .filter(
            User.id == user_uuid
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


# ============================================================
# ROLE DEPENDENCIES
# ============================================================

def require_super_admin(
    current_user: User = Depends(get_current_user),
):
    if current_user.role != SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required",
        )

    return current_user


def require_manager(
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in MANAGER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager access required",
        )

    return current_user


def require_super_admin_or_manager(
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in UNRESTRICTED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    return current_user


# ============================================================
# ROLE CHECK HELPERS
# ============================================================

def has_unrestricted_access(
    user: User,
) -> bool:
    return user.role in UNRESTRICTED_ROLES


def is_worker(
    user: User,
) -> bool:
    return user.role in WORKER_ROLES


# ============================================================
# ACTIVE TASK QUERY
# ============================================================

def _active_assigned_tasks(
    db: Session,
    user: User,
    target_type: str,
):
    return (
        db.query(Task)
        .filter(
            Task.assigned_to_id == user.id,
            Task.status != "COMPLETED",
            Task.target_type == target_type,
        )
    )


# ============================================================
# RECORD ACCESS
# ============================================================

def ensure_record_access(
    db: Session,
    user: User,
    target_type: str,
    target_id,
):
    """
    Check whether a user can access a specific record.

    SUPER_ADMIN and managers have unrestricted access.

    Staff must have an active task referencing
    the specific record.
    """

    if has_unrestricted_access(user):
        return

    task = (
        _active_assigned_tasks(
            db=db,
            user=user,
            target_type=target_type,
        )
        .filter(
            Task.target_id == target_id
        )
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "No active task assigned to you "
                "references this record"
            ),
        )


# ============================================================
# CREATE ACCESS
# ============================================================

def ensure_create_access(
    db: Session,
    user: User,
    target_type: str,
):
    

    if has_unrestricted_access(user):
        return

    task = (
        _active_assigned_tasks(
            db=db,
            user=user,
            target_type=target_type,
        )
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "No active task of the required "
                "type assigned to you"
            ),
        )


# ============================================================
# LIST / READ ACCESS
# ============================================================

def get_covered_target_ids(
    db: Session,
    user: User,
    target_type: str,
):
    """
    Read access is currently unrestricted.

    All authenticated users can view records in
    list and summary endpoints.

    Write access is checked separately through:

        ensure_record_access()
        ensure_create_access()

    Therefore this function returns None.
    """

    return None
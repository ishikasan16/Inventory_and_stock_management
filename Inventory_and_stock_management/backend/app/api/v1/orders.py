import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    ensure_create_access,
    get_current_user,
)
from app.models.user import User
from app.controllers import order_controller
from app.schemas.order import (
    OrderCreate,
    OrderListResponse,
    OrderResponse,
    OrderStatusUpdate,
)
from app.schemas.task import TargetType
from app.utils.constraints import (
    DEFAULT_PAGE,
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
)

router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)

ORDER_TYPE = TargetType.ORDER.value


@router.post(
    "/",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED
)
def create_order(
    data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_create_access(
        db, current_user, ORDER_TYPE
    )

    return order_controller.create_order(
        db=db,
        data=data,
        current_user=current_user
    )



@router.get(
    "/",
    response_model=OrderListResponse
)
def get_orders(
    page: int = Query(DEFAULT_PAGE, ge=1, description="Page number"),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return order_controller.list_orders(
        db=db,
        page=page,
        page_size=page_size,
    )



@router.get(
    "/{order_id}",
    response_model=OrderResponse
)
def get_order(
    order_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return order_controller.get_order(
        db=db,
        order_id=order_id
    )


@router.patch(
    "/{order_id}/status",
    response_model=OrderResponse
)
def update_order_status(
    order_id: uuid.UUID,
    data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return order_controller.update_order_status(
        db=db,
        order_id=order_id,
        status=data.status,
        actual_delivery_date=data.actual_delivery_date
    )
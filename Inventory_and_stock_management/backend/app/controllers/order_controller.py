import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.order import OrderCreate, OrderStatus
from app.services import order_service
from app.utils.constraints import DEFAULT_PAGE, DEFAULT_PAGE_SIZE


def create_order(
    db: Session,
    data: OrderCreate,
    current_user: User | None = None
):
    return order_service.create_order(
        db=db,
        data=data,
        current_user=current_user
    )



def get_order(
    db: Session,
    order_id: uuid.UUID
):
    return order_service.get_order(
        db=db,
        order_id=order_id
    )


def list_orders(
    db: Session,
    page: int = DEFAULT_PAGE,
    page_size: int = DEFAULT_PAGE_SIZE,
):
    return order_service.list_orders(
        db=db,
        page=page,
        page_size=page_size,
    )



def update_order_status(
    db: Session,
    order_id: uuid.UUID,
    status: OrderStatus,
    actual_delivery_date: datetime | None = None
):
    return order_service.update_order_status(
        db=db,
        order_id=order_id,
        new_status=status,
        actual_delivery_date=actual_delivery_date
    )
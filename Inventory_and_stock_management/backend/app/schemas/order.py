import uuid
from datetime import datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class OrderStatus(str, Enum):
    ORDER_PLACED = "ORDER_PLACED"
    CONFIRMED = "CONFIRMED"
    PROCESSING = "PROCESSING"
    AWAITING_STOCK = "AWAITING_STOCK"
    SUPPLIER_ORDER_PLACED = "SUPPLIER_ORDER_PLACED"
    STOCK_RECEIVED = "STOCK_RECEIVED"
    PACKED = "PACKED"
    SHIPPED = "SHIPPED"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class OrderItemCreate(BaseModel):
    product_id: uuid.UUID

    quantity: int = Field(
        ...,
        gt=0
    )


class OrderCreate(BaseModel):
    customer_id: uuid.UUID

    items: list[OrderItemCreate] = Field(
        ...,
        min_length=1
    )


class OrderItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    unit_price: Decimal
    subtotal: Decimal

    model_config = ConfigDict(
        from_attributes=True
    )


class OrderResponse(BaseModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    order_date: datetime
    status: OrderStatus
    total_amount: Decimal
    predicted_delivery_date: datetime | None
    actual_delivery_date: datetime | None
    items: list[OrderItemResponse]

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    actual_delivery_date: datetime | None = None


class OrderListResponse(BaseModel):
    items: list[OrderResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
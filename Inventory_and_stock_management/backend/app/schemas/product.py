from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, ConfigDict
import uuid

StockStatus = Literal[
    "in stock",
    "low stock",
    "out of stock"
]


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

    sku: str = Field(
        ...,
        min_length=1,
        max_length=30)

    category_id: uuid.UUID
    supplier_id: uuid.UUID

    quantity_in_stock: int = Field(
        default=0,
        ge=0)

    reorder_level: int = Field(
        default=10,
        ge=0)
    unit_price: Decimal = Field(
        ...,
        gt=0
    )


class ProductUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100)

    sku: str | None = Field(
        default=None,
        min_length=1,
        max_length=30)

    category_id: uuid.UUID | None = None

    supplier_id: uuid.UUID | None = None

    unit_price: Decimal | None = Field(
        default=None,
        gt=0)

    quantity_in_stock: int | None = Field(
        default=None,
        ge=0)

    reorder_level: int | None = Field(
        default=None,
        ge=0)


class StockAdjustment(BaseModel):
    quantity: int = Field(..., gt=0)
    operation: Literal["IN", "OUT"]
    reason: str = Field(..., min_length=1, max_length=255)

class ProductResponse(BaseModel):
    id: uuid.UUID
    name: str
    sku: str

    category_id: uuid.UUID
    supplier_id: uuid.UUID

    unit_price: Decimal
    quantity_in_stock: int
    reorder_level: int

    is_active: bool
    created_at: datetime
    updated_at: datetime

    stock_status: StockStatus

    model_config = ConfigDict(
        from_attributes=True)


class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    page: int
    page_size: int
    total: int
    total_pages: int


class ProductSummaryResponse(BaseModel):
    total_products: int
    total_stock_value: Decimal
    low_stock_count: int
    out_of_stock_count: int

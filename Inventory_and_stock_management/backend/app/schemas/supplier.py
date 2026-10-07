from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, ConfigDict
import uuid


class SupplierCreate(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=100
    )

    contact_email: EmailStr

    phone: str | None = Field(
        default=None,
        pattern=r"^\d{10}$",
        description="Phone number must contain exactly 10 digits"

    )

    address: str | None = Field(
        default=None,
        max_length=255
    )

   

class SupplierUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100
    )

    contact_email: EmailStr | None = None

    phone: str | None = Field(
        default=None,
        pattern=r"^\d{10}$",
        description="Phone number must contain exactly 10 digits"

    )

    address: str | None = Field(
        default=None,
        max_length=255
    )


class SupplierResponse(BaseModel):
    id: uuid.UUID
    name: str
    contact_email: EmailStr
    phone: str | None
    address: str | None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class SupplierListResponse(BaseModel):
    items: list[SupplierResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CustomerCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=20)
    address: str | None = Field(default=None, max_length=500)
    residential_address: str | None = Field(default=None, max_length=500, description="Where the customer lives")
    delivery_address: str | None = Field(default=None, max_length=500, description="Where the customer wants packages delivered")


class CustomerUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=20)
    address: str | None = Field(default=None, max_length=500)
    residential_address: str | None = Field(default=None, max_length=500)
    delivery_address: str | None = Field(default=None, max_length=500)


class CustomerResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: EmailStr
    phone: str | None = None
    address: str | None = None
    residential_address: str | None = None
    delivery_address: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CustomerListResponse(BaseModel):
    items: list[CustomerResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict
import uuid

class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    description: str | None = Field(
        default=None,
        max_length=255)


class CategoryUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=50)

    description: str | None = Field(
        default=None,
        max_length=255)


class CategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True)


class CategoryListResponse(BaseModel):
    items: list[CategoryResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
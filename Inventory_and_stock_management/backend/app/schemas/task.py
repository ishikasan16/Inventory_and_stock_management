from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
import uuid


class TaskPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class TaskStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class TargetType(str, Enum):
    PRODUCT = "PRODUCT"
    CATEGORY = "CATEGORY"
    SUPPLIER = "SUPPLIER"
    CUSTOMER = "CUSTOMER"
    ORDER = "ORDER"
    NONE = "NONE"


def normalize_target(
    target_type: TargetType | None,
    target_id: uuid.UUID | None
) -> tuple[TargetType, uuid.UUID | None]:
    normalized_type = target_type or TargetType.NONE

    if normalized_type == TargetType.NONE:
        if target_id is not None:
            raise ValueError(
                "target_id must be null when target_type is NONE"
            )

        return normalized_type, None

    # target_type is set; target_id is optional (a type-level
    # task without a specific record is allowed so it can
    # authorize creating new records of that type).

    return normalized_type, target_id


class TaskCreate(BaseModel):
    title: str = Field(
        ...,
        min_length=1,
        max_length=150)

    description: str | None = Field(
        default=None,
        max_length=500)

    priority: TaskPriority = TaskPriority.MEDIUM

    due_date: datetime | None = None

    assigned_to_id: uuid.UUID

    target_type: TargetType | None = None

    target_id: uuid.UUID | None = None

    @field_validator("due_date")
    @classmethod
    def validate_due_date_future(cls, v: datetime | None) -> datetime | None:
        if v is not None:
            now = datetime.now(timezone.utc)
            v_utc = v if v.tzinfo else v.replace(tzinfo=timezone.utc)
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            if v_utc < today_start:
                raise ValueError("Task due_date cannot be before today")
        return v

    @model_validator(mode="after")
    def validate_target(self):
        _, _ = normalize_target(
            self.target_type,
            self.target_id
        )

        return self


class TaskUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=150)

    description: str | None = Field(
        default=None,
        max_length=500)

    priority: TaskPriority | None = None

    status: TaskStatus | None = None

    due_date: datetime | None = None

    assigned_to_id: uuid.UUID | None = None

    target_type: TargetType | None = None

    target_id: uuid.UUID | None = None

    @field_validator("due_date")
    @classmethod
    def validate_due_date_future(cls, v: datetime | None) -> datetime | None:
        if v is not None:
            now = datetime.now(timezone.utc)
            v_utc = v if v.tzinfo else v.replace(tzinfo=timezone.utc)
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            if v_utc < today_start:
                raise ValueError("Task due_date cannot be before today")
        return v


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class TaskResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None
    priority: TaskPriority
    status: TaskStatus
    due_date: datetime | None
    assigned_to_id: uuid.UUID
    assigned_by_id: uuid.UUID
    target_type: TargetType | None
    target_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True)


class TaskListResponse(BaseModel):
    items: list[TaskResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
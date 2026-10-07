from pydantic import BaseModel

from app.schemas.auth import UserResponse, UserRole


class RoleUpdateRequest(BaseModel):
    role: UserRole


class UserListResponse(BaseModel):
    items: list[UserResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
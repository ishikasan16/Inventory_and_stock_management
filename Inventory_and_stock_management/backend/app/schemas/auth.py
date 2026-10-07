from pydantic import BaseModel, EmailStr, ConfigDict, Field
from enum import Enum
import uuid


class UserRole(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    INVENTORY_MANAGER = "INVENTORY_MANAGER"
    ORDER_MANAGER = "ORDER_MANAGER"
    INVENTORY_STAFF = "INVENTORY_STAFF"
    ORDER_STAFF = "ORDER_STAFF"



class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    confirm_password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: UserRole
    username: str


class UserResponse(BaseModel):
    id: uuid.UUID
    username: str
    email: EmailStr
    role: UserRole

    model_config = ConfigDict(from_attributes=True)


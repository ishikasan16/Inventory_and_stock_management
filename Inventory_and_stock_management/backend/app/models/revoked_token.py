import uuid

from sqlalchemy import Column, DateTime, String
from app.core.database import Base


class RevokedToken(Base):
    __tablename__ = "revoked_tokens"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    jti = Column(
        String(36),
        unique=True,
        nullable=False
    )
    token_type = Column(
        String(20),
        nullable=False
    )
    expires_at = Column(
        DateTime(timezone=True),
        nullable=False
    )
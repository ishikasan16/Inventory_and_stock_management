from datetime import datetime,timezone
import uuid
from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,UUID
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    sku: Mapped[str] = mapped_column(
        String(30),
        unique=True,
        nullable=False
    )

    category_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True),
        ForeignKey("categories.id"),
        nullable=False
    )

    supplier_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("suppliers.id"),
        nullable=False
    )

    unit_price: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )

    quantity_in_stock: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    reorder_level: Mapped[int] = mapped_column(
        Integer,
        default=10,
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    category = relationship(
        "Category",
        back_populates="products"
    )

    supplier = relationship(
        "Supplier",
        back_populates="products"
    )
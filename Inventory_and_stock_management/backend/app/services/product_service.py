from decimal import Decimal

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.product import Product
from app.models.supplier import Supplier

from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    StockAdjustment,
)

from app.utils.exceptions import (
    BadRequestException,
    ConflictException,
    NotFoundException,
)


def calculate_stock_status(
    quantity: int,
    reorder_level: int):
    if quantity == 0:
        return "out of stock"

    if quantity <= reorder_level:
        return "low stock"

    return "in stock"


def create_product(
    db: Session,
    data: ProductCreate):
    category = db.get(
        Category,
        data.category_id)

    if not category:
        raise NotFoundException(
            "Category not found")

    supplier = db.get(
        Supplier,
        data.supplier_id)

    if not supplier:
        raise NotFoundException(
            "Supplier not found")

    existing_sku = db.scalar(
        select(Product).where(
            Product.sku == data.sku))

    if existing_sku:
        raise ConflictException(
            "Product with this SKU already exists")

    product = Product(
        name=data.name,
        sku=data.sku,
        category_id=data.category_id,
        supplier_id=data.supplier_id,
        unit_price=data.unit_price,
        quantity_in_stock=data.quantity_in_stock,
        reorder_level=data.reorder_level,
        is_active=True)

    db.add(product)
    db.commit()
    db.refresh(product)

    return product


def get_products(
    db: Session,
    page: int,
    page_size: int,
    search: str | None = None,
    category_id: int | None = None,
    stock_status: str | None = None,
    covered_ids: list | None = None):
    query = select(Product).where(
        Product.is_active.is_(True) )

    if covered_ids is not None:
        query = query.where(
            Product.id.in_(covered_ids))

    if search:
        search_value = f"%{search}%"

        query = query.where(
            or_(
                Product.name.ilike(search_value),
                Product.sku.ilike(search_value) ))

    if category_id is not None:
        query = query.where(
            Product.category_id == category_id)

    if stock_status == "out of stock":
        query = query.where(
            Product.quantity_in_stock == 0)

    elif stock_status == "low stock":
        query = query.where(
            Product.quantity_in_stock > 0,
            Product.quantity_in_stock
            <= Product.reorder_level)

    elif stock_status == "in stock":
        query = query.where(
            Product.quantity_in_stock
            > Product.reorder_level)

    count_query = select(
        func.count()
    ).select_from(
        query.subquery()
    )

    total = db.scalar(count_query) or 0

    offset = (page - 1) * page_size

    products = db.scalars(
        query
        .order_by(Product.id)
        .offset(offset)
        .limit(page_size)
    ).all()

    total_pages = (
        (total + page_size - 1)
        // page_size
    )

    return {
        "items": products,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages
    }


def get_product(
    db: Session,
    product_id: int
):
    product = db.scalar(
        select(Product).where(
            Product.id == product_id,
            Product.is_active.is_(True)
        )
    )

    if not product:
        raise NotFoundException(
            "Product not found"
        )

    return product


def update_product(
    db: Session,
    product_id: int,
    data: ProductUpdate
):
    product = get_product(
        db,
        product_id
    )

    update_data = data.model_dump(
        exclude_unset=True
    )

    if "sku" in update_data:
        existing = db.scalar(
            select(Product).where(
                Product.sku == update_data["sku"],
                Product.id != product_id
            )
        )

        if existing:
            raise ConflictException(
                "Product with this SKU already exists"
            )

    if "category_id" in update_data:
        category = db.get(
            Category,
            update_data["category_id"]
        )

        if not category:
            raise NotFoundException(
                "Category not found"
            )

    if "supplier_id" in update_data:
        supplier = db.get(
            Supplier,
            update_data["supplier_id"]
        )

        if not supplier:
            raise NotFoundException(
                "Supplier not found"
            )

    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)

    return product



   

def delete_product(
    db: Session,
    product_id: int
):
    product = get_product(
        db,
        product_id
    )

    product.is_active = False

    db.commit()


def adjust_stock(
    db: Session,
    product_id: int,
    data: StockAdjustment
):
    product = get_product(
        db,
        product_id
    )

    if data.operation == "IN":
        product.quantity_in_stock += data.quantity

    elif data.operation == "OUT":
        new_quantity = (
            product.quantity_in_stock - data.quantity
        )

        if new_quantity < 0:
            raise BadRequestException(
                "Insufficient stock for this adjustment"
            )

        product.quantity_in_stock = new_quantity

    db.commit()
    db.refresh(product)

    return product


def get_product_summary(
    db: Session,
    covered_ids: list | None = None
):
    query = select(Product).where(
        Product.is_active.is_(True)
    )

    if covered_ids is not None:
        query = query.where(
            Product.id.in_(covered_ids))

    products = db.scalars(query).all()

    total_products = len(products)

    total_stock_value = sum(
        (
            Decimal(product.unit_price)
            * product.quantity_in_stock
        )
        for product in products
    )

    low_stock_count = sum(
        1
        for product in products
        if (
            product.quantity_in_stock > 0
            and product.quantity_in_stock
            <= product.reorder_level
        )
    )

    out_of_stock_count = sum(
        1
        for product in products
        if product.quantity_in_stock == 0
    )

    return {
        "total_products": total_products,
        "total_stock_value": total_stock_value,
        "low_stock_count": low_stock_count,
        "out_of_stock_count": out_of_stock_count
    }
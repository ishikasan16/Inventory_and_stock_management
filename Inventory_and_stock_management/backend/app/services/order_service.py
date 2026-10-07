import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.task import Task
from app.models.user import User
from app.schemas.auth import UserRole
from app.schemas.order import OrderCreate, OrderStatus
from app.utils.constraints import DEFAULT_PAGE, DEFAULT_PAGE_SIZE


def create_order(
    db: Session,
    data: OrderCreate,
    current_user: User | None = None
):
    # ---------------------------------------------------------
    # 1. Check customer
    # ---------------------------------------------------------

    customer = (
        db.query(Customer)
        .filter(Customer.id == data.customer_id)
        .first()
    )

    if not customer:
        raise ValueError("Customer not found")

    # ---------------------------------------------------------
    # 2. Create order object
    # ---------------------------------------------------------

    order = Order(
        customer_id=customer.id,
        status=OrderStatus.ORDER_PLACED.value,
        total_amount=Decimal("0.00")
    )

    db.add(order)

    # Flush so order.id is generated before creating items
    db.flush()

    total_amount = Decimal("0.00")

    has_shortage = False
    shortages = []

    # ---------------------------------------------------------
    # 3. Process each product
    # ---------------------------------------------------------

    for item_data in data.items:

        product = (
            db.query(Product)
            .filter(
                Product.id == item_data.product_id
            )
            .first()
        )

        if not product:
            raise ValueError(
                f"Product {item_data.product_id} not found"
            )

        # -----------------------------------------------------
        # 4. Check product availability
        # -----------------------------------------------------

        if not product.is_active:
            raise ValueError(
                f"Product '{product.name}' is inactive"
            )

        # -----------------------------------------------------
        # 5. Get current product price
        # -----------------------------------------------------

        unit_price = Decimal(str(product.unit_price))

        subtotal = unit_price * item_data.quantity

        total_amount += subtotal

        # -----------------------------------------------------
        # 6. Check stock & record shortage
        # -----------------------------------------------------

        if product.quantity_in_stock < item_data.quantity:
            has_shortage = True
            shortage_qty = item_data.quantity - product.quantity_in_stock
            shortages.append((product, item_data.quantity, shortage_qty))

        # -----------------------------------------------------
        # 7. Create order item
        # -----------------------------------------------------

        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=item_data.quantity,
            unit_price=unit_price,
            subtotal=subtotal
        )

        db.add(order_item)

    # ---------------------------------------------------------
    # 8. Set order total
    # ---------------------------------------------------------

    order.total_amount = total_amount

    # ---------------------------------------------------------
    # 9. Determine initial status & dispatch shortage alerts
    # ---------------------------------------------------------

    if has_shortage:
        order.status = OrderStatus.AWAITING_STOCK.value

        # Automatically assign high-priority restock task to Inventory Manager
        inventory_manager = (
            db.query(User)
            .filter(User.role == UserRole.INVENTORY_MANAGER.value)
            .first()
        )
        if not inventory_manager:
            inventory_manager = (
                db.query(User)
                .filter(User.role == UserRole.SUPER_ADMIN.value)
                .first()
            )

        assigned_by = current_user if current_user else inventory_manager

        if inventory_manager and assigned_by:
            for prod, req_qty, missing_qty in shortages:
                task = Task(
                    title=f"Restock Required: {prod.name} (Shortage: {missing_qty})",
                    description=(
                        f"Order #{str(order.id)[:8]} has a shortage of {missing_qty} units "
                        f"for '{prod.name}' (SKU: {prod.sku}). Customer ordered {req_qty}, "
                        f"current warehouse stock is {prod.quantity_in_stock}. "
                        f"Please place replenishment order with supplier."
                    ),
                    priority="HIGH",
                    status="PENDING",
                    assigned_to_id=inventory_manager.id,
                    assigned_by_id=assigned_by.id,
                    target_type="PRODUCT",
                    target_id=prod.id,
                )
                db.add(task)
    else:
        order.status = OrderStatus.CONFIRMED.value

    # ---------------------------------------------------------
    # 10. Save everything
    # ---------------------------------------------------------

    db.commit()
    db.refresh(order)

    # Load order items
    order.items = (
        db.query(OrderItem)
        .filter(OrderItem.order_id == order.id)
        .all()
    )

    return order


def get_order(
    db: Session,
    order_id: uuid.UUID
):
    order = (
        db.query(Order)
        .filter(Order.id == order_id)
        .first()
    )

    if not order:
        raise ValueError("Order not found")

    order.items = (
        db.query(OrderItem)
        .filter(OrderItem.order_id == order.id)
        .all()
    )

    return order


def list_orders(
    db: Session,
    page: int = DEFAULT_PAGE,
    page_size: int = DEFAULT_PAGE_SIZE,
):
    query = db.query(Order)
    total = query.count()
    offset = (page - 1) * page_size
    orders = (
        query
        .order_by(Order.order_date.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    for order in orders:
        order.items = (
            db.query(OrderItem)
            .filter(OrderItem.order_id == order.id)
            .all()
        )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": orders,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def update_order_status(
    db: Session,
    order_id: uuid.UUID,
    new_status: OrderStatus,
    actual_delivery_date: datetime | None = None
):
    order = (
        db.query(Order)
        .filter(Order.id == order_id)
        .first()
    )

    if not order:
        raise ValueError("Order not found")

    current_status = order.status

    # ---------------------------------------------------------
    # Allowed status transitions
    # ---------------------------------------------------------

    allowed_transitions = {
        "ORDER_PLACED": {
            "CONFIRMED",
            "CANCELLED"
        },

        "CONFIRMED": {
            "PROCESSING",
            "AWAITING_STOCK",
            "CANCELLED"
        },

        "PROCESSING": {
            "PACKED",
            "AWAITING_STOCK",
            "CANCELLED"
        },

        "AWAITING_STOCK": {
            "SUPPLIER_ORDER_PLACED",
            "CANCELLED"
        },

        "SUPPLIER_ORDER_PLACED": {
            "STOCK_RECEIVED",
            "CANCELLED"
        },

        "STOCK_RECEIVED": {
            "PROCESSING"
        },

        "PACKED": {
            "SHIPPED"
        },

        "SHIPPED": {
            "OUT_FOR_DELIVERY"
        },

        "OUT_FOR_DELIVERY": {
            "DELIVERED"
        },

        "DELIVERED": set(),

        "CANCELLED": set()
    }

    allowed = allowed_transitions.get(
        current_status,
        set()
    )

    if new_status.value not in allowed:
        raise ValueError(
            f"Cannot change order status "
            f"from {current_status} "
            f"to {new_status.value}"
        )

    order.status = new_status.value

    if new_status == OrderStatus.DELIVERED:
        order.actual_delivery_date = actual_delivery_date or datetime.now(timezone.utc)

    db.commit()
    db.refresh(order)

    order.items = (
        db.query(OrderItem)
        .filter(OrderItem.order_id == order.id)
        .all()
    )

    return order
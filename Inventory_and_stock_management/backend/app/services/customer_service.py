import uuid

from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate
from app.utils.constraints import DEFAULT_PAGE, DEFAULT_PAGE_SIZE


def create_customer(
    db: Session,
    data: CustomerCreate
):
    # Ensure legacy address is synced with delivery or residential address
    effective_address = data.delivery_address or data.residential_address or data.address
    effective_delivery = data.delivery_address or data.address
    effective_residential = data.residential_address or data.address

    customer = Customer(
        name=data.name,
        email=str(data.email).lower(),
        phone=data.phone,
        address=effective_address,
        residential_address=effective_residential,
        delivery_address=effective_delivery,
    )

    db.add(customer)
    db.commit()
    db.refresh(customer)

    return customer


def get_customer(
    db: Session,
    customer_id: uuid.UUID
):
    return (
        db.query(Customer)
        .filter(Customer.id == customer_id)
        .first()
    )


def list_customers(
    db: Session,
    page: int = DEFAULT_PAGE,
    page_size: int = DEFAULT_PAGE_SIZE,
):
    query = db.query(Customer)
    total = query.count()
    offset = (page - 1) * page_size
    items = query.order_by(Customer.created_at.desc()).offset(offset).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def update_customer(
    db: Session,
    customer: Customer,
    data: CustomerUpdate
):
    values = data.model_dump(exclude_unset=True)

    if "email" in values and values["email"]:
        values["email"] = str(values["email"]).lower()

    # Sync address if delivery_address is updated
    if "delivery_address" in values and values["delivery_address"]:
        values["address"] = values["delivery_address"]
    elif "address" in values and values["address"]:
        if "delivery_address" not in values:
            values["delivery_address"] = values["address"]

    for key, value in values.items():
        setattr(customer, key, value)

    db.commit()
    db.refresh(customer)

    return customer
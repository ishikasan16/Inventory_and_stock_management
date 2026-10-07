import uuid

from sqlalchemy.orm import Session

from app.schemas.customer import CustomerCreate, CustomerUpdate
from app.services import customer_service
from app.utils.constraints import DEFAULT_PAGE, DEFAULT_PAGE_SIZE


def create_customer(
    db: Session,
    data: CustomerCreate
):
    return customer_service.create_customer(db, data)


def get_customer(
    db: Session,
    customer_id: uuid.UUID
):
    customer = customer_service.get_customer(db, customer_id)

    if not customer:
        raise ValueError("Customer not found")

    return customer


def list_customers(
    db: Session,
    page: int = DEFAULT_PAGE,
    page_size: int = DEFAULT_PAGE_SIZE,
):
    return customer_service.list_customers(
        db=db,
        page=page,
        page_size=page_size,
    )



def update_customer(
    db: Session,
    customer_id: uuid.UUID,
    data: CustomerUpdate
):
    customer = customer_service.get_customer(db, customer_id)

    if not customer:
        raise ValueError("Customer not found")

    return customer_service.update_customer(
        db,
        customer,
        data
    )
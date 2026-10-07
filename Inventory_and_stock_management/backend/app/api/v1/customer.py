import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    ensure_create_access,
    ensure_record_access,
    get_current_user,
)
from app.models.user import User
from app.controllers import customer_controller
from app.schemas.customer import (
    CustomerCreate,
    CustomerListResponse,
    CustomerResponse,
    CustomerUpdate,
)
from app.schemas.task import TargetType
from app.utils.constraints import (
    DEFAULT_PAGE,
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
)

router = APIRouter(
    prefix="/customers",
    tags=["Customers"]
)

CUSTOMER_TYPE = TargetType.CUSTOMER.value


@router.post(
    "/",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED
)
def create_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_create_access(
        db, current_user, CUSTOMER_TYPE
    )

    return customer_controller.create_customer(
        db=db,
        data=data
    )


@router.get(
    "/",
    response_model=CustomerListResponse
)
def get_customers(
    page: int = Query(DEFAULT_PAGE, ge=1, description="Page number"),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return customer_controller.list_customers(
        db=db,
        page=page,
        page_size=page_size,
    )



@router.get(
    "/{customer_id}",
    response_model=CustomerResponse
)
def get_customer(
    customer_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return customer_controller.get_customer(
        db=db,
        customer_id=customer_id
    )


@router.put(
    "/{customer_id}",
    response_model=CustomerResponse
)
def update_customer(
    customer_id: uuid.UUID,
    data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_record_access(
        db, current_user, CUSTOMER_TYPE, customer_id
    )

    return customer_controller.update_customer(
        db=db,
        customer_id=customer_id,
        data=data
    )
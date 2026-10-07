from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    ensure_create_access,
    ensure_record_access,
    get_covered_target_ids,
    get_current_user,
)
from app.models.user import User

from app.schemas.supplier import (
    SupplierCreate,
    SupplierListResponse,
    SupplierResponse,
    SupplierUpdate,
)
from app.utils.constraints import (
    DEFAULT_PAGE,
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
)
from app.schemas.task import TargetType
import uuid
from app.controllers import supplier_controller


router = APIRouter(
    prefix="/suppliers",
    tags=["Suppliers"]
)

SUPPLIER_TYPE = TargetType.SUPPLIER.value


@router.post(
    "/",
    response_model=SupplierResponse,
    status_code=status.HTTP_201_CREATED
)
def create_supplier(
    data: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ensure_create_access(
        db, current_user, SUPPLIER_TYPE
    )

    return supplier_controller.create_supplier(
        db=db,
        data=data
    )


@router.get(
    "/",
    response_model=SupplierListResponse
)
def get_suppliers(
    page: int = Query(DEFAULT_PAGE, ge=1, description="Page number"),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    covered_ids = get_covered_target_ids(
        db, current_user, SUPPLIER_TYPE
    )

    return supplier_controller.get_suppliers(
        db=db,
        covered_ids=covered_ids,
        page=page,
        page_size=page_size
    )


@router.get(
    "/{supplier_id}",
    response_model=SupplierResponse
)
def get_supplier(
    supplier_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return supplier_controller.get_supplier(
        db=db,
        supplier_id=supplier_id
    )


@router.put(
    "/{supplier_id}",
    response_model=SupplierResponse
)
def update_supplier(
    supplier_id: uuid.UUID,
    data: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ensure_record_access(
        db, current_user, SUPPLIER_TYPE, supplier_id
    )

    return supplier_controller.update_supplier(
        db=db,
        supplier_id=supplier_id,
        data=data
    )


@router.delete(
    "/{supplier_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_supplier(
    supplier_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ensure_record_access(
        db, current_user, SUPPLIER_TYPE, supplier_id
    )

    supplier_controller.delete_supplier(
        db=db,
        supplier_id=supplier_id
    )
import uuid
from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.services import prediction_service
from app.utils.exceptions import NotFoundException, BadRequestException


def predict_delivery(
    order_id: uuid.UUID,
    order_date: datetime,
    order_quantity: int,
    number_of_items: int,
    current_stock: int,
    reorder_level: int,
    supplier_lead_time: float = 2.0,
    processing_time: float = 1.0,
    shipping_time: int = 3,
    distance_km: float = 350.0,
    shipping_mode: int = 0,
    rainy_days_in_transit: int = 0,
):
    return prediction_service.predict_order_delivery(
        order_id=order_id,
        order_date=order_date,
        order_quantity=order_quantity,
        number_of_items=number_of_items,
        current_stock=current_stock,
        reorder_level=reorder_level,
        distance_km=distance_km,
        shipping_mode=shipping_mode,
        rainy_days_in_transit=rainy_days_in_transit,
        supplier_lead_time=supplier_lead_time,
        processing_time=processing_time,
    )


def predict_by_order_id(db: Session, order_id: uuid.UUID):
    try:
        return prediction_service.predict_by_order_id(db=db, order_id=order_id)
    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message
        )
    except BadRequestException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.controllers import prediction_controller
from app.schemas.prediction import DeliveryPredictionResponse


router = APIRouter(
    prefix="/predictions",
    tags=["Delivery Prediction"],
)


@router.post(
    "/orders/{order_id}",
    response_model=DeliveryPredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict delivery date for an existing order by ID (Auto-extracts DB features & Open-Meteo transit weather)"
)
def predict_order_delivery_by_id(
    order_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return prediction_controller.predict_by_order_id(
        db=db,
        order_id=order_id
    )


@router.post(
    "/delivery",
    response_model=DeliveryPredictionResponse,
    summary="Predict order fulfillment days with manual what-if simulation parameters"
)
def predict_delivery(
    order_id: uuid.UUID,
    order_date: datetime,
    order_quantity: int,
    number_of_items: int,
    current_stock: int,
    reorder_level: int,
    supplier_lead_time: float = Query(2.0, description="Supplier lead time in days"),
    processing_time: float = Query(1.0, description="Warehouse processing time in days"),
    shipping_time: int = Query(3, description="Estimated base shipping time in days"),
    distance_km: float = Query(350.0, description="Transit distance in km"),
    shipping_mode: int = Query(0, description="0 = Standard, 1 = Express"),
    rainy_days_in_transit: int = Query(0, description="Number of adverse/rainy days during transit window"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return prediction_controller.predict_delivery(
        order_id=order_id,
        order_date=order_date,
        order_quantity=order_quantity,
        number_of_items=number_of_items,
        current_stock=current_stock,
        reorder_level=reorder_level,
        supplier_lead_time=supplier_lead_time,
        processing_time=processing_time,
        shipping_time=shipping_time,
        distance_km=distance_km,
        shipping_mode=shipping_mode,
        rainy_days_in_transit=rainy_days_in_transit,
    )
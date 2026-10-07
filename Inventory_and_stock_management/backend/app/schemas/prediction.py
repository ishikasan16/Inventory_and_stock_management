import uuid
from datetime import datetime
from pydantic import BaseModel


class DeliveryPredictionResponse(BaseModel):
    order_id: uuid.UUID
    predicted_fulfillment_days: float
    predicted_delivery_date: datetime
    model_version: str
    training_data_type: str
    weather_condition: str | None = None
    rainy_days_in_transit: int | None = None
    distance_km: float | None = None
    shipping_mode: str | None = None
    logistics_explanation: str | None = None
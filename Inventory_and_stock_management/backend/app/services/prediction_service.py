import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.customer import Customer
from app.utils.exceptions import NotFoundException, BadRequestException
from app.ml.features import build_delivery_features
from app.ml.predict import predict_delivery_days
from app.ml.weather import get_transit_weather

CITY_DISTANCES_FROM_HUB = {
    "delhi": 35.0,
    "new delhi": 35.0,
    "noida": 45.0,
    "gurugram": 50.0,
    "chandigarh": 250.0,
    "jaipur": 280.0,
    "lucknow": 550.0,
    "ahmedabad": 950.0,
    "mumbai": 1400.0,
    "pune": 1450.0,
    "kolkata": 1500.0,
    "hyderabad": 1550.0,
    "bengaluru": 2150.0,
    "bangalore": 2150.0,
    "chennai": 2200.0,
}
DEFAULT_DISTANCE_KM = 350.0


def resolve_distance_from_address(address: str | None) -> float:
    """Estimates road transit distance (km) from Central Warehouse Hub to customer."""
    if not address:
        return DEFAULT_DISTANCE_KM

    address_lower = address.lower()
    for city, dist in CITY_DISTANCES_FROM_HUB.items():
        if city in address_lower:
            return dist

    return DEFAULT_DISTANCE_KM


def predict_order_delivery(
    order_id: uuid.UUID,
    order_date: datetime,
    order_quantity: int,
    number_of_items: int,
    current_stock: int,
    reorder_level: int,
    distance_km: float = 350.0,
    shipping_mode: int = 0,
    rainy_days_in_transit: int = 0,
    supplier_lead_time: float = 2.0,
    processing_time: float = 1.0,
    weather_condition: str = "CLEAR",
):
    features = build_delivery_features(
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

    prediction = predict_delivery_days(features)
    predicted_days = prediction["predicted_fulfillment_days"]

    predicted_delivery_date = order_date + timedelta(days=predicted_days)

    mode_label = "EXPRESS" if shipping_mode == 1 else "STANDARD"
    shortage_qty = max(order_quantity - current_stock, 0)
    
    # Generate human-friendly logistics summary
    parts = [f"{processing_time:.1f}d warehouse handling"]
    transit_est = round((distance_km / 350.0) * (0.6 if shipping_mode == 1 else 1.0), 1)
    parts.append(f"{transit_est}d {mode_label.lower()} transit ({distance_km:.0f} km)")
    
    if rainy_days_in_transit > 0:
        parts.append(f"{rainy_days_in_transit * 0.5:.1f}d transit weather buffer ({rainy_days_in_transit} rainy days)")
        
    if shortage_qty > 0:
        parts.append(f"{supplier_lead_time:.1f}d supplier replenishment deficit ({shortage_qty} units)")

    logistics_explanation = " + ".join(parts)

    return {
        "order_id": order_id,
        "predicted_fulfillment_days": predicted_days,
        "predicted_delivery_date": predicted_delivery_date,
        "model_version": prediction["model_version"],
        "training_data_type": prediction["training_data_type"],
        "weather_condition": weather_condition,
        "rainy_days_in_transit": rainy_days_in_transit,
        "distance_km": distance_km,
        "shipping_mode": mode_label,
        "logistics_explanation": logistics_explanation,
    }


def predict_by_order_id(db: Session, order_id: uuid.UUID):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise NotFoundException(f"Order with ID {order_id} not found")

    if order.status in ["DELIVERED", "CANCELLED"]:
        raise BadRequestException(
            f"Cannot predict delivery for order #{str(order_id)[:8]} because its status is already '{order.status}'."
        )

    items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
    if not items:
        raise BadRequestException(f"Order {order_id} has no line items to predict delivery for")

    total_quantity = sum(item.quantity for item in items)
    number_of_items = len(items)

    product_ids = [item.product_id for item in items]
    products = db.query(Product).filter(Product.id.in_(product_ids)).all()

    if products:
        current_stock = sum(p.quantity_in_stock for p in products)
        reorder_level = max(p.reorder_level for p in products)
    else:
        current_stock = 0
        reorder_level = 10

    # Fetch customer delivery address for distance & transit weather
    customer = db.query(Customer).filter(Customer.id == order.customer_id).first()
    customer_shipping_addr = (customer.delivery_address or customer.address or customer.residential_address) if customer else None
    
    distance_km = resolve_distance_from_address(customer_shipping_addr)
    shipping_mode = 0  # Default to Standard

    # Fetch 5-day transit window weather from Open-Meteo for delivery location
    weather_data = get_transit_weather(order.order_date, destination_city=customer_shipping_addr)
    rainy_days_in_transit = weather_data.get("rainy_days_in_transit", 0)
    weather_condition = weather_data.get("condition", "CLEAR")

    # Logistics lead times: shortage requires supplier procurement
    has_deficit = current_stock < total_quantity
    supplier_lead_time = 4.0 if has_deficit else 1.5
    processing_time = 1.0

    result = predict_order_delivery(
        order_id=order.id,
        order_date=order.order_date,
        order_quantity=total_quantity,
        number_of_items=number_of_items,
        current_stock=current_stock,
        reorder_level=reorder_level,
        distance_km=distance_km,
        shipping_mode=shipping_mode,
        rainy_days_in_transit=rainy_days_in_transit,
        supplier_lead_time=supplier_lead_time,
        processing_time=processing_time,
        weather_condition=weather_condition,
    )

    # Save predicted delivery date on the order record
    order.predicted_delivery_date = result["predicted_delivery_date"]
    db.commit()
    db.refresh(order)

    return result
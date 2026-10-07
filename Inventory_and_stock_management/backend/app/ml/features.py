def build_delivery_features(
    order_quantity: int,
    number_of_items: int,
    current_stock: int,
    reorder_level: int,
    distance_km: float = 350.0,
    shipping_mode: int = 0,
    rainy_days_in_transit: int = 0,
    supplier_lead_time: float = 2.0,
    processing_time: float = 1.0,
) -> dict:
   
    shortage_quantity = max(order_quantity - current_stock, 0)

    return {
        "order_quantity": order_quantity,
        "number_of_items": number_of_items,
        "current_stock": current_stock,
        "reorder_level": reorder_level,
        "shortage_quantity": shortage_quantity,
        "distance_km": float(distance_km),
        "shipping_mode": int(shipping_mode),
        "rainy_days_in_transit": int(rainy_days_in_transit),
        "supplier_lead_time": float(supplier_lead_time),
        "processing_time": float(processing_time),
    }
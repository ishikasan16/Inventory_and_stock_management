from pathlib import Path
import numpy as np
import pandas as pd

DATA_PATH = Path("app/ml/data/fulfillment_historical_data.csv")


def generate_training_data(rows: int = 5000) -> pd.DataFrame:
    """
    Generates a realistic historical shipment fulfillment dataset incorporating:
    - Order volume & warehouse stock
    - Replenishment supplier lead times
    - Logistics transit distance (km) & shipping mode (Standard vs Express)
    - Environmental transit weather delays (rainy/stormy days in transit window)
    """
    rng = np.random.default_rng(42)

    # 1. Order quantities & stock
    order_quantity = rng.integers(1, 55, rows)
    number_of_items = rng.integers(1, 7, rows)
    current_stock = rng.integers(0, 100, rows)
    reorder_level = rng.integers(10, 50, rows)

    # 2. Calculated inventory deficit
    shortage_quantity = np.maximum(order_quantity - current_stock, 0)

    # 3. Logistics & Distance (Local 50km up to Interstate 1500km)
    distance_km = np.round(rng.uniform(40.0, 1500.0, rows), 1)
    
    # Shipping Mode: 0 = Standard (~350 km/day), 1 = Express (~600 km/day)
    shipping_mode = rng.choice([0, 1], size=rows, p=[0.7, 0.3])

    # 4. Transit Weather: Rainy / Adverse weather days in the 5-day window
    rainy_days_in_transit = rng.choice([0, 1, 2, 3, 4], size=rows, p=[0.55, 0.25, 0.12, 0.06, 0.02])

    # 5. Operational Durations
    supplier_lead_time = np.where(
        shortage_quantity > 0,
        np.round(rng.uniform(3.5, 7.0, rows), 1),
        np.round(rng.uniform(1.0, 2.0, rows), 1)
    )
    
    processing_time = np.round(rng.uniform(0.8, 1.8, rows), 2)

    # 6. Realistic Ground-Truth Fulfillment Days Calculation
    speed_factor = np.where(shipping_mode == 1, 0.6, 1.0)
    base_transit_days = (distance_km / 350.0) * speed_factor
    
    stock_delay = np.where(shortage_quantity > 0, supplier_lead_time, 0.0)
    weather_delay = rainy_days_in_transit * 0.55
    random_noise = rng.normal(0, 0.35, rows)

    fulfillment_days = (
        processing_time
        + base_transit_days
        + stock_delay
        + weather_delay
        + random_noise
    )

    # Lower bound to at least 1 full business day
    fulfillment_days = np.maximum(1.0, np.round(fulfillment_days, 2))

    return pd.DataFrame(
        {
            "order_quantity": order_quantity,
            "number_of_items": number_of_items,
            "current_stock": current_stock,
            "reorder_level": reorder_level,
            "shortage_quantity": shortage_quantity,
            "distance_km": distance_km,
            "shipping_mode": shipping_mode,
            "rainy_days_in_transit": rainy_days_in_transit,
            "supplier_lead_time": supplier_lead_time,
            "processing_time": processing_time,
            "fulfillment_days": fulfillment_days,
        }
    )


def save_historical_dataset(rows: int = 5000):
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    df = generate_training_data(rows=rows)
    df.to_csv(DATA_PATH, index=False)
    print(f"Generated and saved {len(df)} rows to {DATA_PATH}")


if __name__ == "__main__":
    save_historical_dataset()
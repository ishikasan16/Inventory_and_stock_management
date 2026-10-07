import json
import urllib.request
import urllib.error
from datetime import datetime, timedelta
from typing import Dict, Any

# City coordinates lookup table for warehouse & customer delivery destinations
CITY_COORDINATES: Dict[str, tuple[float, float]] = {
    "delhi": (28.6139, 77.2090),
    "new delhi": (28.6139, 77.2090),
    "noida": (28.5355, 77.3910),
    "gurugram": (28.4595, 77.0266),
    "mumbai": (19.0760, 72.8777),
    "bengaluru": (12.9716, 77.5946),
    "bangalore": (12.9716, 77.5946),
    "hyderabad": (17.3850, 78.4867),
    "chennai": (13.0827, 80.2707),
    "kolkata": (22.5726, 88.3639),
    "pune": (18.5204, 73.8567),
    "jaipur": (26.9124, 75.7873),
    "ahmedabad": (23.0225, 72.5714),
    "lucknow": (26.8467, 80.9462),
    "chandigarh": (30.7333, 76.7794),
}

DEFAULT_WAREHOUSE_COORDS = (28.6139, 77.2090)  # Central Hub (Delhi)


def resolve_city_coordinates(address_or_city: str | None) -> tuple[float, float]:
    """Resolves latitude and longitude from an address or city string."""
    if not address_or_city:
        return DEFAULT_WAREHOUSE_COORDS

    address_lower = address_or_city.lower()
    for city, coords in CITY_COORDINATES.items():
        if city in address_lower:
            return coords

    return DEFAULT_WAREHOUSE_COORDS


def get_transit_weather(
    order_date: datetime,
    destination_city: str | None = None
) -> Dict[str, Any]:
    lat, lon = resolve_city_coordinates(destination_city)
    
    start_date = order_date.strftime("%Y-%m-%d")
    end_date = (order_date + timedelta(days=4)).strftime("%Y-%m-%d")

    url = ( #create request url for open-meteo api
        f"https://archive-api.open-meteo.com/v1/archive"
        f"?latitude={lat}&longitude={lon}"
        f"&start_date={start_date}&end_date={end_date}"
        f"&daily=weathercode,temperature_2m_max"
        f"&timezone=auto"
    )

    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "InventoryStockManagement/1.0"}
        )
        with urllib.request.urlopen(req, timeout=3) as response:
            if response.status == 200:
                raw_body = response.read().decode("utf-8")
                data = json.loads(raw_body)
                codes = data.get("daily", {}).get("weathercode", [])
                
                # WMO Weather codes classification:
                # 51-65, 80-82: Drizzle & Rain
                # 95-99: Thunderstorms
                # 45-48: Fog
                rainy_days = sum(
                    1 for c in codes
                    if c in [51, 53, 55, 61, 63, 65, 80, 81, 82]
                )
                has_storm = any(c in [95, 96, 99] for c in codes)
                has_fog = any(c in [45, 48] for c in codes)

                if has_storm:
                    condition = "STORM"
                    code_category = 3
                elif rainy_days > 0:
                    condition = "RAIN"
                    code_category = 2
                elif has_fog:
                    condition = "FOG"
                    code_category = 1
                else:
                    condition = "CLEAR"
                    code_category = 0

                return {
                    "condition": condition,
                    "rainy_days_in_transit": rainy_days,
                    "has_storm_risk": has_storm,
                    "weather_code": code_category,
                    "source": "open_meteo"
                }

        return _fallback_weather(order_date)

    except Exception:
        # Graceful fallback on network timeout or offline
        return _fallback_weather(order_date)


def _fallback_weather(order_date: datetime) -> Dict[str, Any]:
    """Seasonal heuristic fallback when network is unavailable."""
    month = order_date.month
    if month in [6, 7, 8, 9]:
        return {"condition": "RAIN", "rainy_days_in_transit": 2, "has_storm_risk": False, "weather_code": 2, "source": "seasonal_fallback"}
    elif month in [12, 1]:
        return {"condition": "FOG", "rainy_days_in_transit": 0, "has_storm_risk": False, "weather_code": 1, "source": "seasonal_fallback"}
    return {"condition": "CLEAR", "rainy_days_in_transit": 0, "has_storm_risk": False, "weather_code": 0, "source": "default_clear"}

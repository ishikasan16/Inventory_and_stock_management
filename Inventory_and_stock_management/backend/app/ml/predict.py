from pathlib import Path
import joblib
import pandas as pd

MODEL_PATH = Path("app/ml/models/delivery_model.pkl")


def predict_delivery_days(features: dict) -> dict:
    
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            "Delivery prediction model artifact not found. "
            "Run 'python -m app.ml.train' first."
        )

    saved_bundle = joblib.load(MODEL_PATH)
    model = saved_bundle["model"]
    feature_names = saved_bundle["features"]
    model_version = saved_bundle.get("model_version", "xgboost-v3")
    training_data_type = saved_bundle.get("training_data_type", "historical_csv")

    # Construct tabular DataFrame in exact trained column order
    input_data = pd.DataFrame([features], columns=feature_names)

    # Perform inference
    raw_prediction = float(model.predict(input_data)[0])

    # Enforce minimum 1.0 day lower bound
    predicted_days = max(1.0, round(raw_prediction, 2))

    return {
        "predicted_fulfillment_days": predicted_days,
        "model_version": model_version,
        "training_data_type": training_data_type,
    }
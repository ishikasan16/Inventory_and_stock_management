from pathlib import Path
import joblib
import pandas as pd
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor

from app.ml.synthetic_data import save_historical_dataset

DATA_PATH = Path("app/ml/data/fulfillment_historical_data.csv")
MODEL_PATH = Path("app/ml/models/delivery_model.pkl")

MODEL_VERSION = "xgboost-v3"
TRAINING_DATA_TYPE = "historical_fulfillment_csv_with_weather_and_distance"

FEATURES = [
    "order_quantity",
    "number_of_items",
    "current_stock",
    "reorder_level",
    "shortage_quantity",
    "distance_km",
    "shipping_mode",
    "rainy_days_in_transit",
    "supplier_lead_time",
    "processing_time",
]

TARGET = "fulfillment_days"


def train_model():
    print("=" * 60)
    print("DELIVERY PREDICTION MODEL TRAINING (XGBOOST)")
    print("=" * 60)

    # 1. Ensure dataset exists and has updated schema
    if not DATA_PATH.exists():
        print("Dataset not found. Generating fresh historical dataset...")
        save_historical_dataset(rows=5000)

    df = pd.read_csv(DATA_PATH)

    # If old columns exist, regenerate
    required_columns = FEATURES + [TARGET]
    if any(col not in df.columns for col in required_columns):
        print("Dataset schema outdated. Regenerating fresh historical dataset...")
        save_historical_dataset(rows=5000)
        df = pd.read_csv(DATA_PATH)

    print(f"\nDataset loaded: {len(df)} rows across {len(FEATURES)} features")

    # 2. Prepare Features & Target
    X = df[FEATURES]
    y = df[TARGET]

    # 3. Train / Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )
    print(f"Training samples: {len(X_train)} | Test samples: {len(X_test)}")

    # 4. Train XGBoost Regressor
    print("\nFitting XGBRegressor...")
    model = XGBRegressor(
        n_estimators=250,
        max_depth=4,
        learning_rate=0.06,
        subsample=0.85,
        colsample_bytree=0.85,
        objective="reg:squarederror",
        random_state=42,
    )
    model.fit(X_train, y_train)

    # 5. Evaluate Performance
    predictions = model.predict(X_test)

    mae = mean_absolute_error(y_test, predictions)
    rmse = mean_squared_error(y_test, predictions) ** 0.5
    r2 = r2_score(y_test, predictions)

    abs_errors = abs(y_test.to_numpy() - predictions)
    acc_1_day = (abs_errors <= 1.0).mean() * 100
    acc_2_days = (abs_errors <= 2.0).mean() * 100

   
    print("MODEL EVALUATION RESULTS")
    
    print(f"Mean Absolute Error (MAE)  : {mae:.2f} days")
    print(f"Root Mean Squared Error    : {rmse:.2f} days")
    print(f"R^2 Score                  : {r2:.4f}")
    print(f"Accuracy within +/- 1.0 day : {acc_1_day:.2f}%")
    print(f"Accuracy within +/- 2.0 days: {acc_2_days:.2f}%")

    # 6. Save Model Bundle
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    model_data = {
        "model": model,
        "features": FEATURES,
        "model_version": MODEL_VERSION,
        "training_data_type": TRAINING_DATA_TYPE,
        "metrics": {
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "r2": round(r2, 4),
            "acc_1_day": round(acc_1_day, 2),
        }
    }
    joblib.dump(model_data, MODEL_PATH)

    print("\n" + "=" * 60)
    print("MODEL ARTIFACT SAVED")
    print("=" * 60)
    print(f"Model path: {MODEL_PATH}")
    print(f"Version   : {MODEL_VERSION}")

    # 7. Generate Evaluation Graphs (3 Reports)
    generate_plots(model, X_train.columns, y_test, predictions, mae, rmse, r2, acc_1_day)


def generate_plots(model, feature_names, y_test, predictions, mae, rmse, r2, acc_1_day):
    """
    Generates and saves 3 clean, highly interpretable visual reports:
    1. actual_vs_predicted.png  - Scatter plot of actual vs predicted delivery times
    2. feature_importance.png   - Horizontal bar chart of key factors influencing delivery time
    3. error_distribution.png   - Histogram of prediction error variance
    """
    try:
        import matplotlib
        matplotlib.use("Agg")  # Non-interactive headless backend
        import matplotlib.pyplot as plt
        import numpy as np
    except ImportError:
        print("\n[NOTE] Matplotlib not installed. To generate visual graphs, run: pip install matplotlib")
        return

    reports_dir = Path("app/ml/reports")
    reports_dir.mkdir(parents=True, exist_ok=True)
    print("\n" + "=" * 60)
    print("GENERATING MODEL EVALUATION REPORTS (3 GRAPHS)")
    print("=" * 60)

    # Dictionary mapping raw feature column names to easy-to-understand labels
    HUMAN_READABLE_LABELS = {
        "distance_km": "Delivery Distance (km)",
        "supplier_lead_time": "Supplier Lead Time (Days)",
        "processing_time": "Warehouse Processing Time (Days)",
        "shipping_mode": "Shipping Mode (Standard / Express)",
        "rainy_days_in_transit": "Rain / Bad Weather Days in Transit",
        "order_quantity": "Order Item Quantity",
        "shortage_quantity": "Stock Shortage Quantity",
        "current_stock": "Current Stock on Hand",
        "reorder_level": "Reorder Threshold Level",
        "number_of_items": "Distinct Product Count in Order",
    }

    # -------------------------------------------------------------------------
    # 1. ACTUAL VS. PREDICTED SCATTER PLOT
    # -------------------------------------------------------------------------
    plt.figure(figsize=(8, 6))
    plt.scatter(
        y_test, predictions,
        alpha=0.45, color="#2563eb", s=35, edgecolors="none", label="Test Orders (1,000 samples)"
    )

    min_val = min(float(y_test.min()), float(predictions.min()))
    max_val = max(float(y_test.max()), float(predictions.max()))
    plt.plot(
        [min_val, max_val], [min_val, max_val],
        color="#dc2626", linestyle="--", lw=2, label="Ideal 100% Match (Predicted = Actual)"
    )

    info_text = (
        f"Model Accuracy (R$^2$): {r2 * 100:.1f}%\n"
        f"Avg Error (MAE): {mae:.2f} Days (~{mae * 24:.0f} hrs)\n"
        f"Within $\\pm$1.0 Day: {acc_1_day:.1f}%"
    )
    plt.text(
        0.05, 0.82, info_text, transform=plt.gca().transAxes,
        fontsize=10, fontweight="bold", color="#1e293b",
        bbox=dict(boxstyle="round,pad=0.5", facecolor="#f8fafc", edgecolor="#cbd5e1", lw=1.2)
    )

    plt.title("Delivery Time Prediction: Actual vs. Predicted", fontsize=13, fontweight="bold", pad=12)
    plt.xlabel("Actual Delivery Time (Days)", fontsize=11, fontweight="bold")
    plt.ylabel("Predicted Delivery Time (Days)", fontsize=11, fontweight="bold")
    plt.grid(True, linestyle=":", alpha=0.5)
    plt.legend(loc="lower right", frameon=True, facecolor="#ffffff", edgecolor="#e2e8f0")
    plt.tight_layout()

    path_1 = reports_dir / "actual_vs_predicted.png"
    plt.savefig(path_1, dpi=200)
    plt.close()
    print(f"[OK] 1/3 Saved: {path_1}")

    # -------------------------------------------------------------------------
    # 2. FEATURE IMPORTANCE (EASY-TO-UNDERSTAND ATTRIBUTE LABELS)
    # -------------------------------------------------------------------------
    importances = model.feature_importances_
    readable_names = [HUMAN_READABLE_LABELS.get(col, col) for col in feature_names]

    # Sort in ascending order so top features appear at the top in horizontal bar chart
    indices = np.argsort(importances)
    sorted_names = [readable_names[i] for i in indices]
    sorted_importances = importances[indices] * 100  # Convert to percentage

    plt.figure(figsize=(9, 6.2))
    bars = plt.barh(
        range(len(sorted_names)),
        sorted_importances,
        color="#3b82f6",
        edgecolor="#1d4ed8",
        height=0.65,
        alpha=0.9
    )

    # Highlight top 3 factors with a distinct color
    for i in range(len(sorted_names) - 3, len(sorted_names)):
        if i >= 0:
            bars[i].set_color("#1d4ed8")

    # Add numeric percentage labels on each bar
    for idx, (bar, val) in enumerate(zip(bars, sorted_importances)):
        plt.text(
            val + 0.5, idx, f"{val:.1f}%",
            va="center", ha="left", fontsize=9, fontweight="bold", color="#1e293b"
        )

    plt.yticks(range(len(sorted_names)), sorted_names, fontsize=10)
    plt.xlabel("Relative Influence on Delivery Time (%)", fontsize=11, fontweight="bold")
    plt.title("Key Factors Influencing Delivery Time (Feature Importance)", fontsize=13, fontweight="bold", pad=12)
    plt.xlim(0, max(sorted_importances) * 1.15)
    plt.grid(axis="x", linestyle=":", alpha=0.6)
    plt.tight_layout()

    path_2 = reports_dir / "feature_importance.png"
    plt.savefig(path_2, dpi=200)
    plt.close()
    print(f"[OK] 2/3 Saved: {path_2}")

    # -------------------------------------------------------------------------
    # 3. PREDICTION ERROR DISTRIBUTION
    # -------------------------------------------------------------------------
    errors = predictions - y_test.to_numpy()

    plt.figure(figsize=(8.5, 6))
    n, bins, patches = plt.hist(
        errors, bins=35, color="#10b981", edgecolor="#047857", alpha=0.75, density=False
    )

    # Highlight ±1.0 day threshold band
    plt.axvline(0, color="#dc2626", linestyle="-", lw=2, label="Zero Error (Exact Match)")
    plt.axvline(-1.0, color="#f59e0b", linestyle="--", lw=1.5, label="$\\pm$1.0 Day Tolerance Band")
    plt.axvline(1.0, color="#f59e0b", linestyle="--", lw=1.5)

    error_summary = (
        f"Mean Error: {np.mean(errors):+.2f} Days\n"
        f"Std Dev: {np.std(errors):.2f} Days\n"
        f"Orders within $\\pm$1.0 Day: {acc_1_day:.1f}%"
    )
    plt.text(
        0.05, 0.82, error_summary, transform=plt.gca().transAxes,
        fontsize=10, fontweight="bold", color="#1e293b",
        bbox=dict(boxstyle="round,pad=0.5", facecolor="#f8fafc", edgecolor="#cbd5e1", lw=1.2)
    )

    plt.title("Prediction Error Distribution (Model Reliability)", fontsize=13, fontweight="bold", pad=12)
    plt.xlabel("Prediction Error in Days (Predicted - Actual)", fontsize=11, fontweight="bold")
    plt.ylabel("Number of Orders", fontsize=11, fontweight="bold")
    plt.legend(loc="upper right", frameon=True, facecolor="#ffffff", edgecolor="#e2e8f0")
    plt.grid(True, linestyle=":", alpha=0.5)
    plt.tight_layout()

    path_3 = reports_dir / "error_distribution.png"
    plt.savefig(path_3, dpi=200)
    plt.close()
    print(f"[OK] 3/3 Saved: {path_3}")
    print("=" * 60)


if __name__ == "__main__":
    train_model()
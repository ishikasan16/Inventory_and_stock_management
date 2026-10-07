from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.categories import router as category_router
from app.api.v1.suppliers import router as supplier_router
from app.api.v1.products import router as product_router
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.tasks import router as tasks_router
from app.api.v1.customer import router as customer_router
from app.api.v1.orders import router as order_router
from app.api.v1.predictions import router as prediction_router
app = FastAPI(
    title="Inventory & Stock Management API",
    description="Backend API for Inventory and Stock Management",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  
    allow_credentials=True,
    allow_methods=["*"],       # must include OPTIONS
    allow_headers=["*"],
)

app.include_router(auth_router,
    prefix="/api/v1")

app.include_router(
    category_router,
    prefix="/api/v1"
)

app.include_router(
    supplier_router,
    prefix="/api/v1"
)

app.include_router(
    product_router,
    prefix="/api/v1"
)

app.include_router(
    users_router,
    prefix="/api/v1"
)

app.include_router(
    tasks_router,
    prefix="/api/v1"
)

app.include_router(
    customer_router,
    prefix="/api/v1"
)

app.include_router(
    order_router,
    prefix="/api/v1"
)

app.include_router(
    prediction_router,
    prefix="/api/v1",
)
from pathlib import Path
from fastapi.staticfiles import StaticFiles

# Mount ML Reports directory so graphs can be viewed directly in browser
REPORTS_DIR = Path("app/ml/reports")
REPORTS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/reports", StaticFiles(directory=str(REPORTS_DIR)), name="reports")


@app.get("/")
def root():
    return {
        "message": "Inventory & Stock Management API is running",
        "ml_reports": {
            "actual_vs_predicted": "/reports/actual_vs_predicted.png",
            "feature_importance": "/reports/feature_importance.png",
            "error_distribution": "/reports/error_distribution.png",
        }
    }
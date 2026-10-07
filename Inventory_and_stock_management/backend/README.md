# Inventory & Stock Management System - Backend

Enterprise-grade REST API for inventory tracking, customer orders, team task delegation, and AI/ML-driven delivery time prediction.

Built with **Python 3.10+**, **FastAPI**, **PostgreSQL**, **SQLAlchemy 2.0**, **Alembic**, and **XGBoost**.

---

## 🚀 Key Features

- **🔐 Dual-Layer Security (RBAC + ABAC)**:
  - 5 Granular Roles: `SUPER_ADMIN`, `INVENTORY_MANAGER`, `ORDER_MANAGER`, `INVENTORY_STAFF`, `ORDER_STAFF`.
  - JWT Authentication with short-lived access tokens and secure `HttpOnly` refresh token cookies.
  - Revoked token blacklist (`RevokedToken` table) for immediate logout invalidation.
  - Attribute-Based Access Control (ABAC): Staff can only create or edit items when explicitly delegated an active task with matching resource scope (`PRODUCT`, `CATEGORY`, `SUPPLIER`, `CUSTOMER`, `ORDER`).
- **📦 Inventory Management**:
  - Full CRUD for Products, Categories, and Suppliers with soft deletion.
  - Automatic SKU generation and uniqueness enforcement.
  - Real-time stock status calculations (`in stock`, `low stock`, `out of stock`).
  - Audited stock adjustments (`IN` / `OUT`) preventing negative stock levels.
  - Aggregated dashboard summary metrics (total inventory valuation, low stock counters).
- **🛒 Order Processing & State Machine**:
  - Customer order placement with line-item validation and automatic pricing calculations.
  - Real-time inventory availability checks (auto-transitions to `AWAITING_STOCK` if deficit exists).
  - Strict order lifecycle state machine (`CONFIRMED`, `PROCESSING`, `AWAITING_STOCK`, `SUPPLIER_ORDER_PLACED`, `STOCK_RECEIVED`, `PACKED`, `SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`).
  - Automated timestamping for `actual_delivery_date` on completion.
- **📋 Task Delegation & Team Governance**:
  - Manager-to-staff task assignment with priorities (`LOW`, `MEDIUM`, `HIGH`) and future due dates.
  - Domain separation:
    - `INVENTORY_MANAGER` assigns to `INVENTORY_STAFF` (Scopes: `NONE`, `PRODUCT`, `CATEGORY`, `SUPPLIER`).
    - `ORDER_MANAGER` assigns to `ORDER_STAFF` (Scopes: `NONE`, `CUSTOMER`, `ORDER`).
  - Staff task lifecycle (`PENDING` → `IN_PROGRESS` → `COMPLETED`).
- **🤖 Machine Learning Delivery Prediction (XGBoost)**:
  - Trained XGBoost Regressor model (`xgboost-v3`) forecasting order fulfillment turnaround in days.
  - Automated 10-feature extraction directly from real-time database orders, customer delivery locations, and stock.
  - Dynamic supplier lead time, warehouse handling, road transit distance, shipping tier, and Open-Meteo 5-day transit window weather forecasts.
  - Automatically writes `predicted_delivery_date` back to PostgreSQL.

---

## 🛠️ Tech Stack

| Technology | Category | Purpose |
|---|---|---|
| **Python 3.10+** | Language | Core runtime |
| **FastAPI** | Web Framework | High-performance asynchronous REST API |
| **PostgreSQL** | Database | ACID-compliant relational data storage |
| **SQLAlchemy 2.0** | ORM | Object-relational mapping, transactions & queries |
| **Alembic** | Migrations | Declarative database schema versioning |
| **Pydantic v2** | Data Validation | Request and response schema serialization |
| **XGBoost & Scikit-Learn** | Machine Learning | Gradient boosting model for delivery turnaround |
| **Pandas & NumPy** | Data Processing | Feature vector array manipulation |
| **Joblib** | Serialization | Serialized ML model pipeline loading |
| **Passlib (bcrypt)** | Cryptography | Password hashing and salt verification |
| **PyJWT** | Authentication | Dual JWT access & refresh token issuance |
| **Uvicorn** | ASGI Server | Production-ready HTTP/WebSocket server |

---

## 🧠 Machine Learning: 10-Parameter Delivery Prediction

The ETA prediction engine evaluates 10 specific parameters to accurately forecast order fulfillment days:

| # | Parameter | Source | Business Logic & Rules |
|---|---|---|---|
| **1** | `order_date` | Order Record | Baseline datetime when the customer placed the order. |
| **2** | `order_quantity` | Order Items | Total quantity across line items ($\sum \text{quantity}$). |
| **3** | `number_of_items` | Order Items | Distinct line item count ($\text{len}(\text{items})$). |
| **4** | `current_stock` | Inventory DB | Available warehouse inventory across all ordered products. |
| **5** | `reorder_level` | Inventory DB | Safety buffer threshold ($\max(\text{reorder\_level})$). |
| **6** | `shortage_quantity` | Calculated | Deficit: $\max(\text{order\_quantity} - \text{current\_stock}, 0)$. |
| **7** | `distance_km` | Geospatial Logistics | Transit distance between Central Warehouse Hub and customer delivery address. |
| **8** | `shipping_mode` | Logistics Tier | `0` = Standard carrier speed, `1` = Express expedited transit. |
| **9** | `rainy_days_in_transit` | Open-Meteo API | Adverse/rainy weather days in the 5-day shipment transit window starting from `order_date`. |
| **10**| `supplier_lead_time` | Warehouse / Supplier Rule | **4.0 days** if stock deficit exists (`current_stock < order_quantity`), **1.5 days** if in stock. |
| **11**| `processing_time` | Warehouse Operations | Standard picking, packing, QC inspection, and invoice labeling: **1.0 day**. |

---

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone <your-repository-url>
cd backend
```

### 2. Create and Activate Virtual Environment
```bash
# Windows PowerShell:
python -m venv .venv
.venv\Scripts\activate

# Linux / macOS:
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Create a `.env` file in the root backend directory:
```env
DATABASE_URL=postgresql+psycopg://postgres:your_password@localhost:5432/inventory_db
SECRET_KEY=your_secure_jwt_signing_secret_key_at_least_32_chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### 5. Run Database Migrations
```bash
alembic upgrade head
```

### 6. Start the Backend Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 📖 Interactive API Documentation

Once the server is running, explore and test the endpoints directly:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

> 📑 **Comprehensive API Reference**: For exhaustive request payloads, response bodies, error codes, and end-to-end business workflows, see [API_DOCUMENTATION.md](file:///c:/Users/Ishika/Desktop/inv-mgmt/backend/API_DOCUMENTATION.md).

---

## 📁 Project Directory Structure

```text
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── auth.py              # Register, login, refresh, logout
│   │       ├── categories.py        # Category management
│   │       ├── customer.py          # Customer profile management (ABAC gated)
│   │       ├── orders.py            # Order lifecycle & state machine (ABAC gated)
│   │       ├── predictions.py       # ML delivery prediction endpoints
│   │       ├── products.py          # Product CRUD & stock adjustment
│   │       ├── suppliers.py         # Supplier management
│   │       ├── tasks.py             # Manager-to-staff task assignment
│   │       └── users.py             # User and team management
│   │
│   ├── controllers/                 # HTTP translation and error handling
│   │   ├── auth_controller.py
│   │   ├── category_controller.py
│   │   ├── customer_controller.py
│   │   ├── order_controller.py
│   │   ├── prediction_controller.py
│   │   ├── product_controller.py
│   │   ├── supplier_controller.py
│   │   └── user_controller.py
│   │
│   ├── core/                        # Core application infrastructure
│   │   ├── config.py                # Pydantic BaseSettings & env configs
│   │   ├── database.py              # SQLAlchemy engine & session factory
│   │   ├── dependencies.py          # JWT validation & ABAC task guards
│   │   └── security.py              # Password hashing & JWT generation
│   │
│   ├── ml/                          # Machine Learning Pipeline
│   │   ├── data/                    # Historical training datasets
│   │   ├── models/                  # Serialized XGBoost model artifacts
│   │   ├── features.py              # 10-feature transformation logic
│   │   ├── predict.py               # Model loading & inference engine
│   │   ├── synthetic_data.py        # Dataset generator with realistic logistics
│   │   ├── train.py                 # Training script & model evaluation
│   │   └── weather.py               # Open-Meteo 5-day transit window forecast
│   │
│   ├── models/                      # SQLAlchemy ORM database models
│   │   ├── category.py
│   │   ├── customer.py
│   │   ├── order.py
│   │   ├── order_item.py
│   │   ├── order_tracking.py
│   │   ├── product.py
│   │   ├── purchase_order.py
│   │   ├── revoked_token.py
│   │   ├── stock_movement.py
│   │   ├── supplier.py
│   │   ├── task.py
│   │   └── user.py
│   │
│   ├── schemas/                     # Pydantic request/response models
│   │   ├── auth.py
│   │   ├── category.py
│   │   ├── customer.py
│   │   ├── order.py
│   │   ├── prediction.py
│   │   ├── product.py
│   │   ├── supplier.py
│   │   ├── task.py
│   │   └── user.py
│   │
│   ├── services/                    # Business logic and domain services
│   │   ├── auth_service.py
│   │   ├── category_service.py
│   │   ├── customer_service.py
│   │   ├── order_service.py
│   │   ├── prediction_service.py
│   │   ├── product_service.py
│   │   ├── supplier_service.py
│   │   ├── task_service.py
│   │   └── user_service.py
│   │
│   ├── utils/                       # Shared utility functions
│   │   ├── constraints.py           # Constants, pagination bounds
│   │   └── exceptions.py            # Custom HTTP exception classes
│   │
│   └── main.py                      # FastAPI application entrypoint & CORS
│
├── alembic/                         # Database schema migrations
│   ├── versions/
│   └── env.py
│
├── .env                             # Environment variables (secret)
├── alembic.ini                      # Alembic migration configuration
├── requirements.txt                 # Python project dependencies
├── API_DOCUMENTATION.md             # Complete API documentation & workflows
└── README.md                        # Project overview & quick start
```

---

## 👩‍💻 Author & License

Developed for the **Inventory & Stock Management** enterprise platform.

# Inventory and Stock Management System

Full-stack Enterprise Inventory and Stock Management System featuring Role-Based and Attribute-Based Access Control (RBAC & ABAC), Automated Replenishment, and Machine Learning Delivery Date Prediction powered by XGBoost and Open-Meteo Weather Services.

---

## 📁 Repository Structure

```
Inventory_and_stock_management/
├── backend/                  # FastAPI + SQLAlchemy + PostgreSQL + XGBoost ML Pipeline
│   ├── app/                  # Application Core, Routers, Controllers, Services, ML & Models
│   ├── alembic/              # Database Schema Migrations
│   ├── requirements.txt      # Python Dependencies
│   ├── API_DOCUMENTATION.md  # Complete REST API Specification & Examples
│   └── README.md             # Backend Architecture, Setup & Evaluation Guide
│
└── frontend/                 # Angular 17+ Enterprise SPA with TailwindCSS
    ├── src/                  # Components, Guards, Interceptors, Services & Stores
    ├── angular.json          # Angular CLI Configuration
    ├── package.json          # Frontend Dependencies & NPM Scripts
    └── README.md             # Frontend Design System & Component Guide
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup
```bash
cd Inventory_and_stock_management/backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
* **API Documentation (Swagger UI):** `http://127.0.0.1:8000/docs`
* **ML Evaluation Reports:** `http://127.0.0.1:8000/reports/actual_vs_predicted.png`

### 2. Frontend Setup
```bash
cd Inventory_and_stock_management/frontend
npm install
npm start
```
* **Application Dashboard:** `http://localhost:4200`

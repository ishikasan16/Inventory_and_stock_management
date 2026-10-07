# Inventory & Stock Management System - Frontend

Modern, high-performance web client for enterprise inventory management, order processing, manager-to-staff task delegation (ABAC), and Machine Learning delivery time forecasting.

Built with **Angular 17**, **TypeScript**, **RxJS**, and **Tailwind CSS**.

---

## 🌟 Key Capabilities

- **🔐 Enterprise Authentication & Dual RBAC/ABAC Security**:
  - 5 Granular Roles: `SUPER_ADMIN`, `INVENTORY_MANAGER`, `ORDER_MANAGER`, `INVENTORY_STAFF`, `ORDER_STAFF`.
  - Route-level security with `roleGuard`.
  - Attribute-Based Access Control (ABAC): Staff action buttons (Add Product, Add Category, Add Supplier, Add Customer, Create Order) dynamically unlock only when the user holds an active delegated task with matching scope.
- **📊 Real-Time Analytics Dashboard**:
  - Live inventory valuation metrics, total SKUs, low-stock warnings, and out-of-stock critical alerts.
- **📦 Inventory & Stock Operations**:
  - Product catalog with live search, category/supplier filters, and pagination.
  - Interactive Stock In / Stock Out adjustment modal with audit logging.
  - Category and Supplier management with soft-delete workflows.
- **🛒 Sales Orders & State Machine Tracking**:
  - Multi-line item order placement with dynamic pricing and inventory deficit detection (`AWAITING_STOCK`).
  - Interactive order status progression (`CONFIRMED` → `PROCESSING` → `PACKED` → `SHIPPED` → `OUT_FOR_DELIVERY` → `DELIVERED`).
- **🤖 AI / ML Delivery Time Prediction (XGBoost)**:
  - Integrated one-click delivery date estimation on orders.
  - Leverages 9 database-driven parameters (shortage, supplier lead time, warehouse handling, and courier transit) to forecast exact fulfillment turnaround days.
- **📋 Domain-Scoped Task Delegation**:
  - `INVENTORY_MANAGER` manages `INVENTORY_STAFF` (Scopes: `PRODUCT`, `CATEGORY`, `SUPPLIER`, `NONE`).
  - `ORDER_MANAGER` manages `ORDER_STAFF` (Scopes: `CUSTOMER`, `ORDER`, `NONE`).
  - Dedicated "My Tasks" interface for staff with status updates and deep-linking to target resources.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **Angular 17** | Modern component-based SPA framework |
| **TypeScript** | Type-safe enterprise JavaScript |
| **Tailwind CSS** | Utility-first responsive CSS styling |
| **RxJS** | Reactive state streams & asynchronous event handling |
| **Angular Forms** | Reactive Forms with validation for complex mutations |
| **Angular Router** | Lazy-loaded feature routing with route guards |

---

## ⚙️ Quick Start & Setup

### 1. Prerequisites
- **Node.js**: `18.13.0` or higher
- **npm**: `9.0.0` or higher
- **FastAPI Backend**: Running at `http://127.0.0.1:8000`

### 2. Installation
```bash
# Navigate to the frontend directory
cd Inventory_stock_management_frontend

# Install dependencies
npm install
```

### 3. Start Development Server
```bash
npm start
```
Open your browser and navigate to `http://localhost:4200/`. The app will automatically reload if you change any source files.

---

## 🚀 Available NPM Scripts

| Command | Description |
|---|---|
| `npm start` | Runs the local development server at `http://localhost:4200/` |
| `npm run build` | Compiles production bundle into `dist/` |
| `npm run watch` | Builds and watches for changes |
| `npm test` | Runs unit tests via Karma and ChromeHeadless |

---

## 🧭 Application Routes

| Path | Access Level | Description |
|---|---|---|
| `/login` | Public | User sign-in with email & password |
| `/register` | Public | New user registration |
| `/dashboard` | All Authenticated | Executive KPIs and stock alerts |
| `/products` | Admins, Inv Managers, Inv Staff, Order Managers | Product catalog & stock adjustments |
| `/categories` | Admins, Inv Managers, Inv Staff | Category management |
| `/suppliers` | Admins, Inv Managers, Inv Staff | Supplier directory |
| `/customers` | Admins, Order Managers, Order Staff | Customer records & profiles |
| `/orders` | Admins, Order Managers, Order Staff, Inv Managers | Order placement & state machine |
| `/predictions` | Admins, Order Managers, Order Staff, Inv Managers | ML delivery ETA predictions |
| `/tasks/manage` | Admins, Inv Managers, Order Managers | Assign scoped tasks to staff |
| `/tasks/my-tasks`| All Staff & Managers | Staff task duty board & status updates |
| `/admin/users` | Super Admin Only | User role promotion & team inspection |

---

## 📁 Project Structure

```text
src/
├── app/
│   ├── auth/                       # Authentication, guards, and RBAC utilities
│   │   ├── guards/                 # role.guard.ts, auth.guard.ts
│   │   ├── pages/                  # login & register pages
│   │   └── utils/                  # role-auth.ts, auth-state.ts
│   │
│   ├── layout/                     # App shell (Sidebar, Topbar, Layout wrapper)
│   │
│   ├── features/                   # Lazy-loaded feature modules
│   │   ├── dashboard/              # Analytics dashboard
│   │   ├── products/               # Product list, filters, stock modals
│   │   ├── categories/             # Category management
│   │   ├── suppliers/              # Supplier management
│   │   ├── customers/              # Customer records (ABAC-gated)
│   │   ├── orders/                 # Order creation & state progression
│   │   ├── predictions/            # ML ETA delivery prediction
│   │   ├── tasks/                  # Task assignment & My Tasks
│   │   └── users/                  # Super Admin user administration
│   │
│   ├── services/                   # Injectable Angular HTTP services
│   │   ├── api.service.ts          # Core HTTP client with JWT interceptor
│   │   ├── auth.service.ts         # Login/register/logout
│   │   ├── task.service.ts         # Task assignment & ABAC helpers
│   │   ├── order.service.ts        # Order CRUD & status transitions
│   │   ├── prediction.service.ts   # ML delivery predictions
│   │   └── product.service.ts      # Product & stock updates
│   │
│   ├── app.module.ts               # Root module
│   └── app-routing.module.ts       # Top-level routing
│
├── environments/                   # Environment configurations
│   ├── environment.ts              # Production environment
│   └── environment.development.ts  # Development API URL (http://127.0.0.1:8000)
│
├── styles.css                      # Global Tailwind CSS imports & animations
└── tailwind.config.js              # Tailwind theme configuration
```

---

## 📖 In-Depth Documentation

For complete architectural details, component interactions, ABAC security logic, and full API data contracts, refer to:
👉 **[FRONTEND_DOCUMENTATION.md](file:///c:/Users/Ishika/Desktop/inv-mgmt/Inventory_stock_management_frontend/FRONTEND_DOCUMENTATION.md)**

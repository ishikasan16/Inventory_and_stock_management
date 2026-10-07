# Inventory & Stock Management System - Backend Documentation

Comprehensive architecture, end-to-end workflows, role-based access control (RBAC), and complete API endpoint reference with sample payloads for the **Inventory & Stock Management** backend.

---

## 📑 Table of Contents
1. [System Overview & Architecture](#system-overview--architecture)
2. [Database Schema & Data Models](#database-schema--data-models)
3. [Authentication & Authorization (RBAC + ABAC)](#authentication--authorization-rbac--abac)
4. [End-to-End Business Workflows](#end-to-end-business-workflows)
   - [Authentication & Session Flow](#1-authentication--session-lifecycle)
   - [Product & Inventory Management Flow](#2-product--inventory-management-flow)
   - [Order Lifecycle & State Transitions](#3-order-processing--status-state-machine)
   - [Manager-Staff Task Delegation Flow](#4-manager-staff-task-delegation--abac-flow)
   - [Machine Learning Delivery Prediction Flow](#5-machine-learning-delivery-prediction-flow)
5. [Complete API Endpoints Reference & Sample Payloads](#complete-api-endpoints-reference)
   - [Authentication Endpoints (`/api/v1/auth`)](#1-authentication-endpoints-apiv1auth)
   - [Users & Team Endpoints (`/api/v1/users`)](#2-users--team-management-apiv1users)
   - [Category Endpoints (`/api/v1/categories`)](#3-categories-apiv1categories)
   - [Supplier Endpoints (`/api/v1/suppliers`)](#4-suppliers-apiv1suppliers)
   - [Product Endpoints (`/api/v1/products`)](#5-products-apiv1products)
   - [Customer Endpoints (`/api/v1/customers`)](#6-customers-apiv1customers)
   - [Order Endpoints (`/api/v1/orders`)](#7-orders-apiv1orders)
   - [Task Delegation Endpoints (`/api/v1/tasks`)](#8-task-management-apiv1tasks)
   - [ML Delivery Prediction Endpoints (`/api/v1/predictions`)](#9-delivery-prediction-apiv1predictions)
6. [Setup, Execution & Database Migrations](#setup-execution--database-migrations)

---

## System Overview & Architecture

The backend is built with **FastAPI** following a multi-tier layered architecture:

```
FastAPI Router (app/api/v1)
        ↓
Controller Layer (app/controllers) -> Translates HTTP & maps custom exceptions
        ↓
Service Layer (app/services)       -> Encapsulates business logic, state machines & rules
        ↓
ORM & Data Access (SQLAlchemy)     -> Maps models, relations, transactions & constraints
        ↓
PostgreSQL Database                -> Relational storage with UUID primary keys & foreign keys
```

### Key Technical Characteristics
- **Framework**: FastAPI (Python 3.10+) with Uvicorn ASGI server.
- **Database & ORM**: PostgreSQL via SQLAlchemy 2.0 with Alembic database migrations.
- **Identity & Keys**: All entity IDs use standard `UUIDv4`.
- **Validation**: Strict typing and request/response serialisation with Pydantic v2.
- **Security**: JWT dual-token mechanism (short-lived access tokens + HttpOnly cookie refresh tokens) with instant database token revocation (`RevokedToken`).
- **Machine Learning**: Integrated XGBoost regressor (`xgboost-v3`) predicting order delivery fulfillment days based on warehouse stock, shortage deficit, transit distance, shipping mode, and Open-Meteo 5-day transit window weather.

---

## Database Schema & Data Models

| Entity | Table Name | Key Attributes | Notes & Relations |
|---|---|---|---|
| **User** | `users` | `id` (UUID), `username`, `email`, `password_hash`, `role`, `manager_id` | Self-referencing FK `manager_id -> users.id` for hierarchical reporting. |
| **RevokedToken**| `revoked_tokens` | `id`, `jti` (UUID), `expires_at`, `token_type` | Revocation blacklist for access & refresh tokens on logout. |
| **Category** | `categories` | `id`, `name`, `description`, `is_deleted`, `created_at` | Soft delete via `is_deleted = True`. 1-to-N with `products`. |
| **Supplier** | `suppliers` | `id`, `name`, `contact_email`, `phone`, `address`, `is_deleted` | Soft delete via `is_deleted = True`. 1-to-N with `products`. |
| **Product** | `products` | `id`, `name`, `sku`, `category_id`, `supplier_id`, `unit_price`, `quantity_in_stock`, `reorder_level`, `is_active` | FK to `categories` and `suppliers`. Unique SKU. Computed `stock_status`. |
| **Customer** | `customers` | `id`, `name`, `email`, `phone`, `residential_address`, `delivery_address`, `address`, `created_at`, `updated_at` | 1-to-N with `orders`. `delivery_address` is used by the ML pipeline to estimate road distance & 5-day transit weather. |
| **Order** | `orders` | `id`, `customer_id`, `order_date`, `status`, `total_amount`, `predicted_delivery_date`, `actual_delivery_date` | FK to `customers`. Cascades to `order_items` and `order_tracking`. |
| **OrderItem** | `order_items` | `id`, `order_id`, `product_id`, `quantity`, `unit_price`, `subtotal` | FK to `orders` and `products`. |
| **OrderTracking**| `order_tracking` | `id`, `order_id`, `status`, `timestamp`, `notes` | Audit trail of order status transitions. |
| **Task** | `tasks` | `id`, `title`, `description`, `priority`, `status`, `due_date`, `assigned_to_id`, `assigned_by_id`, `target_type`, `target_id` | FK to `users` for creator & assignee. Polymorphic link to `PRODUCT`, `CATEGORY`, `SUPPLIER`, `CUSTOMER`, `ORDER`, or `NONE`. |
| **PurchaseOrder**| `purchase_orders` | `id`, `supplier_id`, `status`, `order_date`, `expected_date`, `received_date` | B2B supplier procurement tracking. |
| **StockMovement**| `stock_movements` | `id`, `product_id`, `quantity`, `movement_type`, `reference_id` | Audit log of inventory adjustments. |

---

## Authentication & Authorization (RBAC + ABAC)

### 1. User Roles
The application defines 5 distinct user roles:
1. `SUPER_ADMIN`: Root privileges. Can view/manage all users, roles, tasks, categories, suppliers, products, customers, and orders across the organization.
2. `INVENTORY_MANAGER`: Oversees warehouse inventory. Manages inventory staff, creates inventory-scoped tasks (`PRODUCT`, `CATEGORY`, `SUPPLIER`), and has unrestricted write access to products, categories, and suppliers.
3. `ORDER_MANAGER`: Oversees sales fulfillment and customer relations. Manages order staff, creates order-scoped tasks (`CUSTOMER`, `ORDER`), and has unrestricted write access to customers and orders.
4. `INVENTORY_STAFF`: Warehouse floor operator. Can only create or edit products, categories, and suppliers if assigned an active task for that item/scope.
5. `ORDER_STAFF`: Order fulfillment operator. Can only create or edit customers and create orders if assigned an active task for that item/scope.

### 2. Safeguards & Access Control Rules
- **Bootstrap Rule**: The first user ever registered automatically receives the `SUPER_ADMIN` role. All subsequent registrations default to `INVENTORY_STAFF`.
- **Last Super Admin Protection**: The system prevents demoting or deleting the last active `SUPER_ADMIN`.
- **Manager-Staff Hierarchy & Domain Separation**:
  - `INVENTORY_MANAGER` can assign tasks **only** to `INVENTORY_STAFF` with scopes `NONE`, `PRODUCT`, `CATEGORY`, or `SUPPLIER`.
  - `ORDER_MANAGER` can assign tasks **only** to `ORDER_STAFF` with scopes `NONE`, `CUSTOMER`, or `ORDER`.
  - `SUPER_ADMIN` can assign tasks to any staff member with any scope.
  - Once a staff member is assigned to a manager, other managers cannot reassign or hijack that staff member.
- **Attribute-Based Access Control (Task-Gated Mutations)**:
  - **Read Access**: All authenticated users can view/list products, categories, suppliers, orders, and customer records.
  - **Write Access (Create)**:
    - Super admins & managers: Allowed unconditionally within their respective domain.
    - Staff members: Must hold an active (`status != 'COMPLETED'`) task matching `target_type` (e.g. `PRODUCT`, `CATEGORY`, `SUPPLIER`, `CUSTOMER`, or `ORDER`).
  - **Write Access (Update / Delete / Stock Adjust)**:
    - Super admins & managers: Allowed unconditionally within their respective domain.
    - Staff members: Must hold an active task where `target_type == entity` AND `target_id == record.id` (or a type-level task if record-specific target was not bounded).

---

## End-to-End Business Workflows

### 1. Authentication & Session Lifecycle
```text
Client                          FastAPI Backend                 Database
  |                                   |                            |
  |--- POST /auth/register ---------->|-- Verify email & count --->|
  |                                   |-- Hash password (bcrypt) ->|
  |<-- 201 Created (User details) ----|-- Save user --------------->|
  |                                   |                            |
  |--- POST /auth/login ------------->|-- Verify password --------->|
  |                                   |-- Generate Access Token    |
  |                                   |-- Generate Refresh Token   |
  |<-- 200 OK ------------------------|                            |
  |    (Body: access_token, role)     |                            |
  |    (Set-Cookie: HttpOnly refresh) |                            |
  |                                   |                            |
  |--- GET /products (Bearer token) ->|-- Decode JWT & check jti ->|
  |<-- 200 OK (Products list) --------|                            |
  |                                   |                            |
  |--- POST /auth/logout ------------>|-- Store JTIs in RevokedToken
  |<-- 200 OK (Cookie deleted) -------|-- Blacklisted tokens ----->|
```

### 2. Product & Inventory Management Flow
1. **Creation**: `POST /api/v1/products` validates category and supplier exist and ensures the SKU is unique.
2. **Stock Status Calculation**: Automatically evaluated on every query:
   - `quantity_in_stock == 0` → `"out of stock"`
   - `0 < quantity_in_stock <= reorder_level` → `"low stock"`
   - `quantity_in_stock > reorder_level` → `"in stock"`
3. **Stock Adjustments**: `PATCH /api/v1/products/{id}/stock` accepts operation `"IN"` (increases stock) or `"OUT"` (decreases stock). Prevents negative inventory and records operational reason.
4. **Summary & Metrics**: `GET /api/v1/products/summary` provides instant aggregated dashboard counts (total items, total inventory value in currency, low-stock count, and out-of-stock count).

### 3. Order Processing & Status State Machine
When a customer order is placed, the backend calculates totals and dynamically evaluates stock availability:
- If any requested product has `product.quantity_in_stock < requested_quantity`, initial status is `AWAITING_STOCK`.
- Otherwise, initial status is `CONFIRMED`.

#### State Machine Flowchart:
```text
           [ ORDER_PLACED ]
               /      \
              /        \
             ↓          ↓
       [ CONFIRMED ]  [ CANCELLED ]
          /     \
         ↓       ↓
 [ PROCESSING ] [ AWAITING_STOCK ]
       |     \          |
       |      \         ↓
       |       --> [ SUPPLIER_ORDER_PLACED ]
       |                |
       |                ↓
       |         [ STOCK_RECEIVED ]
       |                |
       |                ↓
       +---------> [ PACKED ]
                        |
                        ↓
                   [ SHIPPED ]
                        |
                        ↓
              [ OUT_FOR_DELIVERY ]
                        |
                        ↓
                  [ DELIVERED ]
```

### 4. Manager-Staff Task Delegation & ABAC Flow
1. Manager creates a task via `POST /api/v1/tasks/` specifying:
   - Title, description, priority (`LOW`, `MEDIUM`, `HIGH`), due date.
   - Assigned staff member (`assigned_to_id`).
   - Domain-specific Scope:
     - `INVENTORY_MANAGER`: `PRODUCT`, `CATEGORY`, `SUPPLIER`, or `NONE`.
     - `ORDER_MANAGER`: `CUSTOMER`, `ORDER`, or `NONE`.
     - Optional `target_id` (UUID of existing entity, or `null` for type-level create permissions).
2. The staff member logs in and queries `GET /api/v1/tasks/my` to retrieve assigned duties.
3. The staff member navigates directly to the target feature. The FastAPI dependencies (`ensure_create_access` / `ensure_record_access`) validate that the staff member holds an active task targeting that resource.
4. Once finished, the staff member updates the task status to `COMPLETED` via `PATCH /api/v1/tasks/{id}/status`.
5. Write access for that record or scope is immediately and automatically revoked.

### 5. Machine Learning Delivery Prediction Flow
The system utilizes a trained **XGBoost Regressor (`xgboost-v3`)** to forecast exact order fulfillment turnaround in days and compute the estimated delivery date (`order_date + predicted_fulfillment_days`). It integrates real-time inventory stock levels, transit distance from Central Warehouse Hub, shipping tier, and an automated **5-day transit window weather forecast** from Open-Meteo (zero API keys required).

#### The 10 Prediction Parameters & Real-Time Extraction Rules

When an order delivery prediction is requested (`POST /api/v1/predictions/orders/{order_id}` or `POST /api/v1/predictions/delivery`), the following 10 parameters are determined:

| # | Parameter | Source / Category | How It Is Evaluated / Business Logic |
|---|---|---|---|
| **1** | `order_date` | Order Record | Placed timestamp (`order.order_date`). Baseline for ETA calculation. |
| **2** | `order_quantity` | Order Items | Total units across all line items: $\sum \text{item.quantity}$. Higher volume increases picking/handling time. |
| **3** | `number_of_items` | Order Items | Distinct line items in order: $\text{count}(\text{items})$. Multiple distinct SKUs require multiple picking bins. |
| **4** | `current_stock` | Inventory Database | Sum of on-hand warehouse stock for all products in the order: $\sum \text{product.quantity\_in\_stock}$. |
| **5** | `reorder_level` | Inventory Database | Safety stock threshold: $\max(\text{product.reorder\_level})$. |
| **6** | `shortage_quantity` | Calculated Feature | Inventory deficit: $\max(\text{order\_quantity} - \text{current\_stock}, 0)$. If stock is sufficient, this is `0`. |
| **7** | `distance_km` | Geospatial Logistics | Road transit distance between Central Warehouse Hub and Customer delivery city (e.g. Local $\approx 45$ km, Regional $\approx 350$ km, Interstate $\approx 1200+$ km). |
| **8** | `shipping_mode` | Logistics Tier | Binary shipping speed: `0` for Standard (~350 km/day), `1` for Express (~600 km/day). |
| **9** | `rainy_days_in_transit` | Open-Meteo API | Adverse/rainy days detected in the 5-day shipment transit window starting from `order_date`. Adds realistic transit buffer (+0.55 days/rainy day). |
| **10**| `supplier_lead_time` | Warehouse / Supplier Rule | Replenishment buffer if deficit exists:<br>• **4.0 days** if shortage (`current_stock < order_quantity`).<br>• **1.5 days** if in stock (`current_stock >= order_quantity`). |
| **11**| `processing_time` | Warehouse Operations | Standard picking, packing, QC inspection, and invoice labeling: **1.0 day**. |

#### Prediction Workflow:
1. When calling `POST /api/v1/predictions/orders/{order_id}`, the backend queries line items and joins product stock.
2. Checks order state: rejects orders already `DELIVERED` or `CANCELLED`.
3. Resolves customer destination city to compute `distance_km`.
4. Calls Open-Meteo for a 5-day transit window weather query to detect rain/storm risks without any API keys.
5. Derives the 10 parameters automatically using the rules above.
6. Passes the feature vector through the XGBoost model pipeline (`app/ml/predict.py`).
7. Updates `orders.predicted_delivery_date` in PostgreSQL automatically and returns the payload with a human-readable logistics explanation to the frontend.

---

## Complete API Endpoints Reference

### Base URL
- Local: `http://127.0.0.1:8000/api/v1`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`

---

### 1. Authentication Endpoints (`/api/v1/auth`)

#### 1.1 Register User
- **Method**: `POST`
- **Path**: `/auth/register`
- **Auth Required**: None (Public)
- **Status Code**: `201 Created`
- **Request Body**:
```json
{
  "username": "ishika_dev",
  "email": "ishika@example.com",
  "password": "SecurePassword123!",
  "confirm_password": "SecurePassword123!"
}
```
- **Response (`201 Created`)**:
```json
{
  "id": "e0b5fa21-5a04-4c47-8a6f-31b32d2012a4",
  "username": "ishika_dev",
  "email": "ishika@example.com",
  "role": "SUPER_ADMIN"
}
```

#### 1.2 Login
- **Method**: `POST`
- **Path**: `/auth/login`
- **Auth Required**: None (Public)
- **Status Code**: `200 OK`
- **Sets Cookie**: `refresh_token=<token>; HttpOnly; Path=/api/v1/auth; Max-Age=604800`
- **Request Body**:
```json
{
  "email": "ishika@example.com",
  "password": "SecurePassword123!"
}
```
- **Response (`200 OK`)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "role": "SUPER_ADMIN",
  "username": "ishika_dev"
}
```

#### 1.3 Refresh Access Token
- **Method**: `POST`
- **Path**: `/auth/refresh`
- **Auth Required**: Refresh token cookie
- **Request Headers / Cookies**:
```text
Cookie: refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- **Response (`200 OK`)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### 1.4 Logout
- **Method**: `POST`
- **Path**: `/auth/logout`
- **Auth Required**: Bearer Access Token + Refresh Token Cookie
- **Request Headers**:
```text
Authorization: Bearer <access_token>
Cookie: refresh_token=<refresh_token>
```
- **Response (`200 OK`)**:
```json
{
  "message": "Logout successful"
}
```

---

### 2. Users & Team Management (`/api/v1/users`)

#### 2.1 List All Users (Paginated)
- **Method**: `GET`
- **Path**: `/users/?page=1&page_size=10`
- **Auth Required**: Bearer Token (`SUPER_ADMIN` only)
- **Query Parameters**:
  - `page` (int, default: 1, ge: 1)
  - `page_size` (int, default: 10, ge: 1, le: 100)
- **Response (`200 OK`)**:
```json
{
  "items": [
    {
      "id": "e0b5fa21-5a04-4c47-8a6f-31b32d2012a4",
      "username": "ishika_dev",
      "email": "ishika@example.com",
      "role": "SUPER_ADMIN"
    },
    {
      "id": "c328e63a-9c64-4cab-a9a1-100d9e07c0b0",
      "username": "john_inv_mgr",
      "email": "john@example.com",
      "role": "INVENTORY_MANAGER"
    }
  ],
  "page": 1,
  "page_size": 10,
  "total": 2,
  "total_pages": 1
}
```

#### 2.2 List Managed Team Members (Paginated)
- **Method**: `GET`
- **Path**: `/users/team?page=1&page_size=10`
- **Auth Required**: Bearer Token (`INVENTORY_MANAGER`, `ORDER_MANAGER`, or `SUPER_ADMIN`)
- **Query Parameters**:
  - `page` (int, default: 1, ge: 1)
  - `page_size` (int, default: 10, ge: 1, le: 100)
- **Description**: Returns staff members already directly assigned to this manager, plus unassigned staff members eligible for this manager's department (e.g. `INVENTORY_STAFF` for `INVENTORY_MANAGER`, and `ORDER_STAFF` for `ORDER_MANAGER`).
- **Response (`200 OK`)**:
```json
{
  "items": [
    {
      "id": "f81f263a-76f8-44bf-a08c-be87f930fcd7",
      "username": "staff_member_1",
      "email": "staff1@example.com",
      "role": "INVENTORY_STAFF"
    }
  ],
  "page": 1,
  "page_size": 10,
  "total": 1,
  "total_pages": 1
}
```

#### 2.3 Update User Role
- **Method**: `PATCH`
- **Path**: `/users/{user_id}/role`
- **Auth Required**: Bearer Token (`SUPER_ADMIN` only)
- **Request Body**:
```json
{
  "role": "INVENTORY_MANAGER"
}
```
- **Response (`200 OK`)**:
```json
{
  "id": "f81f263a-76f8-44bf-a08c-be87f930fcd7",
  "username": "staff_member_1",
  "email": "staff1@example.com",
  "role": "INVENTORY_MANAGER"
}
```

---

### 3. Categories (`/api/v1/categories`)

#### 3.1 Create Category
- **Method**: `POST`
- **Path**: `/categories/`
- **Auth Required**: Bearer Token (Unrestricted or Staff with `CATEGORY` creation task)
- **Request Body**:
```json
{
  "name": "Electronics",
  "description": "Smartphones, laptops, monitors and home appliances"
}
```
- **Response (`201 Created`)**:
```json
{
  "id": "533a15dd-5c2d-4037-81f4-de00b87e68a2",
  "name": "Electronics",
  "description": "Smartphones, laptops, monitors and home appliances",
  "created_at": "2026-09-23T14:30:00Z"
}
```

#### 3.2 List Categories (Paginated)
- **Method**: `GET`
- **Path**: `/categories/?page=1&page_size=10`
- **Auth Required**: Bearer Token
- **Query Parameters**:
  - `page` (int, default: 1, ge: 1)
  - `page_size` (int, default: 10, ge: 1, le: 100)
- **Response (`200 OK`)**:
```json
{
  "items": [
    {
      "id": "533a15dd-5c2d-4037-81f4-de00b87e68a2",
      "name": "Electronics",
      "description": "Smartphones, laptops, monitors and home appliances",
      "created_at": "2026-09-23T14:30:00Z"
    }
  ],
  "page": 1,
  "page_size": 10,
  "total": 1,
  "total_pages": 1
}
```

#### 3.3 Get Category by ID
- **Method**: `GET`
- **Path**: `/categories/{category_id}`
- **Auth Required**: Bearer Token
- **Response (`200 OK`)**:
```json
{
  "id": "533a15dd-5c2d-4037-81f4-de00b87e68a2",
  "name": "Electronics",
  "description": "Smartphones, laptops, monitors and home appliances",
  "created_at": "2026-09-23T14:30:00Z"
}
```

#### 3.4 Update Category
- **Method**: `PUT`
- **Path**: `/categories/{category_id}`
- **Auth Required**: Bearer Token (Unrestricted or Staff with assigned task for this ID)
- **Request Body**:
```json
{
  "name": "Consumer Electronics",
  "description": "Updated category description"
}
```
- **Response (`200 OK`)**:
```json
{
  "id": "533a15dd-5c2d-4037-81f4-de00b87e68a2",
  "name": "Consumer Electronics",
  "description": "Updated category description",
  "created_at": "2026-09-23T14:30:00Z"
}
```

#### 3.5 Soft Delete Category
- **Method**: `DELETE`
- **Path**: `/categories/{category_id}`
- **Auth Required**: Bearer Token (Unrestricted or Staff with assigned task for this ID)
- **Response**: `204 No Content`

---

### 4. Suppliers (`/api/v1/suppliers`)

#### 4.1 Create Supplier
- **Method**: `POST`
- **Path**: `/suppliers/`
- **Auth Required**: Bearer Token (Unrestricted or Staff with `SUPPLIER` creation task)
- **Request Body**:
```json
{
  "name": "Samsung Logistics Corp",
  "contact_email": "orders@samsung-logistics.com",
  "phone": "9876543210",
  "address": "Building 5, Tech Innovation Park, Seoul"
}
```
- **Response (`201 Created`)**:
```json
{
  "id": "8ff19537-9752-4646-8a4f-bc947fed6ce0",
  "name": "Samsung Logistics Corp",
  "contact_email": "orders@samsung-logistics.com",
  "phone": "9876543210",
  "address": "Building 5, Tech Innovation Park, Seoul",
  "created_at": "2026-09-23T14:32:00Z"
}
```

#### 4.2 List Suppliers (Paginated)
- **Method**: `GET`
- **Path**: `/suppliers/?page=1&page_size=10`
- **Auth Required**: Bearer Token
- **Query Parameters**:
  - `page` (int, default: 1, ge: 1)
  - `page_size` (int, default: 10, ge: 1, le: 100)
- **Response (`200 OK`)**:
```json
{
  "items": [
    {
      "id": "8ff19537-9752-4646-8a4f-bc947fed6ce0",
      "name": "Samsung Logistics Corp",
      "contact_email": "orders@samsung-logistics.com",
      "phone": "9876543210",
      "address": "Building 5, Tech Innovation Park, Seoul",
      "created_at": "2026-09-23T14:32:00Z"
    }
  ],
  "page": 1,
  "page_size": 10,
  "total": 1,
  "total_pages": 1
}
```

#### 4.3 Get Supplier by ID
- **Method**: `GET`
- **Path**: `/suppliers/{supplier_id}`
- **Auth Required**: Bearer Token
- **Response (`200 OK`)**: Same as single supplier representation.

#### 4.4 Update Supplier
- **Method**: `PUT`
- **Path**: `/suppliers/{supplier_id}`
- **Auth Required**: Bearer Token (Unrestricted or Staff with task for this ID)
- **Request Body**:
```json
{
  "name": "Samsung Global Suppliers",
  "contact_email": "b2b@samsung.com",
  "phone": "9876543210",
  "address": "Global HQ, Seoul"
}
```
- **Response (`200 OK`)**: Updated supplier object.

#### 4.5 Soft Delete Supplier
- **Method**: `DELETE`
- **Path**: `/suppliers/{supplier_id}`
- **Auth Required**: Bearer Token (Unrestricted or Staff with task for this ID)
- **Response**: `204 No Content`

---

### 5. Products (`/api/v1/products`)

#### 5.1 Create Product
- **Method**: `POST`
- **Path**: `/products/`
- **Auth Required**: Bearer Token (Unrestricted or Staff with `PRODUCT` creation task)
- **Request Body**:
```json
{
  "name": "Galaxy Ultra Book 4",
  "sku": "SAM-GUB4-001",
  "category_id": "533a15dd-5c2d-4037-81f4-de00b87e68a2",
  "supplier_id": "8ff19537-9752-4646-8a4f-bc947fed6ce0",
  "unit_price": 1299.99,
  "quantity_in_stock": 25,
  "reorder_level": 5
}
```
- **Response (`201 Created`)**:
```json
{
  "id": "733784bb-7a4b-45fa-a9c8-f23677d3a141",
  "name": "Galaxy Ultra Book 4",
  "sku": "SAM-GUB4-001",
  "category_id": "533a15dd-5c2d-4037-81f4-de00b87e68a2",
  "supplier_id": "8ff19537-9752-4646-8a4f-bc947fed6ce0",
  "unit_price": "1299.99",
  "quantity_in_stock": 25,
  "reorder_level": 5,
  "is_active": true,
  "stock_status": "in stock",
  "created_at": "2026-09-23T14:35:00Z",
  "updated_at": "2026-09-23T14:35:00Z"
}
```

#### 5.2 List Products (Paginated with Filters)
- **Method**: `GET`
- **Path**: `/products/?page=1&page_size=10&search=Galaxy&stock_status=in%20stock`
- **Auth Required**: Bearer Token
- **Query Parameters**:
  - `page` (int, default: 1, ge: 1)
  - `page_size` (int, default: 10, ge: 1, le: 100)
  - `search` (string, optional: matches name or sku via ILIKE)
  - `category_id` (UUID, optional)
  - `stock_status` (string, optional: `"in stock"` | `"low stock"` | `"out of stock"`)
- **Response (`200 OK`)**:
```json
{
  "items": [
    {
      "id": "733784bb-7a4b-45fa-a9c8-f23677d3a141",
      "name": "Galaxy Ultra Book 4",
      "sku": "SAM-GUB4-001",
      "category_id": "533a15dd-5c2d-4037-81f4-de00b87e68a2",
      "supplier_id": "8ff19537-9752-4646-8a4f-bc947fed6ce0",
      "unit_price": "1299.99",
      "quantity_in_stock": 25,
      "reorder_level": 5,
      "is_active": true,
      "stock_status": "in stock",
      "created_at": "2026-09-23T14:35:00Z",
      "updated_at": "2026-09-23T14:35:00Z"
    }
  ],
  "page": 1,
  "page_size": 10,
  "total": 1,
  "total_pages": 1
}
```

#### 5.3 Product Inventory Summary Dashboard
- **Method**: `GET`
- **Path**: `/products/summary`
- **Auth Required**: Bearer Token
- **Response (`200 OK`)**:
```json
{
  "total_products": 42,
  "total_stock_value": "158420.50",
  "low_stock_count": 4,
  "out_of_stock_count": 2
}
```

#### 5.4 Get Product by ID
- **Method**: `GET`
- **Path**: `/products/{product_id}`
- **Auth Required**: Bearer Token
- **Response (`200 OK`)**: Product details with current `stock_status`.

#### 5.5 Update Product
- **Method**: `PUT`
- **Path**: `/products/{product_id}`
- **Auth Required**: Bearer Token (Unrestricted or Staff with task for this product)
- **Request Body**:
```json
{
  "name": "Galaxy Ultra Book 4 Pro",
  "unit_price": 1399.99,
  "reorder_level": 8
}
```
- **Response (`200 OK`)**: Updated product response.

#### 5.6 Adjust Stock (Stock In / Stock Out)
- **Method**: `PATCH`
- **Path**: `/products/{product_id}/stock`
- **Auth Required**: Bearer Token (Unrestricted or Staff with task for this product)
- **Request Body**:
```json
{
  "quantity": 10,
  "operation": "IN",
  "reason": "Restocked from purchase order PO-2026-09-001"
}
```
*(Use `"operation": "OUT"` to deduct items; checks that remaining stock does not drop below 0).*
- **Response (`200 OK`)**: Updated product response with refreshed `quantity_in_stock` and `stock_status`.

#### 5.7 Soft Delete Product
- **Method**: `DELETE`
- **Path**: `/products/{product_id}`
- **Auth Required**: Bearer Token (Unrestricted or Staff with task for this product)
- **Response**: `204 No Content` (Sets `is_active = False`).

---

### 6. Customers (`/api/v1/customers`)

#### 6.1 Create Customer
- **Method**: `POST`
- **Path**: `/customers/`
- **Auth Required**: Bearer Token
  - Allowed: `SUPER_ADMIN`, `ORDER_MANAGER`.
  - For `ORDER_STAFF`: Requires an active task (`status != 'COMPLETED'`) with `target_type == 'CUSTOMER'`.
- **Request Body**:
```json
{
  "name": "Sarah Connor",
  "email": "sarah.connor@example.com",
  "phone": "+91 98765 43210",
  "residential_address": "Flat 12B, Palm Grove Residency, Noida Sector 62, UP 201301",
  "delivery_address": "402 Business Tower, Bandra Kurla Complex, Mumbai, Maharashtra 400051"
}
```
- **Response (`201 Created`)**:
```json
{
  "id": "18c8e11a-0db5-48b2-8419-f521b44d2162",
  "name": "Sarah Connor",
  "email": "sarah.connor@example.com",
  "phone": "+91 98765 43210",
  "residential_address": "Flat 12B, Palm Grove Residency, Noida Sector 62, UP 201301",
  "delivery_address": "402 Business Tower, Bandra Kurla Complex, Mumbai, Maharashtra 400051",
  "address": "402 Business Tower, Bandra Kurla Complex, Mumbai, Maharashtra 400051",
  "created_at": "2026-09-23T14:40:00Z",
  "updated_at": "2026-09-23T14:40:00Z"
}
```

#### 6.2 List Customers (Paginated)
- **Method**: `GET`
- **Path**: `/customers/?page=1&page_size=10`
- **Auth Required**: Bearer Token (Any authenticated user)
- **Query Parameters**:
  - `page` (int, default: 1, ge: 1)
  - `page_size` (int, default: 10, ge: 1, le: 100)
- **Response (`200 OK`)**:
```json
{
  "items": [
    {
      "id": "18c8e11a-0db5-48b2-8419-f521b44d2162",
      "name": "Sarah Connor",
      "email": "sarah.connor@example.com",
      "phone": "+91 98765 43210",
      "residential_address": "Flat 12B, Palm Grove Residency, Noida Sector 62, UP 201301",
      "delivery_address": "402 Business Tower, Bandra Kurla Complex, Mumbai, Maharashtra 400051",
      "address": "402 Business Tower, Bandra Kurla Complex, Mumbai, Maharashtra 400051",
      "created_at": "2026-09-23T14:40:00Z",
      "updated_at": "2026-09-23T14:40:00Z"
    }
  ],
  "page": 1,
  "page_size": 10,
  "total": 1,
  "total_pages": 1
}
```

#### 6.3 Get Customer by ID
- **Method**: `GET`
- **Path**: `/customers/{customer_id}`
- **Auth Required**: Bearer Token (Any authenticated user)
- **Response (`200 OK`)**: Single customer details with residential and delivery addresses.

#### 6.4 Update Customer
- **Method**: `PUT`
- **Path**: `/customers/{customer_id}`
- **Auth Required**: Bearer Token
  - Allowed: `SUPER_ADMIN`, `ORDER_MANAGER`.
  - For `ORDER_STAFF`: Requires an active task targeting `CUSTOMER` with matching `target_id == customer_id` (or unbounded customer type-level task).
- **Request Body**:
```json
{
  "phone": "+91 98765 99999",
  "delivery_address": "742 Commercial Road, Bengaluru, Karnataka 560001"
}
```
- **Response (`200 OK`)**: Updated customer object.

---

### 7. Orders (`/api/v1/orders`)

#### 7.1 Create Order
- **Method**: `POST`
- **Path**: `/orders/`
- **Auth Required**: Bearer Token
  - Allowed: `SUPER_ADMIN`, `ORDER_MANAGER`.
  - For `ORDER_STAFF`: Requires an active task (`status != 'COMPLETED'`) with `target_type == 'ORDER'`.
- **Request Body**:
```json
{
  "customer_id": "18c8e11a-0db5-48b2-8419-f521b44d2162",
  "items": [
    {
      "product_id": "733784bb-7a4b-45fa-a9c8-f23677d3a141",
      "quantity": 2
    }
  ]
}
```
- **Response (`201 Created`)**:
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "customer_id": "18c8e11a-0db5-48b2-8419-f521b44d2162",
  "order_date": "2026-09-23T14:45:00Z",
  "status": "CONFIRMED",
  "total_amount": "2599.98",
  "predicted_delivery_date": null,
  "actual_delivery_date": null,
  "items": [
    {
      "id": "3146d6b8-20cf-46d9-813f-14f762294101",
      "product_id": "733784bb-7a4b-45fa-a9c8-f23677d3a141",
      "quantity": 2,
      "unit_price": "1299.99",
      "subtotal": "2599.98"
    }
  ],
  "created_at": "2026-09-23T14:45:00Z",
  "updated_at": "2026-09-23T14:45:00Z"
}
```
*(If warehouse stock for any ordered item is lower than requested quantity, order status is automatically set to `"AWAITING_STOCK"`, and the system instantly dispatches a high-priority `"Restock Required: <Product Name> (Shortage: <Qty>)"` task assigned directly to the `INVENTORY_MANAGER` with product scope).*


#### 7.2 List Orders (Paginated)
- **Method**: `GET`
- **Path**: `/orders/?page=1&page_size=10`
- **Auth Required**: Bearer Token (Any authenticated user)
- **Query Parameters**:
  - `page` (int, default: 1, ge: 1)
  - `page_size` (int, default: 10, ge: 1, le: 100)
- **Response (`200 OK`)**:
```json
{
  "items": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "customer_id": "18c8e11a-0db5-48b2-8419-f521b44d2162",
      "order_date": "2026-09-23T14:45:00Z",
      "status": "CONFIRMED",
      "total_amount": "2599.98",
      "predicted_delivery_date": null,
      "actual_delivery_date": null,
      "items": [
        {
          "id": "3146d6b8-20cf-46d9-813f-14f762294101",
          "product_id": "733784bb-7a4b-45fa-a9c8-f23677d3a141",
          "quantity": 2,
          "unit_price": "1299.99",
          "subtotal": "2599.98"
        }
      ],
      "created_at": "2026-09-23T14:45:00Z",
      "updated_at": "2026-09-23T14:45:00Z"
    }
  ],
  "page": 1,
  "page_size": 10,
  "total": 1,
  "total_pages": 1
}
```

#### 7.3 Get Order by ID
- **Method**: `GET`
- **Path**: `/orders/{order_id}`
- **Auth Required**: Bearer Token (Any authenticated user)
- **Response (`200 OK`)**: Single order details with items, subtotal breakdown, and predicted/actual delivery dates.

#### 7.4 Update Order Status
- **Method**: `PATCH`
- **Path**: `/orders/{order_id}/status`
- **Auth Required**: Bearer Token (`SUPER_ADMIN`, `ORDER_MANAGER`, or staff with assigned order task)
- **Request Body**:
```json
{
  "status": "DELIVERED",
  "actual_delivery_date": "2026-09-28T14:45:00Z"
}
```
*(Note: `actual_delivery_date` is optional. When transitioning status to `"DELIVERED"`, if omitted, the system automatically stamps `actual_delivery_date` with the current UTC timestamp `now(timezone.utc)`).*
- **Response (`200 OK`)**: Updated order object with populated `actual_delivery_date`.
- **Enforced Transitions**: Attempting invalid state transitions (e.g. `ORDER_PLACED` directly to `DELIVERED`) throws `400 Bad Request`.

---

### 8. Task Management (`/api/v1/tasks`)

#### 8.1 Create Task
- **Method**: `POST`
- **Path**: `/tasks/`
- **Auth Required**: Bearer Token (`SUPER_ADMIN`, `INVENTORY_MANAGER`, `ORDER_MANAGER`)
- **Domain Scope Enforcement**:
  - `INVENTORY_MANAGER`: Allowed `target_type` values are `NONE`, `PRODUCT`, `CATEGORY`, `SUPPLIER`. Can assign only to `INVENTORY_STAFF`.
  - `ORDER_MANAGER`: Allowed `target_type` values are `NONE`, `CUSTOMER`, `ORDER`. Can assign only to `ORDER_STAFF`.
  - `SUPER_ADMIN`: Can assign any scope (`NONE`, `PRODUCT`, `CATEGORY`, `SUPPLIER`, `CUSTOMER`, `ORDER`) to any staff member.
- **Request Body**:
```json
{
  "title": "Audit Laptop Inventory & Reorder",
  "description": "Verify physical count of Galaxy laptops and update the database accordingly.",
  "priority": "HIGH",
  "due_date": "2026-10-05T18:00:00Z",
  "assigned_to_id": "f81f263a-76f8-44bf-a08c-be87f930fcd7",
  "target_type": "PRODUCT",
  "target_id": "733784bb-7a4b-45fa-a9c8-f23677d3a141"
}
```
*(Notes:
- `target_type`: Enum string (`NONE`, `PRODUCT`, `CATEGORY`, `SUPPLIER`, `CUSTOMER`, `ORDER`).
- `target_id`: Optional UUID. If omitted with a non-NONE `target_type`, it delegates general type-level creation permission to the staff member. If `target_type` is `NONE`, `target_id` must be `null`.
- `due_date`: Optional ISO datetime. If provided, must be in the future).*
- **Response (`201 Created`)**:
```json
{
  "id": "c1a2e3f4-5678-90ab-cdef-1234567890ab",
  "title": "Audit Laptop Inventory & Reorder",
  "description": "Verify physical count of Galaxy laptops and update the database accordingly.",
  "priority": "HIGH",
  "status": "PENDING",
  "due_date": "2026-10-05T18:00:00Z",
  "assigned_to_id": "f81f263a-76f8-44bf-a08c-be87f930fcd7",
  "assigned_by_id": "c328e63a-9c64-4cab-a9a1-100d9e07c0b0",
  "target_type": "PRODUCT",
  "target_id": "733784bb-7a4b-45fa-a9c8-f23677d3a141",
  "created_at": "2026-09-23T14:50:00Z",
  "updated_at": "2026-09-23T14:50:00Z"
}
```

#### 8.2 List Tasks (Manager / Super Admin - Paginated)
- **Method**: `GET`
- **Path**: `/tasks/?page=1&page_size=10`
- **Auth Required**: Bearer Token (`SUPER_ADMIN` sees all tasks; managers see tasks they initiated).
- **Query Parameters**:
  - `page` (int, default: 1, ge: 1)
  - `page_size` (int, default: 10, ge: 1, le: 100)
- **Response (`200 OK`)**: Paginated list of tasks.

#### 8.3 Get Current User's Tasks (Paginated)
- **Method**: `GET`
- **Path**: `/tasks/my?page=1&page_size=10`
- **Auth Required**: Bearer Token (Returns tasks where `assigned_to_id == current_user.id`).
- **Response (`200 OK`)**: Paginated list of tasks assigned to the authenticated user.

#### 8.4 Get Task Details
- **Method**: `GET`
- **Path**: `/tasks/{task_id}`
- **Auth Required**: Bearer Token (Creator, Assignee, or Super Admin).
- **Response (`200 OK`)**: Full task details.

#### 8.5 Update Task Status (Staff / Assignee)
- **Method**: `PATCH`
- **Path**: `/tasks/{task_id}/status`
- **Auth Required**: Bearer Token (Assignee, Creator, or Super Admin).
- **Request Body**:
```json
{
  "status": "COMPLETED"
}
```
*(Allowed statuses: `"PENDING"`, `"IN_PROGRESS"`, `"COMPLETED"`).*
- **Response (`200 OK`)**: Updated task response.

#### 8.6 Full Task Update (Manager Only)
- **Method**: `PUT`
- **Path**: `/tasks/{task_id}`
- **Auth Required**: Bearer Token (Task Creator or Super Admin).
- **Response (`200 OK`)**: Updated task object.

#### 8.7 Delete Task
- **Method**: `DELETE`
- **Path**: `/tasks/{task_id}`
- **Auth Required**: Bearer Token (Task Creator or Super Admin).
- **Response**: `204 No Content`

---

### 9. Delivery Prediction (`/api/v1/predictions`)

#### Overview & The 10 Prediction Parameters
The machine learning pipeline forecasts order fulfillment turnaround in days based on 10 core logistics, inventory, and environmental parameters:

1. `order_date`: Placed timestamp (baseline).
2. `order_quantity`: Total items ordered across line items ($\sum \text{quantity}$).
3. `number_of_items`: Distinct SKU count ($\text{len}(\text{items})$).
4. `current_stock`: Warehouse stock available on-hand ($\sum \text{quantity\_in\_stock}$).
5. `reorder_level`: Safety buffer threshold ($\max(\text{reorder\_level})$).
6. `shortage_quantity`: Deficit calculated as $\max(\text{order\_quantity} - \text{current\_stock}, 0)$.
7. `distance_km`: Transit distance in km from Central Warehouse Hub to customer city.
8. `shipping_mode`: `0` for Standard (~350 km/day), `1` for Express (~600 km/day).
9. `rainy_days_in_transit`: Number of rainy/adverse weather days during the 5-day shipment transit window (auto-fetched from Open-Meteo).
10. `supplier_lead_time`: Replenishment turnaround:
    - **4.0 days** if shortage (`current_stock < order_quantity`).
    - **1.5 days** if in stock (`current_stock >= order_quantity`).
11. `processing_time`: Standard warehouse picking, packing, QC, and invoice labeling: **1.0 day**.

#### 9.1 Predict Delivery by Order ID (Automated Database Feature Extraction)
- **Method**: `POST`
- **Path**: `/predictions/orders/{order_id}`
- **Auth Required**: None / Public (or Bearer Token)
- **Description**: Pulls the order line items, customer address, and current inventory stock from PostgreSQL, automatically evaluates all parameters and Open-Meteo transit weather, runs inference on the XGBoost model, updates `order.predicted_delivery_date` in the database, and returns the result with a full logistics explanation.
- **Path Parameters**:
  - `order_id` (UUID, required): Target order identifier.
- **Constraints**:
  - Rejects orders with status `DELIVERED` or `CANCELLED` (`400 Bad Request`).
  - Rejects orders without line items (`400 Bad Request`).
- **Example Request**:
```http
POST /api/v1/predictions/orders/f47ac10b-58cc-4372-a567-0e02b2c3d479
```
- **Response (`200 OK`)**:
```json
{
  "order_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "predicted_fulfillment_days": 4.62,
  "predicted_delivery_date": "2026-10-06T14:32:00Z",
  "model_version": "xgboost-v3",
  "training_data_type": "historical_fulfillment_csv_with_weather_and_distance",
  "weather_condition": "RAIN",
  "rainy_days_in_transit": 2,
  "distance_km": 550.0,
  "shipping_mode": "STANDARD",
  "logistics_explanation": "1.0d warehouse handling + 1.6d standard transit (550 km) + 1.0d transit weather buffer (2 rainy days)"
}
```

#### 9.2 Predict Order Delivery Days (Manual Parameter Inputs)
- **Method**: `POST`
- **Path**: `/predictions/delivery`
- **Auth Required**: None / Public
- **Query Parameters**:
  - `order_id` (UUID): Identifier of the target order.
  - `order_date` (ISO datetime): Date when order was placed.
  - `order_quantity` (int): Total units ordered.
  - `number_of_items` (int): Distinct items in order.
  - `current_stock` (int): Available inventory in warehouse.
  - `reorder_level` (int): Product threshold for restocking.
  - `distance_km` (float, optional, default: 350.0): Road distance in km.
  - `shipping_mode` (int, optional, default: 0): `0` = Standard, `1` = Express.
  - `rainy_days_in_transit` (int, optional, default: 0): Adverse weather days in transit window.
  - `supplier_lead_time` (float, days, default: 2.0): Supplier replenishment lead time.
  - `processing_time` (float, days, default: 1.0): Internal picking/packing duration.
  - `shipping_time` (int, days, default: 3): Carrier transit duration.

- **Example Request URL**:
```text
POST /api/v1/predictions/delivery?order_id=f47ac10b-58cc-4372-a567-0e02b2c3d479&order_date=2026-10-01T10%3A00%3A00Z&order_quantity=50&number_of_items=3&current_stock=20&reorder_level=10&distance_km=850&shipping_mode=0&rainy_days_in_transit=2&supplier_lead_time=4.0&processing_time=1.0
```

- **Response (`200 OK`)**:
```json
{
  "order_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "predicted_fulfillment_days": 8.49,
  "predicted_delivery_date": "2026-10-10T02:38:43Z",
  "model_version": "xgboost-v3",
  "training_data_type": "historical_fulfillment_csv_with_weather_and_distance",
  "weather_condition": "RAIN",
  "rainy_days_in_transit": 2,
  "distance_km": 850.0,
  "shipping_mode": "STANDARD",
  "logistics_explanation": "1.0d warehouse handling + 2.4d standard transit (850 km) + 1.0d transit weather buffer (2 rainy days) + 4.0d supplier replenishment deficit (30 units)"
}
```

---

## Setup, Execution & Database Migrations

### 1. Environment Configuration
Create a `.env` file in the root backend directory:
```env
DATABASE_URL=postgresql+psycopg://postgres:your_password@localhost:5432/inventory_db
SECRET_KEY=super_secret_jwt_signing_key_at_least_32_characters_long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=5
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### 2. Dependency Installation
```bash
python -m venv .venv
# On Windows PowerShell:
.venv\Scripts\activate
# On Linux / macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Database Migrations (Alembic)
Run migrations to generate all tables, foreign keys, and indexes:
```bash
alembic upgrade head
```

### 4. Running the Application
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 5. Training the Delivery Prediction Machine Learning Model
To retrain or rebuild `app/ml/models/delivery_model.pkl`:
```bash
python -m app.ml.train
```
*(Evaluates MAE, RMSE, R² score, and saves the binary model bundle).*

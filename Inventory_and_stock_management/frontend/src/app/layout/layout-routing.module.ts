import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LayoutComponent } from './layout/layout.component';

import { roleGuard } from '../auth/guards/role.guard';
import {
  SUPER_ADMIN_ROLE,
  INVENTORY_MANAGER_ROLE,
  ORDER_MANAGER_ROLE,
  INVENTORY_STAFF_ROLE,
  ORDER_STAFF_ROLE
} from '../auth/utils/role-auth';

const INVENTORY_VIEW = [
  SUPER_ADMIN_ROLE,
  INVENTORY_MANAGER_ROLE,
  INVENTORY_STAFF_ROLE
];
const ORDER_VIEW = [
  SUPER_ADMIN_ROLE,
  ORDER_MANAGER_ROLE,
  ORDER_STAFF_ROLE,
  INVENTORY_MANAGER_ROLE
];
const PREDICTION_VIEW = ORDER_VIEW;
const PRODUCT_VIEW = [
  SUPER_ADMIN_ROLE,
  INVENTORY_MANAGER_ROLE,
  INVENTORY_STAFF_ROLE,
  ORDER_MANAGER_ROLE
];

const routes: Routes = [

  {
    path: '',
    component: LayoutComponent,

    children: [

      // Dashboard
      {
        path: 'dashboard',

        canActivate: [roleGuard],

        data: {
          roles: [...INVENTORY_VIEW, ...ORDER_VIEW, INVENTORY_STAFF_ROLE]
        },

        loadChildren: () =>
          import('../features/dashboard/dashboard.module')
            .then(module => module.DashboardModule)
      },

      // Products
      {
        path: 'products',

        canActivate: [roleGuard],

        data: {
          roles: PRODUCT_VIEW
        },

        loadChildren: () =>
          import('../features/products/products.module')
            .then(module => module.ProductsModule)
      },

      // Categories
      {
        path: 'categories',

        canActivate: [roleGuard],

        data: {
          roles: INVENTORY_VIEW
        },

        loadChildren: () =>
          import('../features/categories/categories.module')
            .then(module => module.CategoriesModule)
      },

      // Suppliers
      {
        path: 'suppliers',

        canActivate: [roleGuard],

        data: {
          roles: INVENTORY_VIEW
        },

        loadChildren: () =>
          import('../features/suppliers/suppliers.module')
            .then(module => module.SuppliersModule)
      },

      // My Tasks + Manage Tasks (guards on child routes)
      {
        path: 'tasks',

        canActivate: [roleGuard],

        data: {
          roles: [...INVENTORY_VIEW, ...ORDER_VIEW, INVENTORY_STAFF_ROLE]
        },

        loadChildren: () =>
          import('../features/tasks/tasks.module')
            .then(module => module.TasksModule)
      },

      // Sales & Fulfillment Orders
      {
        path: 'orders',

        canActivate: [roleGuard],

        data: {
          roles: ORDER_VIEW
        },

        loadChildren: () =>
          import('../features/orders/orders.module')
            .then(module => module.OrdersModule)
      },

      // Customer Accounts
      {
        path: 'customers',

        canActivate: [roleGuard],

        data: {
          roles: [SUPER_ADMIN_ROLE, ORDER_MANAGER_ROLE, ORDER_STAFF_ROLE]
        },

        loadChildren: () =>
          import('../features/customers/customers.module')
            .then(module => module.CustomersModule)
      },

      // AI Delivery ETA / Predictions
      {
        path: 'predictions',

        canActivate: [roleGuard],

        data: {
          roles: PREDICTION_VIEW
        },

        loadChildren: () =>
          import('../features/predictions/predictions.module')
            .then(module => module.PredictionsModule)
      },

      // User Management (super admin only)
      {
        path: 'admin/users',

        canActivate: [roleGuard],

        data: {
          roles: [SUPER_ADMIN_ROLE]
        },

        loadChildren: () =>
          import('../features/users/users.module')
            .then(module => module.UsersModule)
      },

      // Default
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      }

    ]
  }

];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],

  exports: [
    RouterModule
  ]
})
export class LayoutRoutingModule {}
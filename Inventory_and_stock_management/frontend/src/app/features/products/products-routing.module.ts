import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { ProductsComponent } from './products.component';
import { ProductsFormComponent } from './pages/products-form/products-form.component';

import { roleGuard } from '../../auth/guards/role.guard';
import { ALL_ROLES } from '../../auth/utils/role-auth';

const routes: Routes = [

  // Products List
  {
    path: '',
    component: ProductsComponent,
    canActivate: [roleGuard],
    data: {
      roles: ALL_ROLES
    }
  },

  // Add Product
  {
    path: 'add',
    component: ProductsFormComponent,
    canActivate: [roleGuard],
    data: {
      roles: ALL_ROLES
    }
  },

  // Edit Product
  {
    path: 'edit/:id',
    component: ProductsFormComponent,
    canActivate: [roleGuard],
    data: {
      roles: ALL_ROLES
    }
  }

];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class ProductsRoutingModule {}
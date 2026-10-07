import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { SuppliersComponent } from './suppliers.component';
import { SuplierFormComponent } from './pages/suplier-form/suplier-form.component';

import { roleGuard } from '../../auth/guards/role.guard';
import { ALL_ROLES } from '../../auth/utils/role-auth';

const routes: Routes = [

  // Suppliers List
  {
    path: '',
    component: SuppliersComponent,
    canActivate: [roleGuard],
    data: {
      roles: ALL_ROLES
    }
  },

  // Add Supplier
  {
    path: 'add',
    component: SuplierFormComponent,
    canActivate: [roleGuard],
    data: {
      roles: ALL_ROLES
    }
  },

  // Edit Supplier
  {
    path: 'edit/:id',
    component: SuplierFormComponent,
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
export class SuppliersRoutingModule {}
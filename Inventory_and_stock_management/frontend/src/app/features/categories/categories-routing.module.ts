import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { CategoriesComponent } from './categories.component';
import { CategoriesFormComponent } from './pages/categories-form/categories-form.component';

import { roleGuard } from '../../auth/guards/role.guard';
import { ALL_ROLES } from '../../auth/utils/role-auth';

const routes: Routes = [

  // Categories List
  {
    path: '',
    component: CategoriesComponent,
    canActivate: [roleGuard],
    data: {
      roles: ALL_ROLES
    }
  },

  // Add Category
  {
    path: 'add',
    component: CategoriesFormComponent,
    canActivate: [roleGuard],
    data: {
      roles: ALL_ROLES
    }
  },

  // Edit Category
  {
    path: 'edit/:id',
    component: CategoriesFormComponent,
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
export class CategoriesRoutingModule {}
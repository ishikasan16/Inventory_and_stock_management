import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { CategoriesRoutingModule } from './categories-routing.module';
import { CategoriesComponent } from './categories.component';
import { CategoriesListComponent } from './pages/categories-list/categories-list.component';
import { CategoriesFormComponent } from './pages/categories-form/categories-form.component';

@NgModule({
  declarations: [
    CategoriesComponent,
    CategoriesListComponent,
    CategoriesFormComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    CategoriesRoutingModule,
    ReactiveFormsModule
  ]
})
export class CategoriesModule { }

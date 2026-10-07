import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { ProductsRoutingModule } from './products-routing.module';
import { ReactiveFormsModule } from '@angular/forms';

import { ProductsComponent } from './products.component';
import { ProductsFormComponent } from './pages/products-form/products-form.component';
import { ProductsListComponent } from './pages/products-list/products-list.component';

@NgModule({
  declarations: [
    ProductsComponent,
    ProductsFormComponent,
    ProductsListComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    ProductsRoutingModule,
    ReactiveFormsModule
  ]
})
export class ProductsModule { }
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { SuppliersRoutingModule } from './suppliers-routing.module';
import { SuppliersComponent } from './suppliers.component';
import { SupplierListComponent } from './pages/supplier-list/supplier-list.component';
import { SuplierFormComponent } from './pages/suplier-form/suplier-form.component';

@NgModule({
  declarations: [
    SuppliersComponent,
    SupplierListComponent,
    SuplierFormComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    SuppliersRoutingModule,
    ReactiveFormsModule
  ]
})
export class SuppliersModule { }

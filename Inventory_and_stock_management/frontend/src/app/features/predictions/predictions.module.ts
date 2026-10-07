import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';

import { PredictionsRoutingModule } from './predictions-routing.module';
import { PredictionsComponent } from './predictions.component';

@NgModule({
  declarations: [
    PredictionsComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    PredictionsRoutingModule
  ]
})
export class PredictionsModule { }
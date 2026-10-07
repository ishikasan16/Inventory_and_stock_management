import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { TasksRoutingModule } from './tasks-routing.module';
import { MyTasksComponent } from './pages/my-tasks/my-tasks.component';
import { ManageTasksComponent } from './pages/manage-tasks/manage-tasks.component';
import { TaskFormComponent } from './components/task-form/task-form.component';

@NgModule({
  declarations: [
    MyTasksComponent,
    ManageTasksComponent,
    TaskFormComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    TasksRoutingModule,
    ReactiveFormsModule
  ]
})
export class TasksModule { }
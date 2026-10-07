import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { MyTasksComponent } from './pages/my-tasks/my-tasks.component';
import { ManageTasksComponent } from './pages/manage-tasks/manage-tasks.component';

import { roleGuard } from '../../auth/guards/role.guard';
import { SUPER_ADMIN_ROLE, MANAGER_ROLES } from '../../auth/utils/role-auth';

const routes: Routes = [

  // My Tasks
  {
    path: '',
    component: MyTasksComponent
  },

  // Manage Tasks (super admin + managers)
  {
    path: 'manage',
    component: ManageTasksComponent,
    canActivate: [roleGuard],
    data: {
      roles: [SUPER_ADMIN_ROLE, ...MANAGER_ROLES]
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
export class TasksRoutingModule { }
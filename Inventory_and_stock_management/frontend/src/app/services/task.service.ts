import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService, Paginated } from './api.service';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskTargetType = 'PRODUCT' | 'CATEGORY' | 'SUPPLIER' | 'CUSTOMER' | 'ORDER' | 'NONE';

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string | null;
  assigned_to_id: string;
  assigned_by_id: string;
  target_type: TaskTargetType;
  target_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  assignee_username?: string | null;
  assignee_email?: string | null;
  assigner_username?: string | null;
}

export interface TaskQuery {
  page?: number;
  pageSize?: number;
}

export type TaskCreatePayload = Pick<
  Task,
  'title' | 'priority' | 'status' | 'target_type' | 'target_id'
> & {
  description?: string | null;
  due_date?: string | null;
  assigned_to_id: string;
};

@Injectable({ providedIn: 'root' })
export class TaskService extends ApiService {

  constructor(http: HttpClient) {
    super(http);
  }

  // GET - Current user's tasks, one page
  getMyTasksPage(query: TaskQuery = {}): Observable<Paginated<Task>> {
    const params = new HttpParams()
      .set('page', String(query.page ?? 1))
      .set('page_size', String(query.pageSize ?? 10));

    return this.http.get<Paginated<Task>>(
      this.buildUrl('tasks/my'),
      { params }
    );
  }

  // GET - Tasks assigned to the current user, across every page

  getMyTasks(): Observable<Task[]> {
    return this.fetchAll<Task>((page, pageSize) =>
      this.getMyTasksPage({ page, pageSize })
    );
  }

  // GET - Tasks assigned by the current user (managers), one page
  getTasks(query: TaskQuery = {}): Observable<Paginated<Task>> {
    const params = new HttpParams()
      .set('page', String(query.page ?? 1))
      .set('page_size', String(query.pageSize ?? 10));

    return this.http.get<Paginated<Task>>(
      this.buildUrl('tasks/'),
      { params }
    );
  }

  // GET - All tasks (every page), used for filtering
  getAllTasks(): Observable<Task[]> {
    return this.fetchAll<Task>((page, pageSize) =>
      this.getTasks({ page, pageSize })
    );
  }


  // GET - Single task
  getTask(id: string): Observable<Task> {
    return this.http.get<Task>(
      this.buildUrl(`tasks/${id}`)
    );
  }

  // POST - Create & assign a task
  createTask(task: TaskCreatePayload): Observable<Task> {
    return this.http.post<Task>(
      this.buildUrl('tasks/'),
      task
    );
  }

  // PUT - Update a task
  updateTask(id: string, task: Partial<TaskCreatePayload>): Observable<Task> {
    return this.http.put<Task>(
      this.buildUrl(`tasks/${id}`),
      task
    );
  }

  // PATCH - Update task status
  updateTaskStatus(id: string, status: TaskStatus): Observable<Task> {
    return this.http.patch<Task>(
      this.buildUrl(`tasks/${id}/status`),
      { status }
    );
  }

  // DELETE - Delete a task
  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(
      this.buildUrl(`tasks/${id}`)
    );
  }
}
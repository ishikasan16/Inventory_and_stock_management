import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { TaskService, Task, TaskStatus } from '../../../../services/task.service';

@Component({
  selector: 'app-my-tasks',
  templateUrl: './my-tasks.component.html'
})
export class MyTasksComponent implements OnInit, OnDestroy {

  tasks: Task[] = [];

  // Pagination state
  currentPage = 1;
  pageSize = 10;
  total = 0;
  totalPages = 1;

  isLoading = false;
  errorMessage = '';

  updatingId: string | null = null;

  private subscription?: Subscription;

  constructor(
    private taskService: TaskService
  ) { }

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.subscription = this.taskService
      .getMyTasksPage({ page: this.currentPage, pageSize: this.pageSize })
      .subscribe({
        next: (response) => {
          this.tasks = response.items || [];
          this.currentPage = response.page;
          this.pageSize = response.page_size ?? this.pageSize;
          this.total = response.total;
          this.totalPages = response.total_pages;
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage =
            error.error?.detail ||
            'Failed to load your tasks. The task service may not be available yet.';
        }
      });
  }

  // First visible item number (1-based)
  get startItem(): number {
    if (this.total === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  // Last visible item number (1-based)
  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.total);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
    this.loadTasks();
  }

  statusLabel(status: TaskStatus): string {
    return status.toUpperCase().replace(/_/g, ' ');
  }

  priorityClass(priority: string): string {
    const p = priority.toUpperCase();

    if (p === 'HIGH') {
      return 'rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700';
    }

    if (p === 'LOW') {
      return 'rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600';
    }

    return 'rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700';
  }

  statusClass(status: TaskStatus): string {
    const s = status.toUpperCase();

    if (s === 'COMPLETED') {
      return 'rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700';
    }

    if (s === 'IN_PROGRESS') {
      return 'rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700';
    }

    return 'rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700';
  }

  nextStatus(status: TaskStatus): TaskStatus {
    if (status === 'PENDING') {
      return 'IN_PROGRESS';
    }

    return 'COMPLETED';
  }

  canAdvance(status: TaskStatus): boolean {
    return status !== 'COMPLETED';
  }

  updateStatus(task: Task): void {
    const next = this.nextStatus(task.status);

    if (!this.canAdvance(task.status) || this.updatingId) {
      return;
    }

    this.updatingId = task.id;

    this.taskService.updateTaskStatus(task.id, next).subscribe({
      next: (updated) => {
        task.status = updated.status;
        this.updatingId = null;
      },
      error: () => {
        this.updatingId = null;
      }
    });
  }

  // Returns the route to the linked record's list page
  recordTarget(task: Task): string[] | null {
    if (!task || task.target_type === 'NONE') {
      return null;
    }

    const base =
      task.target_type === 'PRODUCT'
        ? 'products'
        : task.target_type === 'CATEGORY'
          ? 'categories'
          : task.target_type === 'SUPPLIER'
            ? 'suppliers'
            : task.target_type === 'CUSTOMER'
              ? 'customers'
              : task.target_type === 'ORDER'
                ? 'orders'
                : null;

    return base ? ['/', base] : null;
  }

  recordTargetParams(task: Task): { targetId: string } | null {
    return task?.target_id ? { targetId: task.target_id } : null;
  }

  targetLabel(type: string): string {
    return type === 'NONE' ? '—' : type;
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
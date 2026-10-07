import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { TaskService, Task, TaskStatus, TaskTargetType } from '../../../../services/task.service';
import { UserService, User } from '../../../../services/user.service';
import { isInventoryManager, isOrderManager, isSuperAdmin } from '../../../../auth/utils/role-auth';
import { currentUser, decodeJwtPayload } from '../../../../auth/utils/auth-state';

type TaskFilter = TaskStatus | '';

@Component({
  selector: 'app-manage-tasks',
  templateUrl: './manage-tasks.component.html'
})
export class ManageTasksComponent implements OnInit, OnDestroy {

  tasks: Task[] = [];
  assignees: User[] = [];
  allUsers: User[] = [];
  private userMap = new Map<string, User>();

  // Pagination state
  currentPage = 1;
  pageSize = 10;
  total = 0;
  totalPages = 1;

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  deletingId: string | null = null;

  showForm = false;
  editingTask: Task | null = null;

  filterStatus: TaskFilter = '';
  filterAssignee: string = '';

  allTasks: Task[] = [];
  filterPage = 1;

  private subscriptions: Subscription[] = [];

  constructor(
    private taskService: TaskService,
    private userService: UserService
  ) { }

  get isSuper(): boolean {
    return isSuperAdmin();
  }

  get targetTypes(): TaskTargetType[] {
    if (isOrderManager()) {
      return ['NONE', 'CUSTOMER', 'ORDER'];
    }
    if (isInventoryManager()) {
      return ['NONE', 'PRODUCT', 'CATEGORY', 'SUPPLIER'];
    }
    return ['NONE', 'PRODUCT', 'CATEGORY', 'SUPPLIER', 'CUSTOMER', 'ORDER'];
  }

  private get filterSource(): Task[] {
    return this.allTasks.length ? this.allTasks : this.tasks;
  }

  get isFiltering(): boolean {
    return !!this.filterStatus || !!this.filterAssignee;
  }

  get filteredMatches(): Task[] {
    return this.filterSource.filter((task) => {
      const statusMatch = !this.filterStatus || task.status === this.filterStatus;
      const targetAssigneeId = String(task.assigned_to_id || (task as any).assignee_id || '').trim().toLowerCase();
      const filterId = String(this.filterAssignee || '').trim().toLowerCase();
      const assigneeMatch = !this.filterAssignee || targetAssigneeId === filterId;
      return statusMatch && assigneeMatch;
    });
  }

  get filteredTasks(): Task[] {
    if (!this.isFiltering) {
      return this.tasks;
    }
    const start = (this.filterPage - 1) * this.pageSize;
    return this.filteredMatches.slice(start, start + this.pageSize);
  }

  get shownTotal(): number {
    return this.isFiltering ? this.filteredMatches.length : this.total;
  }

  get shownPage(): number {
    return this.isFiltering ? this.filterPage : this.currentPage;
  }

  get shownTotalPages(): number {
    if (!this.isFiltering) {
      return this.totalPages;
    }
    return Math.max(1, Math.ceil(this.shownTotal / this.pageSize));
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadTasks();
    this.loadAllTasks();
  }

  loadUsers(): void {
    const active = currentUser();
    if (active) {
      let sub: string | null = null;
      let email: string | null = null;
      if (active.access_token) {
        const payload = decodeJwtPayload(active.access_token);
        sub = (payload?.['sub'] as string) || null;
        email = (payload?.['email'] as string) || null;
      }
      const selfUser: User = {
        id: active.user_id || sub || '',
        username: active.username,
        email: email || '',
        role: active.role
      };
      this.registerUser(selfUser);
    }

    const mergeUsers = (incoming: User[] | null | undefined) => {
      if (!incoming || !Array.isArray(incoming)) return;
      incoming.forEach((u) => this.registerUser(u));
      this.syncUserLists();
    };

    const initialQuery = { page: 1, pageSize: 50 };
    if (this.isSuper) {
      this.subscriptions.push(
        this.userService.getUsers(initialQuery).subscribe({
          next: (res) => mergeUsers(res?.items || (Array.isArray(res) ? res : [])),
          error: () => {}
        })
      );
    } else {
      this.subscriptions.push(
        this.userService.getUsersTeam(initialQuery).subscribe({
          next: (res) => mergeUsers(res?.items || (Array.isArray(res) ? res : [])),
          error: () => {}
        })
      );
    }

    const fullSource = this.isSuper
      ? this.userService.getAllUsers()
      : this.userService.getAllUsersTeam();

    this.subscriptions.push(
      fullSource.subscribe({
        next: (users) => mergeUsers(users),
        error: () => {
          if (!this.isSuper) {
            this.subscriptions.push(
              this.userService.getAllUsers().subscribe({
                next: (users) => mergeUsers(users),
                error: () => {}
              })
            );
          }
        }
      })
    );

    if (!this.isSuper) {
      this.subscriptions.push(
        this.userService.getAllUsers().subscribe({
          next: (users) => mergeUsers(users),
          error: () => {}
        })
      );
    }
  }

  loadTasks(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.subscriptions.push(
      this.taskService
        .getTasks({ page: this.currentPage, pageSize: this.pageSize })
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
            this.errorMessage = this.formatError(
              error,
              'Failed to load tasks. The task service may not be available yet.'
            );
          }
        })
    );
  }

  loadAllTasks(): void {
    this.subscriptions.push(
      this.taskService.getAllTasks().subscribe({
        next: (tasks) => { this.allTasks = tasks || []; },
        error: () => { /* the paged list shows the error */ }
      })
    );
  }

  // First visible item number (1-based)
  get startItem(): number {
    if (this.shownTotal === 0) {
      return 0;
    }
    return (this.shownPage - 1) * this.pageSize + 1;
  }

  // Last visible item number (1-based)
  get endItem(): number {
    return Math.min(this.shownPage * this.pageSize, this.shownTotal);
  }

  goToPage(page: number): void {
    const maxPage = this.shownTotalPages;
    if (page < 1 || page > maxPage) {
      return;
    }

    if (this.isFiltering) {
      this.filterPage = page;
    } else {
      this.currentPage = page;
      this.loadTasks();
    }
  }

  setStatusFilter(value: string): void {
    this.filterStatus = value as TaskFilter;
    this.filterPage = 1;
  }

  setAssigneeFilter(value: string): void {
    this.filterAssignee = value;
    this.filterPage = 1;
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

  targetLabel(type: string): string {
    return type === 'NONE' ? '—' : type;
  }

  private isUuidOrId(val: string): boolean {
    if (!val) return false;
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidPattern.test(val.trim());
  }

  private registerUser(user: User): void {
    if (!user) return;
    const id = user.id || (user as any).user_id || (user as any)._id;
    if (id) {
      this.userMap.set(String(id).trim().toLowerCase(), user);
    }
    if (user.username && user.username.trim()) {
      this.userMap.set(String(user.username).trim().toLowerCase(), user);
    }
    if (user.email && user.email.trim()) {
      this.userMap.set(String(user.email).trim().toLowerCase(), user);
    }
  }

  private syncUserLists(): void {
    const unique = Array.from(new Set(this.userMap.values()));
    this.allUsers = unique;
    this.assignees = unique.filter((u) => !!(u.id || (u as any).user_id));
  }

  private findUser(identifier: string | null | undefined): User | undefined {
    if (!identifier) return undefined;
    const normalized = String(identifier).trim().toLowerCase();

    if (this.userMap.has(normalized)) {
      return this.userMap.get(normalized);
    }

    return [...this.allUsers, ...this.assignees].find((u) => {
      if (!u) return false;
      const uId = String(u.id || (u as any).user_id || (u as any)._id || '').trim().toLowerCase();
      const uUsername = String(u.username || '').trim().toLowerCase();
      const uEmail = String(u.email || '').trim().toLowerCase();
      return uId === normalized || uUsername === normalized || uEmail === normalized;
    });
  }

  private formatUserName(user: User): string {
    if (!user) return '';
    if (user.username && user.username.trim()) {
      return user.username.trim();
    }
    const anyUser = user as any;
    if (anyUser.name && String(anyUser.name).trim()) {
      return String(anyUser.name).trim();
    }
    if (anyUser.full_name && String(anyUser.full_name).trim()) {
      return String(anyUser.full_name).trim();
    }
    if (user.email && user.email.trim()) {
      return user.email.split('@')[0];
    }
    return '';
  }

  assigneeName(task: Task): string {
    if (!task) return '—';

    // 1. Direct username/name properties on task object
    if (task.assignee_username && !this.isUuidOrId(task.assignee_username)) {
      return task.assignee_username;
    }
    const anyTask = task as any;
    if (anyTask.assignee_name && !this.isUuidOrId(anyTask.assignee_name)) {
      return anyTask.assignee_name;
    }
    if (anyTask.assigned_to_name && !this.isUuidOrId(anyTask.assigned_to_name)) {
      return anyTask.assigned_to_name;
    }
    if (anyTask.assigned_to_username && !this.isUuidOrId(anyTask.assigned_to_username)) {
      return anyTask.assigned_to_username;
    }
    if (anyTask.assignee?.username) {
      return anyTask.assignee.username;
    }
    if (anyTask.assignee?.name) {
      return anyTask.assignee.name;
    }
    if (anyTask.assigned_to?.username) {
      return anyTask.assigned_to.username;
    }
    if (anyTask.assigned_to?.name) {
      return anyTask.assigned_to.name;
    }

    // 2. Resolve target ID against the user registry
    const targetId = task.assigned_to_id || anyTask.assignee_id || anyTask.assigned_to;
    if (targetId) {
      const user = this.findUser(targetId);
      if (user) {
        const resolvedName = this.formatUserName(user);
        if (resolvedName) {
          return resolvedName;
        }
      }
    }

    // 3. Fallback to task's assignee email
    if (task.assignee_email) {
      return task.assignee_email.split('@')[0];
    }
    if (anyTask.assignee?.email) {
      return anyTask.assignee.email.split('@')[0];
    }

    // 4. If targetId itself is a human name / email string and not a raw UUID
    if (targetId && !this.isUuidOrId(targetId)) {
      return targetId;
    }

    // 5. Final fallback if record is still pending
    if (targetId) {
      return `User (${targetId.substring(0, 8)})`;
    }

    return 'Unassigned';
  }

  assignerName(task: Task): string {
    if (!task) return '—';

    if (task.assigner_username && !this.isUuidOrId(task.assigner_username)) {
      return task.assigner_username;
    }
    const anyTask = task as any;
    if (anyTask.assigner_name && !this.isUuidOrId(anyTask.assigner_name)) {
      return anyTask.assigner_name;
    }
    if (anyTask.assigned_by_name && !this.isUuidOrId(anyTask.assigned_by_name)) {
      return anyTask.assigned_by_name;
    }
    if (anyTask.assigned_by?.username) {
      return anyTask.assigned_by.username;
    }
    if (anyTask.assigned_by?.name) {
      return anyTask.assigned_by.name;
    }

    const targetId = task.assigned_by_id || anyTask.assigned_by;
    if (targetId) {
      const user = this.findUser(targetId);
      if (user) {
        const resolvedName = this.formatUserName(user);
        if (resolvedName) {
          return resolvedName;
        }
      }
      if (!this.isUuidOrId(targetId)) {
        return targetId;
      }
      return `Manager (${targetId.substring(0, 8)})`;
    }

    return '—';
  }

  openCreate(): void {
    this.clearMessages();
    this.editingTask = null;
    this.showForm = true;
  }

  openEdit(task: Task): void {
    this.clearMessages();
    this.editingTask = task;
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingTask = null;
  }

  onSaved(): void {
    this.showForm = false;
    this.editingTask = null;
    this.successMessage = 'Task saved successfully.';
    this.loadTasks();
    this.loadAllTasks();
  }

  deleteTask(task: Task): void {
    this.clearMessages();
    const confirmed = window.confirm(
      `Are you sure you want to delete task "${task.title}"?`
    );

    if (!confirmed) {
      return;
    }

    this.deletingId = task.id;

    this.subscriptions.push(this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        this.deletingId = null;
        this.successMessage = 'Task deleted.';
        this.loadTasks();
        this.loadAllTasks();
      },
      error: (error) => {
        this.deletingId = null;
        this.errorMessage = this.formatError(error, 'Failed to delete task.');
      }
    }));
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private formatError(error: any, fallback: string): string {
    const detail = error?.error?.detail;

    if (typeof detail === 'string') {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((d: any) => {
          if (d?.loc && d?.msg) {
            const field = d.loc[d.loc.length - 1];
            return field && field !== 'body' ? `${field}: ${d.msg}` : d.msg;
          }
          return d?.msg || JSON.stringify(d);
        })
        .join(', ');
    }

    if (detail && typeof detail === 'object') {
      return detail.message || detail.msg || JSON.stringify(detail);
    }

    return error?.error?.message || error?.message || fallback;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
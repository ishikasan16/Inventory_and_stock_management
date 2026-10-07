import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { UserService, User } from '../../../services/user.service';
import { ALL_ROLES, AppRole } from '../../../auth/utils/role-auth';
import { clearSession, currentUser } from '../../../auth/utils/auth-state';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html'
})
export class UserManagementComponent implements OnInit, OnDestroy {

  users: User[] = [];

  // Pagination state
  currentPage = 1;
  pageSize = 10;
  total = 0;
  totalPages = 1;

  searchQuery = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  updatingId: string | null = null;

  roleOptions: AppRole[] = ALL_ROLES;

  private subscriptions: Subscription[] = [];

  constructor(
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  get filteredUsers(): User[] {
    const query = this.searchQuery.trim().toLowerCase();

    if (!query) {
      return this.users;
    }

    const normalizedQuery = query.replace(/[_\s-]+/g, ' ');

    return this.users.filter((user) => {
      const username = (user.username || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const roleRaw = (user.role || '').toLowerCase();
      const roleNormalized = roleRaw.replace(/[_\s-]+/g, ' ');

      return (
        username.includes(query) ||
        email.includes(query) ||
        roleRaw.includes(query) ||
        roleNormalized.includes(normalizedQuery)
      );
    });
  }

  getNormalizedRole(role: string | null | undefined): AppRole {
    if (!role) {
      return this.roleOptions[0];
    }
    const match = this.roleOptions.find(
      (r) => r.toUpperCase() === role.trim().toUpperCase()
    );
    return match || this.roleOptions[0];
  }

  isRoleSelected(userRole: string | null | undefined, optionRole: string): boolean {
    if (!userRole) {
      return false;
    }
    return userRole.trim().toUpperCase() === optionRole.trim().toUpperCase();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.subscriptions.push(
      this.userService
        .getUsers({ page: this.currentPage, pageSize: this.pageSize })
        .subscribe({
          next: (response) => {
            this.users = response.items || [];
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
              'Failed to load users. The user service may not be available yet.'
            );
          }
        })
    );
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
    this.loadUsers();
  }

  roleClass(role: string): string {
    const r = (role || '').toUpperCase();

    if (r === 'SUPER_ADMIN') {
      return 'rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700';
    }

    if (r === 'INVENTORY_MANAGER' || r === 'ORDER_MANAGER') {
      return 'rounded-full bg-violet-100 px-2 py-1 text-xs font-medium text-violet-700';
    }

    if (r === 'INVENTORY_STAFF' || r === 'ORDER_STAFF') {
      return 'rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700';
    }

    return 'rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700';
  }

  changeRole(user: User, role: AppRole, event?: Event): void {
    const currentRole = this.getNormalizedRole(user.role);
    if (role === currentRole) {
      return;
    }

    const confirmed = window.confirm(
      `Change role of "${user.username}" from ${user.role} to ${role}?`
    );

    if (!confirmed) {
      if (event?.target) {
        (event.target as HTMLSelectElement).value = currentRole;
      }
      return;
    }

    this.updatingId = user.id;
    this.successMessage = '';
    this.errorMessage = '';

    this.subscriptions.push(this.userService.changeRole(user.id, role).subscribe({
      next: (updated) => {
        this.updatingId = null;
        user.role = updated.role;
        this.successMessage = `Role updated for ${user.username}.`;

        if (this.isCurrentUser(user)) {
          clearSession();
          this.router.navigate(['/login'], {
            queryParams: { reason: 'role-changed' }
          });
        }
      },
      error: (error) => {
        this.updatingId = null;
        if (event?.target) {
          (event.target as HTMLSelectElement).value = currentRole;
        }
        this.errorMessage = this.formatError(
          error,
          'Failed to change role.'
        );
      }
    }));
  }

  private isCurrentUser(user: User): boolean {

    const active = currentUser();

    if (!active) {
      return false;
    }

    if (active.user_id) {
      return active.user_id === user.id;
    }

    return active.username.toLowerCase() === (user.username || '').toLowerCase();
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
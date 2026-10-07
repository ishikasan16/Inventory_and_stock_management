import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  canManageCategories,
  canManageSuppliers,
  canManageTasks,
  canViewCategories,
  canViewCustomers,
  canViewOrders,
  canViewPredictions,
  canViewProducts,
  canViewSuppliers,
  currentRole,
  isSuperAdmin
} from '../../auth/utils/role-auth';
import { clearSession } from '../../auth/utils/auth-state';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  @Input() isOpen = false;
  @Output() sidebarClosed = new EventEmitter<void>();

  openSections: Record<string, boolean> = {
    inventory: true,
    sales: true,
    ai: true,
    management: true
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.restoreSections();
  }

  private restoreSections(): void {
    try {
      const saved = JSON.parse(
        localStorage.getItem('sidebar_sections') || '{}'
      );

      this.openSections = { ...this.openSections, ...saved };
    } catch {
      // Ignore corrupted stored state
    }
  }

  toggleSection(section: string): void {
    this.openSections[section] = !this.openSections[section];
    localStorage.setItem(
      'sidebar_sections',
      JSON.stringify(this.openSections)
    );
  }

  get canViewProducts(): boolean {
    return canViewProducts();
  }

  get canViewCategories(): boolean {
    return canViewCategories();
  }

  get canViewSuppliers(): boolean {
    return canViewSuppliers();
  }

  get canViewOrders(): boolean {
    return canViewOrders();
  }

  get canViewCustomers(): boolean {
    return canViewCustomers();
  }

  get canManageTaskDelegation(): boolean {
    return canManageTasks();
  }

  get canViewPredictions(): boolean {
    return canViewPredictions();
  }

  get canViewUsers(): boolean {
    return isSuperAdmin();
  }

  get canViewMyTasks(): boolean {
    return currentRole() !== null && !isSuperAdmin();
  }

  get canViewInventorySection(): boolean {
    return canViewProducts() || canViewCategories() || canViewSuppliers();
  }

  get canViewSalesSection(): boolean {
    return canViewOrders() || canViewCustomers();
  }

  get canViewAiSection(): boolean {
    return canViewPredictions();
  }

  get canViewManagementSection(): boolean {
    return canManageTasks() || this.canViewMyTasks || this.canViewUsers;
  }

  closeSidebar(): void {
    this.sidebarClosed.emit();
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        clearSession();
        this.router.navigate(['/login']);
      },

      error: () => {
        clearSession();
        this.router.navigate(['/login']);
      }
    });
  }
}
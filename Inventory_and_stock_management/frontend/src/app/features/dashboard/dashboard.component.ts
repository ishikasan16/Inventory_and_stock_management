import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { DashboardService } from '../../services/dashboard.service';
import { ProductService, Product, ProductsResponse } from '../../services/product.service';
import { TaskService, Task } from '../../services/task.service';
import { OrderService, Order } from '../../services/order.service';
import { canViewOrders, canViewProducts, isOrderStaff, isSuperAdmin } from '../../auth/utils/role-auth';

export interface DashboardSummary {
  total_products: number;
  total_stock_value: string;
  low_stock_count: number;
  out_of_stock_count: number;
}

const LOW_STOCK = 'low stock';
const OUT_OF_STOCK = 'out of stock';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  summary: DashboardSummary | null = null;
  tasks: Task[] = [];
  orders: Order[] = [];

  lowStockProducts: Product[] = [];
  outOfStockProducts: Product[] = [];
  stockAlertsTab: 'all' | 'low' | 'out' = 'all';
  stockAlertsLoading = true;
  stockAlertsError = '';

  readonly stockAlertLimit = 12;

  isLoading = true;
  errorMessage = '';

  get canViewOrdersSection(): boolean {
    return canViewOrders();
  }

  get canViewStockAlerts(): boolean {
    return canViewProducts();
  }

  // Tasks are assigned to workers, so a super admin has nothing pending.
  get canViewTasksSection(): boolean {
    return !isSuperAdmin();
  }

  get isOrderStaff(): boolean {
    return isOrderStaff();
  }

  get activeStockProducts(): Product[] {
    if (this.stockAlertsTab === 'low') {
      return this.lowStockProducts;
    }
    if (this.stockAlertsTab === 'out') {
      return this.outOfStockProducts;
    }
    const outIds = new Set(this.outOfStockProducts.map(p => p.id));
    return [
      ...this.outOfStockProducts,
      ...this.lowStockProducts.filter(p => !outIds.has(p.id))
    ].slice(0, 15);
  }

  get activeStockEmptyLabel(): string {
    if (this.stockAlertsTab === 'low') {
      return 'No low stock products.';
    }
    if (this.stockAlertsTab === 'out') {
      return 'No out of stock products.';
    }
    return 'No stock alert products.';
  }

  get totalAlertsCount(): number {
    return (this.summary?.low_stock_count || 0) + (this.summary?.out_of_stock_count || 0);
  }

  get activeStockTotal(): number {
    if (!this.summary) {
      return 0;
    }

    if (this.stockAlertsTab === 'low') {
      return this.summary.low_stock_count;
    }
    if (this.stockAlertsTab === 'out') {
      return this.summary.out_of_stock_count;
    }
    return this.totalAlertsCount;
  }

  constructor(
    private dashboardService: DashboardService,
    private taskService: TaskService,
    private orderService: OrderService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {

    this.dashboardService.getSummary().subscribe({

      next: (summary) => {
        this.summary = summary;
        this.isLoading = false;
      },

      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.status === 0
          ? 'Unable to reach the inventory API. Check that the backend is running and allows CORS requests.'
          : `Unable to load inventory summary (HTTP ${error.status}).`;

        this.isLoading = false;
      }

    });

    this.loadMyTasks();
    this.loadRecentOrders();
    this.loadStockAlerts();
  }

  loadMyTasks(): void {
    if (!this.canViewTasksSection) {
      return;
    }

    this.taskService.getMyTasks().subscribe({
      next: (tasks) => {
        this.tasks = (tasks || []).slice(0, 5);
      },
      error: () => {
        this.tasks = [];
      }
    });
  }

  loadRecentOrders(): void {
    if (!this.canViewOrdersSection) {
      return;
    }

    this.orderService.getOrders({ page: 1, pageSize: 5 }).subscribe({
      next: (response) => {
        this.orders = (response.items || []).slice(0, 5);
      },
      error: () => {
        this.orders = [];
      }
    });
  }

  loadStockAlerts(): void {

    if (!this.canViewStockAlerts) {
      this.stockAlertsLoading = false;
      return;
    }

    forkJoin({
      low: this.productService.getProducts({
        page: 1,
        pageSize: this.stockAlertLimit,
        stockStatus: LOW_STOCK
      }),
      out: this.productService.getProducts({
        page: 1,
        pageSize: this.stockAlertLimit,
        stockStatus: OUT_OF_STOCK
      })
    }).subscribe({

      next: ({ low, out }) => {

        if (this.isFilteredByStatus(low, LOW_STOCK) && this.isFilteredByStatus(out, OUT_OF_STOCK)) {
          this.lowStockProducts = this.firstAlerts(low.items, LOW_STOCK);
          this.outOfStockProducts = this.firstAlerts(out.items, OUT_OF_STOCK);
          this.stockAlertsLoading = false;
          return;
        }

        // The API accepted the request but ignored stock_status, so fall back to
        // a single unfiltered page and split it here.
        this.loadStockAlertsUnfiltered();
      },

      error: () => {
        this.stockAlertsError = 'Unable to load stock alerts.';
        this.stockAlertsLoading = false;
      }

    });
  }

  selectStockTab(tab: 'all' | 'low' | 'out'): void {
    this.stockAlertsTab = tab;
  }

  onStockTabChange(tab: string): void {
    if (tab === 'all' || tab === 'low' || tab === 'out') {
      this.stockAlertsTab = tab;
    }
  }

  stockTabClass(tab: 'all' | 'low' | 'out'): string {
    const base = 'rounded-lg px-2.5 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm font-medium transition-colors duration-150';

    return this.stockAlertsTab === tab
      ? `${base} bg-white text-slate-900 shadow-sm`
      : `${base} text-slate-500 hover:text-slate-900`;
  }

  getStatusLabel(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'in stock':
        return 'In Stock';
      case 'low stock':
        return 'Low Stock';
      case 'out of stock':
        return 'Out of Stock';
      default:
        return status;
    }
  }

  stockStatusClass(status: string): string {
    const base = 'inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-4 sm:px-2 sm:py-1 sm:text-xs';

    switch ((status || '').toLowerCase()) {
      case 'low stock':
        return `${base} bg-amber-100 text-amber-700`;
      case 'out of stock':
        return `${base} bg-red-100 text-red-700`;
      default:
        return `${base} bg-slate-100 text-slate-600`;
    }
  }

  private loadStockAlertsUnfiltered(): void {
    this.productService.getProducts({ page: 1, pageSize: 100 }).subscribe({
      next: (response) => {
        this.lowStockProducts = this.firstAlerts(response.items, LOW_STOCK);
        this.outOfStockProducts = this.firstAlerts(response.items, OUT_OF_STOCK);
        this.stockAlertsLoading = false;
      },
      error: () => {
        this.stockAlertsError = 'Unable to load stock alerts.';
        this.stockAlertsLoading = false;
      }
    });
  }

  // A response is only treated as filtered when every returned row carries the
  // requested status. An empty page counts as filtered only when the total is
  // zero too, otherwise the backend simply ignored the query param.
  private isFilteredByStatus(response: ProductsResponse, status: string): boolean {
    const items = response.items || [];

    if (items.length === 0) {
      return (response.total ?? 0) === 0;
    }

    return items.every(product => (product.stock_status || '').toLowerCase() === status);
  }

  private firstAlerts(items: Product[] | null | undefined, status: string): Product[] {
    return (items || [])
      .filter(product => (product.stock_status || '').toLowerCase() === status)
      .slice(0, this.stockAlertLimit);
  }

  totalInr(order: Order): string {
    return this.formatINR(order.total_amount);
  }

  isDelivered(order: Order): boolean {
    return order.status === 'DELIVERED';
  }

  stockValueInr(): string {
    return this.summary ? this.formatINR(this.summary.total_stock_value) : '₹0.00';
  }

  private formatINR(value: number | string | null | undefined): string {
    const num = Number(value ?? 0);

    if (isNaN(num)) {
      return '₹0.00';
    }

    return `₹${num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  statusClass(status: string): string {
    const base = 'inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-4 sm:px-2 sm:py-1 sm:text-xs';

    switch (status) {
      case 'DELIVERED':
        return `${base} bg-emerald-100 text-emerald-700`;
      case 'CONFIRMED':
      case 'PROCESSING':
      case 'PACKED':
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
        return `${base} bg-blue-100 text-blue-700`;
      case 'AWAITING_STOCK':
      case 'SUPPLIER_ORDER_PLACED':
      case 'STOCK_RECEIVED':
        return `${base} bg-amber-100 text-amber-700`;
      case 'CANCELLED':
        return `${base} bg-red-100 text-red-700`;
      default:
        return `${base} bg-slate-100 text-slate-600`;
    }
  }

  getTaskRoute(task: Task): any[] | null {
    if (!task || task.target_type === 'NONE') {
      return null;
    }

    switch (task.target_type) {
      case 'PRODUCT':
        return ['/products'];
      case 'CATEGORY':
        return ['/categories'];
      case 'SUPPLIER':
        return ['/suppliers'];
      case 'ORDER':
        return ['/orders'];
      case 'CUSTOMER':
        return ['/customers'];
      default:
        return null;
    }
  }

  getTaskQueryParams(task: Task): { targetId: string } | null {
    return task?.target_id ? { targetId: task.target_id } : null;
  }

  getTaskScopeLabel(task: Task): string {
    switch (task.target_type) {
      case 'PRODUCT':
        return 'Open Product';
      case 'CATEGORY':
        return 'Open Category';
      case 'SUPPLIER':
        return 'Open Supplier';
      case 'ORDER':
        return 'Open Order';
      case 'CUSTOMER':
        return 'Open Customer';
      default:
        return 'Open Record';
    }
  }
}
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  OrderService,
  Order,
  OrderStatus
} from '../../services/order.service';
import {
  CustomerService,
  Customer
} from '../../services/customers.service';
import { ProductService, Product } from '../../services/product.service';
import { canCreateRecord, canManageOrders, canTransitionOrderStatus, isWorker } from '../../auth/utils/role-auth';
import { TaskService, Task } from '../../services/task.service';

// Valid transitions enforced by the backend state machine.
const NEXT_ORDER_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  ORDER_PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'AWAITING_STOCK', 'CANCELLED'],
  PROCESSING: ['PACKED', 'AWAITING_STOCK', 'CANCELLED'],
  AWAITING_STOCK: ['SUPPLIER_ORDER_PLACED', 'CANCELLED'],
  SUPPLIER_ORDER_PLACED: ['STOCK_RECEIVED', 'CANCELLED'],
  STOCK_RECEIVED: ['PROCESSING'],
  PACKED: ['SHIPPED'],
  SHIPPED: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: []
};

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html'
})
export class OrdersComponent implements OnInit, OnDestroy {

  orders: Order[] = [];
  allOrders: Order[] = [];
  customers: Customer[] = [];
  products: Product[] = [];
  myTasks: Task[] = [];
  targetId = '';

  // Search state
  searchQuery = '';
  searchPage = 1;

  // Pagination state
  currentPage = 1;
  pageSize = 10;
  total = 0;
  totalPages = 1;

  isLoading = false;
  errorMessage = '';

  customersLoadError = '';
  productsLoadError = '';

  showCreateModal = false;
  showDetailsModal = false;
  showStatusModal = false;

  selectedOrder: Order | null = null;
  selectedStatus = '';

  isSaving = false;

  // Inline toast notifications
  toastMessage: string | null = null;
  toastType: 'success' | 'error' | 'info' = 'info';
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  private subscriptions: Subscription[] = [];
  get canManage(): boolean {
    return canManageOrders();
  }

  canCreateOrder(): boolean {
    return this.canManage || canCreateRecord(this.myTasks, 'ORDER');
  }

  get canTransition(): boolean {
    return canTransitionOrderStatus();
  }

  createForm = this.fb.group({
    customer_id: ['', Validators.required],
    items: this.fb.array([])
  });

  private customerNames = new Map<string, string>();
  private productNames = new Map<string, string>();
  private productMap = new Map<string, Product>();

  constructor(
    private fb: FormBuilder,
    private orderService: OrderService,
    private customerService: CustomerService,
    private productService: ProductService,
    private taskService: TaskService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.loadMyTasks();
    this.loadOrders();
    this.loadAllOrders();
    this.loadCustomers();
    this.loadProducts();

    this.subscriptions.push(
      this.route.queryParamMap.subscribe((params) => {
        const search = params.get('search');
        if (search !== null) {
          this.searchQuery = search;
          this.searchPage = 1;
        }
        this.targetId = params.get('targetId') ?? '';
      })
    );
  }

  loadMyTasks(): void {
    if (!isWorker()) {
      return;
    }

    this.subscriptions.push(
      this.taskService.getMyTasks().subscribe({
        next: (tasks) => {
          this.myTasks = tasks || [];
        },
        error: () => {
          this.myTasks = [];
        }
      })
    );
  }

  get items(): FormArray {
    return this.createForm.get('items') as FormArray;
  }

  get nextStatuses(): OrderStatus[] {
    return this.selectedOrder
      ? NEXT_ORDER_STATUSES[this.selectedOrder.status]
      : [];
  }

  // Whether the given order can be transitioned (per-row, not selectedOrder)
  canUpdateOrder(order: Order): boolean {
    return this.canTransition
      && (NEXT_ORDER_STATUSES[order.status]?.length ?? 0) > 0;
  }

  isDelivered(order: Order): boolean {
    return order.status === 'DELIVERED';
  }

  loadOrders(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.subscriptions.push(
      this.orderService
        .getOrders({ page: this.currentPage, pageSize: this.pageSize })
        .subscribe({
          next: (response) => {
            this.orders = response.items || [];
            this.currentPage = response.page;
            this.pageSize = response.page_size ?? this.pageSize;
            this.total = response.total;
            this.totalPages = response.total_pages;
            this.isLoading = false;
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = this.apiErrorMessage(
              error,
              'Failed to load orders. The order service may not be available yet.'
            );
          }
        })
    );
  }

  loadAllOrders(): void {
    this.subscriptions.push(
      this.orderService.getAllOrders().subscribe({
        next: (orders) => {
          this.allOrders = orders || [];
        },
        error: () => {
          this.allOrders = [];
        }
      })
    );
  }

  get isFiltering(): boolean {
    return this.searchQuery.trim().length > 0;
  }

  private get searchSource(): Order[] {
    return this.allOrders.length ? this.allOrders : this.orders;
  }

  matches(): Order[] {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      return this.searchSource;
    }

    return this.searchSource.filter((order) => {
      const custName = this.customerName(order.customer_id).toLowerCase();
      const shortId = this.shortId(order.id).toLowerCase();
      const statusMatches = order.status.toLowerCase().includes(query);

      return (
        order.id.toLowerCase().includes(query) ||
        shortId.includes(query) ||
        custName.includes(query) ||
        statusMatches
      );
    });
  }

  get filteredTotal(): number {
    return this.isFiltering ? this.matches().length : this.total;
  }

  get filteredTotalPages(): number {
    if (!this.isFiltering) {
      return this.totalPages;
    }
    return Math.max(1, Math.ceil(this.filteredTotal / this.pageSize));
  }

  get activePage(): number {
    return this.isFiltering ? this.searchPage : this.currentPage;
  }

  get displayedOrders(): Order[] {
    let list: Order[];
    if (!this.isFiltering) {
      list = [...this.orders];
    } else {
      const start = (this.searchPage - 1) * this.pageSize;
      list = this.matches().slice(start, start + this.pageSize);
    }

    // If targetId is provided from a task, pin that order to the top of the list
    if (this.targetId) {
      const idx = list.findIndex((o) => o.id === this.targetId);
      if (idx > 0) {
        const [targetItem] = list.splice(idx, 1);
        list.unshift(targetItem);
      } else if (idx === -1) {
        const source = this.allOrders.length ? this.allOrders : this.orders;
        const targetItem = source.find((o) => o.id === this.targetId);
        if (targetItem) {
          list.unshift(targetItem);
        }
      }
    }

    return list;
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchPage = 1;
  }

  // First visible item number (1-based)
  get startItem(): number {
    if (this.filteredTotal === 0) {
      return 0;
    }

    return (this.activePage - 1) * this.pageSize + 1;
  }

  // Last visible item number (1-based)
  get endItem(): number {
    return Math.min(this.activePage * this.pageSize, this.filteredTotal);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.filteredTotalPages || page === this.activePage) {
      return;
    }

    if (this.isFiltering) {
      this.searchPage = page;
      return;
    }

    this.currentPage = page;
    this.loadOrders();
  }

  loadCustomers(): void {
    this.subscriptions.push(this.customerService.getAllCustomers().subscribe({
      next: (customers) => {
        this.customers = customers || [];
        this.customersLoadError = '';
        this.customerNames.clear();
        this.customers.forEach((c) => this.customerNames.set(c.id, c.name));
      },
      error: () => {
        this.customers = [];
        this.customersLoadError = 'Could not load customers.';
      }
    }));
  }

  loadProducts(): void {
    this.subscriptions.push(
      this.productService.getProducts({ page: 1, pageSize: 100 }).subscribe({
        next: (response) => {
          this.products = response.items || [];
          this.productsLoadError = '';
          this.productNames.clear();
          this.productMap.clear();
          this.products.forEach((p) => {
            this.productNames.set(p.id, p.name);
            p.quantity_in_stock = p.quantity_in_stock ?? 0;
            this.productMap.set(p.id, p);
          });
        },
        error: () => {
          this.products = [];
          this.productsLoadError = 'Could not load products.';
        }
      })
    );
  }

  getProduct(productId: string): Product | undefined {
    return this.productMap.get(productId);
  }

  getProductStockQty(productId: string): number | string {
    const product = this.productMap.get(productId);
    if (!product) {
      return '—';
    }
    return product.quantity_in_stock ?? 0;
  }

  productStockStatusLabel(productId: string, orderQty?: number): string {
    const product = this.productMap.get(productId);
    if (!product) {
      return 'Unknown';
    }

    const qty = product.quantity_in_stock ?? 0;

    if (qty <= 0) {
      return 'Out of Stock';
    }

    // In the context of an order, if orderQty is provided, check if available stock covers this order
    if (orderQty !== undefined && orderQty !== null) {
      if (qty < orderQty) {
        return 'Less in Stock';
      }
      return 'In Stock';
    }

    const reorder = product.reorder_level ?? 0;
    if (reorder > 0 && qty <= reorder) {
      return 'Less in Stock';
    }

    if (product.stock_status) {
      const s = product.stock_status.toLowerCase();
      if (s === 'out of stock' || s === 'out_of_stock') {
        return 'Out of Stock';
      }
      if (s === 'low stock' || s === 'low_stock') {
        return 'Less in Stock';
      }
    }

    return 'In Stock';
  }

  productStockQtyText(productId: string): string {
    const product = this.productMap.get(productId);
    if (!product) {
      return 'Stock unknown';
    }
    const qty = product.quantity_in_stock ?? 0;
    return `${qty} in stock`;
  }

  productStockClass(productId: string, orderQty?: number): string {
    const status = this.productStockStatusLabel(productId, orderQty);
    const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';

    switch (status) {
      case 'In Stock':
        return `${base} bg-emerald-100 text-emerald-700`;
      case 'Less in Stock':
        return `${base} bg-amber-100 text-amber-700`;
      case 'Out of Stock':
        return `${base} bg-rose-100 text-rose-700`;
      default:
        return `${base} bg-slate-100 text-slate-600`;
    }
  }

  isShortage(item: any): boolean {
    const product = this.productMap.get(item?.product_id);
    if (!product) {
      return false;
    }
    const available = product.quantity_in_stock ?? 0;
    return (item?.quantity ?? 0) > available;
  }

  // Single message covering whichever reference list failed, for the modal banner.
  get createFormLoadError(): string {
    return [this.customersLoadError, this.productsLoadError]
      .filter(Boolean)
      .join(' ');
  }

  retryCreateFormLoads(): void {
    this.loadCustomers();
    this.loadProducts();
  }

  customerName(id: string): string {
    return this.customerNames.get(id) || '#'.concat(id);
  }

  productName(id: string): string {
    return this.productNames.get(id) || '#'.concat(id);
  }

  shortId(id: string): string {
    return id ? id.slice(0, 8) : '—';
  }

  totalInr(order: Order): string {
    return this.formatINR(order.total_amount);
  }

  subtotalInr(value: string): string {
    return this.formatINR(value);
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

  statusClass(status: OrderStatus): string {
    switch (status) {
      case 'DELIVERED':
        return 'rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700';
      case 'CONFIRMED':
      case 'PROCESSING':
      case 'PACKED':
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
        return 'rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700';
      case 'AWAITING_STOCK':
      case 'SUPPLIER_ORDER_PLACED':
      case 'STOCK_RECEIVED':
        return 'rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700';
      case 'CANCELLED':
        return 'rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700';
      default:
        return 'rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600';
    }
  }

  openCreate(): void {
    this.createForm.reset();
    this.items.clear();
    this.addItem();

    if (this.customers.length > 0) {
      this.createForm.patchValue({ customer_id: '' });
    }

    this.showCreateModal = true;
  }

  addItem(): void {
    this.items.push(this.fb.group({
      product_id: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]]
    }));
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  // FormArray.controls is typed as AbstractControl[], so the item row's own
  // group has to be reached through get() rather than a .controls index.
  isItemFieldInvalid(item: AbstractControl, field: string): boolean {
    const control = item.get(field);

    return !!control && control.touched && control.invalid;
  }

  productStock(id: string): number {
    const product = this.products.find((p) => p.id === id);
    return product ? Number(product.quantity_in_stock) : 0;
  }

  // The backend reports validation failures in more than one shape: a plain
  // string under `detail`, a DRF list of messages, or a per-field error object
  // such as { quantity: ['Insufficient stock.'] }. Flatten all of them so a
  // rejected order never surfaces as "[object Object]".
  private apiErrorMessage(error: unknown, fallback: string): string {
    const body = (error as { error?: unknown } | null)?.error;

    const flatten = (value: unknown): string => {
      if (typeof value === 'string') {
        return value.trim();
      }

      if (Array.isArray(value)) {
        return value.map(flatten).filter(Boolean).join(' ');
      }

      if (value && typeof value === 'object') {
        return Object.values(value as Record<string, unknown>)
          .map(flatten)
          .filter(Boolean)
          .join(' ');
      }

      return '';
    };

    return flatten(body) || fallback;
  }

  createOrder(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      this.showToast('error', 'Please complete the highlighted fields.');
      return;
    }

    const value = this.createForm.value;

    const rawItems = (value.items ?? []) as Array<{ product_id: string; quantity: number }>;

    const payload = {
      customer_id: value.customer_id as string,
      items: rawItems.map((item) => ({
        product_id: item.product_id,
        quantity: Number(item.quantity)
      }))
    };

    this.isSaving = true;

    this.subscriptions.push(this.orderService.createOrder(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.showCreateModal = false;
        this.createForm.reset();
        this.items.clear();
        this.showToast('success', 'Order created successfully.');
        this.loadOrders();
      },
      error: (error) => {
        this.isSaving = false;
        this.showToast(
          'error',
          this.apiErrorMessage(error, 'Failed to create order.')
        );
      }
    }));
  }

  openDetails(order: Order): void {
    this.selectedOrder = order;
    this.showDetailsModal = true;
    this.loadProducts();
  }

  openStatus(order: Order): void {
    this.selectedOrder = order;
    this.selectedStatus = '';
    this.showStatusModal = true;
  }

  updateStatus(): void {
    if (!this.selectedOrder || !this.selectedStatus) {
      return;
    }

    this.isSaving = true;

    this.subscriptions.push(
      this.orderService
        .updateOrderStatus(this.selectedOrder.id, this.selectedStatus as OrderStatus)
        .subscribe({
          next: (updated) => {
            this.isSaving = false;
            this.showStatusModal = false;
            this.showToast('success', 'Order status updated.');
            this.selectedOrder = null;

            const index = this.orders.findIndex((o) => o.id === updated.id);
            if (index >= 0) {
              this.orders[index] = updated;
            }
          },
          error: (error) => {
            this.isSaving = false;
            this.showToast(
              'error',
              this.apiErrorMessage(error, 'Failed to update order status.')
            );
          }
        })
    );
  }

  showToast(type: 'success' | 'error' | 'info', message: string): void {
    this.toastType = type;
    this.toastMessage = message;

    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = null;
    }, 3500);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    clearTimeout(this.toastTimer);
  }
}
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';

import {
  TaskService,
  Task,
  TaskPriority,
  TaskStatus,
  TaskTargetType,
  TaskCreatePayload
} from '../../../../services/task.service';

import { User } from '../../../../services/user.service';
import { ProductService } from '../../../../services/product.service';
import { CategoryService } from '../../../../services/category.service';
import { SupplierService } from '../../../../services/supplier.service';
import { CustomerService, Customer } from '../../../../services/customers.service';
import { OrderService, Order } from '../../../../services/order.service';

import { Product } from '../../../products/products.component';
import { Category } from '../../../categories/categories.component';
import { Supplier } from '../../../suppliers/suppliers.component';
import { currentUser, decodeJwtPayload } from '../../../../auth/utils/auth-state';

interface TargetRecord {
  id: string;
  name: string;
}

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html'
})
export class TaskFormComponent implements OnInit {

  @Input() task: Task | null = null;
  @Input() assignees: User[] = [];
  @Input() targetTypes: TaskTargetType[] = [];

  @Output() saved = new EventEmitter<Task>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;

  isSaving = false;
  errorMessage = '';

  products: Product[] = [];
  categories: Category[] = [];
  suppliers: Supplier[] = [];
  customers: Customer[] = [];
  orders: Order[] = [];

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private productService: ProductService,
    private categoryService: CategoryService,
    private supplierService: SupplierService,
    private customerService: CustomerService,
    private orderService: OrderService
  ) { }

  get todayString(): string {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  get filteredAssignees(): User[] {
    const active = currentUser();
    if (!active) {
      return this.assignees;
    }

    const activeId = active.user_id;
    const activeUsername = (active.username || '').toLowerCase();
    let tokenSub: string | null = null;
    let tokenEmail: string | null = null;

    if (active.access_token) {
      const payload = decodeJwtPayload(active.access_token);
      tokenSub = (payload?.['sub'] as string) || null;
      tokenEmail = ((payload?.['email'] as string) || '').toLowerCase() || null;
    }

    return this.assignees.filter((member) => {
      if (activeId && member.id === activeId) return false;
      if (tokenSub && member.id === tokenSub) return false;
      if (activeUsername && (member.username || '').toLowerCase() === activeUsername) return false;
      if (tokenEmail && (member.email || '').toLowerCase() === tokenEmail) return false;
      return true;
    });
  }

  private minDateTodayValidator = (control: AbstractControl): ValidationErrors | null => {
    const val = control.value;
    if (!val) {
      return null;
    }
    if (val < this.todayString) {
      return { pastDate: true };
    }
    return null;
  };

  onDueDateChange(): void {
    const control = this.form?.get('due_date');
    if (control?.value && control.value < this.todayString) {
      control.setValue(this.todayString);
      control.markAsTouched();
    }
  }

  ngOnInit(): void {
    let initialDueDate = this.task?.due_date ? this.toDateInput(this.task.due_date) : '';
    // If editing a task whose due date was in the past, default to today so backend validation passes
    if (initialDueDate && initialDueDate < this.todayString) {
      initialDueDate = this.todayString;
    }

    this.form = this.fb.group({
      title: [this.task?.title || '', Validators.required],
      description: [this.task?.description || ''],
      priority: [this.task?.priority || 'MEDIUM'],
      due_date: [initialDueDate, [this.minDateTodayValidator]],
      assigned_to_id: [this.task?.assigned_to_id || '', Validators.required],
      target_type: [this.task?.target_type || 'NONE'],
      target_id: [this.task?.target_id || '']
    });

    this.loadRecordOptions();
  }

  get selectedTargetType(): string {
    return this.form.get('target_type')?.value || 'NONE';
  }

  get targetRecords(): TargetRecord[] {
    const type = this.selectedTargetType;

    if (type === 'PRODUCT') {
      return this.products.map((p) => ({ id: p.id, name: p.name }));
    }

    if (type === 'CATEGORY') {
      return this.categories.map((c) => ({ id: c.id, name: c.name }));
    }

    if (type === 'SUPPLIER') {
      return this.suppliers.map((s) => ({ id: s.id, name: s.name }));
    }

    if (type === 'CUSTOMER') {
      return this.customers.map((c) => ({ id: c.id, name: c.name }));
    }

    if (type === 'ORDER') {
      return this.orders.map((o) => ({ id: o.id, name: `#${o.id.substring(0, 8)} (${o.status})` }));
    }

    return [];
  }

  formatTargetType(type: TaskTargetType): string {
    switch (type) {
      case 'NONE': return 'None (general task)';
      case 'PRODUCT': return 'Product';
      case 'CATEGORY': return 'Category';
      case 'SUPPLIER': return 'Supplier';
      case 'CUSTOMER': return 'Customer';
      case 'ORDER': return 'Order';
      default: return type;
    }
  }

  formatRole(role?: string): string {
    if (!role) {
      return '';
    }
    switch (role.toUpperCase()) {
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'INVENTORY_MANAGER': return 'Inventory Manager';
      case 'ORDER_MANAGER': return 'Order Manager';
      case 'INVENTORY_STAFF': return 'Inventory Staff';
      case 'ORDER_STAFF': return 'Order Staff';
      default: return role.replace(/_/g, ' ');
    }
  }

  toDateInput(iso: string): string {
    const d = new Date(iso);

    if (isNaN(d.getTime())) {
      return '';
    }

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${y}-${m}-${day}`;
  }

  loadRecordOptions(): void {
    this.productService.getProducts({ page: 1, pageSize: 50 }).subscribe({
      next: (response) => {
        this.products = response.items || [];
      },
      error: () => {
        this.products = [];
      }
    });

    this.categoryService.getAllCategories().subscribe({
      next: (categories) => {
        this.categories = categories || [];
      },
      error: () => {
        this.categories = [];
      }
    });

    this.supplierService.getAllSuppliers().subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers || [];
      },
      error: () => {
        this.suppliers = [];
      }
    });

    this.customerService.getCustomers({ page: 1, pageSize: 50 }).subscribe({
      next: (response) => {
        this.customers = response.items || [];
      },
      error: () => {
        this.customers = [];
      }
    });

    this.orderService.getOrders({ page: 1, pageSize: 50 }).subscribe({
      next: (response) => {
        this.orders = response.items || [];
      },
      error: () => {
        this.orders = [];
      }
    });
  }

  onTargetTypeChange(): void {
    this.form.get('target_id')?.setValue('');
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;
    const targetType: TaskTargetType = value.target_type;

    const payload: TaskCreatePayload = {
      title: value.title,
      description: value.description || null,
      priority: value.priority as TaskPriority,
      status: (this.task?.status || 'PENDING') as TaskStatus,
      due_date: value.due_date
        ? new Date(`${value.due_date}T12:00:00`).toISOString()
        : null,
      assigned_to_id: value.assigned_to_id,
      target_type: targetType,
      target_id: targetType === 'NONE' ? null : value.target_id || null
    };

    this.isSaving = true;
    this.errorMessage = '';

    const operation = this.task
      ? this.taskService.updateTask(this.task.id, payload)
      : this.taskService.createTask(payload);

    operation.subscribe({
      next: (task) => {
        this.isSaving = false;
        this.saved.emit(task);
      },
      error: (error: any) => {
        this.isSaving = false;
        this.errorMessage = this.formatError(error);
      }
    });
  }

  private formatError(error: any): string {
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

    return error?.error?.message || error?.message || 'Failed to save task.';
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
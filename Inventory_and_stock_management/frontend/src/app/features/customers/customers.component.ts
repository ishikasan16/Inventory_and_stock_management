import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  CustomerService,
  Customer,
  CustomerPayload
} from '../../services/customers.service';
import { canCreateRecord, canEditRecord, canManageCustomers, isWorker } from '../../auth/utils/role-auth';
import { TaskService, Task } from '../../services/task.service';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html'
})
export class CustomersComponent implements OnInit, OnDestroy {

  customers: Customer[] = [];
  allCustomers: Customer[] = [];
  myTasks: Task[] = [];
  targetId = '';

  // Search state
  searchQuery = '';
  searchPage = 1;
  showSuggestions = false;
  selectedSuggestionIndex = -1;

  // Pagination state
  currentPage = 1;
  pageSize = 10;
  total = 0;
  totalPages = 1;

  isLoading = false;
  errorMessage = '';

  showFormModal = false;
  editingCustomer: Customer | null = null;
  isSaving = false;

  // Inline toast notifications
  toastMessage: string | null = null;
  toastType: 'success' | 'error' | 'info' = 'info';
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  private subscriptions: Subscription[] = [];

  get canManage(): boolean {
    return canManageCustomers();
  }

  canCreateCustomer(): boolean {
    return this.canManage || canCreateRecord(this.myTasks, 'CUSTOMER');
  }

  canEditCustomer(customer: Customer): boolean {
    return this.canManage || canEditRecord(this.myTasks, 'CUSTOMER', customer.id);
  }

  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    address: [''],
    residential_address: [''],
    delivery_address: ['']
  });

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private taskService: TaskService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.loadMyTasks();
    this.loadCustomers();
    this.loadAllCustomers();

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

  loadCustomers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.subscriptions.push(
      this.customerService
        .getCustomers({ page: this.currentPage, pageSize: this.pageSize })
        .subscribe({
          next: (response) => {
            this.customers = response.items || [];
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
              'Failed to load customers.';
          }
        })
    );
  }

  loadAllCustomers(): void {
    this.subscriptions.push(
      this.customerService.getAllCustomers().subscribe({
        next: (customers) => {
          this.allCustomers = customers || [];
        },
        error: (error) => {
          console.error('Error loading all customers:', error);
        }
      })
    );
  }

  // Preferred search dataset: allCustomers across pages, fallback to current page
  private get searchSource(): Customer[] {
    return this.allCustomers.length ? this.allCustomers : this.customers;
  }

  get isFiltering(): boolean {
    return this.searchQuery.trim().length > 0;
  }

  matches(): Customer[] {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      return this.searchSource;
    }

    return this.searchSource.filter((customer) => {
      const nameMatch = customer.name.toLowerCase().includes(query);
      const emailMatch = customer.email.toLowerCase().includes(query);
      const phoneMatch = !!customer.phone && customer.phone.toLowerCase().includes(query);
      const addressMatch = !!customer.address && customer.address.toLowerCase().includes(query);

      return nameMatch || emailMatch || phoneMatch || addressMatch;
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

  get filteredCustomers(): Customer[] {
    let list: Customer[];
    if (!this.isFiltering) {
      list = [...this.customers];
    } else {
      const start = (this.searchPage - 1) * this.pageSize;
      list = this.matches().slice(start, start + this.pageSize);
    }

    // If targetId is provided from a task, pin that customer to the top of the list
    if (this.targetId) {
      const idx = list.findIndex((c) => c.id === this.targetId);
      if (idx > 0) {
        const [targetItem] = list.splice(idx, 1);
        list.unshift(targetItem);
      } else if (idx === -1) {
        const source = this.allCustomers.length ? this.allCustomers : this.customers;
        const targetItem = source.find((c) => c.id === this.targetId);
        if (targetItem) {
          list.unshift(targetItem);
        }
      }
    }

    return list;
  }

  get suggestions(): Customer[] {
    if (!this.isFiltering) {
      return [];
    }

    const uniqueCustomers = this.dedupe(this.matches());
    return uniqueCustomers.slice(0, 8);
  }

  onSearchInput(query: string): void {
    this.searchQuery = query;
    this.searchPage = 1;
    this.showSuggestions = true;
    this.selectedSuggestionIndex = -1;
  }

  selectSuggestion(customer: Customer): void {
    this.searchQuery = customer.name;
    this.searchPage = 1;
    this.showSuggestions = false;
    this.selectedSuggestionIndex = -1;
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchPage = 1;
    this.showSuggestions = false;
    this.selectedSuggestionIndex = -1;
  }

  onSearchKeydown(event: KeyboardEvent): void {
    const list = this.suggestions;
    if (list.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedSuggestionIndex =
        (this.selectedSuggestionIndex + 1) % list.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedSuggestionIndex =
        this.selectedSuggestionIndex <= 0
          ? list.length - 1
          : this.selectedSuggestionIndex - 1;
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const targetIndex = this.selectedSuggestionIndex >= 0 ? this.selectedSuggestionIndex : 0;
      this.selectSuggestion(list[targetIndex]);
    } else if (event.key === 'Escape') {
      this.showSuggestions = false;
    }
  }

  onBlurSuggestions(): void {
    setTimeout(() => {
      this.showSuggestions = false;
      this.selectedSuggestionIndex = -1;
    }, 150);
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
    this.loadCustomers();
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

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join('');
  }

  openCreate(): void {
    this.editingCustomer = null;
    this.form.reset({
      name: '',
      email: '',
      phone: '',
      address: '',
      residential_address: '',
      delivery_address: ''
    });
    this.showFormModal = true;
  }

  openEdit(customer: Customer): void {
    this.editingCustomer = customer;
    this.form.patchValue({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      residential_address: customer.residential_address || '',
      delivery_address: customer.delivery_address || ''
    });
    this.showFormModal = true;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CustomerPayload = {
      name: (this.form.value.name || '').trim(),
      email: (this.form.value.email || '').trim().toLowerCase(),
      phone: (this.form.value.phone || '').trim() || null,
      address: (this.form.value.address || '').trim() || null,
      residential_address: (this.form.value.residential_address || '').trim() || null,
      delivery_address: (this.form.value.delivery_address || '').trim() || null
    };

    this.isSaving = true;

    const operation = this.editingCustomer
      ? this.customerService.updateCustomer(this.editingCustomer.id, payload)
      : this.customerService.addCustomer(payload);

    this.subscriptions.push(operation.subscribe({
      next: () => {
        this.isSaving = false;
        this.showFormModal = false;
        this.showToast(
          'success',
          this.editingCustomer
            ? 'Customer updated successfully.'
            : 'Customer created successfully.'
        );
        this.loadCustomers();
        this.loadAllCustomers();
      },
      error: (error) => {
        this.isSaving = false;
        this.showToast(
          'error',
          error.error?.detail ||
          'Failed to save customer.'
        );
      }
    }));
  }

  showToast(type: 'success' | 'error' | 'info', message: string): void {
    this.toastType = type;
    this.toastMessage = message;

    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = null;
    }, 3500);
  }

  private dedupe(customers: Customer[]): Customer[] {
    const seen = new Set<string>();
    return customers.filter((customer) => {
      if (seen.has(customer.id)) {
        return false;
      }
      seen.add(customer.id);
      return true;
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    clearTimeout(this.toastTimer);
  }
}
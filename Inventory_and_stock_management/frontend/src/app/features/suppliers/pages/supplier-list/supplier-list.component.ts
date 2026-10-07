import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { SupplierService, Supplier } from '../../../../services/supplier.service';
import { Task } from '../../../../services/task.service';
import { canEditRecord as canEditByTasks, hasFullInventoryAccess } from '../../../../auth/utils/role-auth';

@Component({
  selector: 'app-suppliers-list',
  templateUrl: './supplier-list.component.html',
  styleUrl: './supplier-list.component.css'
})
export class SupplierListComponent implements OnInit, OnDestroy {

  // Suppliers received from parent component
  @Input() suppliers: Supplier[] = [];

  // Every supplier across all pages, received from parent component so that
  @Input() allSuppliers: Supplier[] = [];

  // Tasks received from parent component (staff access gating)
  @Input() myTasks: Task[] = [];

  // Pagination state from parent component
  @Input() currentPage = 1;
  @Input() pageSize = 10;
  @Input() total = 0;
  @Input() totalPages = 1;

  // Emitted when the user requests a different page
  @Output() pageChange = new EventEmitter<number>();

  get canManage(): boolean {
    return hasFullInventoryAccess();
  }

  constructor(
    private supplierService: SupplierService,
    private route: ActivatedRoute
  ) { }

  canEditRecord(supplier: Supplier): boolean {
    return this.canManage || canEditByTasks(this.myTasks, 'SUPPLIER', supplier.id);
  }

  get showActions(): boolean {
    // Consider every supplier, since a search can surface rows from other pages
    const source = this.allSuppliers.length ? this.allSuppliers : this.suppliers;

    return this.canManage || source.some((s) => canEditByTasks(this.myTasks, 'SUPPLIER', s.id));
  }

  // Search values
  searchQuery = '';
  showSuggestions = false;
  selectedSuggestionIndex = -1;

  searchPage = 1;

  private get searchSource(): Supplier[] {
    return this.allSuppliers.length ? this.allSuppliers : this.suppliers;
  }

  // Whether a search term is currently applied
  get isFiltering(): boolean {
    return this.searchQuery.trim().length > 0;
  }

  // Total number of rows matching the current search
  get filteredTotal(): number {
    return this.isFiltering ? this.matches().length : this.total;
  }

  // Number of pages available for the current search
  get filteredTotalPages(): number {
    if (!this.isFiltering) {
      return this.totalPages;
    }

    return Math.max(1, Math.ceil(this.filteredTotal / this.pageSize));
  }

  // Page currently shown, which is the search page while filtering
  get activePage(): number {
    return this.isFiltering ? this.searchPage : this.currentPage;
  }

  // Store route subscription
  private routeSubscription?: Subscription;

  targetId = '';

  ngOnInit(): void {

    // Get search value from URL
    this.routeSubscription = this.route.queryParamMap.subscribe((params) => {
      this.searchQuery = params.get('search') ?? '';
      this.targetId = params.get('targetId') ?? '';
      this.searchPage = 1;
    });

    // Load suppliers if parent has not provided them
    if (!this.suppliers.length) {

      this.supplierService.getSuppliers({ page: 1, pageSize: 10 }).subscribe({
        next: (response) => {
          this.suppliers = response.items;
        },

        error: (error) => {
          console.error('Error loading suppliers:', error);
        }
      });
    }

    if (!this.allSuppliers.length) {

      this.supplierService.getAllSuppliers().subscribe({
        next: (suppliers) => {
          this.allSuppliers = suppliers || [];
        },

        error: (error) => {
          console.error('Error loading all suppliers:', error);
        }
      });
    }
  }


  // Suppliers matching the current search, across every page
  private matches(): Supplier[] {

    const query = this.searchQuery.trim().toLowerCase();

    return this.searchSource.filter((supplier) => {

      const descriptionMatches = !!supplier.description &&
        supplier.description.toLowerCase().includes(query);

      return (
        supplier.name.toLowerCase().includes(query) ||
        supplier.contact_email.toLowerCase().includes(query) ||
        descriptionMatches
      );

    });
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

  // Go to a specific page via the pagination controls
  goToPage(page: number): void {
    if (
      page < 1 ||
      page > this.filteredTotalPages ||
      page === this.activePage
    ) {
      return;
    }

    // While searching, page through the filtered set locally
    if (this.isFiltering) {
      this.searchPage = page;
      return;
    }

    this.pageChange.emit(page);
  }


  // Filter suppliers based on search

  get filteredSuppliers(): Supplier[] {

    let list: Supplier[];

    // No search, so the server side paginated page is already correct
    if (!this.isFiltering) {
      list = [...this.suppliers];
    } else {
      // Filter every page, then take just the rows for the current search page
      const start = (this.searchPage - 1) * this.pageSize;
      list = this.matches().slice(start, start + this.pageSize);
    }

    // If targetId is provided from a task, pin that supplier to the top of the list
    if (this.targetId) {
      const idx = list.findIndex((s) => s.id === this.targetId);
      if (idx > 0) {
        const [targetItem] = list.splice(idx, 1);
        list.unshift(targetItem);
      } else if (idx === -1) {
        const source = this.allSuppliers.length ? this.allSuppliers : this.suppliers;
        const targetItem = source.find((s) => s.id === this.targetId);
        if (targetItem) {
          list.unshift(targetItem);
        }
      }
    }

    return list;
  }


  // Get search suggestions
  get suggestions(): Supplier[] {

    if (!this.isFiltering) {
      return [];
    }

    // Remove duplicate supplier names
    const uniqueSuppliers = this.dedupe(this.matches());

    // Show maximum 8 suggestions
    const result = uniqueSuppliers.slice(0, 8);

    return result;
  }


  // When user types in search box
  onSearchInput(query: string): void {

    this.searchQuery = query;

    // Every new term starts from the first page of results
    this.searchPage = 1;

    this.showSuggestions = true;

    this.selectedSuggestionIndex = -1;
  }


  // When user selects a suggestion
  selectSuggestion(supplier: Supplier): void {

    this.searchQuery = supplier.name;

    this.searchPage = 1;

    this.showSuggestions = false;

    this.selectedSuggestionIndex = -1;
  }


  // Handle keyboard events
  onSearchKeydown(event: KeyboardEvent): void {

    const list = this.suggestions;

    // Stop if there are no suggestions
    if (list.length === 0) {
      return;
    }

    // Arrow Down
    if (event.key === 'ArrowDown') {

      event.preventDefault();

      this.selectedSuggestionIndex =
        (this.selectedSuggestionIndex + 1) % list.length;
    }

    // Arrow Up
    else if (event.key === 'ArrowUp') {

      event.preventDefault();

      if (this.selectedSuggestionIndex <= 0) {
        this.selectedSuggestionIndex = list.length - 1;
      } else {
        this.selectedSuggestionIndex =
          this.selectedSuggestionIndex - 1;
      }
    }

    // Enter
    else if (
      event.key === 'Enter' &&
      this.selectedSuggestionIndex >= 0
    ) {

      event.preventDefault();

      this.selectSuggestion(
        list[this.selectedSuggestionIndex]
      );
    }

    // Escape
    else if (event.key === 'Escape') {

      this.showSuggestions = false;
    }
  }


  // Hide suggestions when search box loses focus
  onBlurSuggestions(): void {

    setTimeout(() => {

      this.showSuggestions = false;
      this.selectedSuggestionIndex = -1;

    }, 150);
  }


  // Remove duplicate suppliers
  private dedupe(items: Supplier[]): Supplier[] {

    const seen = new Set<string>();

    const result = items.filter((supplier) => {

      const key = supplier.name.toLowerCase();

      // Supplier already exists
      if (seen.has(key)) {
        return false;
      }

      // Add supplier name to Set
      seen.add(key);

      return true;
    });

    return result;
  }


  // Delete supplier
  deleteSupplier(id: string): void {

    // Find supplier that user wants to delete
    const supplier = this.suppliers.find((item) => {

      return item.id === id;

    });

    // Stop if supplier was not found
    if (!supplier) {
      return;
    }

    // Ask user for confirmation
    const confirmed = window.confirm(
      `Are you sure you want to delete "${supplier.name}"?`
    );

    // Stop if user cancels
    if (!confirmed) {
      return;
    }

    // Delete supplier using API
    this.supplierService.deleteSupplier(id).subscribe({
      next: () => {

        // Remove deleted supplier from the visible page and the full
        // set used for searching
        this.suppliers = this.suppliers.filter((item) => {

          return item.id !== id;

        });

        this.allSuppliers = this.allSuppliers.filter((item) => {

          return item.id !== id;

        });

      },

      error: (error) => {
        console.error('Error deleting supplier:', error);
      }
    });
  }


  // Unsubscribe from route subscription
  ngOnDestroy(): void {

    this.routeSubscription?.unsubscribe();

  }

}
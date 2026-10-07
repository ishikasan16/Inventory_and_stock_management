import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { CategoryService } from '../../../../services/category.service';
import { Task } from '../../../../services/task.service';
import { canEditRecord as canEditByTasks, hasFullInventoryAccess } from '../../../../auth/utils/role-auth';
import { Category } from '../../categories.component';


@Component({
  selector: 'app-categories-list',
  templateUrl: './categories-list.component.html',
  styleUrl: './categories-list.component.css'
})
export class CategoriesListComponent implements OnInit, OnDestroy {

  // Categories received from parent component
  @Input() categories: Category[] = [];

  // Every category across all pages, received from parent component so that
  // search is not limited to the current page of the server side paginated list
  @Input() allCategories: Category[] = [];

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
    private categoryService: CategoryService,
    private route: ActivatedRoute
  ) {}

  canEditRecord(category: Category): boolean {
    return this.canManage || canEditByTasks(this.myTasks, 'CATEGORY', category.id);
  }

  get showActions(): boolean {
    // Consider every category, since a search can surface rows from other pages
    const source = this.allCategories.length
      ? this.allCategories
      : this.categories;

    return this.canManage ||
      source.some((c) => canEditByTasks(this.myTasks, 'CATEGORY', c.id));
  }

  // Search values
  searchQuery = '';
  showSuggestions = false;
  selectedSuggestionIndex = -1;

  // Page used while a search is active, so searching pages through the
  // filtered set in memory instead of asking the server for another page
  searchPage = 1;

  // The full set is preferred for searching, but fall back to the current
  // page so a failed full load still renders and filters what it can
  private get searchSource(): Category[] {
    return this.allCategories.length ? this.allCategories : this.categories;
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

    // Get search value and targetId from URL
    this.routeSubscription = this.route.queryParamMap.subscribe((params) => {
      this.searchQuery = params.get('search') ?? '';
      this.targetId = params.get('targetId') ?? '';
      this.searchPage = 1;
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


  // Filter categories based on search
  get filteredCategories(): Category[] {

    let list: Category[];

    // No search, so the server side paginated page is already correct
    if (!this.isFiltering) {
      list = [...this.categories];
    } else {
      // Filter every page, then take just the rows for the current search page
      const start = (this.searchPage - 1) * this.pageSize;
      list = this.matches().slice(start, start + this.pageSize);
    }

    // If targetId is provided from a task, pin that category to the top of the list
    if (this.targetId) {
      const idx = list.findIndex((c) => c.id === this.targetId);
      if (idx > 0) {
        const [targetItem] = list.splice(idx, 1);
        list.unshift(targetItem);
      } else if (idx === -1) {
        const source = this.allCategories.length ? this.allCategories : this.categories;
        const targetItem = source.find((c) => c.id === this.targetId);
        if (targetItem) {
          list.unshift(targetItem);
        }
      }
    }

    return list;
  }


  // Get search suggestions
  get suggestions(): Category[] {

    if (!this.isFiltering) {
      return [];
    }

    // Remove duplicate category names
    const uniqueCategories = this.dedupe(this.matches());

    // Show maximum 8 suggestions
    const result = uniqueCategories.slice(0, 8);

    return result;
  }


  // Categories matching the current search, across every page
  private matches(): Category[] {

    const query = this.searchQuery.trim().toLowerCase();

    return this.searchSource.filter((category) => {

      const descriptionMatches = !!category.description &&
        category.description.toLowerCase().includes(query);

      return (
        category.name.toLowerCase().includes(query) ||
        descriptionMatches
      );

    });
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
  selectSuggestion(category: Category): void {

    this.searchQuery = category.name;

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


  // Remove duplicate categories
  private dedupe(items: Category[]): Category[] {

    const seen = new Set<string>();

    const result = items.filter((category) => {

      const key = category.name.toLowerCase();

      // Category already exists
      if (seen.has(key)) {
        return false;
      }

      // Add category name to Set
      seen.add(key);

      return true;
    });

    return result;
  }


  // Delete category
  deleteCategory(id: string): void {

    // Find category that user wants to delete
    const category = this.categories.find((item) => {

      return item.id === id;

    });

    // Stop if category was not found
    if (!category) {
      return;
    }

    // Ask user for confirmation
    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"?`
    );

    // Stop if user cancels
    if (!confirmed) {
      return;
    }

    // Delete category using API
    this.categoryService.deleteCategory(id).subscribe({

      next: () => {

        // Remove deleted category from both the visible page and the full
        // set used for searching
        this.categories = this.categories.filter((item) => {

          return item.id !== id;

        });

        this.allCategories = this.allCategories.filter((item) => {

          return item.id !== id;

        });

      },

      error: (error) => {
        console.error('Error deleting category:', error);
      }
    });
  }


  // Unsubscribe from route subscription
  ngOnDestroy(): void {

    this.routeSubscription?.unsubscribe();

  }
}
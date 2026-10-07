import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import {
  Observable,
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  forkJoin,
  map,
  of,
  switchMap,
  takeUntil
} from 'rxjs';
import { ProductService } from '../../services/product.service';
import { SupplierService } from '../../services/supplier.service';
import { CategoryService } from '../../services/category.service';
import { CustomerService } from '../../services/customers.service';
import { OrderService } from '../../services/order.service';
import { AppRole, currentRole } from '../../auth/utils/role-auth';
import { currentUser } from '../../auth/utils/auth-state';

export interface Suggestion {
  type: 'product' | 'supplier' | 'category' | 'customer' | 'order';
  id: string;
  name: string;
  sub: string;
  search: string;   // value sent as ?search= on the list page
  text: string;     // everything we match against, lower-cased
}

const ROUTES: Record<Suggestion['type'], string> = {
  product: '/products',
  supplier: '/suppliers',
  category: '/categories',
  customer: '/customers',
  order: '/orders'
};

// If one list fails (e.g. 403 for this role), search still works for the rest
const safe = <T>(obs: Observable<T[]>) => obs.pipe(catchError(() => of([] as T[])));

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css'
})
export class TopbarComponent implements OnInit, OnDestroy {

  @Output() toggleSidebar = new EventEmitter<void>();

  private index: Suggestion[] = [];
  suggestions: Suggestion[] = [];

  searchQuery = '';
  showSuggestions = false;
  selectedSuggestionIndex = -1;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  get userName(): string {
    return currentUser()?.username || '';
  }

  get currentRole(): AppRole | null {
    return currentRole();
  }

  constructor(
    private router: Router,
    private productService: ProductService,
    private supplierService: SupplierService,
    private categoryService: CategoryService,
    private customerService: CustomerService,
    private orderService: OrderService
  ) { }

  ngOnInit(): void {
    this.setupSearchStream();

    forkJoin({
      products: safe(this.productService.getAllProducts()),
      suppliers: safe(this.supplierService.getAllSuppliers()),
      categories: safe(this.categoryService.getAllCategories()),
      customers: safe(this.customerService.getAllCustomers()),
      orders: safe(this.orderService.getAllOrders())
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe(({ products, suppliers, categories, customers, orders }) => {
      const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? '';

      this.index = [
        ...products.map((p) => this.item('product', p.id, p.name, p.sku, p.name, p.name, p.sku)),
        ...suppliers.map((s) => this.item('supplier', s.id, s.name, s.contact_email, s.name, s.name, s.contact_email)),
        ...categories.map((c) => this.item('category', c.id, c.name, c.description ?? '', c.name, c.name, c.description)),
        ...customers.map((c) =>
          this.item('customer', c.id, c.name, c.email || c.phone || 'Customer', c.name, c.name, c.email, c.phone)),
        ...orders.map((o) => {
          const shortId = o.id.slice(0, 8);
          const name = o.customer_name || customerName(o.customer_id);
          return this.item('order', o.id, `Order #${shortId}`,
            (name ? `${name} • ` : '') + o.status, shortId, o.id, name, o.status);
        })
      ];
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchStream(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((query: string) => {
        const q = query.trim().toLowerCase();
        // Minimum 2 characters check - prevents unnecessary API/search calls
        if (q.length < 2) {
          this.suggestions = [];
          this.showSuggestions = false;
          return of([] as Suggestion[]);
        }

        return this.searchSuggestions(q);
      }),
      takeUntil(this.destroy$)
    ).subscribe((results: Suggestion[]) => {
      this.suggestions = results;
      this.showSuggestions = results.length > 0 && this.searchQuery.trim().length >= 2;
    });
  }

  private searchSuggestions(query: string): Observable<Suggestion[]> {
    // Call server search API for products with debouncing & switchMap
    const productsApi$ = this.productService.getProducts({ search: query, page: 1, pageSize: 8 }).pipe(
      map((res) => (res.items || []).map((p) =>
        this.item('product', p.id, p.name, p.sku, p.name, p.name, p.sku)
      )),
      catchError(() => of([] as Suggestion[]))
    );

    return productsApi$.pipe(
      map((productResults) => {
        // Also match suppliers, categories, customers, and orders from reference data
        const otherMatches = this.index.filter(
          (s) => s.type !== 'product' && s.text.includes(query)
        );

        // Fall back to preloaded products if live API returned empty or failed
        const products = productResults.length > 0
          ? productResults
          : this.index.filter((s) => s.type === 'product' && s.text.includes(query));

        return [...products, ...otherMatches].slice(0, 8);
      })
    );
  }

  private item(type: Suggestion['type'], id: string, name: string, sub: string,
    search: string, ...fields: (string | null | undefined)[]): Suggestion {
    return { type, id, name, sub, search, text: fields.filter(Boolean).join(' ').toLowerCase() };
  }

  // Global search input trigger
  onSearchInput(query: string): void {
    this.searchQuery = query;
    this.selectedSuggestionIndex = -1;

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      this.suggestions = [];
      this.showSuggestions = false;
    }

    this.searchSubject.next(trimmed);
  }

  selectSuggestion(suggestion: Suggestion): void {
    this.searchQuery = suggestion.name;
    this.showSuggestions = false;
    this.router.navigate([ROUTES[suggestion.type]], {
      queryParams: { search: suggestion.search }
    });
  }

  onSearchKeydown(event: KeyboardEvent): void {
    const count = this.suggestions.length;

    if (event.key === 'Enter' && count === 0 && this.searchQuery.trim().length >= 2) {
      event.preventDefault();
      this.showSuggestions = false;
      this.router.navigate(['/products'], {
        queryParams: { search: this.searchQuery.trim() }
      });
      return;
    }

    if (!count) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedSuggestionIndex = (this.selectedSuggestionIndex + 1) % count;
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedSuggestionIndex = this.selectedSuggestionIndex <= 0 ? count - 1 : this.selectedSuggestionIndex - 1;
        break;
      case 'Enter':
        event.preventDefault();
        this.selectSuggestion(this.suggestions[Math.max(this.selectedSuggestionIndex, 0)]);
        break;
      case 'Escape':
        this.showSuggestions = false;
        break;
    }
  }

  onBlurSuggestions(): void {
    setTimeout(() => {
      this.showSuggestions = false;
      this.selectedSuggestionIndex = -1;
    }, 150);
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }
}
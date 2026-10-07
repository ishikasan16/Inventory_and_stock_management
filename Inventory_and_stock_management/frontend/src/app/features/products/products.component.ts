import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { ProductService } from '../../services/product.service';
import { TaskService, Task } from '../../services/task.service';
import { canCreateRecord, hasFullInventoryAccess, isWorker } from '../../auth/utils/role-auth';


// Product interface
export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string | null;
  category_id: string;
  category_name?: string | null;
  supplier_id: string;
  supplier_name?: string | null;
  unit_price: number;
  quantity_in_stock: number;
  reorder_level: number;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  stock_status: string;
}


// Backend response interface
export interface ProductsResponse {
  stock_status: string;
  items: Product[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}


@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit, OnDestroy {

  // Pagination properties
  currentPage = 1;
  pageSize = 10;

  total = 0;
  totalPages = 0;

  // Store products received from backend
  products: Product[] = [];

  // Every product across all pages, used for client side search and the
  // stock status counts so they are not limited to the visible page.
  allProducts: Product[] = [];

  // Store subscription so we can unsubscribe later
  private productSubscription?: Subscription;

  // Subscription for the full product set
  private allProductsSubscription?: Subscription;

  // My assigned tasks (staff use these for per-record access gating)
  myTasks: Task[] = [];

  get canManage(): boolean {
    return hasFullInventoryAccess();
  }

  constructor(
    private productService: ProductService,
    private taskService: TaskService
  ) { }


  // Component initialization
  ngOnInit(): void {
    this.loadMyTasks();
    this.getProducts();
    this.loadAllProducts();
  }

  // Load every product across all pages so search is not limited to the
  // current page of the server side paginated list.
  loadAllProducts(): void {

    this.allProductsSubscription = this.productService
      .getAllProducts()
      .subscribe({

        next: (products) => {
          this.allProducts = products || [];
        },

        // Search falls back to the current page if this fails
        error: (error) => {
          console.error('Error loading all products:', error);
        }

      });
  }

  loadMyTasks(): void {
    if (!isWorker()) {
      return;
    }

    this.taskService.getMyTasks().subscribe({
      next: (tasks) => {
        this.myTasks = tasks || [];
      },
      error: () => {
        this.myTasks = [];
      }
    });
  }

  canCreateType(): boolean {
    return this.canManage || canCreateRecord(this.myTasks, 'PRODUCT');
  }


  // GET - Get all products
  getProducts(): void {

    this.productSubscription = this.productService
      .getProducts({ page: this.currentPage, pageSize: this.pageSize })
      .subscribe({

        // API success
        next: (response: ProductsResponse) => {

          this.products = response.items;

          this.currentPage = response.page;

          this.pageSize = response.page_size ?? this.pageSize;

          this.total = response.total;

          this.totalPages = response.total_pages;

          console.log('Products:', this.products);
        },

        // API error
        error: (error: any) => {
          console.error('Error loading products:', error);
        }

      });
  }


  // Go to a specific page via the pagination controls

  goToPage(page: number): void {

    if (page < 1 || page > this.totalPages) {

      return;

    }

    this.currentPage = page;

    this.getProducts();

  }


  // Count products by stock status
  countByStatus(status: string): number {

    const statusLower = status.toLowerCase();

    // Prefer the full set so the counts cover every page, not just the
    // rows currently visible in the table.
    const source = this.allProducts.length
      ? this.allProducts
      : this.products;

    return source.filter(
      product => product.stock_status.toLowerCase() === statusLower
    ).length;
  }


  // Component destruction
  ngOnDestroy(): void {

    this.productSubscription?.unsubscribe();

    this.allProductsSubscription?.unsubscribe();

  }

}
import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../../services/category.service';
import { TaskService, Task } from '../../services/task.service';
import { canCreateRecord, hasFullInventoryAccess, isWorker } from '../../auth/utils/role-auth';

export interface Category {
  id: string;
  name: string;
  description: string;
  created_at?: string | null;
}

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css'
})
export class CategoriesComponent implements OnInit {

  categories: Category[] = [];

  // Every category across all pages, used for client side search so results
  // are not limited to the current page of the server side paginated list.
  allCategories: Category[] = [];

  // Pagination state
  currentPage = 1;
  pageSize = 10;
  total = 0;
  totalPages = 1;

  // My assigned tasks (staff use these for per-record access gating)
  myTasks: Task[] = [];

  get canManage(): boolean {
    return hasFullInventoryAccess();
  }

  constructor(
    private categoryService: CategoryService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    this.loadMyTasks();
    this.getCategories();
    this.loadAllCategories();
  }

  // Load every category across all pages so search covers the whole table.
  loadAllCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (categories) => {
        this.allCategories = categories || [];
      },
      // Search falls back to the current page if this fails
      error: (error) => {
        console.error('Error loading all categories:', error);
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
    return this.canManage || canCreateRecord(this.myTasks, 'CATEGORY');
  }

  getCategories(): void {
    this.categoryService
      .getCategories({ page: this.currentPage, pageSize: this.pageSize })
      .subscribe({
        next: (response) => {
          this.categories = response.items;
          this.currentPage = response.page;
          this.pageSize = response.page_size ?? this.pageSize;
          this.total = response.total;
          this.totalPages = response.total_pages;
        },
        error: (error) => {
          console.error('Error loading categories:', error);
        }
      });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
    this.getCategories();
  }

  deleteCategory(id: string): void {
    this.categoryService.deleteCategory(id).subscribe({
      next: () => {
        this.categories = this.categories.filter(
          category => category.id !== id
        );
      },
      error: (error) => {
        console.error('Error deleting category:', error);
      }
    });
  }
}

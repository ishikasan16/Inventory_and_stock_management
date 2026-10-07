import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService, Paginated } from './api.service';
import { Category } from '../features/categories/categories.component';

export { Category };

export interface CategoryQuery {
  page?: number;
  pageSize?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService extends ApiService {

  constructor(http: HttpClient) {
    super(http);
  }

  // GET - Get categories with server-side pagination
  getCategories(query: CategoryQuery = {}): Observable<Paginated<Category>> {
    const params = new HttpParams()
      .set('page', String(query.page ?? 1))
      .set('page_size', String(query.pageSize ?? 10));

    return this.http.get<Paginated<Category>>(
      this.buildUrl('categories/'),
      { params }
    );
  }

  // GET - All categories, across every page
  getAllCategories(): Observable<Category[]> {
    return this.fetchAll<Category>((page, pageSize) =>
      this.getCategories({ page, pageSize })
    );
  }

  // GET - Get category by ID
  getCategoryById(id: string): Observable<Category> {
    return this.http.get<Category>(
      this.buildUrl(`categories/${id}`)
    );
  }

  // POST - Add category
  addCategory(category: Omit<Category, 'id' | 'created_at'>): Observable<Category> {
    return this.http.post<Category>(
      this.buildUrl('categories/'),
      category
    );
  }

  // PUT - Update category
  updateCategory(
    id: string,
    category: Partial<Omit<Category, 'id' | 'created_at'>>
  ): Observable<Category> {
    return this.http.put<Category>(
      this.buildUrl(`categories/${id}`),
      category
    );
  }

  // DELETE - Delete category
  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(
      this.buildUrl(`categories/${id}`)
    );
  }
}
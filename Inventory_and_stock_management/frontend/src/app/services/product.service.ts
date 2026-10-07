import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { Product, ProductsResponse } from '../features/products/products.component';

export { Product, ProductsResponse };

export interface ProductQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  stockStatus?: string;
}

export interface StockAdjustmentPayload {
  quantity: number;
  operation: 'IN' | 'OUT';
  reason: string;
}

@Injectable({ providedIn: 'root' })

export class ProductService extends ApiService {
  constructor(http: HttpClient) {
    super(http);
  }


  // GET - Get all products with server-side filters & pagination
  getProducts(query: ProductQuery = {}): Observable<ProductsResponse> {
    let params = new HttpParams();

    params = params.set('page', String(query.page ?? 1));
    params = params.set('page_size', String(query.pageSize ?? 10));

    if (query.search) {
      params = params.set('search', query.search);
    }

    if (query.categoryId) {
      params = params.set('category_id', query.categoryId);
    }

    if (query.stockStatus) {
      params = params.set('stock_status', query.stockStatus);
    }

    return this.http.get<ProductsResponse>(
      this.buildUrl('products/'),
      { params }
    );
  }

  // GET - All products, across every page
  getAllProducts(): Observable<Product[]> {
    return this.fetchAll<Product>((page, pageSize) =>
      this.getProducts({ page, pageSize })
    );
  }

  // GET - Get product by ID
  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(
      this.buildUrl(`products/${id}`)
    );
  }


  // POST - Add new product
  addProduct(
    product: Omit<Product, 'id' | 'stock_status'>)
    : Observable<Product> {

    return this.http.post<Product>(
      this.buildUrl('products/'),
      product
    );

  }


  // PUT - Update product
  updateProduct(
    id: string,
    product: Omit<Product, 'id' | 'stock_status'>
  ): Observable<Product> {

    return this.http.put<Product>(
      this.buildUrl(`products/${id}`),
      product
    );

  }


  // PATCH - Adjust stock (IN / OUT)
  adjustStock(
    id: string,
    payload: StockAdjustmentPayload
  ): Observable<Product> {

    return this.http.patch<Product>(
      this.buildUrl(`products/${id}/stock`),
      payload
    );

  }


  // DELETE - Delete product
  deleteProduct(id: string): Observable<void> {

    return this.http.delete<void>(
      this.buildUrl(`products/${id}`)
    );

  }

}
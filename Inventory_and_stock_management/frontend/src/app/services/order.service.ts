import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService, Paginated } from './api.service';

export type OrderStatus =
  | 'ORDER_PLACED'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'AWAITING_STOCK'
  | 'SUPPLIER_ORDER_PLACED'
  | 'STOCK_RECEIVED'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  id: string;
  product_id: string;
  product_name?: string | null;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface Order {
  id: string;
  customer_id: string;
  customer_name?: string | null;
  order_date: string;
  status: OrderStatus;
  total_amount: string;
  predicted_delivery_date?: string | null;
  actual_delivery_date?: string | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderItemInput {
  product_id: string;
  quantity: number;
}

export interface OrderCreatePayload {
  customer_id: string;
  items: OrderItemInput[];
}

export interface OrderQuery {
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class OrderService extends ApiService {

  constructor(http: HttpClient) {
    super(http);
  }

  getOrders(query: OrderQuery = {}): Observable<Paginated<Order>> {
    const params = new HttpParams()
      .set('page', String(query.page ?? 1))
      .set('page_size', String(query.pageSize ?? 10));

    return this.http.get<Paginated<Order>>(
      this.buildUrl('orders/'),
      { params }
    );
  }

  getAllOrders(): Observable<Order[]> {
    return this.fetchAll<Order>((page, pageSize) =>
      this.getOrders({ page, pageSize })
    );
  }

  getOrder(id: string): Observable<Order> {
    return this.http.get<Order>(
      this.buildUrl(`orders/${id}`)
    );
  }

  createOrder(payload: OrderCreatePayload): Observable<Order> {
    return this.http.post<Order>(
      this.buildUrl('orders/'),
      payload
    );
  }

  updateOrderStatus(id: string, status: OrderStatus): Observable<Order> {
    return this.http.patch<Order>(
      this.buildUrl(`orders/${id}/status`),
      { status }
    );
  }
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService, Paginated } from './api.service';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  residential_address?: string | null;
  delivery_address?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type CustomerPayload = Omit<Customer, 'id' | 'created_at' | 'updated_at'>;

export interface CustomerQuery {
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class CustomerService extends ApiService {

  constructor(http: HttpClient) {
    super(http);
  }

  getCustomers(query: CustomerQuery = {}): Observable<Paginated<Customer>> {
    const params = new HttpParams()
      .set('page', String(query.page ?? 1))
      .set('page_size', String(query.pageSize ?? 10));

    return this.http.get<Paginated<Customer>>(
      this.buildUrl('customers/'),
      { params }
    );
  }

  getAllCustomers(): Observable<Customer[]> {
    return this.fetchAll<Customer>((page, pageSize) =>
      this.getCustomers({ page, pageSize })
    );
  }

  getCustomer(id: string): Observable<Customer> {
    return this.http.get<Customer>(
      this.buildUrl(`customers/${id}`)
    );
  }

  addCustomer(customer: CustomerPayload): Observable<Customer> {
    return this.http.post<Customer>(
      this.buildUrl('customers/'),
      customer
    );
  }

  updateCustomer(id: string, customer: Partial<CustomerPayload>): Observable<Customer> {
    return this.http.put<Customer>(
      this.buildUrl(`customers/${id}`),
      customer
    );
  }
}
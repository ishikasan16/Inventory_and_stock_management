import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService, Paginated } from './api.service';
import { Supplier } from '../features/suppliers/suppliers.component';

export { Supplier };

export interface SupplierQuery {
  page?: number;
  pageSize?: number;
}


@Injectable({ providedIn: 'root' })

export class SupplierService extends ApiService {

   constructor(http: HttpClient) {
      super(http);
    }


    //fetch all suppliers (paginated)
  getSuppliers(query: SupplierQuery = {}): Observable<Paginated<Supplier>> {
    const params = new HttpParams()
      .set('page', String(query.page ?? 1))
      .set('page_size', String(query.pageSize ?? 10));

    return this.http.get<Paginated<Supplier>>(
      this.buildUrl('suppliers/'),
      { params }
    );
  }

  //fetch every supplier, across all pages
  getAllSuppliers(): Observable<Supplier[]> {
    return this.fetchAll<Supplier>((page, pageSize) =>
      this.getSuppliers({ page, pageSize })
    );
  }

  //fetch a single supplier by ID
  getSupplierById(id: string): Observable<Supplier> {
    return this.http.get<Supplier>(this.buildUrl(`${`suppliers/`}${id}`));
  }

  //add a new supplier
  addSupplier(supplier: Omit<Supplier, 'id' | 'created_at'>): Observable<Supplier> {
    return this.http.post<Supplier>(this.buildUrl(`suppliers/`), supplier);
  }

  //update an existing supplier
  updateSupplier(id: string, supplier: Partial<Omit<Supplier, 'id' | 'created_at'>>): Observable<Supplier> {
    return this.http.put<Supplier>(this.buildUrl(`${`suppliers/`}${id}`), supplier);
  }

  //delete a supplier by ID
  deleteSupplier(id: string): Observable<void> {
    return this.http.delete<void>(this.buildUrl(`${`suppliers/`}${id}`));
  }
}
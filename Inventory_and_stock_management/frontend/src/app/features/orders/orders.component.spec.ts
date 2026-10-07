import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { OrderService, Order } from '../../services/order.service';
import { CustomerService, Customer } from '../../services/customers.service';
import { ProductService } from '../../services/product.service';
import { Product, ProductsResponse } from '../products/products.component';
import { OrdersComponent } from './orders.component';

describe('OrdersComponent', () => {
  let component: OrdersComponent;
  let fixture: ComponentFixture<OrdersComponent>;
  let orderService: jasmine.SpyObj<OrderService>;
  let customerService: jasmine.SpyObj<CustomerService>;
  let productService: jasmine.SpyObj<ProductService>;

  const orderPage = (items: Order[]) => ({
    items,
    total: items.length,
    page: 1,
    page_size: 10,
    total_pages: 1
  });

  const productPage = (items: Product[]): ProductsResponse => ({
    stock_status: 'IN_STOCK',
    items,
    page: 1,
    page_size: 100,
    total: items.length,
    total_pages: 1
  });

  const customer = { id: 'cust-1', name: 'Acme', email: 'a@b.c' } as Customer;
  const product = {
    id: 'prod-1',
    name: 'Widget',
    quantity_in_stock: 5
  } as Product;

  const emptyPage = orderPage([]);

  beforeEach(async () => {
    orderService = jasmine.createSpyObj('OrderService', [
      'getOrders',
      'createOrder'
    ]);
    orderService.getOrders.and.returnValue(of(emptyPage));
    orderService.createOrder.and.returnValue(of({} as Order));

    customerService = jasmine.createSpyObj('CustomerService', ['getAllCustomers']);
    customerService.getAllCustomers.and.returnValue(of([customer]));

    productService = jasmine.createSpyObj('ProductService', ['getProducts']);
    productService.getProducts.and.returnValue(of(productPage([product])));

    await TestBed.configureTestingModule({
      imports: [CommonModule, ReactiveFormsModule],
      declarations: [OrdersComponent],
      providers: [
        { provide: OrderService, useValue: orderService },
        { provide: CustomerService, useValue: customerService },
        { provide: ProductService, useValue: productService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function openModal(): void {
    component.openCreate();
    fixture.detectChanges();
  }

  function row(index = 0): HTMLSelectElement {
    return fixture.nativeElement.querySelectorAll('select[formcontrolname="product_id"]')[index];
  }

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('marks the first row invalid before anything is chosen', () => {
    openModal();

    expect(component.isItemFieldInvalid(component.items.at(0), 'product_id')).toBeFalse();
    expect(component.createForm.invalid).toBeTrue();
  });

  it('hides the product error once a product is actually selected', () => {
    openModal();

    const select = row();
    select.value = 'prod-1';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const item = component.items.at(0);

    expect(item.get('product_id')?.value).toBe('prod-1');
    expect(item.get('product_id')?.valid).toBeTrue();
    expect(component.isItemFieldInvalid(item, 'product_id')).toBeFalse();
    expect(fixture.nativeElement.textContent).not.toContain('Product is required.');
  });

  it('clears the product error for the selected row but not untouched siblings', () => {
    openModal();
    component.addItem();
    fixture.detectChanges();

    const select = row(0);
    select.value = 'prod-1';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    // Simulate a blocked submit: everything becomes touched.
    component.createForm.markAllAsTouched();
    fixture.detectChanges();

    expect(component.isItemFieldInvalid(component.items.at(0), 'product_id')).toBeFalse();
    expect(component.isItemFieldInvalid(component.items.at(1), 'product_id')).toBeTrue();
  });

  it('submits the chosen product and quantity', () => {
    openModal();

    component.createForm.patchValue({ customer_id: 'cust-1' });
    component.items.at(0).patchValue({ product_id: 'prod-1', quantity: 2 });
    fixture.detectChanges();

    component.createOrder();

    expect(orderService.createOrder).toHaveBeenCalledWith({
      customer_id: 'cust-1',
      items: [{ product_id: 'prod-1', quantity: 2 }]
    });
  });

  it('surfaces the backend message when the request is rejected', () => {
    orderService.createOrder.and.returnValue(
      throwError(() => ({ error: { detail: 'Insufficient stock for Widget' } }))
    );

    openModal();
    component.createForm.patchValue({ customer_id: 'cust-1' });
    component.items.at(0).patchValue({ product_id: 'prod-1', quantity: 99 });
    fixture.detectChanges();

    component.createOrder();
    fixture.detectChanges();

    expect(component.toastMessage).toBe('Insufficient stock for Widget');
  });

  it('surfaces a DRF field-error body', () => {
    orderService.createOrder.and.returnValue(
      throwError(() => ({ error: { detail: { quantity: ['Insufficient stock.'] } } }))
    );

    openModal();
    component.createForm.patchValue({ customer_id: 'cust-1' });
    component.items.at(0).patchValue({ product_id: 'prod-1', quantity: 99 });
    fixture.detectChanges();

    component.createOrder();

    expect(component.toastMessage).toBeTruthy();
    expect(component.toastMessage).not.toContain('[object Object]');
  });

  it('explains a failed product lookup instead of showing an empty dropdown', () => {
    productService.getProducts.and.returnValue(
      throwError(() => new Error('boom'))
    );

    const failed = TestBed.createComponent(OrdersComponent);
    failed.detectChanges();

    expect(failed.componentInstance.createFormLoadError).toContain('Could not load products.');
  });
});

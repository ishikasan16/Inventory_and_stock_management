import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { DashboardService } from '../../services/dashboard.service';
import { ProductService, Product, ProductQuery, ProductsResponse } from '../../services/product.service';
import { TaskService } from '../../services/task.service';
import { OrderService, Order, OrderStatus } from '../../services/order.service';
import { DashboardComponent, DashboardSummary } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let dashboardService: jasmine.SpyObj<DashboardService>;
  let productService: jasmine.SpyObj<ProductService>;
  let orderService: jasmine.SpyObj<OrderService>;

  const summary: DashboardSummary = {
    total_products: 128,
    total_stock_value: '250000.00',
    low_stock_count: 12,
    out_of_stock_count: 4
  };

  function makeProduct(name: string, sku: string, status: string, quantity: number, reorder: number): Product {
    return {
      id: sku,
      name,
      sku,
      description: null,
      category_id: 'cat-1',
      category_name: 'Fasteners',
      supplier_id: 'sup-1',
      supplier_name: 'Acme',
      unit_price: 10,
      quantity_in_stock: quantity,
      reorder_level: reorder,
      is_active: true,
      created_at: null,
      updated_at: null,
      stock_status: status
    };
  }

  const catalogue: Product[] = [
    makeProduct('Hex Bolt M8', 'HB-001', 'low stock', 3, 10),
    makeProduct('Nut M8', 'NU-001', 'low stock', 1, 5),
    makeProduct('Washer M8', 'WA-001', 'low stock', 0, 5),
    makeProduct('Wrench 12mm', 'WR-001', 'out of stock', 0, 4),
    makeProduct('Pliers 8in', 'PL-001', 'out of stock', 0, 2)
  ];

  function responseFor(status: string | null, products: Product[]): ProductsResponse {
    const items = status ? products.filter(p => p.stock_status === status) : products;

    return {
      stock_status: status || '',
      items,
      page: 1,
      page_size: 10,
      total: items.length,
      total_pages: 1
    };
  }

  function stockAlertsSection(): HTMLElement {
    return fixture.nativeElement.querySelector('[aria-label="Stock alerts"]');
  }

  function renderedProductNames(): string[] {
    return Array.from(stockAlertsSection().querySelectorAll('tbody tr'))
      .map(row => (row.querySelector('td') as HTMLElement).textContent || '');
  }

  beforeEach(async () => {
    dashboardService = jasmine.createSpyObj('DashboardService', ['getSummary']);
    dashboardService.getSummary.and.returnValue(of(summary));

    productService = jasmine.createSpyObj('ProductService', ['getProducts']);
    productService.getProducts.and.callFake((query: ProductQuery) =>
      of(responseFor(query.stockStatus || null, catalogue))
    );

    const taskService = jasmine.createSpyObj('TaskService', ['getMyTasks']);
    taskService.getMyTasks.and.returnValue(of([]));

    orderService = jasmine.createSpyObj('OrderService', ['getOrders']);
    orderService.getOrders.and.returnValue(of({
      items: [], page: 1, page_size: 5, total: 0, total_pages: 0
    }));

    await TestBed.configureTestingModule({
      imports: [CommonModule, HttpClientTestingModule],
      declarations: [DashboardComponent],
      providers: [
        { provide: DashboardService, useValue: dashboardService },
        { provide: ProductService, useValue: productService },
        { provide: TaskService, useValue: taskService },
        { provide: OrderService, useValue: orderService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  function createWithStockAccess(): void {
    spyOnProperty(component, 'canViewStockAlerts', 'get').and.returnValue(true);
    fixture.detectChanges();
  }

  it('renders the summary returned by the service', () => {
    createWithStockAccess();

    expect(fixture.nativeElement.textContent).toContain('128');
    expect(fixture.nativeElement.textContent).toContain('2,50,000.00');
    expect(fixture.nativeElement.textContent).toContain('12');
    expect(fixture.nativeElement.textContent).toContain('4');
    expect(component.isLoading).toBeFalse();
  });

  it('shows an error when the summary request fails', () => {
    dashboardService.getSummary.and.returnValue(
      throwError(() => ({ status: 500 } as HttpErrorResponse))
    );

    createWithStockAccess();

    expect(fixture.nativeElement.textContent).toContain(
      'Unable to load inventory summary (HTTP 500).'
    );
    expect(component.isLoading).toBeFalse();
  });

  it('hides the stock alerts when the role cannot view products', () => {
    fixture.detectChanges();

    expect(stockAlertsSection()).toBeNull();
    expect(productService.getProducts).not.toHaveBeenCalled();
  });

  it('lists low stock products by default', () => {
    createWithStockAccess();

    expect(productService.getProducts).toHaveBeenCalledWith(
      jasmine.objectContaining({ stockStatus: 'low stock', pageSize: component.stockAlertLimit })
    );
    expect(renderedProductNames().join(' ')).toContain('Hex Bolt M8');
    expect(renderedProductNames().join(' ')).not.toContain('Wrench 12mm');
  });

  it('shows the restock qty alongside the current qty for each alert', () => {
    createWithStockAccess();

    const rows = Array.from(stockAlertsSection().querySelectorAll('tbody tr'));
    const cells = (row: Element): string[] =>
      Array.from(row.querySelectorAll('td')).map(cell => (cell.textContent || '').trim());

    expect(cells(rows[0]).slice(1)).toEqual(['3', '10', 'Low Stock']);
    expect(cells(rows[1]).slice(1)).toEqual(['1', '5', 'Low Stock']);
    expect(cells(rows[2]).slice(1)).toEqual(['0', '5', 'Low Stock']);
  });

  it('switches to the out of stock products on tab change', () => {
    createWithStockAccess();

    const outTab = stockAlertsSection().querySelectorAll('[role="tab"]')[1] as HTMLElement;
    outTab.click();
    fixture.detectChanges();

    expect(renderedProductNames().join(' ')).toContain('Wrench 12mm');
    expect(renderedProductNames().join(' ')).not.toContain('Hex Bolt M8');
  });

  it('falls back to an unfiltered page when the API ignores the stock status filter', () => {
    productService.getProducts.and.callFake(() => of(responseFor(null, catalogue)));

    createWithStockAccess();

    expect(productService.getProducts).toHaveBeenCalledWith({ page: 1, pageSize: 100 });
    expect(renderedProductNames().join(' ')).toContain('Hex Bolt M8');
    expect(component.outOfStockProducts.length).toBe(2);
  });

  it('shows at most the alert limit per tab', () => {
    const many: Product[] = Array.from({ length: 7 }, (_unused, index) =>
      makeProduct(`Low ${index}`, `LOW-${index}`, 'low stock', 1, 5)
    );
    productService.getProducts.and.callFake((query: ProductQuery) =>
      of(responseFor(query.stockStatus || null, many))
    );

    createWithStockAccess();

    expect(renderedProductNames().length).toBe(component.stockAlertLimit);
  });

  it('reports a stock alert failure without breaking the summary', () => {
    productService.getProducts.and.returnValue(
      throwError(() => new Error('Request failed'))
    );

    createWithStockAccess();

    expect(stockAlertsSection().textContent).toContain('Unable to load stock alerts.');
    expect(fixture.nativeElement.textContent).toContain('128');
    expect(component.summary).toEqual(summary);
    expect(component.stockAlertsLoading).toBeFalse();
  });

  it('shows the empty label when a tab has no products', () => {
    productService.getProducts.and.callFake((query: ProductQuery) =>
      of(responseFor(
        query.stockStatus || null,
        catalogue.filter(product => product.stock_status !== 'out of stock')
      ))
    );

    createWithStockAccess();

    const outTab = stockAlertsSection().querySelectorAll('[role="tab"]')[1] as HTMLElement;
    outTab.click();
    fixture.detectChanges();

    expect(stockAlertsSection().textContent).toContain('No out of stock products.');
  });

  it('shows the delivery date under the status for delivered orders', () => {
    const delivered = makeOrder('DELIVERED', '2026-03-15T00:00:00Z');
    orderService.getOrders.and.returnValue(of({
      items: [delivered, makeOrder('SHIPPED', null)],
      page: 1, page_size: 5, total: 2, total_pages: 1
    }));

    spyOnProperty(component, 'canViewOrdersSection', 'get').and.returnValue(true);
    createWithStockAccess();

    const rows: Element[] = Array.from(
      fixture.nativeElement.querySelectorAll('[aria-label="Dashboard widgets"] tbody tr')
    );
    const rowText = (status: string): string => {
      const row = rows.find(candidate => (candidate.textContent || '').includes(status));
      return row ? row.textContent || '' : '';
    };

    expect(rowText('DELIVERED')).toContain('Mar 15, 2026');
    expect(rowText('DELIVERED')).toContain('#order-DELIVERED');
    expect(rowText('DELIVERED')).not.toContain('cus-1');
    expect(rowText('SHIPPED')).toContain('#order-SHIPPED');
    expect(rowText('SHIPPED')).not.toContain('Delivered');
  });

  function makeOrder(status: OrderStatus, actualDeliveryDate: string | null): Order {
    return {
      id: `order-${status}`,
      customer_id: 'cus-1',
      customer_name: 'Acme',
      order_date: '2026-03-01T00:00:00Z',
      status,
      total_amount: '1500.00',
      predicted_delivery_date: '2026-03-20T00:00:00Z',
      actual_delivery_date: actualDeliveryDate,
      items: [],
      created_at: '2026-03-01T00:00:00Z',
      updated_at: '2026-03-01T00:00:00Z'
    };
  }
});

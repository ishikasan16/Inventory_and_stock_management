import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  PredictionService,
  DeliveryPrediction,
  FulfillmentFeatures
} from '../../services/prediction.service';
import { OrderService, Order } from '../../services/order.service';
import { CustomerService, Customer } from '../../services/customers.service';

@Component({
  selector: 'app-predictions',
  templateUrl: './predictions.component.html'
})
export class PredictionsComponent implements OnInit, OnDestroy {

  orders: Order[] = [];
  customers: Customer[] = [];

  selectedOrderId = '';

  result: DeliveryPrediction | null = null;
  sourceLabel = '';

  isLoading = false;
  errorMessage = '';

  manualForm: FormGroup;

  private subscriptions: Subscription[] = [];

  private customerNames = new Map<string, string>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private predictionService: PredictionService,
    private orderService: OrderService,
    private customerService: CustomerService
  ) {
    this.manualForm = this.fb.group({
      order_id: ['', Validators.required],
      order_date: [this.todayInput(), Validators.required],
      order_quantity: [10, [Validators.required, Validators.min(1)]],
      number_of_items: [1, [Validators.required, Validators.min(1)]],
      current_stock: [10, [Validators.required, Validators.min(0)]],
      reorder_level: [5, [Validators.required, Validators.min(0)]],
      supplier_lead_time: [2, [Validators.required, Validators.min(0)]],
      processing_time: [1, [Validators.required, Validators.min(0)]],
      shipping_time: [3, [Validators.required, Validators.min(0)]],
      distance_km: [350, [Validators.required, Validators.min(0)]],
      shipping_mode: [0, [Validators.required]],
      rainy_days_in_transit: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadOrders();
    this.loadCustomers();

    this.route.queryParamMap.subscribe((params) => {
      const orderId = params.get('orderId');

      if (orderId) {
        this.selectedOrderId = orderId;
        this.manualForm.patchValue({ order_id: orderId });
        if (!this.result) {
          this.predictSelectedOrder();
        }
      }
    });
  }

  todayInput(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  loadOrders(): void {
    this.subscriptions.push(this.orderService.getAllOrders().subscribe({
      next: (orders) => {
        this.orders = (orders || []).filter(
          (order) => order.status?.toUpperCase() !== 'DELIVERED' && !order.actual_delivery_date
        );
        if (this.orders.length > 0 && !this.manualForm.get('order_id')?.value) {
          this.syncManualFormWithOrder(this.orders[0]);
        }
      },
      error: () => {
        this.orders = [];
      }
    }));
  }

  syncManualFormWithOrder(order: Order): void {
    if (!order) return;
    const totalQty = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 10;
    const itemCount = order.items?.length || 1;
    const orderDate = order.order_date ? order.order_date.split('T')[0] : this.todayInput();
    this.manualForm.patchValue({
      order_id: order.id,
      order_date: orderDate,
      order_quantity: totalQty,
      number_of_items: itemCount
    });
  }

  onManualOrderSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const orderId = target?.value;
    const order = this.orders.find((o) => o.id === orderId);
    if (order) {
      this.syncManualFormWithOrder(order);
    }
  }

  loadCustomers(): void {
    this.subscriptions.push(this.customerService.getAllCustomers().subscribe({
      next: (customers) => {
        this.customers = customers || [];
        this.customerNames.clear();
        this.customers.forEach((c) => this.customerNames.set(c.id, c.name));
      },
      error: () => {
        this.customers = [];
      }
    }));
  }

  customerName(id: string): string {
    return this.customerNames.get(id) || '#'.concat(id);
  }

  shortId(id: string): string {
    return id ? id.slice(0, 8) : '—';
  }

  selectedOrder(): Order | null {
    return this.orders.find((o) => o.id === this.selectedOrderId) || null;
  }

  // 1-Click order-based prediction
  predictSelectedOrder(): void {
    if (!this.selectedOrderId) {
      return;
    }

    const order = this.orders.find((o) => o.id === this.selectedOrderId);
    if (order) {
      this.syncManualFormWithOrder(order);
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.result = null;

    this.subscriptions.push(
      this.predictionService.predictOrderDelivery(this.selectedOrderId).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.result = response;
          this.sourceLabel = 'Order-based prediction (auto feature extraction & transit weather)';
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = this.formatError(
            error,
            'Failed to compute prediction for the selected order.'
          );
        }
      })
    );
  }

  // Manual what-if simulation
  runManual(): void {
    if (this.manualForm.invalid) {
      this.manualForm.markAllAsTouched();
      return;
    }

    const value = this.manualForm.value;

    const features: FulfillmentFeatures = {
      order_id: value.order_id,
      order_date: new Date(`${value.order_date}T00:00:00`).toISOString(),
      order_quantity: Number(value.order_quantity),
      number_of_items: Number(value.number_of_items),
      current_stock: Number(value.current_stock),
      reorder_level: Number(value.reorder_level),
      supplier_lead_time: Number(value.supplier_lead_time),
      processing_time: Number(value.processing_time),
      shipping_time: Number(value.shipping_time),
      distance_km: Number(value.distance_km),
      shipping_mode: Number(value.shipping_mode),
      rainy_days_in_transit: Number(value.rainy_days_in_transit)
    };

    this.isLoading = true;
    this.errorMessage = '';
    this.result = null;

    this.subscriptions.push(
      this.predictionService.predictDelivery(features).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.result = response;
          this.sourceLabel = 'Manual simulation (weather & transit parameters)';
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = this.formatError(
            error,
            'Failed to run the simulation.'
          );
        }
      })
    );
  }

  getWeatherIcon(condition: string | null | undefined): string {
    if (!condition) return '🌤️';
    const c = condition.toLowerCase();
    if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) return '🌧️';
    if (c.includes('thunder') || c.includes('storm')) return '⛈️';
    if (c.includes('snow') || c.includes('flurry')) return '❄️';
    if (c.includes('fog') || c.includes('mist')) return '🌫️';
    if (c.includes('cloud') || c.includes('overcast')) return '☁️';
    if (c.includes('clear') || c.includes('sun')) return '☀️';
    return '🌤️';
  }

  getShippingModeBadge(mode: string | null | undefined): string {
    return mode || 'Standard';
  }

  formatFulfillmentDays(days: number | null | undefined): string {
    if (days === null || days === undefined || isNaN(Number(days))) {
      return '—';
    }
    const val = Number(days);
    const rounded = Math.round(val * 2) / 2;
    return (rounded % 1 === 0) ? rounded.toFixed(0) : rounded.toFixed(1);
  }

  riskAssessment(): 'ON TIME' | 'DELAY RISK' {
    if (!this.result) {
      return 'ON TIME';
    }

    return this.result.predicted_fulfillment_days > 5
      ? 'DELAY RISK'
      : 'ON TIME';
  }

  stockSufficient(): boolean {
    const quantity = this.manualForm.get('order_quantity')?.value || 0;
    const stock = this.manualForm.get('current_stock')?.value || 0;
    return Number(stock) >= Number(quantity);
  }

  formatPredictionDate(): string {
    return this.result ? this.formatDate(this.result.predicted_delivery_date) : '—';
  }

  private formatDate(value: string | null | undefined): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  private formatError(error: any, fallback: string): string {
    const detail = error?.error?.detail;

    if (typeof detail === 'string') {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((d: any) => {
          if (d?.loc && d?.msg) {
            const field = d.loc[d.loc.length - 1];
            return field && field !== 'body' ? `${field}: ${d.msg}` : d.msg;
          }
          return d?.msg || JSON.stringify(d);
        })
        .join(', ');
    }

    if (detail && typeof detail === 'object') {
      return detail.message || detail.msg || JSON.stringify(detail);
    }

    return error?.error?.message || error?.message || fallback;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
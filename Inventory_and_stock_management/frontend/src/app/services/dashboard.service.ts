import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { DashboardSummary } from '../features/dashboard/dashboard.component';


@Injectable({ providedIn: 'root' })
export class DashboardService extends ApiService {

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(this.buildUrl(`products/summary`));
  }
}

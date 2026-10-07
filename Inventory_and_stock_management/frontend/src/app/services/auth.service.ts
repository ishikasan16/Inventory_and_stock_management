import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  role: string;
  username: string;
  user_id?: string;
}

export interface RefreshResponse {
  access_token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService extends ApiService {

  constructor(http: HttpClient) {
    super(http);
  }

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      this.buildUrl('auth/login'),
      data,
      {
        withCredentials: true
      }
    );
  }

  // Register API
  signup(data: any): Observable<any> {
    return this.http.post<any>(
      this.buildUrl('auth/register'),
      data
    );
  }

  // Refresh token API
  refreshToken(): Observable<RefreshResponse> {
    return this.http.post<RefreshResponse>(
      this.buildUrl('auth/refresh'),
      {},
      {
        withCredentials: true
      }
    );
  }

  // Logout API
  logout(): Observable<any> {
    return this.http.post<any>(
      this.buildUrl('auth/logout'),
      {},
      {
        withCredentials: true
      }
    );
  }
}
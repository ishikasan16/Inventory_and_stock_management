import { Injectable, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, shareReplay, throwError } from 'rxjs';

import { AuthService, RefreshResponse } from './auth.service';
import {
  clearSession,
  currentUser,
  getAccessToken,
  hasStoredSession,
  restoreSession,
  tokenExpiry
} from '../auth/utils/auth-state';


export const REFRESH_LEEWAY_MS = 60_000;


@Injectable({
  providedIn: 'root'
})
export class SessionService {

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private inFlight: Observable<string> | null = null;

  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {


    effect(() => this.armFor(currentUser()?.access_token ?? null));
  }

 
  init(): Observable<unknown> {

    if (getAccessToken()) {
      return of(null);
    }

    if (!hasStoredSession()) {
      return of(null);
    }

    return this.refresh().pipe(catchError(() => of(null)));
  }

  refresh(): Observable<string> {

    if (!this.inFlight) {
      this.inFlight = this.requestRefresh();
    }

    return this.inFlight;
  }


  private refreshNow(): void {
    this.refresh().subscribe({
      next: () => undefined,
      error: () => this.endSession()
    });
  }

  private requestRefresh(): Observable<string> {
    return this.authService.refreshToken().pipe(
      map((response: RefreshResponse) => {
        if (!restoreSession(response.access_token)) {
          throw new Error('Refreshed access token cannot describe this session.');
        }

        return response.access_token;
      }),
      catchError(error => {
       
        clearSession();
        return throwError(() => error);
      }),
    
      finalize(() => {
        this.inFlight = null;
      }),
     
      shareReplay({ bufferSize: 1, refCount: false })
    );
  }

  private armFor(token: string | null): void {
    this.clearTimer();

    if (!token) {
      return;
    }

    const expiry = tokenExpiry(token);

    if (expiry === null) {
      return;
    }

    const delay = Math.max(0, expiry - Date.now() - REFRESH_LEEWAY_MS);

    this.timer = setTimeout(() => this.refreshNow(), delay);
  }

  private clearTimer(): void {
    if (this.timer !== undefined) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  private endSession(): void {
    this.router.navigate(['/login'], {
      queryParams: {
        returnUrl: this.router.url,
        reason: 'session-changed'
      }
    });
  }
}

export function sessionInitFactory(session: SessionService): () => Observable<unknown> {
  return () => session.init();
}

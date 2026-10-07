import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService, LoginRequest } from '../../../services/auth.service';
import { clearSession, startSession } from '../../utils/auth-state';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {

  email = '';
  password = '';

  errorMessage = '';
  noticeMessage = '';
  isLoading = false;


  private static readonly NOTICES: Record<string, string> = {
    'role-changed':
      'Your own role was changed. Please sign in again to apply it.',
    'session-changed':
      'Your session is no longer valid. Please sign in again.'
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.noticeMessage =
      LoginComponent.NOTICES[this.route.snapshot.queryParamMap.get('reason') ?? ''] ?? '';
  }

  onSubmit(): void {

    this.errorMessage = '';
    this.noticeMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Email and password are required.';
      return;
    }

    this.isLoading = true;

    const loginData: LoginRequest = {
      email: this.email.trim().toLowerCase(),
      password: this.password
    };

    this.authService.login(loginData).subscribe({

      next: (response) => {

        const started = startSession(
          response.access_token,
          response.role,
          response.username,
          response.user_id
        );

        if (!started) {
          this.isLoading = false;
          this.errorMessage =
            'Login response was missing a valid access token or role.';
          return;
        }

        this.isLoading = false;

        this.router.navigate(['/dashboard']);
      },

      error: (error) => {

        this.isLoading = false;

        this.errorMessage =
          error.error?.detail ||
          'Login failed. Please check your email and password.';
      }
    });
  }

 
  logout(): void {

    clearSession();

    this.router.navigate(['/login']);
  }
}

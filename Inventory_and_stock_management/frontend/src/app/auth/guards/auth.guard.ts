import { inject } from '@angular/core';
import { CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';

import { getAccessToken } from '../utils/auth-state';

export const authGuard: CanActivateFn = (route, state) => {

  const router = inject(Router);

  if (getAccessToken()) {
    return true;
  }

  // Preserve where the user was heading so login can send them back.
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};

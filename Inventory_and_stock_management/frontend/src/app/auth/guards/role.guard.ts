import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { currentRole } from '../utils/role-auth';
import { parseRole } from '../utils/role-model';

export const roleGuard: CanActivateFn = (route) => {

  const router = inject(Router);

  const userRole = currentRole();

  const allowedRoles = (route.data['roles'] as string[] || [])
    .map(role => parseRole(role))
    .filter(role => role !== null);

  if (userRole !== null && allowedRoles.includes(userRole)) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

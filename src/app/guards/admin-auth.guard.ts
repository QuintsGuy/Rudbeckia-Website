// src/app/guards/admin-auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminAuthGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (await authService.isLoggedIn() && await authService.isAdmin()) {
    return true;
  }

  // Redirect to home or login page
  router.navigate(['/']);
  return false;
};



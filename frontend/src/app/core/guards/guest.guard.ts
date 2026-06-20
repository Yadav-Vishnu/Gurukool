import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.ensureReady();

  if (authService.isAuthenticated()) {
    const user = authService.user();
    const profileCompleted = user?.profile_completed;
    return profileCompleted
      ? router.createUrlTree(['/dashboard'])
      : router.createUrlTree(['/profile-setup']);
  }

  return true;
};

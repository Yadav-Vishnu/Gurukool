import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.ensureReady();

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/welcome']);
  }

  const user = authService.user();
  const profileCompleted = user?.profile_completed;
  const isProfileSetupRoute = state.url.includes('/profile-setup');

  // If profile is not set up and we're not on the setup page, force redirect to setup
  if (!profileCompleted && !isProfileSetupRoute) {
    return router.createUrlTree(['/profile-setup']);
  }

  // If profile is already set up and we are trying to access the setup page, redirect to dashboard
  if (profileCompleted && isProfileSetupRoute) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};

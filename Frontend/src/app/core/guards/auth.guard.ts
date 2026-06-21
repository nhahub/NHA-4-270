import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from '../../stores/auth.store';

export const authGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    // Check role permissions if specified in route data
    const expectedPermission = route.data['permission'] as string;
    if (expectedPermission && !authStore.hasPermission(expectedPermission)) {
      router.navigate(['/dashboard']); // Redirect to home dashboard if unauthorized
      return false;
    }
    return true;
  }

  // Redirect to login with original return url
  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

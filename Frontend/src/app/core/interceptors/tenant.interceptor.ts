import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStore } from '../../stores/auth.store';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const tenantId = authStore.tenant()?.id;

  if (tenantId) {
    const cloned = req.clone({
      headers: req.headers.set('X-Tenant-ID', tenantId)
    });
    return next(cloned);
  }

  return next(req);
};

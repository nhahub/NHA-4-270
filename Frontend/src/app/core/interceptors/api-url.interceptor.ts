import { HttpInterceptorFn } from '@angular/common/http';
import { isDevMode } from '@angular/core';

export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const apiBaseUrl = isDevMode()
    ? 'http://localhost:5097'
    : window.location.origin;

  if (req.url.startsWith('/api/')) {
    const cloned = req.clone({
      url: `${apiBaseUrl}${req.url}`
    });
    return next(cloned);
  }
  return next(req);
};

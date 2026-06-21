import { HttpInterceptorFn } from '@angular/common/http';

export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const apiBaseUrl = 'http://localhost:5097';
  if (req.url.startsWith('/api/')) {
    const cloned = req.clone({
      url: `${apiBaseUrl}${req.url}`
    });
    return next(cloned);
  }
  return next(req);
};

import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { MockDbService } from '../services/mock-db.service';

export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  // If the request is not for the mock API, pass it through
  if (!req.url.startsWith('/api/')) {
    return next(req);
  }

  const db = inject(MockDbService);

  // Extract tenant identifier from headers
  const tenantId = req.headers.get('X-Tenant-ID') || 'acme';

  // Extract query parameters or URL path parts
  const url = req.url;
  const method = req.method;

  try {
    // ---------------- PRODUCTS ENDPOINT ----------------
    if (url === '/api/products') {
      if (method === 'GET') {
        const data = db.getProducts(tenantId);
        return of(new HttpResponse({ status: 200, body: data })).pipe(delay(400));
      }
      if (method === 'POST' || method === 'PUT') {
        const product = db.saveProduct(tenantId, req.body as any);
        return of(new HttpResponse({ status: 200, body: product })).pipe(delay(400));
      }
    }
    if (url.startsWith('/api/products/') && method === 'DELETE') {
      const parts = url.split('/');
      const id = parseInt(parts[parts.length - 1], 10);
      db.deleteProduct(tenantId, id);
      return of(new HttpResponse({ status: 200, body: { success: true, id } })).pipe(delay(300));
    }

    // ---------------- CATEGORIES ENDPOINT ----------------
    if (url === '/api/categories') {
      if (method === 'GET') {
        const data = db.getCategories(tenantId);
        return of(new HttpResponse({ status: 200, body: data })).pipe(delay(300));
      }
      if (method === 'POST' || method === 'PUT') {
        const cat = db.saveCategory(tenantId, req.body as any);
        return of(new HttpResponse({ status: 200, body: cat })).pipe(delay(300));
      }
    }
    if (url.startsWith('/api/categories/') && method === 'DELETE') {
      const parts = url.split('/');
      const id = parseInt(parts[parts.length - 1], 10);
      db.deleteCategory(tenantId, id);
      return of(new HttpResponse({ status: 200, body: { success: true, id } })).pipe(delay(200));
    }

    // ---------------- STOCK MOVEMENTS ENDPOINT ----------------
    if (url === '/api/stock-movements') {
      if (method === 'GET') {
        const data = db.getStockMovements(tenantId);
        return of(new HttpResponse({ status: 200, body: data })).pipe(delay(400));
      }
      if (method === 'POST') {
        const movement = db.createStockMovement(tenantId, req.body as any);
        return of(new HttpResponse({ status: 200, body: movement })).pipe(delay(400));
      }
    }

    // ---------------- WAREHOUSES ENDPOINT ----------------
    if (url === '/api/inventory/warehouses') {
      if (method === 'GET') {
        const data = db.getWarehouses(tenantId);
        return of(new HttpResponse({ status: 200, body: data })).pipe(delay(300));
      }
    }

    // ---------------- USERS ENDPOINT ----------------
    if (url === '/api/users') {
      if (method === 'GET') {
        const data = db.getUsers(tenantId);
        return of(new HttpResponse({ status: 200, body: data })).pipe(delay(300));
      }
      if (method === 'POST' || method === 'PUT') {
        const user = db.saveUser(tenantId, req.body as any);
        return of(new HttpResponse({ status: 200, body: user })).pipe(delay(300));
      }
    }
    if (url.startsWith('/api/users/') && method === 'DELETE') {
      const parts = url.split('/');
      const id = parseInt(parts[parts.length - 1], 10);
      db.deleteUser(tenantId, id);
      return of(new HttpResponse({ status: 200, body: { success: true, id } })).pipe(delay(200));
    }

    // ---------------- ROLES ENDPOINT ----------------
    if (url === '/api/roles') {
      if (method === 'GET') {
        const data = db.getRoles(tenantId);
        return of(new HttpResponse({ status: 200, body: data })).pipe(delay(300));
      }
      if (method === 'POST' || method === 'PUT') {
        const role = db.saveRole(tenantId, req.body as any);
        return of(new HttpResponse({ status: 200, body: role })).pipe(delay(300));
      }
    }

    // ---------------- SETTINGS ENDPOINT ----------------
    if (url === '/api/settings') {
      if (method === 'GET') {
        const data = db.getSettings(tenantId);
        return of(new HttpResponse({ status: 200, body: data })).pipe(delay(300));
      }
      if (method === 'POST' || method === 'PUT') {
        const settings = db.saveSettings(tenantId, req.body as any);
        return of(new HttpResponse({ status: 200, body: settings })).pipe(delay(300));
      }
    }

    // ---------------- DASHBOARD & WIDGETS ENDPOINT ----------------
    if (url === '/api/dashboard/stats') {
      if (method === 'GET') {
        const products = db.getProducts(tenantId);
        const categories = db.getCategories(tenantId);
        const users = db.getUsers(tenantId);
        const stockMovements = db.getStockMovements(tenantId);

        const totalProducts = products.length;
        const totalCategories = categories.length;
        const totalValue = products.reduce((acc, p) => acc + (p.price * p.quantity), 0);
        const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity <= 10).length;
        const activeUsersCount = users.filter(u => u.status === 'Active').length;
        const monthlyTx = stockMovements.filter(m => {
          const date = new Date(m.movementDate);
          const now = new Date();
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }).length + 120; // adding constant base to look full

        // Mock chart data tailored by tenant
        const isAcme = tenantId === 'acme';
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

        const inventoryTrend = isAcme 
          ? [120, 150, 180, 210, 230, totalProducts]
          : [80, 100, 120, 140, 145, totalProducts];

        const catData = categories.map(c => {
          const count = products.filter(p => p.categoryId === c.id).length;
          return { name: c.name, count };
        });

        const stockInTrends = isAcme ? [45, 60, 55, 70, 80, 95] : [100, 120, 150, 110, 130, 140];
        const stockOutTrends = isAcme ? [30, 40, 45, 50, 60, 75] : [80, 90, 110, 95, 115, 125];

        const valueGrowth = isAcme
          ? [95000, 105000, 115000, 135000, 142000, totalValue]
          : [28000, 31000, 34000, 41000, 43000, totalValue];

        const topProducts = products
          .map(p => ({ name: p.name, value: p.price * p.quantity, qty: p.quantity }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);

        const recentActivities = db.getActivityLogs(tenantId);

        const statsBody = {
          kpis: {
            totalProducts,
            totalCategories,
            totalValue,
            lowStockCount,
            activeUsersCount,
            monthlyTx
          },
          charts: {
            months,
            inventoryTrend,
            categoryDistribution: catData,
            stockMovement: {
              in: stockInTrends,
              out: stockOutTrends
            },
            valueGrowth,
            topProducts
          },
          recentActivities
        };

        return of(new HttpResponse({ status: 200, body: statsBody })).pipe(delay(500));
      }
    }

    // 404 fallback for mock API
    return throwError(() => new HttpErrorResponse({
      status: 404,
      statusText: 'Mock API Endpoint Not Found',
      url: req.url
    })).pipe(delay(200));

  } catch (err: any) {
    return throwError(() => new HttpErrorResponse({
      status: 500,
      statusText: err.message || 'Internal Mock API Server Error',
      url: req.url
    })).pipe(delay(300));
  }
};

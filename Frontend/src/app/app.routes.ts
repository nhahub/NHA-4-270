import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Auth routes
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    title: 'Sign In - Inventory Management System'
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
    title: 'Provision Workspace - Inventory Management System'
  },
  
  // Dashboard routes inside shell
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        data: { title: 'Dashboard' }
      },
      {
        path: 'inventory/products',
        loadComponent: () => import('./features/products/products.component').then(m => m.ProductsComponent),
        data: { title: 'Product Catalog', permission: 'products:read' }
      },
      {
        path: 'inventory/categories',
        loadComponent: () => import('./features/categories/categories.component').then(m => m.CategoriesComponent),
        data: { title: 'Category Matrix', permission: 'categories:read' }
      },
      {
        path: 'inventory/overview',
        loadComponent: () => import('./features/inventory/inventory-overview.component').then(m => m.InventoryOverviewComponent),
        data: { title: 'Inventory Overview', permission: 'inventory:read' }
      },
      {
        path: 'operations/movements',
        loadComponent: () => import('./features/stock-movements/stock-movements.component').then(m => m.StockMovementsComponent),
        data: { title: 'Stock Transactions', permission: 'movements:read' }
      },
      {
        path: 'admin/users',
        loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent),
        data: { title: 'User Access Matrix', permission: 'users:read' }
      },
      {
        path: 'admin/roles',
        loadComponent: () => import('./features/roles/roles.component').then(m => m.RolesComponent),
        data: { title: 'Security Roles', permission: 'roles:read' }
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent),
        data: { title: 'Analytics Reports', permission: 'reports:read' }
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
        data: { title: 'System Settings', permission: 'settings:read' }
      }
    ]
  },

  // Fallback
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

// User & Auth Interfaces
export interface AuthUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string; // 'Platform Admin' | 'Tenant Admin' | 'Inventory Manager' | 'Staff'
  status: 'Active' | 'Inactive';
}

export interface Tenant {
  id: string;
  name: string;
  logo?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
}

// Product Interface
export interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  price: number;
  quantity: number;
  categoryId: number;
  imageUrl: string;
  status: 'Active' | 'Inactive' | 'Draft';
  createdAt: string;
}

// Category Interface
export interface Category {
  id: number;
  name: string;
  description: string;
}

// Stock Movement Interface
export interface StockMovement {
  id: number;
  productId: number;
  productName?: string; // Optional resolved name for UI displays
  movementType: 'STOCK_IN' | 'STOCK_OUT' | 'TRANSFER';
  quantity: number;
  reference: string;
  movementDate: string;
  notes: string;
  fromWarehouse?: string;
  toWarehouse?: string;
}

// User Profile & Management
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
}

// Role Interface for RBAC
export interface Role {
  id: number;
  name: string; // e.g. 'Platform Admin'
  description: string;
  permissions: string[]; // List of allowed actions like 'products:read', 'products:write'
}

// Permission Matrix item
export interface PermissionDefinition {
  module: string;
  action: string;
  key: string; // e.g. 'products:create'
  description: string;
}

// Warehouse Inventory detail
export interface WarehouseStock {
  id: number;
  name: string;
  location: string;
  availableQty: number;
  reservedQty: number;
  value: number;
}

// Activity Log widget item
export interface ActivityLog {
  id: number;
  user: string;
  action: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

// Settings Configurations
export interface CompanySettings {
  companyName: string;
  logo: string;
  email: string;
  phone: string;
  address: string;
}

export interface UserProfileSettings {
  firstName: string;
  lastName: string;
  email: string;
}

export interface NotificationSettings {
  emailAlerts: boolean;
  lowStockAlerts: boolean;
  dailyReports: boolean;
}

export interface AppSettings {
  company: CompanySettings;
  profile: UserProfileSettings;
  notifications: NotificationSettings;
}

import { Injectable } from '@angular/core';
import { Product, Category, StockMovement, User, Role, WarehouseStock, ActivityLog, AppSettings } from '../models/app.models';

interface TenantData {
  products: Product[];
  categories: Category[];
  stockMovements: StockMovement[];
  users: User[];
  warehouses: WarehouseStock[];
  roles: Role[];
  activityLogs: ActivityLog[];
  settings: AppSettings;
}

@Injectable({
  providedIn: 'root'
})
export class MockDbService {
  private readonly STORAGE_PREFIX = 'ims_tenant_';

  // Seed data for Acme Corp (Tenant: acme)
  private readonly acmeSeed: TenantData = {
    categories: [
      { id: 1, name: 'Electronics', description: 'Smartphones, laptops, tablets, and smartwatches' },
      { id: 2, name: 'Accessories', description: 'Chargers, cases, keyboards, and mouse devices' },
      { id: 3, name: 'Office Equipment', description: 'Printers, standing desks, ergonomic chairs' }
    ],
    products: [
      { id: 101, name: 'iPhone 15 Pro Max', sku: 'APL-IP15PM-256', description: 'Apple iPhone 15 Pro Max 256GB Space Gray', price: 1199.99, quantity: 45, categoryId: 1, imageUrl: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', status: 'Active', createdAt: '2026-01-10T10:00:00Z' },
      { id: 102, name: 'MacBook Pro 16 M3', sku: 'APL-MBP16M3-512', description: 'Apple MacBook Pro 16-inch M3 Pro 16GB/512GB Space Black', price: 2499.00, quantity: 12, categoryId: 1, imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', status: 'Active', createdAt: '2026-02-15T14:30:00Z' },
      { id: 103, name: 'Dell XPS 15 9530', sku: 'DEL-XPS15-16512', description: 'Dell XPS 15 Laptop Intel Core i7 16GB/512GB RTX 4050', price: 1799.00, quantity: 3, categoryId: 1, imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', status: 'Active', createdAt: '2026-03-01T09:15:00Z' }, // Low stock
      { id: 104, name: 'iPad Pro 11 M2', sku: 'APL-IPP11M2-128', description: 'Apple iPad Pro 11-inch M2 128GB Wi-Fi Space Gray', price: 799.00, quantity: 0, categoryId: 1, imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', status: 'Active', createdAt: '2026-03-10T11:00:00Z' }, // Out of stock
      { id: 105, name: 'Logitech MX Master 3S', sku: 'LOG-MXM3S-GRY', description: 'Logitech MX Master 3S Wireless Ergonomic Mouse Graphite', price: 99.99, quantity: 85, categoryId: 2, imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', status: 'Active', createdAt: '2026-01-20T16:20:00Z' },
      { id: 106, name: 'USB-C Multiport Adapter', sku: 'GEN-USBC-HUB7', description: '7-in-1 USB-C Hub with 4K HDMI, SD Card Reader, Power Delivery', price: 49.99, quantity: 150, categoryId: 2, imageUrl: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', status: 'Active', createdAt: '2026-02-10T08:00:00Z' },
      { id: 107, name: 'Ergonomic Desk Chair', sku: 'OFC-ERGCHR-BLK', description: 'High-back ergonomic mesh office chair with lumbar support', price: 349.00, quantity: 8, categoryId: 3, imageUrl: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', status: 'Active', createdAt: '2026-01-15T12:00:00Z' }
    ],
    stockMovements: [
      { id: 501, productId: 101, movementType: 'STOCK_IN', quantity: 50, reference: 'PO-2026-001', movementDate: '2026-01-10T11:00:00Z', notes: 'Initial seed stock', toWarehouse: 'Main Warehouse SF' },
      { id: 502, productId: 101, movementType: 'STOCK_OUT', quantity: 5, reference: 'SO-2026-001', movementDate: '2026-02-01T15:00:00Z', notes: 'Customer order sale', fromWarehouse: 'Main Warehouse SF' },
      { id: 503, productId: 102, movementType: 'STOCK_IN', quantity: 15, reference: 'PO-2026-002', movementDate: '2026-02-15T15:00:00Z', notes: 'Supplier delivery', toWarehouse: 'Main Warehouse SF' },
      { id: 504, productId: 102, movementType: 'TRANSFER', quantity: 3, reference: 'TR-2026-001', movementDate: '2026-03-05T10:00:00Z', notes: 'Internal warehouse balance', fromWarehouse: 'Main Warehouse SF', toWarehouse: 'East Coast Hub NY' },
      { id: 505, productId: 103, movementType: 'STOCK_IN', quantity: 5, reference: 'PO-2026-003', movementDate: '2026-03-01T10:00:00Z', notes: 'Purchased laptops', toWarehouse: 'East Coast Hub NY' },
      { id: 506, productId: 103, movementType: 'STOCK_OUT', quantity: 2, reference: 'SO-2026-012', movementDate: '2026-03-12T14:00:00Z', notes: 'Fulfillment order', fromWarehouse: 'East Coast Hub NY' }
    ],
    warehouses: [
      { id: 1, name: 'Main Warehouse SF', location: 'San Francisco, CA', availableQty: 290, reservedQty: 15, value: 125000 },
      { id: 2, name: 'East Coast Hub NY', location: 'New York, NY', availableQty: 13, reservedQty: 2, value: 24500 }
    ],
    users: [
      { id: 1, firstName: 'Admin', lastName: 'Acme', email: 'admin@acme.com', role: 'Tenant Admin', status: 'Active' },
      { id: 2, firstName: 'John', lastName: 'Doe', email: 'manager@acme.com', role: 'Inventory Manager', status: 'Active' },
      { id: 3, firstName: 'Jane', lastName: 'Smith', email: 'staff@acme.com', role: 'Staff', status: 'Active' },
      { id: 4, firstName: 'Bob', lastName: 'Builder', email: 'inactive@acme.com', role: 'Staff', status: 'Inactive' }
    ],
    roles: [
      { id: 1, name: 'Platform Admin', description: 'Full global system control across all tenants.', permissions: ['all'] },
      { id: 2, name: 'Tenant Admin', description: 'Full control over company account and stock management.', permissions: ['dashboard:read', 'products:read', 'products:write', 'categories:read', 'categories:write', 'inventory:read', 'inventory:write', 'movements:read', 'movements:write', 'users:read', 'users:write', 'roles:read', 'reports:read', 'settings:read', 'settings:write'] },
      { id: 3, name: 'Inventory Manager', description: 'Can read/write stock levels and issue movements.', permissions: ['dashboard:read', 'products:read', 'products:write', 'categories:read', 'categories:write', 'inventory:read', 'inventory:write', 'movements:read', 'movements:write', 'reports:read', 'settings:read'] },
      { id: 4, name: 'Staff', description: 'Can read stock levels and view/record simple stock inputs.', permissions: ['dashboard:read', 'products:read', 'categories:read', 'inventory:read', 'movements:read', 'movements:write'] }
    ],
    activityLogs: [
      { id: 1, user: 'Admin Acme', action: 'Created product APL-IP15PM-256', timestamp: '2026-06-19T09:00:00Z', type: 'success' },
      { id: 2, user: 'John Doe', action: 'Recorded STOCK_OUT of 5 items for iPhone 15', timestamp: '2026-06-19T10:15:00Z', type: 'info' },
      { id: 3, user: 'Jane Smith', action: 'Updated quantity of Logitech MX Master 3S', timestamp: '2026-06-19T11:45:00Z', type: 'warning' }
    ],
    settings: {
      company: {
        companyName: 'Acme Corporation Ltd.',
        logo: 'https://cdn.logojoy.com/wp-content/uploads/2018/05/30164225/5_big1.png',
        email: 'info@acme.com',
        phone: '+1 (555) 019-2834',
        address: '101 Market Street, Suite 400, San Francisco, CA 94105'
      },
      profile: {
        firstName: 'Admin',
        lastName: 'Acme',
        email: 'admin@acme.com'
      },
      notifications: {
        emailAlerts: true,
        lowStockAlerts: true,
        dailyReports: false
      }
    }
  };

  // Seed data for Globex Industries (Tenant: globex)
  private readonly globexSeed: TenantData = {
    categories: [
      { id: 4, name: 'Industrial Tools', description: 'Heavy machinery and hand tools' },
      { id: 5, name: 'Safety Equipment', description: 'Hard hats, goggles, and high-visibility clothing' },
      { id: 6, name: 'Raw Materials', description: 'Steel beams, concrete mixes, timber wood' }
    ],
    products: [
      { id: 201, name: 'Rotary Hammer Drill 850W', sku: 'GLB-RHD850-X', description: 'Globex Industrial Rotary Hammer Drill 850W with SDS-Plus chuck', price: 149.99, quantity: 150, categoryId: 4, imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', status: 'Active', createdAt: '2026-02-01T08:00:00Z' },
      { id: 202, name: 'Heavy Duty Steel Beam', sku: 'GLB-SB100-24', description: 'Universal columns and steel sections I-beam, 24-foot length', price: 420.00, quantity: 18, categoryId: 6, imageUrl: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', status: 'Active', createdAt: '2026-02-10T12:00:00Z' },
      { id: 203, name: 'Premium Hard Hat Vented', sku: 'GLB-HATHAT-YEL', description: 'OSHA Approved Premium Vented Safety Helmet Yellow', price: 19.99, quantity: 500, categoryId: 5, imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', status: 'Active', createdAt: '2026-03-01T15:30:00Z' },
      { id: 204, name: 'Kevlar Cut-Resistant Gloves', sku: 'GLB-KEVGLV-MED', description: 'Level 5 Cut-Resistant Work Gloves reinforced with Kevlar, Medium', price: 12.50, quantity: 4, categoryId: 5, imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', status: 'Active', createdAt: '2026-03-12T09:00:00Z' } // Low stock
    ],
    stockMovements: [
      { id: 601, productId: 201, movementType: 'STOCK_IN', quantity: 200, reference: 'PO-GLB-001', movementDate: '2026-02-01T09:00:00Z', notes: 'Supplier batch delivery', toWarehouse: 'Chicago Logistics Park' },
      { id: 602, productId: 201, movementType: 'STOCK_OUT', quantity: 50, reference: 'SO-GLB-052', movementDate: '2026-02-28T16:00:00Z', notes: 'Wholesale order pickup', fromWarehouse: 'Chicago Logistics Park' },
      { id: 603, productId: 203, movementType: 'STOCK_IN', quantity: 500, reference: 'PO-GLB-002', movementDate: '2026-03-01T16:00:00Z', notes: 'Bulk purchase', toWarehouse: 'Houston Depot Store' }
    ],
    warehouses: [
      { id: 3, name: 'Chicago Logistics Park', location: 'Chicago, IL', availableQty: 118, reservedQty: 0, value: 24500 },
      { id: 4, name: 'Houston Depot Store', location: 'Houston, TX', availableQty: 554, reservedQty: 50, value: 22000 }
    ],
    users: [
      { id: 5, firstName: 'Admin', lastName: 'Globex', email: 'admin@globex.com', role: 'Tenant Admin', status: 'Active' },
      { id: 6, firstName: 'Hank', lastName: 'Scorpio', email: 'hank@globex.com', role: 'Inventory Manager', status: 'Active' },
      { id: 7, firstName: 'Homer', lastName: 'Simpson', email: 'homer@globex.com', role: 'Staff', status: 'Active' }
    ],
    roles: [
      { id: 1, name: 'Platform Admin', description: 'Full global system control across all tenants.', permissions: ['all'] },
      { id: 2, name: 'Tenant Admin', description: 'Full control over company account and stock management.', permissions: ['dashboard:read', 'products:read', 'products:write', 'categories:read', 'categories:write', 'inventory:read', 'inventory:write', 'movements:read', 'movements:write', 'users:read', 'users:write', 'roles:read', 'reports:read', 'settings:read', 'settings:write'] },
      { id: 3, name: 'Inventory Manager', description: 'Can read/write stock levels and issue movements.', permissions: ['dashboard:read', 'products:read', 'products:write', 'categories:read', 'categories:write', 'inventory:read', 'inventory:write', 'movements:read', 'movements:write', 'reports:read', 'settings:read'] },
      { id: 4, name: 'Staff', description: 'Can read stock levels and view/record simple stock inputs.', permissions: ['dashboard:read', 'products:read', 'categories:read', 'inventory:read', 'movements:read', 'movements:write'] }
    ],
    activityLogs: [
      { id: 5, user: 'Admin Globex', action: 'Authorized new safety stock limits', timestamp: '2026-06-19T08:30:00Z', type: 'info' },
      { id: 6, user: 'Hank Scorpio', action: 'Shipped 50 Hammer Drills to project alpha', timestamp: '2026-06-19T10:00:00Z', type: 'danger' }
    ],
    settings: {
      company: {
        companyName: 'Globex Industries Inc.',
        logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=200&auto=format&fit=crop',
        email: 'support@globex.com',
        phone: '+1 (800) 555-GLOBE',
        address: '42 Project Way, Cypress Creek, OR 97401'
      },
      profile: {
        firstName: 'Admin',
        lastName: 'Globex',
        email: 'admin@globex.com'
      },
      notifications: {
        emailAlerts: true,
        lowStockAlerts: true,
        dailyReports: true
      }
    }
  };

  constructor() {
    // Clear old seeded localStorage & sessionStorage data to ensure start from scratch
    const clearedKey = 'ims_local_storage_cleared_v1';
    if (!localStorage.getItem(clearedKey)) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('ims_') || key.startsWith('ims_tenant_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));

      // Clear session storage as well
      const sessionKeysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('ims_')) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(k => sessionStorage.removeItem(k));

      localStorage.setItem(clearedKey, 'true');
    }

    this.initDatabase();
  }

  // Initialize data if not already exists in localStorage
  private initDatabase(): void {
    if (!localStorage.getItem('ims_tenants_list')) {
      this.getTenantsList();
    }
  }

  // Get active tenants list
  public getTenantsList(): { id: string; name: string; logo: string; }[] {
    const raw = localStorage.getItem('ims_tenants_list');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {}
    }
    const defaultList: { id: string; name: string; logo: string; }[] = [];
    localStorage.setItem('ims_tenants_list', JSON.stringify(defaultList));
    return defaultList;
  }

  // Register a new tenant workspace with initial configuration
  public registerTenant(tenantId: string, companyName: string, adminUser: any): void {
    const list = this.getTenantsList();
    const idNormalized = tenantId.toLowerCase().trim();
    if (list.some(t => t.id === idNormalized)) {
      throw new Error(`Tenant workspace with identifier '${tenantId}' already exists.`);
    }
    
    const newTenant = {
      id: idNormalized,
      name: companyName,
      logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=200&auto=format&fit=crop'
    };
    list.push(newTenant);
    localStorage.setItem('ims_tenants_list', JSON.stringify(list));

    const newTenantData: TenantData = {
      categories: [
        { id: 1, name: 'General', description: 'Default category for incoming items' }
      ],
      products: [],
      stockMovements: [],
      warehouses: [
        { id: 1, name: 'Main Depot', location: 'Headquarters', availableQty: 0, reservedQty: 0, value: 0 }
      ],
      users: [
        { 
          id: 1, 
          firstName: adminUser.firstName, 
          lastName: adminUser.lastName, 
          email: adminUser.email.toLowerCase(), 
          role: 'Tenant Admin', 
          status: 'Active' 
        }
      ],
      roles: [
        { id: 1, name: 'Platform Admin', description: 'Full global system control across all tenants.', permissions: ['all'] },
        { id: 2, name: 'Tenant Admin', description: 'Full control over company account and stock management.', permissions: ['dashboard:read', 'products:read', 'products:write', 'categories:read', 'categories:write', 'inventory:read', 'inventory:write', 'movements:read', 'movements:write', 'users:read', 'users:write', 'roles:read', 'reports:read', 'settings:read', 'settings:write'] },
        { id: 3, name: 'Inventory Manager', description: 'Can read/write stock levels and issue movements.', permissions: ['dashboard:read', 'products:read', 'products:write', 'categories:read', 'categories:write', 'inventory:read', 'inventory:write', 'movements:read', 'movements:write', 'reports:read', 'settings:read'] },
        { id: 4, name: 'Staff', description: 'Can read stock levels and view/record simple stock inputs.', permissions: ['dashboard:read', 'products:read', 'categories:read', 'inventory:read', 'movements:read', 'movements:write'] }
      ],
      activityLogs: [
        { id: 1, user: `${adminUser.firstName} ${adminUser.lastName}`, action: 'Created and initialized tenant workspace', timestamp: new Date().toISOString(), type: 'success' }
      ],
      settings: {
        company: {
          companyName: companyName,
          logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=200&auto=format&fit=crop',
          email: adminUser.email.toLowerCase(),
          phone: '',
          address: ''
        },
        profile: {
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
          email: adminUser.email.toLowerCase()
        },
        notifications: {
          emailAlerts: true,
          lowStockAlerts: true,
          dailyReports: false
        }
      }
    };
    this.saveTenantData(idNormalized, newTenantData);
  }

  // Get raw tenant data helper
  private getTenantData(tenantId: string): TenantData {
    const raw = localStorage.getItem(`${this.STORAGE_PREFIX}${tenantId}`);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        // fall back to default
      }
    }
    return tenantId === 'globex' ? this.globexSeed : this.acmeSeed;
  }

  // Save raw tenant data helper
  private saveTenantData(tenantId: string, data: TenantData): void {
    localStorage.setItem(`${this.STORAGE_PREFIX}${tenantId}`, JSON.stringify(data));
  }

  // Generic DB methods isolated by tenantId

  // --- PRODUCTS ---
  public getProducts(tenantId: string): Product[] {
    return this.getTenantData(tenantId).products;
  }

  public saveProduct(tenantId: string, product: Product): Product {
    const data = this.getTenantData(tenantId);
    if (product.id) {
      // Edit
      data.products = data.products.map(p => p.id === product.id ? product : p);
    } else {
      // Create
      product.id = Math.max(...data.products.map(p => p.id), 0) + 1;
      product.createdAt = new Date().toISOString();
      data.products.push(product);
    }
    this.saveTenantData(tenantId, data);
    this.logActivity(tenantId, `Saved product ${product.name} (SKU: ${product.sku})`, 'success');
    return product;
  }

  public deleteProduct(tenantId: string, productId: number): void {
    const data = this.getTenantData(tenantId);
    const prod = data.products.find(p => p.id === productId);
    data.products = data.products.filter(p => p.id !== productId);
    this.saveTenantData(tenantId, data);
    if (prod) {
      this.logActivity(tenantId, `Deleted product ${prod.name}`, 'danger');
    }
  }

  // --- CATEGORIES ---
  public getCategories(tenantId: string): Category[] {
    return this.getTenantData(tenantId).categories;
  }

  public saveCategory(tenantId: string, category: Category): Category {
    const data = this.getTenantData(tenantId);
    if (category.id) {
      data.categories = data.categories.map(c => c.id === category.id ? category : c);
    } else {
      category.id = Math.max(...data.categories.map(c => c.id), 0) + 1;
      data.categories.push(category);
    }
    this.saveTenantData(tenantId, data);
    this.logActivity(tenantId, `Saved category ${category.name}`, 'info');
    return category;
  }

  public deleteCategory(tenantId: string, categoryId: number): void {
    const data = this.getTenantData(tenantId);
    data.categories = data.categories.filter(c => c.id !== categoryId);
    this.saveTenantData(tenantId, data);
    this.logActivity(tenantId, `Deleted category ID ${categoryId}`, 'warning');
  }

  // --- STOCK MOVEMENTS ---
  public getStockMovements(tenantId: string): StockMovement[] {
    const data = this.getTenantData(tenantId);
    // Enrich movements with product name
    return data.stockMovements.map(m => {
      const prod = data.products.find(p => p.id === m.productId);
      return {
        ...m,
        productName: prod ? prod.name : 'Unknown Product'
      };
    });
  }

  public createStockMovement(tenantId: string, movement: StockMovement): StockMovement {
    const data = this.getTenantData(tenantId);
    movement.id = Math.max(...data.stockMovements.map(m => m.id), 0) + 1;
    movement.movementDate = new Date().toISOString();
    
    // Adjust product quantity based on movement
    const product = data.products.find(p => p.id === movement.productId);
    if (product) {
      if (movement.movementType === 'STOCK_IN') {
        product.quantity += movement.quantity;
      } else if (movement.movementType === 'STOCK_OUT') {
        product.quantity = Math.max(0, product.quantity - movement.quantity);
      } else if (movement.movementType === 'TRANSFER') {
        // Quantity remains the same overall but visualizes a location change
        // In real backend, warehouse quantities would shift.
      }
      data.products = data.products.map(p => p.id === product.id ? product : p);
    }

    data.stockMovements.push(movement);
    this.saveTenantData(tenantId, data);
    this.logActivity(
      tenantId,
      `Recorded ${movement.movementType} of ${movement.quantity} items for ${product ? product.name : 'ID ' + movement.productId}`,
      movement.movementType === 'STOCK_IN' ? 'success' : movement.movementType === 'STOCK_OUT' ? 'danger' : 'info'
    );
    return movement;
  }

  // --- WAREHOUSES ---
  public getWarehouses(tenantId: string): WarehouseStock[] {
    return this.getTenantData(tenantId).warehouses;
  }

  // --- USERS ---
  public getUsers(tenantId: string): User[] {
    return this.getTenantData(tenantId).users;
  }

  public saveUser(tenantId: string, user: User): User {
    const data = this.getTenantData(tenantId);
    if (user.id) {
      data.users = data.users.map(u => u.id === user.id ? user : u);
    } else {
      user.id = Math.max(...data.users.map(u => u.id), 0) + 1;
      data.users.push(user);
    }
    this.saveTenantData(tenantId, data);
    this.logActivity(tenantId, `Saved user account for ${user.firstName} ${user.lastName}`, 'info');
    return user;
  }

  public deleteUser(tenantId: string, userId: number): void {
    const data = this.getTenantData(tenantId);
    data.users = data.users.filter(u => u.id !== userId);
    this.saveTenantData(tenantId, data);
    this.logActivity(tenantId, `Removed user account ID ${userId}`, 'warning');
  }

  // --- ROLES & RBAC ---
  public getRoles(tenantId: string): Role[] {
    return this.getTenantData(tenantId).roles;
  }

  public saveRole(tenantId: string, role: Role): Role {
    const data = this.getTenantData(tenantId);
    if (role.id) {
      data.roles = data.roles.map(r => r.id === role.id ? role : r);
    } else {
      role.id = Math.max(...data.roles.map(r => r.id), 0) + 1;
      data.roles.push(role);
    }
    this.saveTenantData(tenantId, data);
    this.logActivity(tenantId, `Updated permission settings for role: ${role.name}`, 'warning');
    return role;
  }

  // --- SETTINGS ---
  public getSettings(tenantId: string): AppSettings {
    return this.getTenantData(tenantId).settings;
  }

  public saveSettings(tenantId: string, settings: AppSettings): AppSettings {
    const data = this.getTenantData(tenantId);
    data.settings = settings;
    this.saveTenantData(tenantId, data);
    this.logActivity(tenantId, `Updated system configurations`, 'info');
    return settings;
  }

  // --- ACTIVITY LOGS ---
  public getActivityLogs(tenantId: string): ActivityLog[] {
    return this.getTenantData(tenantId).activityLogs;
  }

  private logActivity(tenantId: string, action: string, type: 'info' | 'success' | 'warning' | 'danger'): void {
    const data = this.getTenantData(tenantId);
    const newLog: ActivityLog = {
      id: Math.max(...data.activityLogs.map(l => l.id), 0) + 1,
      user: 'Current User', // Will be resolved by user session normally
      action,
      timestamp: new Date().toISOString(),
      type
    };
    // Keep only last 20 logs
    data.activityLogs.unshift(newLog);
    data.activityLogs = data.activityLogs.slice(0, 20);
    this.saveTenantData(tenantId, data);
  }
}

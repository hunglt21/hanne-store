export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string | null;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  quantity: number;
  importPrice: number;
  salePrice: number;
  promotionPercent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  note: string | null;
  isVip: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerWithStats extends Customer {
  totalSpent: number;
  orderCount: number;
}

export interface CustomerStats {
  totalSpent: number;
  orderCount: number;
  month: { spent: number; orders: number };
  quarter: { spent: number; orders: number };
  year: { spent: number; orders: number };
  lastOrderAt: string | null;
}

export interface InvoiceItem {
  id?: number;
  invoiceId?: number;
  productId: number | null;
  name: string;
  quantity: number;
  unitPrice: number;
  importPrice: number;
  lineTotal: number;
}

export type InvoiceStatus = 'confirmed' | 'draft' | 'cancelled';

export interface Invoice {
  id: number;
  code: string;
  customerId: number | null;
  customerName: string;
  customerPhone: string | null;
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  costTotal: number;
  note: string | null;
  status: InvoiceStatus;
  createdAt: string;
  items?: InvoiceItem[];
  customer?: Customer | null;
  _count?: { items: number };
}

export interface Paged<T> {
  data: T[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface Overview {
  products: {
    count: number;
    totalUnits: number;
    lowStockCount: number;
    inventoryCostValue: number;
    inventoryRetailValue: number;
  };
  customers: { count: number };
  invoices: { count: number };
  revenue: { today: number; month: number; year: number };
  profit: { today: number; month: number; year: number };
  orders: { today: number; month: number; year: number };
  lowStockThreshold: number;
}

export interface RevenueBucket {
  key: string;
  label: string;
  revenue: number;
  cost: number;
  profit: number;
  orders: number;
}

export interface RevenueSeries {
  granularity: 'month' | 'quarter' | 'year';
  data: RevenueBucket[];
  totals: { revenue: number; cost: number; profit: number; orders: number };
}

export interface TopProduct {
  productId: number | null;
  name: string;
  quantity: number;
  revenue: number;
  profit: number;
}

export interface TopCustomer {
  customerId: number | null;
  name: string;
  totalSpent: number;
  orderCount: number;
}

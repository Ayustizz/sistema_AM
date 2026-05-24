export type UserRole = "ADMIN" | "EMPLOYEE";
export type ProductStatus = "ACTIVE" | "INACTIVE" | "DISCONTINUED";
export type SaleStatus = "PENDING" | "COMPLETED" | "CANCELLED" | "REFUNDED";
export type PaymentMethod = "CASH" | "TRANSFER" | "CARD_DEBIT" | "CARD_CREDIT" | "MERCADO_PAGO" | "INSTALLMENTS";
export type MovementType = "IN" | "OUT" | "ADJUSTMENT" | "RETURN" | "TRANSFER";
export type ExpenseCategory = "RENT" | "SALARY" | "UTILITIES" | "MARKETING" | "LOGISTICS" | "TAXES" | "EQUIPMENT" | "OTHER";
export type InstStatus = "ACTIVE" | "COMPLETED" | "DEFAULTED";
export type InstPayStatus = "PENDING" | "PAID" | "OVERDUE" | "PARTIAL";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
  active: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
}

export interface Brand {
  id: string;
  name: string;
  description?: string | null;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  categoryId?: string | null;
  brandId?: string | null;
  costUsd: number;
  costArs: number;
  priceArs: number;
  profitMargin: number;
  stock: number;
  minStock: number;
  status: ProductStatus;
  images: string[];
  barcode?: string | null;
  supplierId?: string | null;
  category?: Category | null;
  brand?: Brand | null;
  variants?: ProductVariant[];
  variantAttributes?: VariantAttribute[];
  createdAt: string;
  updatedAt: string;
}

export interface VariantAttribute {
  id: string;
  productId: string;
  name: string;
  values: string[];
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  attributes: Record<string, string>;
  costUsd?: number | null;
  costArs?: number | null;
  priceArs?: number | null;
  stock: number;
  imei?: string | null;
  serialNumber?: string | null;
  batteryHealth?: number | null;
  condition?: string | null;
  images: string[];
  active: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  dni?: string | null;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  totalSpent: number;
  debt: number;
  active: boolean;
  createdAt: string;
  sales?: Sale[];
}

export interface Supplier {
  id: string;
  name: string;
  contact?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null;
  notes?: string | null;
  active: boolean;
  createdAt: string;
}

export interface Sale {
  id: string;
  saleNumber: string;
  customerId?: string | null;
  userId: string;
  subtotal: number;
  discount: number;
  total: number;
  totalCost: number;
  profit: number;
  status: SaleStatus;
  notes?: string | null;
  saleDate: string;
  createdAt: string;
  customer?: Customer | null;
  user?: User;
  items?: SaleItem[];
  payments?: Payment[];
  installmentPlan?: InstallmentPlan | null;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  variantId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discount: number;
  total: number;
  product?: Product;
  variant?: ProductVariant | null;
}

export interface Payment {
  id: string;
  saleId: string;
  method: PaymentMethod;
  amount: number;
  reference?: string | null;
  installments?: number | null;
  interest?: number | null;
  notes?: string | null;
  paidAt: string;
}

export interface InstallmentPlan {
  id: string;
  saleId: string;
  installments: number;
  interestRate: number;
  installmentAmt: number;
  totalWithInt: number;
  status: InstStatus;
  createdAt: string;
  installmentRows?: Installment[];
}

export interface Installment {
  id: string;
  planId: string;
  number: number;
  amount: number;
  dueDate: string;
  paidAt?: string | null;
  paidAmount?: number | null;
  status: InstPayStatus;
}

export interface StockMovement {
  id: string;
  productId: string;
  variantId?: string | null;
  type: MovementType;
  quantity: number;
  previousQty: number;
  newQty: number;
  reference?: string | null;
  reason?: string | null;
  userId?: string | null;
  createdAt: string;
  product?: Product;
  variant?: ProductVariant | null;
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  userId?: string | null;
  notes?: string | null;
  createdAt: string;
  user?: User | null;
}

export interface ExchangeRate {
  id: string;
  usdToArs: number;
  note?: string | null;
  createdAt: string;
  setBy?: string | null;
}

export interface DashboardStats {
  todaySales: number;
  todayRevenue: number;
  todayProfit: number;
  monthSales: number;
  monthRevenue: number;
  monthProfit: number;
  totalProducts: number;
  lowStockCount: number;
  totalCustomers: number;
  exchangeRate: number;
  weekSalesData: Array<{ date: string; sales: number; revenue: number; profit: number }>;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  recentSales: Sale[];
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface InstallmentConfig {
  installments: number;
  interestRate: number;
  label: string;
}

export const INSTALLMENT_CONFIGS: InstallmentConfig[] = [
  { installments: 1, interestRate: 0, label: "Contado" },
  { installments: 3, interestRate: 15, label: "3 cuotas" },
  { installments: 6, interestRate: 25, label: "6 cuotas" },
  { installments: 12, interestRate: 45, label: "12 cuotas" },
  { installments: 18, interestRate: 70, label: "18 cuotas" },
  { installments: 24, interestRate: 100, label: "24 cuotas" },
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  CARD_DEBIT: "Tarjeta Débito",
  CARD_CREDIT: "Tarjeta Crédito",
  MERCADO_PAGO: "Mercado Pago",
  INSTALLMENTS: "Cuotas",
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  RENT: "Alquiler",
  SALARY: "Sueldos",
  UTILITIES: "Servicios",
  MARKETING: "Marketing",
  LOGISTICS: "Logística",
  TAXES: "Impuestos",
  EQUIPMENT: "Equipamiento",
  OTHER: "Otros",
};

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  IN: "Entrada",
  OUT: "Salida",
  ADJUSTMENT: "Ajuste",
  RETURN: "Devolución",
  TRANSFER: "Transferencia",
};

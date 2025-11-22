export enum PaymentMethod {
  CASH = 'Наличные',
  CARD = 'Карта'
}

export enum InventoryType {
  LAVASH = 'lavash',
  BREAD_BIG = 'bread_big',
  BREAD_SMALL = 'bread_small',
  NONE = 'none'
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  isCustom?: boolean;
}

export interface Sale {
  id: string;
  timestamp: number;
  items: CartItem[];
  total: number;
  paymentMethod: PaymentMethod;
  isDeleted: boolean;
  editHistory?: string[]; // Audit trail
}

export interface Expense {
  id: string;
  timestamp: number;
  amount: number;
  category: string;
  description: string;
  inventoryType?: InventoryType;
  inventoryQty?: number;
  isDeleted: boolean;
}

export interface ShiftReport {
  id: string;
  startTime: number;
  endTime: number;
  revenue: number;
  expenses: number;
  profit: number;
  saleCount: number;
}

export const EXPENSE_CATEGORIES = [
  'Ингредиенты',
  'Зарплата',
  'Такси',
  'Уборка',
  'Прочее'
];

export type ViewState = 'pos' | 'expenses' | 'dashboard' | 'journal' | 'chat';
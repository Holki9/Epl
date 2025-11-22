
export const MENU_CATEGORIES = [
  { id: 'food', name: 'Еда' },
  { id: 'drinks', name: 'Напитки' },
  { id: 'addons', name: 'Добавки' },
];

export const MENU_ITEMS = [
  // Base Food
  { id: 'sh_classic', name: 'Шаурма', price: 300, category: 'food' },
  { id: 'sh_xl', name: 'Шаурма XL', price: 400, category: 'food' },
  { id: 'dn_big', name: 'Дёнер Большой', price: 310, category: 'food' },
  { id: 'dn_small', name: 'Дёнер Малый', price: 160, category: 'food' },
  
  // Drinks
  { id: 'dr_tea', name: 'Чай', price: 45, category: 'drinks' },
  { id: 'dr_coffee', name: 'Кофе', price: 50, category: 'drinks' },
  { id: 'dr_coffee3in1', name: 'Кофе 3в1', price: 50, category: 'drinks' },

  // Add-ons (Universal)
  { id: 'add_cheese', name: 'Сыр', price: 35, category: 'addons' },
  { id: 'add_mushroom', name: 'Грибы', price: 35, category: 'addons' },
  { id: 'add_ham', name: 'Ветчина', price: 35, category: 'addons' },
];

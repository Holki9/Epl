import React, { useState } from 'react';
import { Plus, Package } from 'lucide-react';
import { Expense, EXPENSE_CATEGORIES, InventoryType } from '../types';

interface ExpensesProps {
  expenses: Expense[];
  onAddExpense: (exp: Omit<Expense, 'id' | 'timestamp' | 'isDeleted'>) => void;
}

const Expenses: React.FC<ExpensesProps> = ({ expenses, onAddExpense }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [desc, setDesc] = useState('');
  const [invType, setInvType] = useState<InventoryType>(InventoryType.NONE);
  const [invQty, setInvQty] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddExpense({
      amount: parseFloat(amount),
      category,
      description: desc,
      inventoryType: category === 'Ингредиенты' ? invType : InventoryType.NONE,
      inventoryQty: category === 'Ингредиенты' ? parseFloat(invQty) || 0 : 0,
    });
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setAmount('');
    setDesc('');
    setCategory(EXPENSE_CATEGORIES[0]);
    setInvType(InventoryType.NONE);
    setInvQty('');
  };

  return (
    <div className="flex flex-col h-full bg-brand-dark p-4 pb-24">
      <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
        <h1 className="text-2xl font-black text-white uppercase tracking-wider">Расходы</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-orange hover:bg-orange-600 text-white p-2 px-4 rounded-lg flex items-center gap-2 font-bold text-sm shadow-glow transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> ДОБАВИТЬ
        </button>
      </div>

      <div className="space-y-3 overflow-y-auto flex-1">
        {expenses.length === 0 ? (
          <div className="text-center text-gray-600 mt-20 font-medium">История расходов пуста</div>
        ) : (
          expenses.filter(e => !e.isDeleted).sort((a,b) => b.timestamp - a.timestamp).map(exp => (
            <div key={exp.id} className="bg-brand-surface p-4 rounded-xl border border-brand-border flex justify-between items-center relative overflow-hidden">
               <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600"></div>
              <div className="pl-2">
                <p className="font-bold text-gray-200">{exp.category}</p>
                <p className="text-xs text-gray-500 mt-0.5">{exp.description || 'Без описания'}</p>
                {exp.inventoryType && exp.inventoryType !== InventoryType.NONE && (
                  <span className="inline-flex items-center gap-1 bg-yellow-900/30 text-yellow-500 text-[10px] px-2 py-0.5 rounded mt-1.5 border border-yellow-500/20">
                    <Package size={10} /> {exp.inventoryQty} ({exp.inventoryType})
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="font-black text-lg text-red-500">- {exp.amount}₽</p>
                <p className="text-[10px] text-gray-600">{new Date(exp.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-center items-center p-4">
          <form onSubmit={handleSubmit} className="bg-[#1A1A1A] w-full max-w-md rounded-2xl p-6 border border-brand-border shadow-2xl animate-in zoom-in-95">
            <h2 className="text-xl font-bold text-white mb-6">Записать расход</h2>
            
            <div className="space-y-5">
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase mb-1.5 block">Сумма (₽)</label>
                <input 
                  required type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full p-3 bg-[#111] border border-brand-border rounded-lg text-xl font-bold text-white outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/50"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-bold uppercase mb-1.5 block">Категория</label>
                <div className="flex flex-wrap gap-2">
                  {EXPENSE_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-2 rounded-md text-xs font-bold transition-colors border ${
                        category === cat ? 'bg-white text-black border-white' : 'bg-[#222] text-gray-400 border-transparent hover:bg-[#333]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {category === 'Ингредиенты' && (
                <div className="bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/20">
                  <label className="text-xs text-yellow-500 font-bold uppercase block mb-2">Складской учет</label>
                  <select 
                    value={invType} onChange={e => setInvType(e.target.value as InventoryType)}
                    className="w-full p-2.5 bg-[#111] text-gray-200 rounded-lg mb-3 border border-brand-border outline-none"
                  >
                    <option value={InventoryType.NONE}>Не учитывать</option>
                    <option value={InventoryType.LAVASH}>Лаваш (уп)</option>
                    <option value={InventoryType.BREAD_BIG}>Хлеб Большой</option>
                    <option value={InventoryType.BREAD_SMALL}>Хлеб Маленький</option>
                  </select>
                  {invType !== InventoryType.NONE && (
                    <input 
                      type="number" placeholder="Количество"
                      value={invQty} onChange={e => setInvQty(e.target.value)}
                      className="w-full p-2.5 bg-[#111] text-white rounded-lg border border-brand-border outline-none"
                    />
                  )}
                </div>
              )}

              <div>
                <label className="text-xs text-gray-400 font-bold uppercase mb-1.5 block">Комментарий</label>
                <input 
                  type="text" value={desc} onChange={e => setDesc(e.target.value)}
                  className="w-full p-3 bg-[#111] border border-brand-border rounded-lg text-white outline-none"
                  placeholder="..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-8">
              <button type="button" onClick={() => setIsModalOpen(false)} className="py-3 rounded-lg font-bold text-gray-400 bg-[#222] hover:bg-[#333] transition-colors">Отмена</button>
              <button type="submit" className="py-3 rounded-lg font-bold text-white bg-brand-orange shadow-glow hover:bg-orange-600 transition-colors">Сохранить</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Expenses;
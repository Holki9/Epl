
import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import POS from './components/POS';
import Expenses from './components/Expenses';
import Dashboard from './components/Dashboard';
import Journal from './components/Journal';
import AIChat from './components/AIChat';
import Sidebar from './components/Sidebar';
import { Sale, Expense, ViewState, PaymentMethod, ShiftReport } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('pos');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- LAZY INITIALIZATION (Fixes Data Loss) ---
  
  const [sales, setSales] = useState<Sale[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('sales');
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error("Failed to load sales:", e);
    }
    return [];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('expenses');
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error("Failed to load expenses:", e);
    }
    return [];
  });

  // Shift Start (Timestamp)
  const [shiftStart, setShiftStart] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const stored = localStorage.getItem('shiftStart');
      return stored ? parseInt(stored) : 0;
    } catch (e) {
      console.error("Failed to load shiftStart:", e);
      return 0;
    }
  });

  // Shift Archive (Z-Reports)
  const [shiftReports, setShiftReports] = useState<ShiftReport[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('shiftReports');
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error("Failed to load shiftReports:", e);
    }
    return [];
  });

  // --- PERSISTENCE ---

  useEffect(() => {
    try {
      localStorage.setItem('sales', JSON.stringify(sales));
    } catch (e) {
      console.error("Failed to save sales:", e);
    }
  }, [sales]);
  
  useEffect(() => {
    try {
      localStorage.setItem('expenses', JSON.stringify(expenses));
    } catch (e) {
      console.error("Failed to save expenses:", e);
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem('shiftStart', shiftStart.toString());
    } catch (e) {
      console.error("Failed to save shiftStart:", e);
    }
  }, [shiftStart]);

  useEffect(() => {
    try {
      localStorage.setItem('shiftReports', JSON.stringify(shiftReports));
    } catch (e) {
      console.error("Failed to save shiftReports:", e);
    }
  }, [shiftReports]);

  // --- HANDLERS ---

  const handleAddSale = (items: any[], total: number, method: PaymentMethod) => {
    const newSale: Sale = {
      id: `sale_${Date.now()}`,
      timestamp: Date.now(),
      items,
      total,
      paymentMethod: method,
      isDeleted: false
    };
    setSales(prev => [...prev, newSale]);
  };

  const handleAddExpense = (expenseData: any) => {
    setExpenses(prev => [...prev, {
      id: `exp_${Date.now()}`,
      timestamp: Date.now(),
      ...expenseData,
      isDeleted: false
    }]);
  };

  const handleSoftDelete = (id: string, type: 'sale' | 'expense') => {
    if (type === 'sale') setSales(prev => prev.map(s => s.id === id ? { ...s, isDeleted: true } : s));
    else setExpenses(prev => prev.map(e => e.id === id ? { ...e, isDeleted: true } : e));
  };

  const handleCloseShift = () => {
    // 1. Calculate stats for the closing shift
    const currentSales = sales.filter(s => !s.isDeleted && s.timestamp >= shiftStart);
    const currentExpenses = expenses.filter(e => !e.isDeleted && e.timestamp >= shiftStart);
    
    const revenue = currentSales.reduce((sum, s) => sum + s.total, 0);
    const expenseTotal = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
    const profit = revenue - expenseTotal;

    const report: ShiftReport = {
      id: `shift_${Date.now()}`,
      startTime: shiftStart,
      endTime: Date.now(),
      revenue,
      expenses: expenseTotal,
      profit,
      saleCount: currentSales.length
    };

    // 2. Save report to archive
    setShiftReports(prev => [report, ...prev]);

    // 3. Reset current shift timestamp to NOW + 1ms (effectively starting a new shift instantly)
    // Adding a small buffer ensures no overlap
    setShiftStart(Date.now() + 1);
  };

  const handleAIActions = (actions: any[]) => {
    if (!Array.isArray(actions)) return;

    actions.forEach(action => {
       if (action.type === 'add_sale' && action.data) {
          if (Array.isArray(action.data.items)) {
              const total = action.data.items.reduce((a:number, b:any) => a + ((Number(b.price) || 0) * (Number(b.quantity) || 1)), 0);
              const method = action.data.paymentMethod === 'Карта' ? PaymentMethod.CARD : PaymentMethod.CASH;
              setTimeout(() => handleAddSale(action.data.items, total, method), 10);
          }
        } else if (action.type === 'add_expense' && action.data) {
           setTimeout(() => handleAddExpense({
               amount: Number(action.data.amount) || 0,
               category: action.data.category || 'Прочее',
               description: action.data.description || 'AI Entry',
               inventoryType: action.data.inventoryType || 'none',
               inventoryQty: Number(action.data.inventoryQty) || 0
           }), 10);
        }
    });
  };

  return (
    <div className="h-full w-full flex flex-col bg-brand-dark font-sans overflow-hidden text-gray-100">
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        currentView={view}
        onChangeView={setView}
      />

      {/* Mobile Header */}
      <div className="h-16 flex items-center px-4 bg-[#1A1A1A] border-b border-[#333] shadow-lg md:hidden z-30 relative">
         <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-400 hover:text-white transition-colors">
           <Menu size={24} />
         </button>
         <span className="font-black text-lg ml-4 text-gray-200 uppercase tracking-widest">
            {view === 'pos' ? 'ТЕРМИНАЛ' : view === 'expenses' ? 'РАСХОДЫ' : view === 'chat' ? 'AI АГЕНТ' : view === 'journal' ? 'ИСТОРИЯ' : 'СТАТИСТИКА'}
         </span>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden md:ml-72"> 
         {view === 'pos' && <POS onCheckout={handleAddSale} />}
         {view === 'expenses' && <Expenses expenses={expenses} onAddExpense={handleAddExpense} />}
         {view === 'dashboard' && (
            <Dashboard 
              sales={sales} 
              expenses={expenses} 
              shiftStart={shiftStart}
              onCloseDay={handleCloseShift} 
            />
         )}
         {view === 'journal' && (
            <Journal 
                sales={sales} 
                expenses={expenses} 
                shiftReports={shiftReports}
                onDeleteSale={(id) => handleSoftDelete(id, 'sale')}
                onDeleteExpense={(id) => handleSoftDelete(id, 'expense')}
            />
         )}
         {view === 'chat' && <AIChat sales={sales} expenses={expenses} onAction={handleAIActions} />}
      </main>

    </div>
  );
};

export default App;

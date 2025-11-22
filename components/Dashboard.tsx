
import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Sale, Expense, InventoryType } from '../types';
import { Wallet, TrendingUp, TrendingDown, Package, Power, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  sales: Sale[];
  expenses: Expense[];
  shiftStart: number;
  onCloseDay: () => void;
}

const COLORS = ['#FF4500', '#FFA500', '#3B82F6', '#10B981', '#6B7280'];

const Dashboard: React.FC<DashboardProps> = ({ sales, expenses, shiftStart, onCloseDay }) => {
  // State for Confirmation Modal
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  // Filter items based on shiftStart timestamp
  // Only show items created AFTER the current shift started
  const activeSales = sales.filter(s => !s.isDeleted && s.timestamp >= shiftStart);
  const activeExpenses = expenses.filter(e => !e.isDeleted && e.timestamp >= shiftStart);

  const stats = useMemo(() => {
    const revenue = activeSales.reduce((sum, s) => sum + s.total, 0);
    const expenseTotal = activeExpenses.reduce((sum, e) => sum + e.amount, 0);
    const profit = revenue - expenseTotal;
    
    const categoryData: Record<string, number> = {};
    activeSales.forEach(s => {
      s.items.forEach(i => {
        categoryData[i.category] = (categoryData[i.category] || 0) + (i.price * i.quantity);
      });
    });
    
    const pieData = Object.keys(categoryData).map(k => ({
       name: k === 'food' ? 'Еда' : k === 'drinks' ? 'Напитки' : k === 'addons' ? 'Добавки' : 'Прочее',
       value: categoryData[k]
    }));

    const inventory = {
      lavashBought: activeExpenses.reduce((sum, e) => e.inventoryType === InventoryType.LAVASH ? sum + (e.inventoryQty || 0) : sum, 0),
      breadBigBought: activeExpenses.reduce((sum, e) => e.inventoryType === InventoryType.BREAD_BIG ? sum + (e.inventoryQty || 0) : sum, 0),
      breadSmallBought: activeExpenses.reduce((sum, e) => e.inventoryType === InventoryType.BREAD_SMALL ? sum + (e.inventoryQty || 0) : sum, 0),
      
      lavashUsed: activeSales.reduce((sum, s) => sum + s.items.filter(i => i.name.toLowerCase().includes('шаурма')).reduce((p, c) => p + c.quantity, 0), 0),
      breadBigUsed: activeSales.reduce((sum, s) => sum + s.items.filter(i => i.name.toLowerCase().includes('большой')).reduce((p, c) => p + c.quantity, 0), 0),
      breadSmallUsed: activeSales.reduce((sum, s) => sum + s.items.filter(i => i.name.toLowerCase().includes('малый')).reduce((p, c) => p + c.quantity, 0), 0),
    };

    return { revenue, expenseTotal, profit, pieData, inventory };
  }, [activeSales, activeExpenses]);

  const handleConfirmClose = () => {
    generateShiftReport(); // Generate HTML receipt
    onCloseDay(); // Trigger App state update (Archive + Reset Time)
    setIsCloseModalOpen(false);
  };

  const generateShiftReport = () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Z-REPORT - ${new Date().toLocaleDateString()}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
          body { font-family: 'JetBrains Mono', monospace; padding: 20px; background: #fff; color: #000; max-width: 400px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .brand { font-size: 24px; font-weight: 900; }
          .meta { font-size: 12px; margin-top: 5px; text-transform: uppercase; }
          .row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
          .bold { font-weight: bold; }
          .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
          .total { font-size: 18px; font-weight: 900; margin-top: 10px; border-top: 2px solid #000; pt-2; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">DONER MASTER</div>
          <div class="meta">Z-ОТЧЕТ (СМЕНА)</div>
          <div class="meta">НАЧАЛО: ${new Date(shiftStart).toLocaleString()}</div>
          <div class="meta">КОНЕЦ: ${new Date().toLocaleString()}</div>
        </div>
        
        <div class="row"><span class="bold">ВЫРУЧКА:</span> <span>${stats.revenue} ₽</span></div>
        <div class="row"><span class="bold">РАСХОДЫ:</span> <span>${stats.expenseTotal} ₽</span></div>
        <div class="row"><span class="bold">ПРИБЫЛЬ:</span> <span>${stats.profit} ₽</span></div>
        
        <div class="divider"></div>
        
        <div class="row"><span class="bold">ЧЕКОВ:</span> <span>${activeSales.length}</span></div>
        
        <div class="divider"></div>
        <div style="text-align:center; font-size:10px; margin-top:20px;">СМЕНА ЗАКРЫТА УСПЕШНО</div>
        <script>window.print();</script>
      </body>
      </html>
    `;
    const blob = new Blob([html], {type: 'text/html'});
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-brand-dark p-6 pb-24 overflow-y-auto text-gray-200 relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">Dashboard</h1>
          <p className="text-xs text-brand-orange font-mono tracking-widest">
             СТАРТ СМЕНЫ: {new Date(shiftStart).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
          </p>
        </div>
        <button 
          onClick={() => setIsCloseModalOpen(true)}
          className="bg-white text-black px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-all shadow-neon active:scale-95 flex items-center gap-2"
        >
          <Power size={14} /> Закрыть смену
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Revenue Card */}
        <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-brand-orange to-red-900 shadow-neon-strong group">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
          <div className="flex justify-between items-start mb-8">
            <div className="p-2 bg-black/20 rounded-lg backdrop-blur-sm">
               <Wallet className="text-white" size={20} />
            </div>
            <TrendingUp className="text-white/50" size={40} />
          </div>
          <div>
             <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Выручка</p>
             <p className="text-4xl font-black text-white tracking-tight">{stats.revenue}₽</p>
          </div>
        </div>

        {/* Profit Card */}
        <div className="relative overflow-hidden rounded-2xl p-6 bg-[#1E1E1E] border border-white/5 shadow-glass">
           <div className="flex justify-between items-start mb-8">
            <div className={`p-2 rounded-lg backdrop-blur-sm ${stats.profit >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
               <TrendingUp size={20} />
            </div>
          </div>
          <div>
             <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Чистая прибыль</p>
             <p className={`text-4xl font-black tracking-tight ${stats.profit >= 0 ? 'text-white' : 'text-red-500'}`}>
               {stats.profit}₽
             </p>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="relative overflow-hidden rounded-2xl p-6 bg-[#1E1E1E] border border-white/5 shadow-glass group hover:border-red-500/30 transition-colors">
           <div className="flex justify-between items-start mb-8">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-500 backdrop-blur-sm">
               <TrendingDown size={20} />
            </div>
          </div>
          <div>
             <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Расходы</p>
             <p className="text-4xl font-black text-white tracking-tight">-{stats.expenseTotal}₽</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pie Chart */}
        <div className="bg-[#121212] border border-brand-border p-6 rounded-2xl relative">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="w-1 h-4 bg-brand-orange rounded-full"></span>
            Структура продаж
          </h3>
          <div className="h-64 w-full">
            {activeSales.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={4}
                  >
                    {stats.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-600 font-mono text-xs">
                НЕТ ДАННЫХ ЗА ТЕКУЩУЮ СМЕНУ
              </div>
            )}
          </div>
        </div>

        {/* Inventory */}
        <div className="bg-[#121212] border border-brand-border p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
            Движение склада
          </h3>
          <div className="space-y-6">
            <InventoryBar label="Лаваш" bought={stats.inventory.lavashBought} used={stats.inventory.lavashUsed} />
            <InventoryBar label="Хлеб (Бол.)" bought={stats.inventory.breadBigBought} used={stats.inventory.breadBigUsed} />
            <InventoryBar label="Хлеб (Мал.)" bought={stats.inventory.breadSmallBought} used={stats.inventory.breadSmallUsed} />
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {isCloseModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex justify-center items-center p-6 animate-in fade-in duration-200">
          <div className="bg-[#121212] border border-brand-border w-full max-w-sm rounded-2xl p-1 shadow-2xl animate-in zoom-in-95">
             <div className="p-6 bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] rounded-xl">
               <div className="w-12 h-12 bg-brand-orange/10 rounded-full flex items-center justify-center mb-4 mx-auto text-brand-orange">
                  <AlertTriangle size={24} />
               </div>
               <h3 className="text-xl font-bold text-white mb-2 text-center">Закрыть смену?</h3>
               <p className="text-gray-400 text-sm mb-6 text-center leading-relaxed">
                 Текущие показатели (выручка, расходы) будут <span className="text-white font-bold">обнулены</span> на главном экране и сохранены в Архив.
                 <br/><br/>
                 Автоматически начнется новая смена.
               </p>
               <div className="flex gap-3">
                  <button 
                    onClick={() => setIsCloseModalOpen(false)}
                    className="flex-1 bg-transparent border border-white/10 hover:bg-white/5 text-white py-3 rounded-lg font-bold text-sm transition-colors uppercase tracking-wider"
                  >
                    Отмена
                  </button>
                  <button 
                    onClick={handleConfirmClose}
                    className="flex-1 bg-brand-orange hover:bg-orange-600 text-white py-3 rounded-lg font-bold text-sm shadow-neon transition-colors uppercase tracking-wider"
                  >
                    Закрыть смену
                  </button>
               </div>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

const InventoryBar = ({ label, bought, used }: {label: string, bought: number, used: number}) => {
  const max = Math.max(bought, used, 10); 
  return (
    <div>
      <div className="flex justify-between text-xs font-bold mb-2">
        <span className="text-gray-400 uppercase">{label}</span>
        <div className="flex gap-3">
           <span className="text-green-500">IN: {bought}</span>
           <span className="text-red-500">OUT: {used}</span>
        </div>
      </div>
      <div className="h-2 w-full bg-[#222] rounded-full overflow-hidden flex">
        <div style={{ width: `${(bought / max) * 50}%` }} className="h-full bg-green-500 rounded-l-full opacity-80" />
        <div style={{ width: `${(used / max) * 50}%` }} className="h-full bg-red-500 rounded-r-full opacity-80 ml-auto" />
      </div>
    </div>
  );
}

export default Dashboard;


import React, { useState } from 'react';
import { Sale, Expense, PaymentMethod, ShiftReport } from '../types';
import { Trash2, Download, FileText, Check, X, Printer, Archive, Search } from 'lucide-react';

interface JournalProps {
  sales: Sale[];
  expenses: Expense[];
  shiftReports?: ShiftReport[];
  onDeleteSale: (id: string) => void;
  onDeleteExpense: (id: string) => void;
}

const Journal: React.FC<JournalProps> = ({ sales, expenses, shiftReports = [], onDeleteSale, onDeleteExpense }) => {
  const [activeTab, setActiveTab] = useState<'ops' | 'archive'>('ops');
  const [deleteConfirm, setDeleteConfirm] = useState<{id: string, type: 'sale' | 'expense'} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const allItems = [
    ...sales.map(s => ({ ...s, type: 'sale' as const })),
    ...expenses.map(e => ({ ...e, type: 'expense' as const }))
  ].sort((a, b) => b.timestamp - a.timestamp);

  // Filter Archives
  const filteredReports = shiftReports.filter(r => {
      const dateStr = new Date(r.startTime).toLocaleDateString();
      const idStr = r.id.toLowerCase();
      const search = searchTerm.toLowerCase();
      return dateStr.includes(search) || idStr.includes(search);
  }).sort((a,b) => b.endTime - a.endTime);

  const generateHTMLReport = () => {
    const activeItems = allItems.filter(i => !i.isDeleted);
    const totalRevenue = activeItems.filter(i => i.type === 'sale').reduce((sum, i) => sum + (i as Sale).total, 0);
    const totalExpenses = activeItems.filter(i => i.type === 'expense').reduce((sum, i) => sum + (i as Expense).amount, 0);
    const net = totalRevenue - totalExpenses;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Отчет Doner Master - ${new Date().toLocaleDateString()}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
          body { font-family: 'JetBrains Mono', monospace; padding: 40px; background: #fff; color: #000; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 4px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
          .brand { font-size: 32px; font-weight: 900; letter-spacing: -1px; }
          .meta { font-size: 14px; color: #666; margin-top: 5px; text-transform: uppercase; }
          .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 40px; }
          .summary-card { border: 2px solid #000; padding: 15px; }
          .summary-label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #666; display: block; }
          .summary-value { font-size: 24px; font-weight: bold; display: block; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { text-align: left; border-bottom: 2px solid #000; padding: 10px 5px; text-transform: uppercase; }
          td { border-bottom: 1px solid #eee; padding: 10px 5px; }
          .type-sale { color: green; font-weight: bold; }
          .type-expense { color: red; font-weight: bold; }
          .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">DONER MASTER</div>
          <div class="meta">ОТЧЕТ ЗА СМЕНУ / ${new Date().toLocaleString()}</div>
        </div>
        
        <div class="summary-grid">
          <div class="summary-card">
            <span class="summary-label">Выручка</span>
            <span class="summary-value">+${totalRevenue}₽</span>
          </div>
          <div class="summary-card">
            <span class="summary-label">Расходы</span>
            <span class="summary-value">-${totalExpenses}₽</span>
          </div>
          <div class="summary-card" style="background: #000; color: #fff;">
            <span class="summary-label" style="color: #888;">Прибыль</span>
            <span class="summary-value">${net}₽</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Время</th>
              <th>Тип</th>
              <th>Описание</th>
              <th>Сумма</th>
            </tr>
          </thead>
          <tbody>
            ${activeItems.map(item => `
              <tr>
                <td>${new Date(item.timestamp).toLocaleTimeString()}</td>
                <td class="${item.type === 'sale' ? 'type-sale' : 'type-expense'}">
                  ${item.type === 'sale' ? 'ПРОДАЖА' : 'РАСХОД'}
                </td>
                <td>
                   ${item.type === 'sale' 
                     ? (item as Sale).items.map(i => `${i.name} x${i.quantity}`).join(', ') 
                     : `${(item as Expense).category}: ${(item as Expense).description}`}
                </td>
                <td style="font-weight: bold;">
                  ${item.type === 'sale' ? '+' : '-'}${item.type === 'sale' ? (item as Sale).total : (item as Expense).amount}₽
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">AUTOMATED REPORT GENERATED BY GEMINI AI SYSTEM</div>
        <script>window.print();</script>
      </body>
      </html>
    `;
    
    const blob = new Blob([html], {type: 'text/html'});
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      if (deleteConfirm.type === 'sale') onDeleteSale(deleteConfirm.id);
      else onDeleteExpense(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-brand-dark p-4 pb-24 overflow-y-auto relative">
      <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
         <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic">Журнал</h1>
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">История и отчетность</p>
         </div>
         
         <div className="flex bg-[#111] p-1 rounded-lg border border-white/5">
            <button 
               onClick={() => setActiveTab('ops')}
               className={`px-3 py-1.5 rounded font-bold text-xs uppercase transition-all ${activeTab === 'ops' ? 'bg-white text-black' : 'text-gray-500'}`}
            >
              Операции
            </button>
            <button 
               onClick={() => setActiveTab('archive')}
               className={`px-3 py-1.5 rounded font-bold text-xs uppercase transition-all ${activeTab === 'archive' ? 'bg-white text-black' : 'text-gray-500'}`}
            >
              Архив смен
            </button>
         </div>
      </div>
      
      {/* TABS CONTENT */}
      {activeTab === 'ops' ? (
        <>
          <div className="mb-4 flex justify-end">
             <button 
                onClick={generateHTMLReport}
                className="bg-[#1A1A1A] hover:bg-white hover:text-black text-white p-2 px-3 rounded-lg flex items-center gap-2 font-bold text-xs border border-brand-border transition-all"
              >
                <Printer className="w-4 h-4" /> ПЕЧАТЬ ОТЧЕТА
              </button>
          </div>

          <div className="space-y-2">
            {allItems.length === 0 && <div className="text-center text-gray-600 py-10">Нет операций</div>}
            {allItems.map(item => (
              <div 
                key={item.id} 
                className={`p-5 rounded-sm border-l-4 flex justify-between relative group transition-all ${
                  item.isDeleted 
                    ? 'bg-[#111] border-l-gray-800 opacity-40 grayscale' 
                    : item.type === 'sale' 
                      ? 'bg-[#121212] border-l-green-500 border-b border-gray-900 hover:bg-[#161616]'
                      : 'bg-[#121212] border-l-red-500 border-b border-gray-900 hover:bg-[#161616]'
                }`}
              >
                <div className="flex-1 pr-8">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] text-gray-500 font-mono font-bold">
                      {new Date(item.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </span>
                    {item.type === 'sale' && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-800 rounded text-gray-400 uppercase tracking-wider">
                        {(item as Sale).paymentMethod}
                      </span>
                    )}
                  </div>
                  
                  {item.type === 'sale' ? (
                    <div className="text-sm text-gray-200 font-bold font-mono tracking-tight">
                      {(item as Sale).items.map(i => `${i.name} x${i.quantity}`).join(', ')}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-200 font-bold font-mono tracking-tight">
                      {(item as Expense).category}
                      <span className="text-gray-500 mx-2 font-normal text-xs">/</span>
                      <span className="text-gray-400 font-normal italic text-xs">{(item as Expense).description || '-'}</span>
                    </div>
                  )}
                </div>

                <div className="text-right flex flex-col justify-between">
                  <p className={`font-black text-lg ${item.type === 'sale' ? 'text-green-500' : 'text-red-500'}`}>
                    {item.type === 'sale' ? '+' : '-'} {item.type === 'sale' ? (item as Sale).total : (item as Expense).amount}₽
                  </p>
                  {!item.isDeleted && (
                    <button 
                      onClick={() => setDeleteConfirm({ id: item.id, type: item.type })}
                      className="self-end p-2 text-gray-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {item.isDeleted && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="border-2 border-red-900 text-red-900 font-black text-2xl uppercase px-4 py-2 rotate-[-15deg] opacity-50">Удалено</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        /* ARCHIVE TAB */
        <div className="space-y-3">
           {/* Search Box */}
           <div className="relative mb-4">
             <input 
                type="text"
                placeholder="Поиск по дате (напр. 25.10)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#1E1E1E] text-gray-100 font-medium border border-brand-border focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/50 outline-none transition-all"
             />
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
           </div>

           {filteredReports.length === 0 && <div className="text-center text-gray-600 py-10">Смены не найдены</div>}
           
           {filteredReports.map(report => (
             <div key={report.id} className="bg-[#121212] border border-white/10 rounded-xl p-5 relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4">
                   <div>
                      <div className="flex items-center gap-2 mb-1">
                         <Archive size={14} className="text-brand-orange" />
                         <h3 className="font-black text-white text-lg uppercase tracking-tight">Смена #{report.id.slice(-4)}</h3>
                      </div>
                      <p className="text-xs text-gray-500 font-mono">
                        {new Date(report.startTime).toLocaleDateString()} • {new Date(report.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} — {new Date(report.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                      </p>
                   </div>
                   <div className="text-right">
                      <span className={`font-black text-xl ${report.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                         {report.profit >= 0 ? '+' : ''}{report.profit}₽
                      </span>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Прибыль</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
                   <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Выручка</p>
                      <p className="text-sm font-bold text-white">{report.revenue}₽</p>
                   </div>
                   <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Расходы</p>
                      <p className="text-sm font-bold text-red-400">-{report.expenses}₽</p>
                   </div>
                   <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Чеков</p>
                      <p className="text-sm font-bold text-white">{report.saleCount}</p>
                   </div>
                </div>
             </div>
           ))}
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex justify-center items-center p-6">
          <div className="bg-[#121212] border border-brand-border w-full max-w-sm rounded-2xl p-1 shadow-2xl animate-in zoom-in-95">
             <div className="p-6 bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] rounded-xl">
               <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 mx-auto text-red-500">
                  <Trash2 size={24} />
               </div>
               <h3 className="text-xl font-bold text-white mb-2 text-center">Удалить запись?</h3>
               <p className="text-gray-400 text-sm mb-8 text-center">Вы уверены, что хотите удалить эту операцию? Статистика будет пересчитана.</p>
               <div className="flex gap-3">
                  <button 
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 bg-transparent border border-white/10 hover:bg-white/5 text-white py-3 rounded-lg font-bold text-sm transition-colors uppercase tracking-wider"
                  >
                    Отмена
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-bold text-sm shadow-neon transition-colors uppercase tracking-wider"
                  >
                    Удалить
                  </button>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Journal;

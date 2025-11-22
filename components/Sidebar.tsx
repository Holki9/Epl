import React from 'react';
import { LayoutDashboard, Receipt, UtensilsCrossed, History, Bot, X, ChevronRight } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentView, onChangeView }) => {
  
  const menuItems = [
    { id: 'pos', label: 'ТЕРМИНАЛ', icon: <UtensilsCrossed size={20} /> },
    { id: 'expenses', label: 'РАСХОДЫ', icon: <Receipt size={20} /> },
    { id: 'dashboard', label: 'АНАЛИТИКА', icon: <LayoutDashboard size={20} /> },
    { id: 'journal', label: 'ИСТОРИЯ', icon: <History size={20} /> },
    { id: 'chat', label: 'AI СИСТЕМА', icon: <Bot size={20} />, special: true },
  ];

  return (
    <>
      {/* Backdrop - Mobile Only */}
      <div 
        className={`fixed inset-0 bg-black/90 backdrop-blur-md z-40 transition-opacity duration-500 md:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer - Fixed on desktop, slide on mobile */}
      <div className={`fixed top-0 left-0 bottom-0 w-72 bg-[#050505] border-r border-[#222] z-50 transform transition-transform duration-300 shadow-[0_0_50px_rgba(0,0,0,0.8)] md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-8 flex justify-between items-center mb-4">
          <div>
             <h1 className="text-2xl font-black tracking-tighter text-white italic transform -skew-x-10">
               DONER<span className="text-brand-orange">.AI</span>
             </h1>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#222] rounded-full text-gray-500 transition-colors md:hidden">
            <X size={20} />
          </button>
        </div>

        <div className="px-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onChangeView(item.id as ViewState);
                onClose(); // Close on mobile after selection
              }}
              className={`w-full flex items-center justify-between p-4 rounded-lg transition-all group relative overflow-hidden ${
                currentView === item.id
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {/* Active BG Indicator */}
              {currentView === item.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-brand-orange/20 to-transparent border-l-4 border-brand-orange" />
              )}

              <div className="flex items-center gap-4 font-bold text-sm tracking-widest uppercase relative z-10">
                <span className={`${currentView === item.id ? 'text-brand-orange' : 'text-gray-600 group-hover:text-gray-400'}`}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {currentView === item.id && <ChevronRight size={16} className="text-brand-orange" />}
            </button>
          ))}
        </div>
        
        <div className="absolute bottom-8 left-0 w-full px-8">
           <div className="p-4 rounded-xl border border-[#222] bg-[#0A0A0A] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-orange/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-black border border-gray-700 flex items-center justify-center font-black text-xs text-gray-400">
                   DM
                </div>
                <div>
                   <p className="font-bold text-sm text-gray-200">Admin</p>
                   <p className="text-[10px] text-gray-600 font-mono">STATUS: ONLINE</p>
                </div>
              </div>
           </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

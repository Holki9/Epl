import React, { useState, useMemo } from 'react';
import { Search, Plus, Minus, ChevronUp, ChevronDown, Delete, Check } from 'lucide-react';
import { MENU_ITEMS } from '../constants';
import { CartItem, PaymentMethod } from '../types';

interface POSProps {
  onCheckout: (items: CartItem[], total: number, method: PaymentMethod) => void;
}

const POS: React.FC<POSProps> = ({ onCheckout }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('food');
  
  // Custom Price Modal State
  const [isCustomPriceOpen, setIsCustomPriceOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  const filteredItems = useMemo(() => {
    let items = MENU_ITEMS;
    if (search) {
      items = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    } else {
      items = items.filter(i => i.category === activeCategory);
    }
    return items;
  }, [activeCategory, search]);

  const addToCart = (item: any, priceOverride?: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && i.price === (priceOverride || item.price));
      if (existing) {
        return prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { 
        id: item.id, 
        name: item.name, 
        price: priceOverride || item.price, 
        quantity: 1, 
        category: item.category,
        isCustom: !!priceOverride
      }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(i => i.quantity > 0));
  };

  const handleNumpadInput = (val: string) => {
    if (val === 'C') setCustomAmount('');
    else if (val === 'back') setCustomAmount(prev => prev.slice(0, -1));
    else setCustomAmount(prev => prev + val);
  };

  const confirmCustomPrice = () => {
    const price = parseInt(customAmount);
    if (price && !isNaN(price) && price > 0) {
      addToCart({ 
        id: `custom_${Date.now()}`, 
        name: 'Свободная цена', 
        price: price, 
        category: 'custom' 
      }, price);
      setIsCustomPriceOpen(false);
      setCustomAmount('');
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col h-full relative bg-brand-dark text-white">
      
      {/* Header / Search */}
      <div className="p-5 pb-2 sticky top-0 z-10 bg-brand-dark/95 backdrop-blur-md border-b border-brand-border">
        <div className="relative mb-5">
            <input
              type="text"
              placeholder="Найти товар..."
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#1E1E1E] text-gray-100 font-medium border border-brand-border focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/50 outline-none transition-all shadow-inner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
        </div>
        
        {/* Categories */}
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {[
            {id: 'food', label: 'Еда'},
            {id: 'drinks', label: 'Напитки'},
            {id: 'addons', label: 'Добавки'},
          ].map(cat => (
             <button
               key={cat.id}
               onClick={() => setActiveCategory(cat.id)}
               className={`px-5 py-2.5 rounded-lg font-bold whitespace-nowrap transition-all text-sm uppercase tracking-wide border ${
                 activeCategory === cat.id 
                  ? 'bg-brand-orange text-white border-brand-orange shadow-glow' 
                  : 'bg-[#1A1A1A] text-gray-400 border-brand-border hover:bg-[#252525]'
               }`}
             >
               {cat.label}
             </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-5 pb-32 pt-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map(item => (
            <button
              key={item.id}
              onClick={() => addToCart(item)}
              className="relative group p-4 rounded-xl bg-gradient-to-br from-[#1E1E1E] to-[#161616] border border-brand-border shadow-lg active:scale-95 transition-all flex flex-col items-start justify-between h-36 hover:border-brand-orange/30"
            >
              <div className="font-bold text-lg text-gray-200 leading-tight text-left w-full pr-2">{item.name}</div>
              <div className="w-full flex justify-between items-end">
                <span className="font-black text-brand-orange text-xl">{item.price}₽</span>
                <div className="w-8 h-8 rounded-lg bg-[#2A2A2A] flex items-center justify-center border border-white/5 group-hover:bg-brand-orange group-hover:text-white transition-colors">
                  <Plus size={18} />
                </div>
              </div>
            </button>
          ))}
          
          {/* Custom Price Button */}
          <button
            onClick={() => setIsCustomPriceOpen(true)}
             className="relative p-4 rounded-xl bg-[#111] border border-dashed border-gray-700 flex flex-col items-center justify-center h-36 active:scale-95 transition-all hover:bg-[#161616]"
          >
             <span className="text-3xl font-bold text-gray-500 mb-1">?</span>
             <span className="text-gray-500 text-xs font-bold uppercase">Своя цена</span>
          </button>
        </div>
      </div>

      {/* Cart Summary / Bottom Sheet */}
      <div className={`fixed bottom-0 left-0 right-0 md:left-80 z-40 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isCartOpen ? 'h-[85vh]' : 'h-20'}`}>
        {/* Backdrop */}
        {isCartOpen && (
            <div className="absolute inset-0 -top-[100vh] bg-black/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
        )}

        <div className="absolute inset-0 bg-[#1A1A1A] border-t border-brand-border rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden">
            
            {/* Handle/Summary Bar */}
            <div 
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="h-20 px-6 flex items-center justify-between cursor-pointer hover:bg-[#222] transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-orange text-white flex items-center justify-center shadow-glow font-bold text-lg">
                        {totalQty}
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">К оплате</p>
                        <p className="text-2xl font-black text-white">{total}₽</p>
                    </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center text-gray-400">
                    {isCartOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[#121212]">
                {cart.length === 0 ? (
                    <div className="text-center text-gray-600 mt-12 font-medium">Корзина пуста</div>
                ) : (
                    cart.map(item => (
                        <div key={item.id} className="flex items-center justify-between bg-[#1E1E1E] p-4 rounded-xl border border-white/5">
                            <div className="flex-1">
                                <p className="font-bold text-gray-200">{item.name}</p>
                                <p className="text-brand-orange font-bold text-sm">{item.price}₽</p>
                            </div>
                            <div className="flex items-center gap-3 bg-[#2A2A2A] rounded-lg p-1 border border-white/5">
                                <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded bg-[#333] flex items-center justify-center text-gray-300 active:bg-brand-orange active:text-white transition-colors">
                                    <Minus size={14} />
                                </button>
                                <span className="font-bold text-white w-6 text-center text-sm">{item.quantity}</span>
                                <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded bg-[#333] flex items-center justify-center text-gray-300 active:bg-brand-orange active:text-white transition-colors">
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Actions */}
            <div className="p-6 bg-[#1A1A1A] border-t border-white/5 grid grid-cols-2 gap-4">
                <button 
                    onClick={() => onCheckout(cart, total, PaymentMethod.CASH)}
                    disabled={cart.length === 0}
                    className="py-3.5 rounded-xl font-bold text-white bg-green-600 shadow-[0_4px_0_#14532d] active:shadow-none active:translate-y-[4px] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    НАЛИЧНЫЕ
                </button>
                <button 
                    onClick={() => onCheckout(cart, total, PaymentMethod.CARD)}
                    disabled={cart.length === 0}
                    className="py-3.5 rounded-xl font-bold text-white bg-blue-600 shadow-[0_4px_0_#1e3a8a] active:shadow-none active:translate-y-[4px] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    КАРТА
                </button>
            </div>
        </div>
      </div>

      {/* CUSTOM PRICE MODAL */}
      {isCustomPriceOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-[#121212] border border-brand-border rounded-3xl p-6 w-full max-w-xs shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-white font-bold uppercase tracking-widest">Сумма</h3>
                 <button onClick={() => setIsCustomPriceOpen(false)} className="text-gray-500 hover:text-white">
                   <ChevronDown size={24} />
                 </button>
              </div>
              
              {/* Display */}
              <div className="bg-[#050505] p-4 rounded-xl mb-4 border border-[#222] text-right h-20 flex items-center justify-end">
                 <span className="text-4xl font-black text-white tracking-tighter">
                    {customAmount || '0'}
                 </span>
                 <span className="text-xl text-brand-orange font-bold ml-2">₽</span>
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-3">
                 {[1,2,3,4,5,6,7,8,9].map(num => (
                   <button 
                     key={num} 
                     onClick={() => handleNumpadInput(num.toString())}
                     className="h-16 rounded-xl bg-[#1E1E1E] text-white font-bold text-xl active:bg-[#333] transition-colors shadow-sm border border-white/5"
                   >
                     {num}
                   </button>
                 ))}
                 <button onClick={() => handleNumpadInput('C')} className="h-16 rounded-xl bg-red-900/20 text-red-500 font-bold active:bg-red-900/40 transition-colors border border-red-900/30">C</button>
                 <button onClick={() => handleNumpadInput('0')} className="h-16 rounded-xl bg-[#1E1E1E] text-white font-bold text-xl active:bg-[#333] transition-colors border border-white/5">0</button>
                 <button onClick={confirmCustomPrice} className="h-16 rounded-xl bg-brand-orange text-white font-bold flex items-center justify-center active:scale-95 transition-all shadow-neon">
                   <Check size={24} />
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default POS;
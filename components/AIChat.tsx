import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, ChefHat, Briefcase, Check, X, Volume2, AlertCircle, Plus, Trash2, MessageSquare, Menu } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { Sale, Expense } from '../types';
import { MENU_ITEMS } from '../constants';

interface AIChatProps {
  sales: Sale[];
  expenses: Expense[];
  onAction: (actions: any[]) => void;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  isConfirmation?: boolean;
  pendingActions?: any[];
  isError?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

const ActionPreviewCard: React.FC<{ action: any }> = ({ action }) => {
  if (action.type === 'add_sale') {
    const data = action.data || {};
    const items = Array.isArray(data.items) ? data.items : [];
    const total = items.reduce((sum: number, i: any) => sum + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);
    
    return (
      <div className="mt-3 bg-white text-black rounded-sm p-0 overflow-hidden shadow-lg relative font-mono text-xs w-full max-w-xs mx-auto transform rotate-1 hover:rotate-0 transition-transform duration-300">
        <div className="bg-gray-100 p-3 border-b border-dashed border-gray-400 text-center">
          <div className="font-bold text-sm tracking-widest uppercase">ЧЕК ПРОДАЖИ</div>
          <div className="text-[10px] text-gray-500">{new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}</div>
        </div>
        <div className="p-4 space-y-2">
          {items.length > 0 ? items.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between items-end border-b border-gray-100 pb-1">
              <div>
                <div className="font-bold uppercase">{item.name}</div>
                <div className="text-[10px] text-gray-500">{item.quantity} x {item.price}₽</div>
              </div>
              <div className="font-bold">{(item.quantity * item.price)}₽</div>
            </div>
          )) : <div className="text-center italic text-gray-400">Нет товаров</div>}
        </div>
        <div className="bg-gray-50 p-3 border-t border-dashed border-gray-400">
           <div className="flex justify-between items-center mb-1">
             <span className="text-[10px] uppercase text-gray-500">Метод</span>
             <span className="font-bold uppercase">{data.paymentMethod || 'Наличные'}</span>
           </div>
           <div className="flex justify-between items-center text-lg font-black mt-2">
             <span>ИТОГО</span>
             <span>{total}₽</span>
           </div>
        </div>
        <div className="h-3 bg-white absolute bottom-0 left-0 right-0" style={{
           maskImage: 'linear-gradient(45deg, transparent 33%, #000 33%, #000 66%, transparent 66%), linear-gradient(-45deg, transparent 33%, #000 33%, #000 66%, transparent 66%)',
           WebkitMaskImage: 'linear-gradient(45deg, transparent 33%, #000 33%, #000 66%, transparent 66%), linear-gradient(-45deg, transparent 33%, #000 33%, #000 66%, transparent 66%)',
           WebkitMaskSize: '12px 10px',
        }}></div>
      </div>
    );
  }
  
  if (action.type === 'add_expense') {
    const data = action.data || {};
    return (
      <div className="mt-3 bg-[#1a1a1a] border-l-4 border-brand-orange rounded-r-lg p-4 shadow-md w-full">
        <div className="flex justify-between items-start">
           <div>
              <div className="text-[10px] text-brand-orange font-bold uppercase tracking-widest mb-1">Расход</div>
              <div className="font-bold text-white text-sm">{data.category || 'Прочее'}</div>
              <div className="text-xs text-gray-400 mt-1 italic max-w-[150px]">{data.description || 'Без описания'}</div>
           </div>
           <div className="text-right">
              <div className="font-black text-white text-xl">-{data.amount || 0}₽</div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 bg-[#222] p-3 rounded border border-gray-700 text-xs text-gray-400">
       Неизвестное действие
    </div>
  );
};

const ChatMessage: React.FC<{ 
  msg: Message; 
  onConfirm: (id: string, actions: any[]) => void; 
  onCancel: (id: string) => void;
  onPlay: (text: string) => void;
}> = ({ msg, onConfirm, onCancel, onPlay }) => {
  const isUser = msg.role === 'user';
  
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      <div className={`max-w-[90%] md:max-w-[75%] relative`}>
        <div className={`flex items-center gap-2 mb-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
           <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-glow ${
             isUser ? 'bg-brand-orange text-white' : 'bg-blue-600 text-white'
           }`}>
             {isUser ? 'ВЫ' : 'AI'}
           </div>
           <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">
             {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
           </span>
           {!isUser && (
             <button onClick={() => onPlay(msg.text)} className="p-1 text-gray-600 hover:text-brand-orange transition-colors">
                <Volume2 size={12} />
             </button>
           )}
        </div>

        <div className={`p-5 rounded-2xl backdrop-blur-md border transition-all ${
            isUser 
            ? 'bg-brand-orange/10 border-brand-orange/20 text-white rounded-tr-sm' 
            : 'bg-[#1A1A1A]/90 border-white/10 text-gray-200 rounded-tl-sm shadow-glass'
        }`}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
            
            {msg.pendingActions && Array.isArray(msg.pendingActions) && msg.pendingActions.length > 0 && (
               <div className="my-4 flex flex-col gap-3 items-center">
                 {msg.pendingActions.map((action, idx) => <ActionPreviewCard key={idx} action={action} />)}
               </div>
            )}
            
            {msg.isConfirmation && msg.pendingActions && msg.pendingActions.length > 0 && (
              <div className="mt-5 pt-4 border-t border-white/5 flex gap-3">
                <button 
                  onClick={() => onConfirm(msg.id, msg.pendingActions!)}
                  className="flex-1 bg-brand-orange hover:bg-orange-600 text-white py-3 px-4 rounded-xl font-bold shadow-neon active:scale-95 transition-all flex items-center justify-center gap-2 text-xs tracking-wider uppercase"
                >
                  <Check size={14} strokeWidth={3} /> Подтвердить
                </button>
                <button 
                  onClick={() => onCancel(msg.id)}
                  className="flex-1 bg-transparent hover:bg-white/5 text-gray-400 border border-white/10 py-3 px-4 rounded-xl font-bold active:scale-95 transition-all flex items-center justify-center gap-2 text-xs tracking-wider uppercase"
                >
                  <X size={14} strokeWidth={3} /> Отмена
                </button>
              </div>
            )}
            
            {msg.isError && (
              <div className="mt-3 flex items-center gap-2 text-red-400 text-xs bg-red-900/10 p-2 rounded border border-red-900/30">
                 <AlertCircle size={14} /> <span>Ошибка обработки данных.</span>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

const AIChat: React.FC<AIChatProps> = ({ sales, expenses, onAction }) => {
  const [activeTab, setActiveTab] = useState<'ops' | 'analyst'>('ops');
  
  // --- OPS STATE (Lazy Init) ---
  const [opsMessages, setOpsMessages] = useState<Message[]>(() => {
    try {
      const stored = localStorage.getItem('ops_history_v2');
      return stored ? JSON.parse(stored) : [{ id: 'init', role: 'ai', text: 'Касса готова. Жду команд (например: "2 шаурмы и кола").' }];
    } catch (e) { return []; }
  });
  
  // --- ANALYST STATE (Lazy Init) ---
  const [analystSessions, setAnalystSessions] = useState<ChatSession[]>(() => {
    try {
      const stored = localStorage.getItem('analyst_sessions_v2');
      if (stored) {
         const parsed = JSON.parse(stored);
         if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) { console.error(e); }
    return [];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    // Try to find most recent from initial state
    try {
       const stored = localStorage.getItem('analyst_sessions_v2');
       if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed[0].id;
       }
    } catch(e) {}
    return '';
  });

  const [isSessionSidebarOpen, setIsSessionSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const gemini = useRef<GeminiService | null>(null);
  const recognition = useRef<any>(null);

  // Ensure at least one session exists if empty on mount
  useEffect(() => {
    if (analystSessions.length === 0) {
       createNewSession();
    }
  }, []);

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('ops_history_v2', JSON.stringify(opsMessages));
  }, [opsMessages]);

  useEffect(() => {
    if (analystSessions.length > 0) {
       localStorage.setItem('analyst_sessions_v2', JSON.stringify(analystSessions));
    }
  }, [analystSessions]);

  const getGemini = () => {
    if (!gemini.current) gemini.current = new GeminiService();
    return gemini.current;
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [opsMessages, analystSessions, currentSessionId, activeTab]);

  // Voice Init
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      // @ts-ignore
      recognition.current = new window.webkitSpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.lang = 'ru-RU';
      recognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleSend(transcript);
      };
      recognition.current.onend = () => setIsListening(false);
    }
  }, [activeTab, currentSessionId]);

  // --- SESSION LOGIC ---

  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'Новый чат',
      createdAt: Date.now(),
      messages: [{ id: 'init', role: 'ai', text: 'Аналитик готов. Спрашивайте о стратегии, прибыли или маркетинге.' }]
    };
    setAnalystSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    if (window.innerWidth < 768) setIsSessionSidebarOpen(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSessions = analystSessions.filter(s => s.id !== id);
    setAnalystSessions(newSessions);
    if (newSessions.length === 0) {
      createNewSession();
    } else if (currentSessionId === id) {
      setCurrentSessionId(newSessions[0].id);
    }
  };

  // --- MESSAGE HANDLERS ---

  const handleConfirmOps = (msgId: string, actions: any[]) => {
    onAction(actions);
    setOpsMessages(prev => prev.map(m => m.id === msgId ? { ...m, isConfirmation: false, text: '✅ Операция выполнена.' } : m));
  };

  const handleCancelOps = (msgId: string) => {
    setOpsMessages(prev => prev.map(m => m.id === msgId ? { ...m, isConfirmation: false, text: '❌ Отменено.' } : m));
  };

  const handlePlayAudio = async (text: string) => {
    const service = getGemini();
    const buffer = await service.speak(text);
    if (buffer) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await ctx.decodeAudioData(buffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
    }
  };

  const handleSend = async (textOverride?: string) => {
    const text = textOverride || input;
    if (!text.trim()) return;
    setInput('');
    setIsProcessing(true);

    const userMsgId = Date.now().toString();
    const newUserMsg: Message = { id: userMsgId, role: 'user', text };

    try {
      const service = getGemini();

      if (activeTab === 'ops') {
        setOpsMessages(prev => [...prev, newUserMsg]);

        const salesToday = sales.filter(s => !s.isDeleted && new Date(s.timestamp).toDateString() === new Date().toDateString()).reduce((a,b) => a + b.total, 0);
        const expensesToday = expenses.filter(e => !e.isDeleted && new Date(e.timestamp).toDateString() === new Date().toDateString()).reduce((a,b) => a + b.amount, 0);
        const menuStr = MENU_ITEMS.map(i => `${i.id}: ${i.name} (${i.price}р)`).join(', ');

        const result = await service.parseOperationalCommand(text, { salesToday, expensesToday, menu: menuStr });

        if (result && result.actions) {
           const actionable = result.actions.filter(a => a.type === 'add_sale' || a.type === 'add_expense');
           setOpsMessages(prev => [...prev, {
              id: Date.now().toString(), role: 'ai',
              text: result.confirmationText || "Проверьте данные:",
              isConfirmation: actionable.length > 0,
              pendingActions: actionable.length > 0 ? actionable : undefined
           }]);
        } else {
            setOpsMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', text: "Не удалось разобрать команду.", isError: true }]);
        }

      } else {
        // Analyst
        setAnalystSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
            const isNew = s.messages.length <= 1;
            return {
              ...s,
              title: isNew ? (text.slice(0, 25) + (text.length > 25 ? '...' : '')) : s.title,
              messages: [...s.messages, newUserMsg]
            };
          }
          return s;
        }));

        const activeSales = sales.filter(s => !s.isDeleted);
        const activeExpenses = expenses.filter(e => !e.isDeleted);
        const historyData = JSON.stringify({ 
          sales: activeSales, expenses: activeExpenses,
          revenue: activeSales.reduce((sum, s) => sum + s.total, 0),
          expense: activeExpenses.reduce((sum, e) => sum + e.amount, 0)
        });
        
        const result = await service.getAnalystAdvice(historyData, text);
        
        setAnalystSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              messages: [...s.messages, { id: Date.now().toString(), role: 'ai', text: result.text }]
            };
          }
          return s;
        }));
      }
    } catch (e) {
      console.error(e);
      if (activeTab === 'ops') setOpsMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', text: 'Ошибка сервера.', isError: true }]);
      else setAnalystSessions(prev => prev.map(s => s.id === currentSessionId ? {...s, messages: [...s.messages, { id: Date.now().toString(), role: 'ai', text: 'Ошибка сервера.', isError: true }]} : s));
    } finally {
      setIsProcessing(false);
    }
  };

  const activeMessages = activeTab === 'ops' 
    ? opsMessages 
    : (analystSessions.find(s => s.id === currentSessionId)?.messages || []);

  return (
    <div className="flex flex-col h-full bg-brand-dark relative overflow-hidden">
      
      {/* TOP BAR */}
      <div className="p-4 z-20 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-brand-border flex justify-between items-center shrink-0">
        <div className="flex bg-[#111] p-1 rounded-xl border border-white/5 w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('ops')}
            className={`px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${
              activeTab === 'ops' ? 'bg-brand-surfaceHighlight text-brand-orange shadow-glow border border-white/5' : 'text-gray-500'
            }`}
          >
            <ChefHat size={16} className="inline mr-2" /> Касса
          </button>
          <button 
            onClick={() => setActiveTab('analyst')}
            className={`px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${
              activeTab === 'analyst' ? 'bg-brand-surfaceHighlight text-blue-500 shadow-lg border border-white/5' : 'text-gray-500'
            }`}
          >
            <Briefcase size={16} className="inline mr-2" /> Бизнес
          </button>
        </div>
        
        {activeTab === 'analyst' && (
          <button 
            onClick={() => setIsSessionSidebarOpen(!isSessionSidebarOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white"
          >
             <Menu size={24} />
          </button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* ANALYST SIDEBAR */}
        {activeTab === 'analyst' && (
          <div className={`
            absolute inset-y-0 left-0 w-64 bg-[#080808] border-r border-[#222] z-30 transform transition-transform duration-300
            md:relative md:translate-x-0
            ${isSessionSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <div className="p-4 h-full flex flex-col">
               <button 
                 onClick={createNewSession}
                 className="w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 border border-blue-500/30 p-3 rounded-xl flex items-center gap-2 font-bold text-xs uppercase tracking-wider transition-all mb-4"
               >
                 <Plus size={16} /> Новый чат
               </button>
               
               <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                  {analystSessions.map(session => (
                    <div 
                      key={session.id}
                      onClick={() => { setCurrentSessionId(session.id); if(window.innerWidth < 768) setIsSessionSidebarOpen(false); }}
                      className={`group p-3 rounded-lg border cursor-pointer transition-all relative ${
                        currentSessionId === session.id 
                          ? 'bg-[#1A1A1A] border-blue-500/40 text-white shadow-lg' 
                          : 'bg-transparent border-transparent hover:bg-[#111] text-gray-500'
                      }`}
                    >
                       <div className="flex items-center gap-3 mb-1">
                          <MessageSquare size={14} className={currentSessionId === session.id ? 'text-blue-500' : 'opacity-50'} />
                          <span className="font-bold text-xs truncate">{session.title}</span>
                       </div>
                       <div className="text-[10px] opacity-40 font-mono pl-7">
                         {new Date(session.createdAt).toLocaleDateString()}
                       </div>
                       
                       <button 
                         onClick={(e) => deleteSession(e, session.id)}
                         className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                       >
                         <Trash2 size={14} />
                       </button>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}
        
        {/* CHAT AREA */}
        <div className="flex-1 flex flex-col relative bg-brand-dark h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 pb-32">
              {activeMessages.map(msg => (
                <ChatMessage 
                  key={msg.id} 
                  msg={msg} 
                  onConfirm={handleConfirmOps} 
                  onCancel={handleCancelOps}
                  onPlay={handlePlayAudio}
                />
              ))}
              {isProcessing && (
                <div className="flex justify-start mb-6 ml-2">
                  <div className="bg-brand-surface border border-brand-border px-4 py-3 rounded-2xl rounded-tl-sm flex gap-2 items-center shadow-glow">
                      <span className="text-xs text-gray-400 font-mono animate-pulse">Processing...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-brand-dark via-brand-dark to-transparent z-20">
              <div className="flex gap-3 items-center max-w-3xl mx-auto bg-[#121212] border border-brand-border p-2 rounded-2xl shadow-2xl">
                <button 
                  onClick={() => {
                    if(isListening) recognition.current?.stop();
                    else { setIsListening(true); recognition.current?.start(); }
                  }}
                  className={`p-4 rounded-xl transition-all border border-transparent ${
                    isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Mic size={20} />
                </button>
                
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={activeTab === 'ops' ? "Команда: '2 шаурмы'..." : "Спроси о бизнесе..."}
                  className="flex-1 bg-transparent text-white p-2 outline-none font-medium placeholder-gray-600 text-sm"
                />
                
                <button 
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isProcessing}
                  className="bg-brand-orange text-white p-4 rounded-xl shadow-neon hover:shadow-neon-strong active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default AIChat;
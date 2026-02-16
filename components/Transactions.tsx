
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../App';
import { db } from '../db';
import { Transaction, TransactionCategory, Portfolio, Currency } from '../types';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter, 
  Search, 
  Calendar, 
  TrendingUp, 
  BarChart3, 
  ChevronRight,
  X,
  CreditCard,
  PieChart,
  History,
  Loader2,
  Edit3,
  Trash2,
  AlertCircle,
  Activity
} from 'lucide-react';

export const TransactionModal: React.FC<{ 
  onClose: () => void; 
  onSuccess: () => void;
  txToEdit?: Transaction | null;
  fixedPortfolioId?: string;
}> = ({ onClose, onSuccess, txToEdit, fixedPortfolioId }) => {
  const { portfolios } = useApp();
  const [formData, setFormData] = useState({
    portfolioId: fixedPortfolioId || portfolios[0]?.id || '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: TransactionCategory.OTHER,
    note: ''
  });

  useEffect(() => {
    if (txToEdit) {
      setFormData({
        portfolioId: fixedPortfolioId || txToEdit.portfolioId,
        amount: txToEdit.amount.toString(),
        type: txToEdit.type,
        category: txToEdit.category,
        note: txToEdit.note
      });
    }
  }, [txToEdit, fixedPortfolioId]);

  // Ensure fixed ID is respected if it changes
  useEffect(() => {
    if (fixedPortfolioId) {
      setFormData(prev => ({ ...prev, portfolioId: fixedPortfolioId }));
    }
  }, [fixedPortfolioId]);

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formData.amount);
    const targetPortfolio = portfolios.find(p => p.id === formData.portfolioId);
    if (isNaN(amountNum) || !targetPortfolio) return;

    const txData: Transaction = {
      id: txToEdit ? txToEdit.id : Date.now().toString(),
      portfolioId: targetPortfolio.id,
      amount: amountNum,
      type: formData.type,
      category: formData.category,
      note: formData.note,
      date: txToEdit ? txToEdit.date : Date.now(),
      updatedAt: Date.now()
    };

    await db.saveTransaction(txData);
    onSuccess();
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const expenseCategories = [
    TransactionCategory.FOOD, TransactionCategory.RENT, TransactionCategory.UTILITIES,
    TransactionCategory.GROCERY, TransactionCategory.ENTERTAINMENT, TransactionCategory.OTHER
  ];

  const incomeCategories = [TransactionCategory.SALARY, TransactionCategory.OTHER];

  const labelStyle = "text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2 block ml-2";
  const inputStyle = "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-[1.5rem] px-6 py-4 font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-base placeholder:opacity-50";

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/80 backdrop-blur-md flex items-end sm:items-center sm:justify-center sm:p-6 animate-in fade-in duration-300">
      <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-[3rem] sm:rounded-[3rem] p-8 shadow-premium animate-in slide-in-from-bottom duration-500">
        <div className="flex justify-between items-center mb-10">
          <div className="flex flex-col">
            <h3 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">
              {txToEdit ? 'Adjust Record' : 'Quick Journal'}
            </h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vault Entry</p>
          </div>
          <button onClick={onClose} className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 active:scale-90 transition-all">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSaveTransaction} className="space-y-6">
          <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-[1.5rem]">
            <button 
              type="button"
              onClick={() => setFormData({...formData, type: 'expense', category: TransactionCategory.OTHER})}
              className={`flex-1 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${formData.type === 'expense' ? 'bg-white dark:bg-slate-700 text-rose-500 shadow-premium' : 'text-slate-400'}`}
            >
              Expense
            </button>
            <button 
              type="button"
              onClick={() => setFormData({...formData, type: 'income', category: TransactionCategory.OTHER})}
              className={`flex-1 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${formData.type === 'income' ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-premium' : 'text-slate-400'}`}
            >
              Income
            </button>
          </div>

          {!fixedPortfolioId && (
            <div className="space-y-1">
              <label className={labelStyle}>Wallet</label>
              <select 
                required
                className={inputStyle + " appearance-none cursor-pointer"}
                value={formData.portfolioId}
                onChange={(e) => setFormData({...formData, portfolioId: e.target.value})}
              >
                {portfolios.map(p => <option key={p.id} value={p.id}>{p.name} ({p.currency})</option>)}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className={labelStyle}>Amount</label>
            <div className="relative">
              <input 
                required
                type="number"
                step="0.01"
                placeholder="0.00"
                className={inputStyle + " text-2xl tracking-tighter tabular-nums"}
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={labelStyle}>Category</label>
              <select 
                className={inputStyle + " appearance-none"}
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value as TransactionCategory})}
              >
                {formData.type === 'expense' ? expenseCategories.map(c => <option key={c} value={c}>{c}</option>) : incomeCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className={labelStyle}>Note</label>
              <input 
                type="text"
                placeholder="Details..."
                className={inputStyle}
                value={formData.note}
                onChange={(e) => setFormData({...formData, note: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-gradient-to-br from-blue-500 to-blue-700 text-white font-black py-5 rounded-[1.8rem] shadow-glow active:scale-95 transition-all text-[15px] uppercase tracking-[0.2em] mt-4"
          >
            {txToEdit ? 'Update Vault' : 'Secure Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
};

const Transactions: React.FC = () => {
  const { portfolios, baseCurrency, settings, setIsTxModalOpen } = useApp();
  const [subTab, setSubTab] = useState<'history' | 'insights'>('history');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [timeRange, setTimeRange] = useState<'7d' | '1m' | '1y' | 'custom'>('1m');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  // Menu and Edit state
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);
  const [isPressingId, setIsPressingId] = useState<string | null>(null);
  const pressTimer = useRef<number | null>(null);

  const fetchTransactions = async () => {
    setIsLoading(true);
    const data = await db.getAllTransactions();
    setTransactions(data.sort((a, b) => b.date - a.date));
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleStartPress = (id: string) => {
    if (selectedTxId) return;
    setIsPressingId(id);
    pressTimer.current = window.setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50);
      setSelectedTxId(id);
      setIsPressingId(null);
    }, 600);
  };

  const handleEndPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    setIsPressingId(null);
  };

  const handleDeleteTx = async (id: string) => {
    await db.deleteTransaction(id);
    fetchTransactions();
    setSelectedTxId(null);
    if (navigator.vibrate) navigator.vibrate([10, 30]);
  };

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const query = searchQuery.toLowerCase();
    
    return transactions.filter(tx => {
      const p = portfolios.find(port => port.id === tx.portfolioId);
      const portfolioName = p ? p.name.toLowerCase() : '';
      const note = (tx.note || '').toLowerCase();
      const category = tx.category.toLowerCase();
      const amountStr = tx.amount.toString();
      
      return note.includes(query) || 
             category.includes(query) || 
             portfolioName.includes(query) ||
             amountStr.includes(query);
    });
  }, [transactions, searchQuery, portfolios]);

  const filteredTransactions = useMemo(() => {
    const now = Date.now();
    const msInDay = 24 * 60 * 60 * 1000;
    
    return transactions.filter(tx => {
      if (timeRange === '7d') return now - tx.date <= 7 * msInDay;
      if (timeRange === '1m') return now - tx.date <= 30 * msInDay;
      if (timeRange === '1y') return now - tx.date <= 365 * msInDay;
      if (timeRange === 'custom') {
        const start = customRange.start ? new Date(customRange.start).getTime() : 0;
        const end = customRange.end ? new Date(customRange.end).getTime() + msInDay : Infinity;
        return tx.date >= start && tx.date <= end;
      }
      return true;
    });
  }, [transactions, timeRange, customRange]);

  const insightsData = useMemo(() => {
    const groups: Record<string, { total: number; count: number; type: 'income' | 'expense'; category: string; currency: string }> = {};
    
    filteredTransactions.forEach(tx => {
      const p = portfolios.find(port => port.id === tx.portfolioId);
      const currency = p?.currency || baseCurrency;
      const key = `${tx.category}_${currency}`;
      
      if (!groups[key]) {
        groups[key] = { total: 0, count: 0, type: tx.type, category: tx.category, currency };
      }
      groups[key].total += tx.amount;
      groups[key].count += 1;
    });

    return Object.values(groups).sort((a, b) => b.total - a.total);
  }, [filteredTransactions, portfolios, baseCurrency]);

  const formatValue = (val: number, currencyCode: string = baseCurrency) => {
    const f = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0
    }).format(val);
    return settings.privacyMode ? '••••' : f;
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full flex flex-col min-h-full pb-20">
      <div className="pt-4 pb-6 px-1 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight">Activity</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">Stream of Wealth</p>
          </div>
          <button 
            onClick={() => { setTxToEdit(null); setIsTxModalOpen(true); }}
            className="w-12 h-12 rounded-[1.3rem] bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-premium shadow-blue-500/30 active:scale-90 transition-all hover:brightness-110"
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* Custom Pill Tab Switcher */}
        <div className="flex p-1.5 bg-white/40 dark:bg-slate-900/50 backdrop-blur-xl border border-white/30 dark:border-white/5 rounded-[1.8rem] shadow-premium">
          <button 
            onClick={() => setSubTab('history')}
            className={`flex-1 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${subTab === 'history' ? 'bg-blue-600 text-white shadow-glow' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <History size={16} />
            Journal
          </button>
          <button 
            onClick={() => setSubTab('insights')}
            className={`flex-1 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${subTab === 'insights' ? 'bg-blue-600 text-white shadow-glow' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <Activity size={16} />
            Analytics
          </button>
        </div>
      </div>

      <div className="flex-1 mt-2">
        {subTab === 'history' ? (
          <div className="space-y-6">
            <div className="sticky top-0 z-20 pt-2 pb-4 px-1 bg-slate-50/80 dark:bg-[#020617]/80 backdrop-blur-2xl">
              <div className="relative group">
                <input 
                  type="text"
                  placeholder="Filter by notes, category or sum..."
                  className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-[1.5rem] py-5 pl-14 pr-6 font-extrabold text-[15px] text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-premium placeholder:text-slate-400/60"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search size={20} className={`absolute left-6 top-1/2 -translate-y-1/2 transition-all duration-300 ${searchQuery ? 'text-blue-500 scale-110' : 'text-slate-400'}`} />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-6 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 active:scale-90 transition-all"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {isLoading ? (
               <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-4">
                  <Loader2 size={40} className="animate-spin text-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Scanning Vault...</span>
               </div>
            ) : filteredHistory.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center text-slate-400/40 gap-6">
                <div className="w-20 h-20 rounded-[2.5rem] border-4 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center">
                   <CreditCard size={36} className="opacity-50" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-extrabold text-slate-500 dark:text-slate-400">{searchQuery ? 'No matches found' : 'The vault is silent'}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest mt-1">Start journalizing activity</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 px-1">
                {filteredHistory.map(tx => {
                  const p = portfolios.find(p => p.id === tx.portfolioId);
                  const isSelected = selectedTxId === tx.id;
                  const isPressing = isPressingId === tx.id;

                  return (
                    <div 
                      key={tx.id} 
                      onMouseDown={() => handleStartPress(tx.id)}
                      onMouseUp={handleEndPress}
                      onMouseLeave={handleEndPress}
                      onTouchStart={() => handleStartPress(tx.id)}
                      onTouchEnd={handleEndPress}
                      className={`relative bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 p-5 rounded-[2rem] flex items-center justify-between group shadow-premium transition-all duration-300 select-none overflow-hidden
                        ${isPressing ? 'scale-[0.97] brightness-90 shadow-none' : 'animate-in fade-in slide-in-from-bottom-2 duration-500'}
                      `}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 z-30 bg-black/95 backdrop-blur-2xl flex items-center justify-center gap-8 animate-in fade-in zoom-in duration-300 p-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setTxToEdit(tx); setSelectedTxId(null); }}
                              className="flex flex-col items-center gap-2.5 text-white group"
                            >
                              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center group-active:scale-90 transition-transform shadow-glow"><Edit3 size={24} /></div>
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Adjust</span>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteTx(tx.id); }}
                              className="flex flex-col items-center gap-2.5 text-rose-400 group"
                            >
                              <div className="w-14 h-14 rounded-full bg-rose-500/20 flex items-center justify-center group-active:scale-90 transition-transform"><Trash2 size={24} /></div>
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Remove</span>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedTxId(null); }}
                              className="absolute top-4 right-6 p-2 text-white/40 hover:text-white active:scale-90"
                            >
                              <X size={24} />
                            </button>
                        </div>
                      )}

                      <div className="flex items-center gap-5 flex-1 min-w-0">
                        <div className={`w-12 h-12 rounded-[1.3rem] flex items-center justify-center shrink-0 shadow-sm ${tx.type === 'income' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'}`}>
                          {tx.type === 'income' ? <ArrowDownLeft size={24} strokeWidth={2.5} /> : <ArrowUpRight size={24} strokeWidth={2.5} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-extrabold text-slate-900 dark:text-white text-[15px] tracking-tight truncate">{tx.category}</span>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest shrink-0">{formatDate(tx.date)}</span>
                          </div>
                          <p className="text-[12px] text-slate-500 dark:text-slate-400 font-bold tracking-tight line-clamp-1 italic opacity-70">{tx.note || p?.name || 'Local Record'}</p>
                        </div>
                      </div>
                      <div className="text-right pl-4">
                        <span className={`font-black tabular-nums text-[16px] tracking-tight ${tx.type === 'income' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'} ${settings.privacyMode ? 'blur-md opacity-40' : ''}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatValue(tx.amount, p?.currency)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-wrap gap-2.5 px-1">
              {[
                { id: '7d', label: '7D' },
                { id: '1m', label: '1M' },
                { id: '1y', label: '1Y' },
                { id: 'custom', label: 'Custom' }
              ].map(range => (
                <button 
                  key={range.id}
                  onClick={() => setTimeRange(range.id as any)}
                  className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all ${timeRange === range.id ? 'bg-blue-600 text-white shadow-glow' : 'bg-white dark:bg-slate-900/50 text-slate-500 border border-slate-200 dark:border-white/5 hover:border-blue-400'}`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {timeRange === 'custom' && (
              <div className="grid grid-cols-2 gap-4 px-1 animate-in slide-in-from-top-2 duration-300">
                <input 
                  type="date" 
                  className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-2xl px-4 py-3 text-xs font-black uppercase text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={customRange.start}
                  onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
                />
                <input 
                  type="date" 
                  className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-2xl px-4 py-3 text-xs font-black uppercase text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={customRange.end}
                  onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
                />
              </div>
            )}

            <div className="grid gap-5 px-1">
              {insightsData.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center opacity-30 text-slate-400">
                   <BarChart3 size={48} className="mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Data Streams</p>
                </div>
              ) : (
                insightsData.map((data) => (
                  <div key={`${data.category}_${data.currency}`} className="bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 p-6 rounded-[2.2rem] shadow-premium flex flex-col gap-4 group hover:scale-[1.02] transition-transform duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${data.type === 'income' ? 'bg-emerald-500 shadow-glow shadow-emerald-500/30' : 'bg-blue-500 shadow-glow shadow-blue-500/30'}`}></div>
                        <span className="font-black text-[15px] text-slate-900 dark:text-white tracking-tight">
                          {data.category}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg uppercase tracking-tighter">{data.currency}</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100/50 dark:bg-slate-800/50 px-3 py-1 rounded-full">{data.count} Entries</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                       <span className={`text-2xl font-black tabular-nums text-slate-900 dark:text-white ${settings.privacyMode ? 'blur-md opacity-40' : ''}`}>
                        {formatValue(data.total, data.currency)}
                       </span>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">Total volume</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                       <div 
                         className={`h-full rounded-full transition-all duration-1000 ${data.type === 'income' ? 'bg-emerald-500' : 'bg-blue-600'}`} 
                         style={{ width: '100%' }} // Simple indicator, can be dynamic based on max
                       ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {txToEdit && (
        <TransactionModal 
          onClose={() => setTxToEdit(null)}
          onSuccess={() => { fetchTransactions(); setTxToEdit(null); }}
          txToEdit={txToEdit}
        />
      )}
    </div>
  );
};

export default Transactions;

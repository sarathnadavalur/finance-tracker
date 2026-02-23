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
    TransactionCategory.FOOD, TransactionCategory.FOOD_ORDERS, TransactionCategory.RENT, TransactionCategory.UTILITIES,
    TransactionCategory.GROCERY, TransactionCategory.ENTERTAINMENT, TransactionCategory.OTHER
  ];

  const incomeCategories = [TransactionCategory.SALARY, TransactionCategory.OTHER];

  const labelStyle = "text-[12px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3 block ml-4 opacity-70";
  const inputStyle = "w-full bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/10 rounded-[2.2rem] px-8 py-5.5 font-black text-slate-900 dark:text-white outline-none focus:ring-8 focus:ring-blue-500/10 transition-all text-lg placeholder:opacity-30 shadow-inner-light";

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/70 backdrop-blur-xl flex items-end sm:items-center sm:justify-center sm:p-6 animate-in fade-in duration-500 overflow-y-auto">
      <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-[3.5rem] sm:rounded-[3.5rem] p-6 sm:p-10 shadow-premium animate-in slide-in-from-bottom duration-700 max-h-[95vh] overflow-y-auto no-scrollbar sm:my-auto">
        <div className="flex justify-between items-center mb-8 sm:mb-10">
          <div className="flex flex-col">
            <h3 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
              {txToEdit ? 'Modify Entry' : 'Add a Transaction'}
            </h3>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 opacity-60">Vault Transaction</p>
          </div>
          <button onClick={onClose} className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 active:scale-90 tap-scale transition-all">
            <X size={26} />
          </button>
        </div>

        <form onSubmit={handleSaveTransaction} className="space-y-8">
          <div className="flex p-1.5 glass rounded-[2.2rem] shadow-inner-light">
            <button 
              type="button"
              onClick={() => setFormData({...formData, type: 'expense', category: TransactionCategory.OTHER})}
              className={`flex-1 py-4 rounded-[1.8rem] font-black text-[11px] uppercase tracking-widest transition-all tap-scale ${formData.type === 'expense' ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-xl' : 'text-slate-400 opacity-60'}`}
            >
              Expense
            </button>
            <button 
              type="button"
              onClick={() => setFormData({...formData, type: 'income', category: TransactionCategory.OTHER})}
              className={`flex-1 py-4 rounded-[1.8rem] font-black text-[11px] uppercase tracking-widest transition-all tap-scale ${formData.type === 'income' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-xl' : 'text-slate-400 opacity-60'}`}
            >
              Income
            </button>
          </div>

          {!fixedPortfolioId && (
            <div className="space-y-2">
              <label className={labelStyle}>Destination Wallet</label>
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

          <div className="space-y-3">
            <label className={labelStyle}>Financial Amount</label>
            <div className="relative">
              <input 
                required
                type="number"
                step="0.01"
                placeholder="0.00"
                className={inputStyle + " text-5xl tracking-tighter tabular-nums text-center py-8"}
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className={labelStyle}>Category</label>
              <select 
                className={inputStyle + " appearance-none text-center"}
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value as TransactionCategory})}
              >
                {formData.type === 'expense' ? expenseCategories.map(c => <option key={c} value={c}>{c}</option>) : incomeCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className={labelStyle}>Note / Ref</label>
              <input 
                type="text"
                placeholder="Reference..."
                className={inputStyle + " text-center"}
                value={formData.note}
                onChange={(e) => setFormData({...formData, note: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full glossy-blue text-white font-black py-6 rounded-[2.2rem] shadow-glow active:scale-95 transition-all tap-scale text-[16px] uppercase tracking-[0.25em] mt-6 shadow-inner-light"
          >
            {txToEdit ? 'Update Record' : 'Commit Entry'}
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
    <div className="w-full flex flex-col min-h-full pb-32">
      <div className="pt-4 pb-8 px-1 flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight">Activity</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.25em] mt-1.5 opacity-60">Stream of Events</p>
          </div>
          <button 
            onClick={() => { setTxToEdit(null); setIsTxModalOpen(true); }}
            className="w-14 h-14 rounded-[1.8rem] glossy-blue flex items-center justify-center text-white shadow-glow shadow-inner-light active:scale-90 transition-all tap-scale"
          >
            <Plus size={28} strokeWidth={2.5} />
          </button>
        </div>

        {/* Custom Tab Switcher */}
        <div className="flex p-1.5 glass rounded-[2.2rem] shadow-premium">
          <button 
            onClick={() => setSubTab('history')}
            className={`flex-1 py-4 rounded-[1.8rem] font-black text-[11px] uppercase tracking-widest transition-all tap-scale flex items-center justify-center gap-3 ${subTab === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}
          >
            <History size={18} />
            History
          </button>
          <button 
            onClick={() => setSubTab('insights')}
            className={`flex-1 py-4 rounded-[1.8rem] font-black text-[11px] uppercase tracking-widest transition-all tap-scale flex items-center justify-center gap-3 ${subTab === 'insights' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}
          >
            <Activity size={18} />
            Analytics
          </button>
        </div>
      </div>

      <div className="flex-1 mt-2">
        {subTab === 'history' ? (
          <div className="space-y-8">
            <div className="sticky top-0 z-20 pt-2 pb-6 px-1 glass backdrop-blur-3xl rounded-[2.5rem] border-white/20 mb-4">
              <div className="relative group px-4">
                <input 
                  type="text"
                  placeholder="Filter by records..."
                  className="w-full bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-[2rem] py-5 pl-14 pr-6 font-black text-[16px] text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-premium placeholder:opacity-50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search size={22} className={`absolute left-10 top-1/2 -translate-y-1/2 transition-all duration-300 ${searchQuery ? 'text-blue-600' : 'text-slate-400'}`} />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-10 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 tap-scale transition-all"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {isLoading ? (
               <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-6">
                  <Loader2 size={48} className="animate-spin text-blue-600" />
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] opacity-60">Scanning Vault...</span>
               </div>
            ) : filteredHistory.length === 0 ? (
              <div className="py-32 flex flex-col items-center justify-center text-slate-400/30 gap-8">
                <div className="w-24 h-24 rounded-[3rem] border-4 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center opacity-50">
                   <CreditCard size={42} />
                </div>
                <div className="text-center px-10">
                  <p className="text-lg font-black text-slate-500 dark:text-slate-400 leading-tight">{searchQuery ? 'No Results Matching Search' : 'Vault History is Empty'}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-60">Start tracking your entries today</p>
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
                      className={`relative glass p-6 rounded-[2.5rem] flex items-center justify-between group shadow-premium transition-all duration-300 select-none overflow-hidden tap-scale
                        ${isPressing ? 'brightness-90 scale-[0.98]' : 'animate-in fade-in slide-in-from-bottom-3 duration-500'}
                      `}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 z-30 bg-black/95 backdrop-blur-3xl flex items-center justify-center gap-10 animate-in fade-in zoom-in duration-300 p-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setTxToEdit(tx); setSelectedTxId(null); }}
                              className="flex flex-col items-center gap-3.5 text-white group"
                            >
                              <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center group-active:scale-90 transition-all shadow-glow"><Edit3 size={28} /></div>
                              <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-70">Adjust</span>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteTx(tx.id); }}
                              className="flex flex-col items-center gap-3.5 text-rose-400 group"
                            >
                              <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/20 flex items-center justify-center group-active:scale-90 transition-all"><Trash2 size={28} /></div>
                              <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-70">Purge</span>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedTxId(null); }}
                              className="absolute top-6 right-8 p-2.5 text-white/40 hover:text-white tap-scale transition-all"
                            >
                              <X size={28} />
                            </button>
                        </div>
                      )}

                      <div className="flex items-center gap-6 flex-1 min-w-0">
                        <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-inner-light ${tx.type === 'income' ? 'bg-emerald-500 text-white glossy-green' : 'bg-rose-500 text-white glossy-red'}`}>
                          {tx.type === 'income' ? <ArrowDownLeft size={28} strokeWidth={3} /> : <ArrowUpRight size={28} strokeWidth={3} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-black text-slate-900 dark:text-white text-[17px] tracking-tight truncate leading-none">{tx.note || p?.name || 'Vantage Record'}</span>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest shrink-0 opacity-60">{formatDate(tx.date)}</span>
                          </div>
                          <p className="text-[13px] text-slate-500 dark:text-slate-400 font-bold tracking-tight line-clamp-1 italic opacity-60">{tx.category} • {p?.name || 'Unknown Wallet'}</p>
                        </div>
                      </div>
                      <div className="text-right pl-5">
                        <span className={`font-black tabular-nums text-[18px] tracking-tighter leading-none ${tx.type === 'income' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'} ${settings.privacyMode ? 'blur-lg opacity-30' : ''}`}>
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
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex flex-wrap gap-3 px-2">
              {[
                { id: '7d', label: '7 Days' },
                { id: '1m', label: 'Month' },
                { id: '1y', label: 'Year' },
                { id: 'custom', label: 'Custom' }
              ].map(range => (
                <button 
                  key={range.id}
                  onClick={() => setTimeRange(range.id as any)}
                  className={`px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all tap-scale ${timeRange === range.id ? 'bg-blue-600 text-white shadow-lg' : 'glass text-slate-500'}`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {timeRange === 'custom' && (
              <div className="grid grid-cols-2 gap-5 px-2 animate-in slide-in-from-top-3 duration-500">
                <input 
                  type="date" 
                  className="glass rounded-2xl px-5 py-4 text-xs font-black uppercase text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10"
                  value={customRange.start}
                  onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
                />
                <input 
                  type="date" 
                  className="glass rounded-2xl px-5 py-4 text-xs font-black uppercase text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10"
                  value={customRange.end}
                  onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
                />
              </div>
            )}

            <div className="grid gap-6 px-2 pb-10">
              {insightsData.length === 0 ? (
                <div className="py-32 flex flex-col items-center justify-center opacity-30 text-slate-400 gap-8">
                   <BarChart3 size={56} />
                   <p className="text-[11px] font-black uppercase tracking-[0.3em] text-center">Awaiting Market Data Streams</p>
                </div>
              ) : (
                insightsData.map((data) => (
                  <div key={`${data.category}_${data.currency}`} className="glass p-8 rounded-[2.8rem] shadow-premium flex flex-col gap-6 group hover:scale-[1.02] transition-all duration-500 tap-scale border border-white/40 dark:border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-3.5 h-3.5 rounded-full ${data.type === 'income' ? 'bg-emerald-500 shadow-glow shadow-emerald-500/40' : 'bg-blue-600 shadow-glow shadow-blue-600/40'} ring-4 ring-white/20`}></div>
                        <span className="font-black text-[19px] text-slate-900 dark:text-white tracking-tighter leading-none">
                          {data.category}
                        </span>
                        <span className="text-[10px] font-black text-blue-600 bg-blue-600/10 px-3 py-1 rounded-xl uppercase tracking-widest">{data.currency}</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white/40 dark:bg-slate-800/40 px-4 py-2 rounded-full shadow-inner-dark">{data.count} Entries</span>
                    </div>
                    <div className="flex items-baseline gap-3">
                       <span className={`text-3xl font-black tabular-nums text-slate-900 dark:text-white tracking-tighter drop-shadow-sm ${settings.privacyMode ? 'blur-lg opacity-30' : ''}`}>
                        {formatValue(data.total, data.currency)}
                       </span>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">Volume Weighted</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800/60 rounded-full overflow-hidden shadow-inner">
                       <div 
                         className={`h-full rounded-full transition-all duration-1000 ${data.type === 'income' ? 'glossy-green' : 'glossy-blue'}`} 
                         style={{ width: '100%' }} 
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
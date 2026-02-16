
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
  AlertCircle
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

  const labelStyle = "text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block ml-1";
  const inputStyle = "w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl px-5 py-3.5 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm";

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center sm:justify-center sm:p-4 animate-in fade-in duration-300">
      <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {txToEdit ? 'Edit Entry' : 'Quick Entry'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={24} className="text-slate-900 dark:text-white" />
          </button>
        </div>

        <form onSubmit={handleSaveTransaction} className="space-y-4">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button 
              type="button"
              onClick={() => setFormData({...formData, type: 'expense', category: TransactionCategory.OTHER})}
              className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all ${formData.type === 'expense' ? 'bg-white dark:bg-slate-700 text-rose-500 shadow-sm' : 'text-slate-400'}`}
            >
              Expense
            </button>
            <button 
              type="button"
              onClick={() => setFormData({...formData, type: 'income', category: TransactionCategory.OTHER})}
              className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all ${formData.type === 'income' ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-400'}`}
            >
              Income
            </button>
          </div>

          {!fixedPortfolioId && (
            <div className="space-y-1">
              <label className={labelStyle}>Target Wallet</label>
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
            <input 
              required
              type="number"
              step="0.01"
              placeholder="0.00"
              className={inputStyle + " text-lg"}
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
              <label className={labelStyle}>Reference</label>
              <input 
                type="text"
                placeholder="Brief note..."
                className={inputStyle}
                value={formData.note}
                onChange={(e) => setFormData({...formData, note: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/30 active:scale-95 transition-all text-sm uppercase tracking-widest mt-2"
          >
            {txToEdit ? 'Save Changes' : 'Post Entry'}
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
    <div className="w-full flex flex-col min-h-full">
      <div className="pt-6 pb-4 px-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight">Activity</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">Stream of Transactions</p>
          </div>
          <button 
            onClick={() => { setTxToEdit(null); setIsTxModalOpen(true); }}
            className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 active:scale-90 transition-transform"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="flex p-1 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-2xl shadow-sm">
          <button 
            onClick={() => setSubTab('history')}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${subTab === 'history' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}
          >
            <History size={14} />
            History
          </button>
          <button 
            onClick={() => setSubTab('insights')}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${subTab === 'insights' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}
          >
            <PieChart size={14} />
            Insights
          </button>
        </div>
      </div>

      <div className="flex-1 mt-2">
        {subTab === 'history' ? (
          <div className="space-y-4 pb-20">
            <div className="sticky top-0 z-20 bg-slate-50/80 dark:bg-[#020617]/80 backdrop-blur-md py-3 px-1">
              <div className="relative group">
                <input 
                  type="text"
                  placeholder="Search notes, category or amount..."
                  className="w-full bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 rounded-2xl py-3.5 pl-12 pr-6 font-bold text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search size={18} className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${searchQuery ? 'text-blue-500' : 'text-slate-400'}`} />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X size={14} className="text-slate-400" />
                  </button>
                )}
              </div>
            </div>

            {isLoading ? (
               <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 size={32} className="animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-widest">Loading Records...</span>
               </div>
            ) : filteredHistory.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400/40 gap-4">
                <div className="w-16 h-16 rounded-full border-4 border-dashed border-current flex items-center justify-center">
                   <CreditCard size={32} />
                </div>
                <p className="text-sm font-bold">{searchQuery ? 'No matching records' : 'No activity found yet'}</p>
              </div>
            ) : (
              <div className="space-y-3 px-1">
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
                      className={`relative bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 p-4 rounded-3xl flex items-center justify-between group shadow-sm transition-all duration-300 select-none overflow-hidden
                        ${isPressing ? 'scale-[0.98] brightness-90' : 'animate-in fade-in slide-in-from-bottom-2 duration-300'}
                      `}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-xl flex items-center justify-center gap-6 animate-in fade-in zoom-in duration-200 p-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setTxToEdit(tx); setSelectedTxId(null); }}
                              className="flex flex-col items-center gap-2 text-white group"
                            >
                              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-active:scale-90 transition-transform"><Edit3 size={20} /></div>
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Edit</span>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteTx(tx.id); }}
                              className="flex flex-col items-center gap-2 text-rose-400 group"
                            >
                              <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center group-active:scale-90 transition-transform"><Trash2 size={20} /></div>
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Delete</span>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedTxId(null); }}
                              className="absolute top-3 right-4 p-1 text-white/40 hover:text-white"
                            >
                              <X size={20} />
                            </button>
                        </div>
                      )}

                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {tx.type === 'income' ? <ArrowDownLeft size={22} /> : <ArrowUpRight size={22} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 dark:text-white text-sm tracking-tight truncate">{tx.category}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter shrink-0">{formatDate(tx.date)}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold tracking-tight line-clamp-1 italic">{tx.note || p?.name || 'Vantage Record'}</p>
                        </div>
                      </div>
                      <div className="text-right pl-4">
                        <span className={`font-black tabular-nums text-sm ${tx.type === 'income' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'} ${settings.privacyMode ? 'blur-sm' : ''}`}>
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
          <div className="space-y-6 pb-20 animate-in fade-in duration-300">
            <div className="flex flex-wrap gap-2">
              {[
                { id: '7d', label: '7 Days' },
                { id: '1m', label: '1 Month' },
                { id: '1y', label: '1 Year' },
                { id: 'custom', label: 'Custom' }
              ].map(range => (
                <button 
                  key={range.id}
                  onClick={() => setTimeRange(range.id as any)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeRange === range.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-slate-900/50 text-slate-500 border border-slate-100 dark:border-white/5'}`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {timeRange === 'custom' && (
              <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-300">
                <input 
                  type="date" 
                  className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
                  value={customRange.start}
                  onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
                />
                <input 
                  type="date" 
                  className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
                  value={customRange.end}
                  onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
                />
              </div>
            )}

            <div className="grid gap-4">
              {insightsData.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center opacity-30 text-slate-400">
                   <BarChart3 size={40} className="mb-2" />
                   <p className="text-xs font-bold uppercase tracking-widest">No data for this period</p>
                </div>
              ) : (
                insightsData.map((data) => (
                  <div key={`${data.category}_${data.currency}`} className="bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 p-5 rounded-3xl shadow-sm flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${data.type === 'income' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                        <span className="font-black text-sm text-slate-900 dark:text-white tracking-tight">
                          {data.category} ({data.currency})
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{data.count} txs</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                       <span className={`text-xl font-black tabular-nums text-slate-900 dark:text-white ${settings.privacyMode ? 'blur-sm' : ''}`}>
                        {formatValue(data.total, data.currency)}
                       </span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Accumulated</span>
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

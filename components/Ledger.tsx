
import React, { useState, useEffect } from 'react';
import { X, Plus, ArrowUpRight, ArrowDownLeft, Trash2, Calendar, Tag, CreditCard, ChevronLeft } from 'lucide-react';
import { Portfolio, Transaction, TransactionCategory, Currency } from '../types';
import { useApp } from '../App';
import { db } from '../db';

interface LedgerProps {
  portfolio: Portfolio;
  onClose: () => void;
}

const Ledger: React.FC<LedgerProps> = ({ portfolio, onClose }) => {
  const { settings } = useApp();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: TransactionCategory.OTHER,
    note: ''
  });

  const fetchTransactions = async () => {
    const data = await db.getTransactionsByPortfolio(portfolio.id);
    setTransactions(data.sort((a, b) => b.date - a.date));
  };

  useEffect(() => {
    fetchTransactions();
  }, [portfolio.id]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum)) return;

    const newTx: Transaction = {
      id: Date.now().toString(),
      portfolioId: portfolio.id,
      amount: amountNum,
      type: formData.type,
      category: formData.category,
      note: formData.note,
      date: Date.now(),
      updatedAt: Date.now()
    };

    await db.saveTransaction(newTx);
    
    // Independent Tracking: No longer updating portfolio value here

    setFormData({ amount: '', type: 'expense', category: TransactionCategory.OTHER, note: '' });
    setShowAddForm(false);
    fetchTransactions();
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleDeleteTransaction = async (tx: Transaction) => {
    if (!confirm('Remove this transaction record?')) return;
    
    await db.deleteTransaction(tx.id);
    // Independent Tracking: No longer reversing portfolio balance here
    fetchTransactions();
  };

  const formatValue = (val: number) => {
    const f = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: portfolio.currency,
      maximumFractionDigits: 0
    }).format(val);
    return settings.privacyMode ? '••••' : f;
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const expenseCategories = [
    TransactionCategory.FOOD,
    TransactionCategory.RENT,
    TransactionCategory.UTILITIES,
    TransactionCategory.GROCERY,
    TransactionCategory.ENTERTAINMENT,
    TransactionCategory.OTHER
  ];

  const incomeCategories = [
    TransactionCategory.SALARY,
    TransactionCategory.OTHER
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-[#020617] flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <header className="px-6 py-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-white dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ChevronLeft size={24} className="text-slate-900 dark:text-white" />
          </button>
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">{portfolio.name}</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Transaction Ledger</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-xl font-black tabular-nums ${settings.privacyMode ? 'blur-sm select-none' : ''}`}>{formatValue(portfolio.value)}</p>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Target Portfolio Balance</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-container no-scrollbar">
        {transactions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-20 opacity-30">
            <CreditCard size={48} className="mb-4" />
            <p className="font-bold text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map(tx => (
              <div key={tx.id} className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 p-4 rounded-[1.5rem] flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {tx.type === 'income' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{tx.category}</span>
                      <span className="text-[10px] text-slate-400 font-medium">• {formatDate(tx.date)}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{tx.note || 'No description'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-black tabular-nums ${tx.type === 'income' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'} ${settings.privacyMode ? 'blur-sm' : ''}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatValue(tx.amount)}
                  </span>
                  <button onClick={() => handleDeleteTransaction(tx)} className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-rose-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Bar */}
      <footer className="p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-t border-slate-200 dark:border-white/5 shrink-0">
        <button 
          onClick={() => setShowAddForm(true)}
          className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <Plus size={20} />
          <span>Add Transaction</span>
        </button>
      </footer>

      {/* Add Form Overlay */}
      {showAddForm && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-end animate-in fade-in duration-300">
          <div className="w-full bg-white dark:bg-slate-900 rounded-t-[3rem] p-8 animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">New Entry</h3>
              <button onClick={() => setShowAddForm(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={24} className="text-slate-900 dark:text-white" />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-6">
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, type: 'expense', category: TransactionCategory.OTHER})}
                  className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${formData.type === 'expense' ? 'bg-white dark:bg-slate-700 text-rose-500 shadow-sm' : 'text-slate-400'}`}
                >
                  Expense
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, type: 'income', category: TransactionCategory.OTHER})}
                  className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${formData.type === 'income' ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-400'}`}
                >
                  Income
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block ml-2">Amount</label>
                <div className="relative">
                   <input 
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-5 text-3xl font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300">{portfolio.currency}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block ml-2">Category</label>
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 font-bold text-slate-900 dark:text-white outline-none appearance-none"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as TransactionCategory})}
                  >
                    {formData.type === 'expense' ? (
                      expenseCategories.map(c => <option key={c} value={c}>{c}</option>)
                    ) : (
                      incomeCategories.map(c => <option key={c} value={c}>{c}</option>)
                    )}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block ml-2">Notes</label>
                  <input 
                    type="text"
                    placeholder="Brief detail..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 font-bold text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
                    value={formData.note}
                    onChange={(e) => setFormData({...formData, note: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-500/30 active:scale-95 transition-all text-lg"
              >
                Post Entry
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ledger;

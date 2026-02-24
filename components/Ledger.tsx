
import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, ArrowUpRight, ArrowDownLeft, Trash2, Calendar, Tag, CreditCard, ChevronLeft, Edit3, AlertCircle } from 'lucide-react';
import { Portfolio, Transaction, TransactionCategory, Currency } from '../types';
import { useApp } from '../App';
import { db } from '../db';
import { TransactionModal } from './Transactions';

interface LedgerProps {
  portfolio: Portfolio;
  onClose: () => void;
}

const Ledger: React.FC<LedgerProps> = ({ portfolio, onClose }) => {
  const { settings, reloadData } = useApp();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);
  
  // Menu and State
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [isPressingId, setIsPressingId] = useState<string | null>(null);
  const pressTimer = useRef<number | null>(null);

  const fetchTransactions = async () => {
    const data = await db.getTransactionsByPortfolio(portfolio.id);
    setTransactions(data.sort((a, b) => b.date - a.date));
  };

  useEffect(() => {
    fetchTransactions();
  }, [portfolio.id]);

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
    await fetchTransactions();
    await reloadData(); // Refresh global totals
    setSelectedTxId(null);
    if (navigator.vibrate) navigator.vibrate([10, 30]);
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

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-[#020617] flex flex-col animate-in slide-in-from-right duration-300 mesh-bg-ios">
      <header className="px-6 py-6 liquid-glass flex items-center justify-between sticky top-0 z-10 shrink-0">
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
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Wallet Balance</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-container no-scrollbar">
        {transactions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-20 opacity-30">
            <CreditCard size={48} className="mb-4" />
            <p className="font-bold text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map(tx => {
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
                  className={`relative liquid-glass p-4 rounded-[1.8rem] flex items-center justify-between group shadow-sm transition-all duration-300 select-none overflow-hidden
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

                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {tx.type === 'income' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm truncate">{tx.category}</span>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">• {formatDate(tx.date)}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 italic">{tx.note || 'Reference record'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className={`font-black tabular-nums ${tx.type === 'income' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'} ${settings.privacyMode ? 'blur-sm' : ''}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatValue(tx.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <footer className="p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-t border-slate-200 dark:border-white/5 shrink-0">
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3 active:scale-95 transition-all text-sm uppercase tracking-widest"
        >
          <Plus size={20} />
          <span>Add Transaction</span>
        </button>
      </footer>

      {showAddModal && (
        <TransactionModal 
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { fetchTransactions(); reloadData(); setShowAddModal(false); }}
          fixedPortfolioId={portfolio.id}
        />
      )}

      {txToEdit && (
        <TransactionModal 
          txToEdit={txToEdit}
          onClose={() => setTxToEdit(null)}
          onSuccess={() => { fetchTransactions(); reloadData(); setTxToEdit(null); }}
          fixedPortfolioId={portfolio.id}
        />
      )}
    </div>
  );
};

export default Ledger;

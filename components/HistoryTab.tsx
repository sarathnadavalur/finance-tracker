
import React from 'react';
import { useApp } from '../App';
import { ChevronLeft, History, Calendar, Tag, DollarSign, Trash2 } from 'lucide-react';
import { db } from '../db';

const HistoryTab: React.FC = () => {
  const { snapshots, setSnapshots, setActiveTab } = useApp();

  const handleDelete = async (id: string) => {
    try {
      if (navigator.vibrate) navigator.vibrate([30, 30]);
      await db.deleteSnapshot(id);
      const updated = await db.getAllSnapshots();
      setSnapshots(updated);
    } catch (err) {
      console.error("Failed to delete snapshot:", err);
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="w-full flex flex-col min-h-screen bg-slate-50 dark:bg-[#020617] animate-in slide-in-from-right duration-300 mesh-bg-ios">
      <header className="px-6 py-8 liquid-glass flex items-center gap-4 sticky top-0 z-10 shrink-0">
        <button 
          onClick={() => setActiveTab('dashboard')} 
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft size={24} className="text-slate-900 dark:text-white" />
        </button>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">Snapshot History</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Historical CAD Values</p>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-y-auto no-scrollbar">
        {snapshots.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-20 opacity-30">
            <History size={48} className="mb-4" />
            <p className="font-bold text-sm">No snapshots saved yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {snapshots.sort((a, b) => b.date - a.date).map((s) => (
              <div key={s.id} className="liquid-glass-refractive rounded-[2rem] overflow-hidden shadow-sm">
                <div className="bg-white/10 dark:bg-white/5 px-6 py-4 flex items-center justify-between border-b border-white/10 dark:border-white/5">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <Calendar size={14} className="text-blue-500" />
                    <span className="text-xs font-black uppercase tracking-widest">{formatDate(s.date)}</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(s.id);
                    }}
                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors relative z-20 cursor-pointer active:scale-90"
                    title="Delete Snapshot"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="p-6 grid grid-cols-1 gap-4">
                  <HistoryItem label="Investments" value={s.investments} />
                  <HistoryItem label="Savings" value={s.savings} />
                  <HistoryItem label="Total Debt" value={s.debt} />
                  <HistoryItem label="Total EMIs" value={s.emiTotal} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const HistoryItem: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex items-center justify-between border-b border-slate-50 dark:border-white/5 pb-3 last:border-0 last:pb-0">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
        <Tag size={14} />
      </div>
      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
    <div className="flex items-center gap-1 text-slate-900 dark:text-white">
      <span className="text-[10px] font-black text-slate-400">CAD</span>
      <span className="text-lg font-black tabular-nums">
        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(value)}
      </span>
    </div>
  </div>
);

export default HistoryTab;

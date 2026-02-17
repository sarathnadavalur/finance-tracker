
import React, { useState } from 'react';
import { Plus, Wallet, Target, Sparkles } from 'lucide-react';
import { useApp } from '../App';
import { Portfolio, PortfolioType, Goal } from '../types';
import PortfolioCard from './PortfolioCard';
import PortfolioForm from './PortfolioForm';
import GoalCard from './GoalCard';
import GoalForm from './GoalForm';
import GoalDetails from './GoalDetails';

const Portfolios: React.FC = () => {
  const { portfolios, goals } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'accounts' | 'goals'>('accounts');
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedGoalDetails, setSelectedGoalDetails] = useState<Goal | null>(null);

  const segments = [
    PortfolioType.SAVINGS,
    PortfolioType.INVESTMENTS,
    PortfolioType.DEBTS,
    PortfolioType.EMIS
  ];

  const handleEditPortfolio = (p: Portfolio) => {
    setEditingPortfolio(p);
    setIsPortfolioModalOpen(true);
  };

  const handleEditGoal = (g: Goal) => {
    setEditingGoal(g);
    setIsGoalModalOpen(true);
  };

  return (
    <div className="space-y-6 md:space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Assets</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Precision vault management</p>
        </div>
        
        {/* Switcher */}
        <div className="flex p(1) bg-white/40 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-2xl shadow-sm self-start">
          <button 
            onClick={() => setActiveSubTab('accounts')}
            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeSubTab === 'accounts' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400'}`}
          >
            <Wallet size={12} />
            Accounts
          </button>
          <button 
            onClick={() => setActiveSubTab('goals')}
            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeSubTab === 'goals' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400'}`}
          >
            <Target size={12} />
            Goals
          </button>
        </div>
      </div>

      {activeSubTab === 'accounts' ? (
        <div className="space-y-10">
          {segments.map(type => {
            const filtered = portfolios.filter(p => p.type === type);
            if (filtered.length === 0) return null;

            return (
              <section key={type} className="animate-in fade-in slide-in-from-left-2 duration-500">
                <div className="flex items-center gap-3 mb-6 px-1">
                  <h2 className="text-[11px] font-black tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase">{type}</h2>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800 opacity-50"></div>
                  <span className="text-[9px] font-black text-blue-500 px-2.5 py-1 bg-blue-500/5 rounded-full border border-blue-500/10">{filtered.length} Items</span>
                </div>
                
                <div className="flex flex-col gap-3">
                  {filtered.map(portfolio => (
                    <PortfolioCard 
                      key={portfolio.id} 
                      portfolio={portfolio} 
                      onEdit={() => handleEditPortfolio(portfolio)}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          {portfolios.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
              <Wallet size={48} className="mb-4 text-slate-300" />
              <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Empty Vault</p>
            </div>
          )}
        </div>
      ) : (
        <div className="animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map(goal => (
              <GoalCard 
                key={goal.id} 
                goal={goal} 
                onEdit={() => handleEditGoal(goal)} 
                onViewDetails={() => setSelectedGoalDetails(goal)}
              />
            ))}
          </div>

          {goals.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 bg-white/40 dark:bg-slate-900/40 rounded-[3rem] border border-dashed border-slate-200 dark:border-white/5">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6">
                <Sparkles size={32} />
              </div>
              <h3 className="text-xl font-black mb-2">Aim for Greatness</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs text-center leading-relaxed font-medium">Create your first financial milestone. Track progress across multiple accounts automatically.</p>
              <button 
                onClick={() => setIsGoalModalOpen(true)}
                className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-premium active:scale-95 transition-all"
              >
                Launch New Goal
              </button>
            </div>
          )}
        </div>
      )}

      {/* Fab Button */}
      <button 
        onClick={() => activeSubTab === 'accounts' ? setIsPortfolioModalOpen(true) : setIsGoalModalOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-full shadow-glow flex items-center justify-center active:scale-90 transition-transform z-50 border-4 border-white dark:border-slate-900"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {isPortfolioModalOpen && (
        <PortfolioForm 
          onClose={() => { setIsPortfolioModalOpen(false); setEditingPortfolio(null); }} 
          editingPortfolio={editingPortfolio || undefined}
        />
      )}

      {isGoalModalOpen && (
        <GoalForm 
          onClose={() => { setIsGoalModalOpen(false); setEditingGoal(null); }} 
          editingGoal={editingGoal || undefined}
        />
      )}

      {selectedGoalDetails && (
        <GoalDetails 
          goal={selectedGoalDetails} 
          onClose={() => setSelectedGoalDetails(null)} 
        />
      )}
    </div>
  );
};

export default Portfolios;

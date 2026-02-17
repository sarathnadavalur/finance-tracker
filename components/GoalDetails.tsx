
import React, { useMemo } from 'react';
import { ChevronLeft, Target, Trophy, Calendar, Briefcase, PiggyBank, ArrowRight, ShieldCheck, Sparkles, AlertCircle, TrendingUp } from 'lucide-react';
import { Goal, Currency, Portfolio, PortfolioType } from '../types';
import { useApp } from '../App';

interface GoalDetailsProps {
  goal: Goal;
  onClose: () => void;
}

const GoalDetails: React.FC<GoalDetailsProps> = ({ goal, onClose }) => {
  const { portfolios, rates, settings } = useApp();

  const linkedPortfolios = useMemo(() => {
    return goal.portfolioIds
      .map(id => portfolios.find(p => p.id === id))
      .filter((p): p is Portfolio => p !== undefined);
  }, [goal.portfolioIds, portfolios]);

  const currentTotal = useMemo(() => {
    return linkedPortfolios.reduce((sum, p) => {
      const valInGoalCurr = p.currency === goal.currency 
        ? p.value 
        : p.value * rates[p.currency][goal.currency];
      return sum + valInGoalCurr;
    }, 0);
  }, [linkedPortfolios, goal.currency, rates]);

  const percentage = Math.min(100, Math.max(0, (currentTotal / goal.targetAmount) * 100));
  const remaining = Math.max(0, goal.targetAmount - currentTotal);

  const formatValue = (val: number, currencyCode: string = goal.currency) => {
    const f = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0
    }).format(val);
    return settings.privacyMode ? '••••' : f;
  };

  // SVG Progress Circle Math
  const radius = 42; // Adjusted for better visual balance around text
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-[#020617] flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
      {/* Header */}
      <header className="px-6 py-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose} 
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 active:scale-90 transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">Milestone Insight</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Goal Strategy View</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600">
           <ShieldCheck size={20} />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
        
        {/* Progress Hero */}
        <div className="relative glass p-10 rounded-[3rem] shadow-premium flex flex-col items-center justify-center overflow-hidden border border-white/40 dark:border-white/5">
          <div className={`absolute top-0 right-0 w-40 h-40 blur-[100px] opacity-20 pointer-events-none ${goal.color}`}></div>
          
          <div className="relative w-56 h-56 flex items-center justify-center">
             <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r={radius}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-slate-100 dark:text-slate-800 opacity-50"
                />
                <circle
                  cx="50" cy="50" r={radius}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="7"
                  strokeDasharray={circumference}
                  strokeLinecap="round"
                  style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                  className={`${percentage >= 100 ? 'text-emerald-500' : 'text-blue-600'} drop-shadow-glow`}
                />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums leading-none">
                  {percentage.toFixed(0)}
                </span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 opacity-60">% Complete</span>
             </div>
          </div>

          <div className="mt-8 text-center space-y-1">
            <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{goal.name}</h3>
            {goal.deadline && (
              <div className="flex items-center justify-center gap-2 text-slate-400">
                <Calendar size={12} />
                <span className="text-[10px] font-black uppercase tracking-widest">Target: {new Date(goal.deadline).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="grid grid-cols-2 gap-4">
           <div className="glass p-6 rounded-[2rem] border border-white/40 dark:border-white/5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 opacity-60">Currently Held</span>
              <p className={`text-2xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums ${settings.privacyMode ? 'blur-md' : ''}`}>
                {formatValue(currentTotal)}
              </p>
           </div>
           <div className="glass p-6 rounded-[2rem] border border-white/40 dark:border-white/5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 opacity-60">Remaining Gap</span>
              <p className={`text-2xl font-black text-blue-600 tracking-tighter tabular-nums ${settings.privacyMode ? 'blur-md' : ''}`}>
                {percentage >= 100 ? '0' : formatValue(remaining)}
              </p>
           </div>
        </div>

        {/* Linked Accounts List */}
        <div className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Contributing Vaults</h4>
              <span className="text-[9px] font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full">{linkedPortfolios.length} Accounts</span>
           </div>
           
           <div className="space-y-2">
              {linkedPortfolios.map(p => {
                const valInGoalCurr = p.currency === goal.currency 
                  ? p.value 
                  : p.value * rates[p.currency][goal.currency];
                
                return (
                  <div key={p.id} className="glass py-4 px-5 rounded-[1.8rem] flex items-center justify-between border border-white/40 dark:border-white/5 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${p.type === PortfolioType.SAVINGS ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        {p.type === PortfolioType.SAVINGS ? <PiggyBank size={18} /> : <Briefcase size={18} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-black text-slate-900 dark:text-white leading-none">{p.name}</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-60">{p.currency} Asset</span>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className={`text-[15px] font-black text-slate-900 dark:text-white tabular-nums leading-none ${settings.privacyMode ? 'blur-sm' : ''}`}>
                         {formatValue(valInGoalCurr)}
                       </p>
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-40">Allocated</p>
                    </div>
                  </div>
                );
              })}

              {linkedPortfolios.length === 0 && (
                <div className="py-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] opacity-40">
                  <AlertCircle size={24} className="mx-auto mb-3 text-slate-400" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No accounts linked</p>
                </div>
              )}
            </div>
        </div>

        {/* AI Projection Tip */}
        <div className="bg-slate-950 p-6 rounded-[2.5rem] border border-white/5 flex gap-4 items-start shadow-xl">
           <div className="w-10 h-10 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-500 shrink-0">
              <Sparkles size={18} className="animate-pulse" />
           </div>
           <div className="space-y-1">
              <h5 className="text-[11px] font-black text-white uppercase tracking-widest">Trajectory insight</h5>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                {percentage >= 100 
                  ? "Congratulations! You have successfully reached your target. Consider reallocating these funds into a new milestone." 
                  : `At your current allocation, you are ${formatValue(remaining)} away from completing this milestone. Linked accounts are tracking live market rates.`}
              </p>
           </div>
        </div>

      </div>

      {/* Footer Action */}
      <footer className="p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-t border-slate-200 dark:border-white/5 shrink-0">
        <button 
          onClick={onClose}
          className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-5 rounded-[1.8rem] shadow-premium active:scale-95 transition-all text-sm uppercase tracking-widest"
        >
          Return to Vault
        </button>
      </footer>
    </div>
  );
};

export default GoalDetails;

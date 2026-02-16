import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Target, X, Edit3, Trash2, Trophy, MoreVertical, Calendar, ChevronRight } from 'lucide-react';
import { Goal, Currency } from '../types';
import { useApp } from '../App';

interface GoalCardProps {
  goal: Goal;
  onEdit: () => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit }) => {
  const { portfolios, rates, settings, deleteGoal } = useApp();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentTotal = useMemo(() => {
    let sum = 0;
    goal.portfolioIds.forEach(pid => {
      const p = portfolios.find(item => item.id === pid);
      if (p) {
        const valInGoalCurr = p.currency === goal.currency 
          ? p.value 
          : p.value * rates[p.currency][goal.currency];
        sum += valInGoalCurr;
      }
    });
    return sum;
  }, [goal, portfolios, rates]);

  const percentage = Math.min(100, Math.max(0, (currentTotal / goal.targetAmount) * 100));
  
  // SVG Progress Circle Math
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const getMilestoneStatus = () => {
    if (percentage >= 100) return { label: 'Goal Reached', icon: <Trophy size={14} />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    if (percentage >= 75) return { label: 'Nearly There', icon: <Target size={14} />, color: 'text-blue-500', bg: 'bg-blue-500/10' };
    if (percentage >= 50) return { label: 'Halfway Point', icon: <Target size={14} />, color: 'text-amber-500', bg: 'bg-amber-500/10' };
    return { label: 'In Progress', icon: <Calendar size={14} />, color: 'text-slate-500', bg: 'bg-slate-500/10' };
  };

  const status = getMilestoneStatus();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatValue = (val: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: goal.currency,
      maximumFractionDigits: 0
    }).format(val);
    return settings.privacyMode ? '••••' : formatted;
  };

  return (
    <div className={`relative glass rounded-[2.8rem] p-7 shadow-premium transition-all duration-500 group overflow-hidden tap-scale border border-white/40 dark:border-white/5 ${percentage >= 100 ? 'ring-2 ring-emerald-500/30' : ''}`}>
      {/* Background Decorative Gradient Highlight */}
      <div className={`absolute top-0 right-0 w-40 h-40 blur-[80px] opacity-20 pointer-events-none transition-all duration-700 ${goal.color}`}></div>
      
      <div className="flex justify-between items-start relative z-10 mb-8">
        <div className="flex gap-5">
          <div className="relative shrink-0 w-[100px] h-[100px] flex items-center justify-center">
             <svg className="w-full h-full transform -rotate-90 filter drop-shadow-sm">
                <circle
                  cx="50" cy="50" r={radius}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="9"
                  className="text-slate-100 dark:text-slate-800 opacity-50"
                />
                <circle
                  cx="50" cy="50" r={radius}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="9"
                  strokeDasharray={circumference}
                  style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                  className={`${percentage >= 100 ? 'text-emerald-500' : 'text-blue-600'} drop-shadow-glow`}
                />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums leading-none tracking-tighter">{percentage.toFixed(0)}</span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">%</span>
             </div>
          </div>
          
          <div className="flex flex-col justify-center">
             <h3 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors line-clamp-1 leading-tight">{goal.name}</h3>
             <div className={`flex items-center gap-2.5 px-4 py-1.5 rounded-full ${status.bg} border border-transparent group-hover:border-white/20 transition-all`}>
                <div className={`${status.color}`}>
                   {status.icon}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${status.color}`}>{status.label}</span>
             </div>
          </div>
        </div>

        <div ref={menuRef} className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-3 rounded-2xl bg-white/40 dark:bg-slate-800/40 text-slate-500 hover:text-slate-900 dark:hover:text-white active:scale-90 transition-all shadow-sm"
          >
            <MoreVertical size={20} />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-14 w-48 glass rounded-[2rem] shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-3 duration-300">
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(); setShowMenu(false); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/60 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200 font-black text-[11px] uppercase tracking-widest transition-all"
              >
                <Edit3 size={16} />
                Edit Milestone
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteGoal(goal.id); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-rose-500/10 text-rose-500 font-black text-[11px] uppercase tracking-widest transition-all"
              >
                <Trash2 size={16} />
                Purge Goal
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 mt-4 p-6 bg-white/40 dark:bg-slate-950/30 rounded-[2.2rem] border border-white/40 dark:border-white/5 shadow-inner-dark">
         <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5 opacity-60">Currently Saved</span>
            <span className={`text-[19px] font-black text-slate-900 dark:text-white tabular-nums tracking-tighter leading-tight ${settings.privacyMode ? 'blur-md' : ''}`}>
               {formatValue(currentTotal)}
            </span>
         </div>
         <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5 opacity-60">Target Goal</span>
            <span className={`text-[19px] font-black text-slate-400 tabular-nums tracking-tighter leading-tight ${settings.privacyMode ? 'blur-md opacity-40' : ''}`}>
               {formatValue(goal.targetAmount)}
            </span>
         </div>
      </div>

      <div className="mt-6 flex items-center justify-between px-2">
         <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-60">{goal.portfolioIds.length} Connected Accounts</span>
         <button className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:translate-x-1.5 transition-all">
            Full Details <ChevronRight size={14} />
         </button>
      </div>
    </div>
  );
};

export default GoalCard;
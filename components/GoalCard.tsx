
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
    if (percentage >= 100) return { label: 'Complete', icon: <Trophy size={12} />, color: 'text-emerald-500' };
    if (percentage >= 75) return { label: 'Nearly There', icon: <Target size={12} />, color: 'text-blue-500' };
    if (percentage >= 50) return { label: 'Halfway', icon: <Target size={12} />, color: 'text-amber-500' };
    return { label: 'In Progress', icon: <Calendar size={12} />, color: 'text-slate-400' };
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
    <div className={`relative bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-6 shadow-premium transition-all duration-300 group overflow-hidden ${percentage >= 100 ? 'ring-2 ring-emerald-500/20' : ''}`}>
      {/* Background Decorative Element */}
      <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 pointer-events-none ${goal.color}`}></div>
      
      <div className="flex justify-between items-start relative z-10 mb-6">
        <div className="flex gap-4">
          <div className="relative shrink-0 w-[90px] h-[90px] flex items-center justify-center">
             <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="45" cy="45" r={radius}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-100 dark:text-slate-800"
                />
                <circle
                  cx="45" cy="45" r={radius}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 1s ease-in-out' }}
                  className={`${percentage >= 100 ? 'text-emerald-500' : 'text-blue-500'}`}
                />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums leading-none">{percentage.toFixed(0)}</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">%</span>
             </div>
          </div>
          
          <div className="flex flex-col justify-center">
             <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white mb-1 group-hover:text-blue-500 transition-colors line-clamp-1">{goal.name}</h3>
             <div className="flex items-center gap-2">
                <div className={`p-1 rounded-lg ${status.color.replace('text-', 'bg-').replace('500', '500/10')}`}>
                   {status.icon}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest ${status.color}`}>{status.label}</span>
             </div>
          </div>
        </div>

        <div ref={menuRef} className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:bg-slate-100 dark:active:bg-slate-800 transition-all"
          >
            <MoreVertical size={18} />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-12 w-40 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-white/5 p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(); setShowMenu(false); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-600 dark:text-slate-300 font-bold text-xs"
              >
                <Edit3 size={14} />
                Edit Goal
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteGoal(goal.id); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500 font-bold text-xs"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5">
         <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Saved</span>
            <span className={`text-[15px] font-black text-slate-900 dark:text-white tabular-nums ${settings.privacyMode ? 'blur-sm' : ''}`}>
               {formatValue(currentTotal)}
            </span>
         </div>
         <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Target</span>
            <span className={`text-[15px] font-black text-slate-400 tabular-nums ${settings.privacyMode ? 'blur-sm' : ''}`}>
               {formatValue(goal.targetAmount)}
            </span>
         </div>
      </div>

      <div className="mt-4 flex items-center justify-between px-1">
         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{goal.portfolioIds.length} Linked Accounts</span>
         <button className="flex items-center gap-1 text-[9px] font-black text-blue-500 uppercase tracking-widest hover:translate-x-1 transition-transform">
            Details <ChevronRight size={10} />
         </button>
      </div>
    </div>
  );
};

export default GoalCard;

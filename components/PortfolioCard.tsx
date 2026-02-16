
import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Edit3, X, CreditCard, List, ArrowUpRight, PiggyBank, Briefcase, TrendingDown, Clock, Calendar, ChevronRight } from 'lucide-react';
import { Portfolio, PortfolioType, Currency } from '../types';
import { useApp } from '../App';
import Ledger from './Ledger';

interface PortfolioCardProps {
  portfolio: Portfolio;
  onEdit: () => void;
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({ portfolio, onEdit }) => {
  const { deletePortfolio, settings } = useApp();
  const [showMenu, setShowMenu] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const pressTimer = useRef<number | null>(null);
  
  const isEMI = portfolio.type === PortfolioType.EMIS;

  const getCategoryStyles = () => {
    switch(portfolio.type) {
      case PortfolioType.SAVINGS: 
        return { icon: <PiggyBank size={20} />, color: 'bg-emerald-500/10 text-emerald-500' };
      case PortfolioType.INVESTMENTS: 
        return { icon: <Briefcase size={20} />, color: 'bg-blue-500/10 text-blue-500' };
      case PortfolioType.DEBTS: 
        return { icon: <TrendingDown size={20} />, color: 'bg-rose-500/10 text-rose-500' };
      case PortfolioType.EMIS: 
        return { icon: <Clock size={20} />, color: 'bg-amber-500/10 text-amber-500' };
      default: 
        return { icon: <List size={20} />, color: 'bg-slate-500/10 text-slate-500' };
    }
  };

  const { icon, color } = getCategoryStyles();

  useEffect(() => {
    return () => {
      if (pressTimer.current) clearTimeout(pressTimer.current);
    };
  }, []);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (showMenu) return;
    setIsPressing(true);
    pressTimer.current = window.setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50);
      setShowMenu(true);
      setIsPressing(false);
    }, 600);
  };

  const handleEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    setIsPressing(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    deletePortfolio(portfolio.id);
    setShowMenu(false);
  };

  const handleCardClick = () => {
    if (!showMenu) {
      setShowLedger(true);
      if (navigator.vibrate) navigator.vibrate(5);
    }
  };

  const formatValue = (val: number, currency: Currency) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(val);

    return settings.privacyMode ? '••••' : formatted;
  };

  return (
    <>
      <div 
        onClick={handleCardClick}
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
        className={`relative glass p-4 md:p-5 rounded-[1.8rem] transition-all duration-300 select-none cursor-pointer flex items-center justify-between border border-white/40 dark:border-white/5 shadow-sm tap-scale group overflow-hidden
          ${isPressing ? 'brightness-90 scale-[0.98]' : ''}
        `}
      >
        {/* Context Menu Overlay */}
        {showMenu && (
          <div 
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="absolute inset-0 z-30 bg-black/90 backdrop-blur-3xl flex items-center justify-center gap-8 animate-in fade-in zoom-in duration-300 p-2"
          >
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); setShowMenu(false); }}
              className="flex flex-col items-center gap-2 text-white"
            >
              <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shadow-lg"><Edit3 size={20} /></div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Edit</span>
            </button>
            <button 
              onClick={handleDeleteClick}
              className="flex flex-col items-center gap-2 text-rose-400"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/20 flex items-center justify-center shadow-lg"><Trash2 size={20} /></div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Delete</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
              className="absolute top-4 right-6 p-2 text-white/40 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Left: Icon */}
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${color}`}>
            {icon}
          </div>

          {/* Middle: Name and Type */}
          <div className="flex flex-col min-w-0">
            <h3 className="text-[16px] font-black tracking-tight text-slate-900 dark:text-white leading-tight truncate">
              {portfolio.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-60">
                {portfolio.currency} • {portfolio.type}
              </span>
              {isEMI && (
                <div className="w-1 h-1 rounded-full bg-slate-300"></div>
              )}
              {isEMI && (
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">
                  {portfolio.paymentDate}th Bill
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Value */}
        <div className="flex flex-col items-end pl-4 shrink-0">
          <p className={`text-[19px] font-black tracking-tighter tabular-nums text-slate-900 dark:text-white leading-none transition-all duration-700 ${settings.privacyMode ? 'blur-md opacity-30' : ''}`}>
            {formatValue(portfolio.value, portfolio.currency)}
          </p>
          {isEMI && (
            <p className={`text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 transition-all ${settings.privacyMode ? 'blur-sm opacity-30' : ''}`}>
              EMI: {formatValue(portfolio.monthlyEmiAmount || 0, portfolio.currency)}
            </p>
          )}
          {!isEMI && (
            <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-60 transition-all -translate-x-1 group-hover:translate-x-0">
               <span className="text-[9px] font-black uppercase tracking-widest text-blue-500">Details</span>
               <ChevronRight size={10} className="text-blue-500" />
            </div>
          )}
        </div>
      </div>

      {showLedger && (
        <Ledger 
          portfolio={portfolio} 
          onClose={() => setShowLedger(false)} 
        />
      )}
    </>
  );
};

export default PortfolioCard;

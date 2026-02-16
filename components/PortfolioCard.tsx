
import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Calendar, Edit3, X, CreditCard, AlertCircle, List, ArrowUpRight, PiggyBank, Briefcase, TrendingDown, Clock } from 'lucide-react';
import { Portfolio, PortfolioType, Currency } from '../types';
import { TYPE_COLORS } from '../constants';
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
  const colorClass = TYPE_COLORS[portfolio.type];

  const getIcon = () => {
    switch(portfolio.type) {
      case PortfolioType.SAVINGS: return <PiggyBank size={14} />;
      case PortfolioType.INVESTMENTS: return <Briefcase size={14} />;
      case PortfolioType.DEBTS: return <TrendingDown size={14} />;
      case PortfolioType.EMIS: return <Clock size={14} />;
      default: return <List size={14} />;
    }
  };

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
    if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
  };

  const handleCardClick = () => {
    if (!showMenu) {
      setShowLedger(true);
      if (navigator.vibrate) navigator.vibrate(2);
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
        className={`relative overflow-hidden p-5 rounded-[2rem] text-white shadow-premium ${colorClass} transition-all duration-500 select-none cursor-pointer flex flex-col justify-between min-h-[145px] border border-white/10
          ${isPressing ? 'scale-[0.96] brightness-90 shadow-none' : 'hover:scale-[1.02] hover:shadow-xl'}
        `}
      >
        {showMenu && (
          <div 
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="absolute inset-0 z-30 bg-black/95 backdrop-blur-2xl flex items-center justify-center gap-6 animate-in fade-in zoom-in duration-300 p-2"
          >
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onEdit();
                    setShowMenu(false);
                  }}
                  className="flex flex-col items-center gap-2 text-white group"
                >
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-active:scale-90 transition-transform shadow-premium"><Edit3 size={20} /></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Edit</span>
                </button>
                <button 
                  onClick={handleDeleteClick}
                  className="flex flex-col items-center gap-2 text-rose-400 group"
                >
                  <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center group-active:scale-90 transition-transform shadow-premium"><Trash2 size={20} /></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Delete</span>
                </button>
            
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
              className="absolute top-4 right-5 p-2 text-white/40 hover:text-white active:scale-90"
            >
              <X size={20} />
            </button>
          </div>
        )}

        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white/15 to-transparent pointer-events-none"></div>
        
        <div className="relative z-10 h-full flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-1">
               <div className="flex items-center gap-2">
                 <div className="w-6 h-6 rounded-lg bg-black/10 flex items-center justify-center">
                    {getIcon()}
                 </div>
                 <h3 className="text-[15px] font-extrabold tracking-tight line-clamp-1 opacity-95">{portfolio.name}</h3>
               </div>
               <span className="text-[9px] font-black uppercase tracking-[0.1em] text-white/60 bg-black/20 px-2 py-0.5 rounded-lg border border-white/10">
                {portfolio.currency}
              </span>
            </div>
            
            {isEMI && (
              <div className="flex items-center gap-1.5 text-white/70 mt-1">
                <Clock size={10} strokeWidth={3} />
                <span className="text-[9px] font-black uppercase tracking-widest">{portfolio.emiStartDate}</span>
              </div>
            )}
          </div>

          <div className="mt-auto">
            <p className={`${isEMI ? 'text-xl' : 'text-2xl'} font-black tracking-tighter tabular-nums leading-none ${settings.privacyMode ? 'blur-md opacity-50' : ''}`}>
              {formatValue(portfolio.value, portfolio.currency)}
            </p>
            
            {isEMI ? (
              <div className="mt-4 flex items-center justify-between text-white/80 border-t border-white/15 pt-3">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Installment</span>
                  <span className={`text-[12px] font-black leading-none ${settings.privacyMode ? 'blur-sm' : ''}`}>
                    {formatValue(portfolio.monthlyEmiAmount || 0, portfolio.currency)}
                  </span>
                </div>
                <div className="p-2 bg-white/10 rounded-xl">
                  <CreditCard size={14} />
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">Ledger View</span>
                <ArrowUpRight size={14} className="opacity-50" />
              </div>
            )}
          </div>
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

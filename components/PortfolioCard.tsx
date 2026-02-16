import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Edit3, X, CreditCard, List, ArrowUpRight, PiggyBank, Briefcase, TrendingDown, Clock, Calendar } from 'lucide-react';
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
      case PortfolioType.SAVINGS: return <PiggyBank size={18} />;
      case PortfolioType.INVESTMENTS: return <Briefcase size={18} />;
      case PortfolioType.DEBTS: return <TrendingDown size={18} />;
      case PortfolioType.EMIS: return <Clock size={18} />;
      default: return <List size={18} />;
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
        className={`relative overflow-hidden p-5 rounded-[2.2rem] text-white shadow-premium ${colorClass} transition-all duration-500 select-none cursor-pointer flex flex-col justify-between min-h-[175px] border border-white/20 tap-scale
          ${isPressing ? 'brightness-90 saturate-150' : 'hover:scale-[1.01]'}
        `}
      >
        {/* Context Menu Overlay */}
        {showMenu && (
          <div 
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="absolute inset-0 z-30 bg-black/90 backdrop-blur-3xl flex items-center justify-center gap-6 animate-in fade-in zoom-in duration-200 p-2 rounded-[2.2rem]"
          >
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); setShowMenu(false); }}
              className="flex flex-col items-center gap-2 text-white"
            >
              <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shadow-lg"><Edit3 size={20} /></div>
              <span className="text-[10px] font-bold uppercase tracking-widest">Edit</span>
            </button>
            <button 
              onClick={handleDeleteClick}
              className="flex flex-col items-center gap-2 text-rose-400"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/20 flex items-center justify-center shadow-lg"><Trash2 size={20} /></div>
              <span className="text-[10px] font-bold uppercase tracking-widest">Delete</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
              className="absolute top-4 right-5 p-2 text-white/40 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        )}

        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white/20 via-transparent to-black/5 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col h-full">
          {/* Header row with Icon and Currency */}
          <div className="flex justify-between items-center mb-3">
            <div className="w-9 h-9 rounded-xl bg-black/20 flex items-center justify-center shrink-0 shadow-inner">
              {getIcon()}
            </div>
            <div className="bg-black/20 px-2.5 py-1 rounded-lg border border-white/10 shadow-sm shrink-0">
              <span className="text-[10px] font-black tracking-widest leading-none">{portfolio.currency}</span>
            </div>
          </div>

          {/* Name - Ensure no trimming, use wrap */}
          <h3 className="text-[16px] font-black tracking-tight leading-tight mb-2 break-words">
            {portfolio.name}
          </h3>

          {/* Value Area */}
          <div className="mt-auto">
            {isEMI && (
              <div className="flex items-center gap-1 text-white/60 mb-1">
                <Calendar size={10} strokeWidth={3} />
                <span className="text-[9px] font-bold uppercase tracking-widest">Start: {portfolio.emiStartDate}</span>
              </div>
            )}
            
            <p className={`${isEMI ? 'text-[22px]' : 'text-[26px]'} font-black tracking-tighter tabular-nums leading-none drop-shadow-md transition-all duration-700 ${settings.privacyMode ? 'blur-md opacity-40' : ''}`}>
              {formatValue(portfolio.value, portfolio.currency)}
            </p>

            {/* Footer with Minimal EMI Value or simply an icon */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
              <div className="flex flex-col min-w-0">
                {isEMI && (
                  <span className={`text-[14px] font-black leading-none ${settings.privacyMode ? 'blur-sm' : ''}`}>
                    {formatValue(portfolio.monthlyEmiAmount || 0, portfolio.currency)}
                  </span>
                )}
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shadow-inner shrink-0">
                {isEMI ? <CreditCard size={16} /> : <ArrowUpRight size={16} className="opacity-80" />}
              </div>
            </div>
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
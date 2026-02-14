
import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Calendar, Edit3, X, CreditCard, AlertCircle } from 'lucide-react';
import { Portfolio, PortfolioType, Currency } from '../types';
import { TYPE_COLORS } from '../constants';
import { useApp } from '../App';

interface PortfolioCardProps {
  portfolio: Portfolio;
  onEdit: () => void;
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({ portfolio, onEdit }) => {
  const { deletePortfolio } = useApp();
  const [showMenu, setShowMenu] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const pressTimer = useRef<number | null>(null);
  
  const isEMI = portfolio.type === PortfolioType.EMIS;
  const colorClass = TYPE_COLORS[portfolio.type];

  // Clean up timer on unmount
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
      setIsConfirmingDelete(false);
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
    if (isConfirmingDelete) {
      deletePortfolio(portfolio.id);
      setShowMenu(false);
      setIsConfirmingDelete(false);
    } else {
      setIsConfirmingDelete(true);
    }
  };

  const formatValue = (val: number, currency: Currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div 
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      className={`relative overflow-hidden p-4 rounded-[1.5rem] text-white shadow-lg ${colorClass} transition-all duration-300 select-none cursor-pointer flex flex-col justify-between min-h-[140px]
        ${isPressing ? 'scale-95 brightness-90' : 'hover:scale-[1.02]'}
      `}
    >
      {/* Contextual Action Menu Overlay */}
      {showMenu && (
        <div 
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          className="absolute inset-0 z-20 bg-black/85 backdrop-blur-xl flex items-center justify-center gap-4 animate-in fade-in zoom-in duration-200 p-2"
        >
          {!isConfirmingDelete ? (
            <>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onEdit();
                  setShowMenu(false);
                }}
                className="flex flex-col items-center gap-1.5 text-white group"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-active:scale-90 transition-transform"><Edit3 size={20} /></div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Edit</span>
              </button>
              <button 
                onClick={handleDeleteClick}
                className="flex flex-col items-center gap-1.5 text-rose-400 group"
              >
                <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center group-active:scale-90 transition-transform"><Trash2 size={20} /></div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Delete</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 w-full px-4 animate-in slide-in-from-bottom-2 duration-300">
              <AlertCircle className="text-rose-500 mb-1" size={32} />
              <p className="text-xs font-bold text-center text-white/90">Permanently delete this item?</p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsConfirmingDelete(false); }}
                  className="flex-1 py-3 rounded-xl bg-white/10 text-[10px] font-black uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteClick}
                  className="flex-1 py-3 rounded-xl bg-rose-600 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-900/40"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
          
          <button 
            onClick={(e) => { e.stopPropagation(); setShowMenu(false); setIsConfirmingDelete(false); }}
            className="absolute top-3 right-3 p-1.5 text-white/40 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Glossy Overlay */}
      <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
      
      <div className="relative z-10 h-full flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
             <h3 className="text-base font-bold tracking-tight line-clamp-1 opacity-90">{portfolio.name}</h3>
             <span className="text-[9px] font-black uppercase tracking-tighter text-white/50 bg-black/10 px-1.5 py-0.5 rounded">
              {portfolio.currency}
            </span>
          </div>
          
          {isEMI && (
            <div className="mt-2 flex items-center gap-1.5 text-white/70">
              <Calendar size={12} />
              <span className="text-[10px] font-semibold">{portfolio.emiStartDate}</span>
            </div>
          )}
        </div>

        <div className="mt-auto">
          <p className={`${isEMI ? 'text-xl' : 'text-2xl'} font-black tracking-tighter tabular-nums`}>
            {formatValue(portfolio.value, portfolio.currency)}
          </p>
          
          {isEMI && (
            <div className="mt-2 flex items-center gap-1.5 text-white/80 border-t border-white/10 pt-2">
              <CreditCard size={12} />
              <div className="flex flex-col">
                <span className="text-[8px] font-bold uppercase opacity-60">Monthly Pay</span>
                <span className="text-[11px] font-bold leading-none">
                  {formatValue(portfolio.monthlyEmiAmount || 0, portfolio.currency)}
                </span>
              </div>
            </div>
          )}
          
          {!isEMI && (
            <div className="mt-1">
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Balance</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioCard;

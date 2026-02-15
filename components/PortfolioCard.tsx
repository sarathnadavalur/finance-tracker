
import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Calendar, Edit3, X, CreditCard, AlertCircle, List } from 'lucide-react';
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
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const pressTimer = useRef<number | null>(null);
  
  const isEMI = portfolio.type === PortfolioType.EMIS;
  const colorClass = TYPE_COLORS[portfolio.type];

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

  const handleCardClick = () => {
    if (!showMenu) {
      setShowLedger(true);
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
        className={`relative overflow-hidden p-3.5 rounded-2xl text-white shadow-md ${colorClass} transition-all duration-300 select-none cursor-pointer flex flex-col justify-between min-h-[120px]
          ${isPressing ? 'scale-95 brightness-90' : 'hover:scale-[1.01]'}
        `}
      >
        {showMenu && (
          <div 
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="absolute inset-0 z-20 bg-black/85 backdrop-blur-xl flex items-center justify-center gap-3 animate-in fade-in zoom-in duration-200 p-2"
          >
            {!isConfirmingDelete ? (
              <>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onEdit();
                    setShowMenu(false);
                  }}
                  className="flex flex-col items-center gap-1 text-white group"
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-active:scale-90 transition-transform"><Edit3 size={18} /></div>
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Edit</span>
                </button>
                <button 
                  onClick={handleDeleteClick}
                  className="flex flex-col items-center gap-1 text-rose-400 group"
                >
                  <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center group-active:scale-90 transition-transform"><Trash2 size={18} /></div>
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Delete</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 w-full px-3 animate-in slide-in-from-bottom-1 duration-300">
                <AlertCircle className="text-rose-500" size={24} />
                <p className="text-[10px] font-bold text-center text-white/90">Wipe this item?</p>
                <div className="flex gap-2 w-full">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsConfirmingDelete(false); }}
                    className="flex-1 py-2 rounded-lg bg-white/10 text-[9px] font-black uppercase tracking-widest"
                  >
                    No
                  </button>
                  <button 
                    onClick={handleDeleteClick}
                    className="flex-1 py-2 rounded-lg bg-rose-600 text-[9px] font-black uppercase tracking-widest"
                  >
                    Yes
                  </button>
                </div>
              </div>
            )}
            
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMenu(false); setIsConfirmingDelete(false); }}
              className="absolute top-2 right-2 p-1 text-white/40 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
        
        <div className="relative z-10 h-full flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
               <h3 className="text-sm font-bold tracking-tight line-clamp-1 opacity-90">{portfolio.name}</h3>
               <span className="text-[8px] font-black uppercase tracking-tighter text-white/50 bg-black/10 px-1.5 py-0.5 rounded">
                {portfolio.currency}
              </span>
            </div>
            
            {isEMI && (
              <div className="mt-1 flex items-center gap-1 text-white/60">
                <Calendar size={10} />
                <span className="text-[9px] font-semibold">{portfolio.emiStartDate}</span>
              </div>
            )}
          </div>

          <div className="mt-auto">
            <p className={`${isEMI ? 'text-lg' : 'text-xl'} font-black tracking-tighter tabular-nums ${settings.privacyMode ? 'blur-[2px]' : ''}`}>
              {formatValue(portfolio.value, portfolio.currency)}
            </p>
            
            {isEMI && (
              <div className="mt-1.5 flex items-center gap-1 text-white/70 border-t border-white/10 pt-1.5">
                <CreditCard size={10} />
                <div className="flex flex-col">
                  <span className="text-[7px] font-bold uppercase opacity-60">Monthly</span>
                  <span className={`text-[10px] font-bold leading-none ${settings.privacyMode ? 'blur-[1px]' : ''}`}>
                    {formatValue(portfolio.monthlyEmiAmount || 0, portfolio.currency)}
                  </span>
                </div>
              </div>
            )}
            
            {!isEMI && (
              <div className="mt-0.5 flex items-center justify-between">
                <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">Value</span>
                <List size={10} className="opacity-40" />
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

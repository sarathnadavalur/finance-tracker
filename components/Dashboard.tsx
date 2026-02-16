
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useApp } from '../App';
import { Currency, PortfolioType, Portfolio } from '../types';
import { Info, ChevronDown, Zap, Plus, Receipt, TrendingUp, TrendingDown, ArrowUpRight, RefreshCcw, Clock, Activity, Sparkles, BrainCircuit, ShieldAlert, CheckCircle2, Loader2, X, AlertCircle } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const Dashboard: React.FC = () => {
  const { portfolios, baseCurrency, setBaseCurrency, rates, settings, setIsPortfolioModalOpen, setIsTxModalOpen, lastUpdated, isSyncing, vantageScore, vantageAdvice, refreshVantageScore } = useApp();
  
  // Local UI State for Modal
  const [showAdvicePopup, setShowAdvicePopup] = useState(false);

  const calculateRemainingEMI = (p: Portfolio) => {
    if (p.type !== PortfolioType.EMIS || !p.totalEmiValue || !p.monthlyEmiAmount || !p.emiStartDate) {
      return p.value;
    }
    const total = p.totalEmiValue;
    const monthly = p.monthlyEmiAmount;
    const [y, m, d] = p.emiStartDate.split('-').map(Number);
    if (!y || !m || !d) return p.value;
    const pDay = parseInt(p.paymentDate || '1') || 1;
    let firstPaymentDate;
    if (pDay >= d) firstPaymentDate = new Date(y, m - 1, pDay);
    else firstPaymentDate = new Date(y, m, pDay);
    const today = new Date();
    const todayStripped = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const firstStripped = new Date(firstPaymentDate.getFullYear(), firstPaymentDate.getMonth(), firstPaymentDate.getDate());
    let paymentsMade = 0;
    if (todayStripped >= firstStripped) {
      const diffMonths = (todayStripped.getFullYear() - firstStripped.getFullYear()) * 12 + (todayStripped.getMonth() - firstStripped.getMonth());
      paymentsMade = todayStripped.getDate() >= pDay ? diffMonths + 1 : diffMonths;
    }
    return Math.max(0, total - (paymentsMade * monthly));
  };

  const totals = useMemo(() => {
    let savings = 0, investments = 0, debt = 0, emiTotal = 0;
    portfolios.forEach(p => {
      const liveValue = p.type === PortfolioType.EMIS ? calculateRemainingEMI(p) : p.value;
      const valInBase = p.currency === baseCurrency ? liveValue : liveValue * rates[p.currency][baseCurrency];
      switch(p.type) {
        case PortfolioType.SAVINGS: savings += valInBase; break;
        case PortfolioType.INVESTMENTS: investments += valInBase; break;
        case PortfolioType.DEBTS: debt += valInBase; break;
        case PortfolioType.EMIS: emiTotal += valInBase; break;
      }
    });
    const totalAssets = (investments + savings) || 1;
    return {
      savings, investments, debt, emiTotal,
      netValue: investments + savings - debt - emiTotal,
      investmentsPercentage: ((investments / totalAssets) * 100).toFixed(0) + '%',
      savingsPercentage: ((savings / totalAssets) * 100).toFixed(0) + '%'
    };
  }, [portfolios, baseCurrency, rates]);

  const formatCurrency = (val: number) => {
    const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: baseCurrency, maximumFractionDigits: 0 }).format(val);
    return settings.privacyMode ? '••••••' : formatted;
  };

  const otherCurrencies = Object.values(Currency).filter(c => c !== baseCurrency);
  const formattedLastUpdated = lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Progress Gauge Helpers
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const scoreOffset = circumference - ((vantageScore || 0) / 100) * circumference;

  const getScoreColor = (score: number) => {
    if (score > 80) return 'text-blue-500';
    if (score > 60) return 'text-emerald-500';
    if (score > 40) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <div className="w-full space-y-8 flex flex-col items-stretch pb-10">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between px-1">
          <div className="flex flex-col">
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight">Overview</h1>
          </div>
          <div className="flex items-center gap-2 glass px-5 py-2.5 rounded-2xl border-white/40 shadow-sm tap-scale cursor-pointer">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Unit</span>
            <select 
              value={baseCurrency} 
              onChange={(e) => setBaseCurrency(e.target.value as Currency)} 
              className="appearance-none bg-transparent border-none font-black text-slate-900 dark:text-white text-xs focus:outline-none cursor-pointer"
            >
              <option value={Currency.CAD}>CAD</option>
              <option value={Currency.INR}>INR</option>
              <option value={Currency.USD}>USD</option>
            </select>
          </div>
        </div>

        {/* AI Vantage Score Gauge - Centered & Refined */}
        <div className="relative group overflow-hidden rounded-[2.8rem] bg-slate-950 p-6 shadow-2xl transition-all duration-500 hover:shadow-glow/20 border border-white/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] pointer-events-none"></div>
          
          <div className="flex items-center gap-6 relative z-10">
            {/* The Animated Gauge */}
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
               <div className="absolute inset-0 rounded-full bg-blue-500/5 blur-xl pointer-events-none"></div>
               
               <svg viewBox="0 0 112 112" className="w-full h-full transform -rotate-90 relative z-10 block">
                 <circle
                   cx="56" cy="56" r={radius}
                   fill="transparent"
                   stroke="rgba(255,255,255,0.05)"
                   strokeWidth="8"
                 />
                 <circle
                   cx="56" cy="56" r={radius}
                   fill="transparent"
                   stroke="currentColor"
                   strokeWidth="8"
                   strokeDasharray={circumference}
                   style={{ 
                     strokeDashoffset: isSyncing ? circumference : scoreOffset,
                     transition: 'stroke-dashoffset 2s cubic-bezier(0.34, 1.56, 0.64, 1)' 
                   }}
                   className={`${getScoreColor(vantageScore || 0)} drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]`}
                 />
               </svg>

               <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                 {isSyncing ? (
                   <Loader2 size={20} className="animate-spin text-blue-500" />
                 ) : (
                   <span className="text-[38px] font-black text-white tracking-tighter tabular-nums leading-none">
                     {vantageScore || '—'}
                   </span>
                 )}
               </div>
            </div>

            <div className="flex flex-col flex-1 gap-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-blue-400 animate-pulse" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">AI Vantage Pulse</span>
              </div>
              
              <div 
                onClick={() => !isSyncing && vantageAdvice && setShowAdvicePopup(true)}
                className="cursor-pointer active:opacity-70 transition-opacity"
              >
                <p className="text-[15px] font-bold text-white leading-snug pr-2 line-clamp-2">
                  {isSyncing ? "Recalculating your trajectory..." : vantageAdvice || "Analyzing your portfolio for fresh insights..."}
                </p>
                {vantageAdvice && !isSyncing && (
                  <span className="text-[9px] font-black text-blue-400/60 uppercase tracking-widest mt-1 block">Read Analysis • Tap to Expand</span>
                )}
              </div>

              {!isSyncing && (
                <button 
                  onClick={(e) => { e.stopPropagation(); refreshVantageScore(); }}
                  className="mt-1 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-400 transition-colors w-fit"
                >
                  <RefreshCcw size={10} />
                  Resync Health
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Real-time Ticker Bar */}
        <div className="w-full glass rounded-[2.5rem] p-5 flex flex-col gap-3 shadow-premium transition-all">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-tighter text-blue-600 dark:text-blue-400">High-Frequency Market Sync</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-inner-dark">
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{formattedLastUpdated}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-5 overflow-x-auto no-scrollbar py-1">
            {otherCurrencies.map(curr => {
              const currentRate = rates[baseCurrency][curr];
              return (
                <div key={curr} className="flex items-center gap-4 shrink-0 bg-white/60 dark:bg-slate-800/60 px-5 py-3 rounded-2xl border border-white/40 dark:border-white/5 shadow-sm tap-scale cursor-pointer">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{baseCurrency}/{curr}</span>
                  <span className={`text-[14px] font-black text-slate-900 dark:text-white tabular-nums tracking-tighter ${isSyncing ? 'opacity-40' : 'opacity-100'}`}>
                    {currentRate.toFixed(4)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* Net Worth Card */}
        <div className="relative overflow-hidden rounded-[3rem] py-12 px-10 md:py-16 md:px-14 text-white shadow-2xl mesh-bg group transition-all duration-700 hover:shadow-glow tap-scale cursor-pointer border-0.5 border-white/20">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/20 rounded-full blur-[120px] -mr-40 -mt-40 group-hover:scale-125 transition-transform duration-1000"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full blur-[100px] -ml-32 -mb-32 group-hover:scale-125 transition-transform duration-1000"></div>
          
          <div className="relative z-10 flex flex-col items-start gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
              <TrendingUp size={12} className="text-emerald-400" />
              <p className="text-white font-black tracking-[0.25em] uppercase text-[9px]">Net Asset Value</p>
            </div>
            <h2 className={`text-5xl md:text-7xl font-black tracking-tighter tabular-nums transition-all duration-700 drop-shadow-lg ${settings.privacyMode ? 'blur-xl opacity-30' : 'group-hover:translate-x-1'}`}>
              {formatCurrency(totals.netValue)}
            </h2>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-5">
          <button 
            onClick={() => setIsPortfolioModalOpen(true)}
            className="flex items-center justify-center gap-3 glossy-blue text-white p-6 rounded-[2.2rem] font-black text-[14px] uppercase tracking-[0.2em] shadow-glow active:scale-95 transition-all tap-scale shadow-inner-light"
          >
            <Plus size={22} strokeWidth={3} />
            <span>Add Asset</span>
          </button>
          <button 
            onClick={() => setIsTxModalOpen(true)}
            className="flex items-center justify-center gap-3 glass p-6 rounded-[2.2rem] font-black text-[14px] uppercase tracking-[0.2em] shadow-premium active:scale-95 transition-all tap-scale shadow-inner-light dark:shadow-inner-dark"
          >
            <Receipt size={22} className="text-blue-500" strokeWidth={2.5} />
            <span className="text-slate-900 dark:text-white">New Entry</span>
          </button>
        </div>
      </div>

      {/* Distribution Breakdown */}
      <div className="glass rounded-[3rem] p-10 shadow-premium">
        <div className="flex items-center justify-between mb-10">
          <div className="flex flex-col">
            <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">Distribution</h3>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 opacity-60">Asset Allocation</p>
          </div>
          <div className="w-12 h-12 bg-white/60 dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm">
            <TrendingUp size={22} className="text-blue-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <TableRows label="Investments" amount={totals.investments} percentage={totals.investmentsPercentage} color="bg-blue-500" currency={baseCurrency} isPrivate={settings.privacyMode} />
          <TableRows label="Savings" amount={totals.savings} percentage={totals.savingsPercentage} color="bg-emerald-500" currency={baseCurrency} isPrivate={settings.privacyMode} />
          <TableRows label="Liabilities" amount={totals.debt + totals.emiTotal} percentage="Owed" color="bg-rose-500" currency={baseCurrency} isPrivate={settings.privacyMode} />
        </div>
      </div>

      {/* AI Advice Popup Modal - Mobile Optimized */}
      {showAdvicePopup && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-2xl flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl animate-in slide-in-from-bottom duration-500 relative border border-white/10 max-h-[92dvh] overflow-hidden flex flex-col">
            
            <div className="p-8 pb-4 flex items-start justify-between shrink-0">
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600">
                    <Sparkles size={24} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Vantage Analysis</h3>
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-blue-500">AI Health Report</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowAdvicePopup(false)}
                className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 active:scale-90 transition-all shadow-sm"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="px-8 pb-8 overflow-y-auto no-scrollbar flex-1">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5 mb-8">
                <p className="text-[17px] font-normal text-slate-700 dark:text-slate-200 leading-relaxed">
                  {vantageAdvice}
                </p>
              </div>

              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/20 p-6 rounded-[2.2rem] border border-slate-100 dark:border-white/5">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-60">Calculated Score</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getScoreColor(vantageScore || 0)} shadow-glow`}></div>
                    <span className={`text-4xl font-black tracking-tighter tabular-nums ${getScoreColor(vantageScore || 0)}`}>
                      {vantageScore}%
                    </span>
                  </div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-inner-light">
                   <Activity size={24} className="text-slate-300" />
                </div>
              </div>
            </div>

            <div className="p-8 pt-4 border-t border-slate-50 dark:border-white/5 shrink-0">
              <button 
                onClick={() => setShowAdvicePopup(false)}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-black py-5 rounded-[1.8rem] active:scale-[0.98] transition-all text-xs uppercase tracking-widest"
              >
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TableRows: React.FC<{ label: string; amount: number; percentage: string; color: string; currency: string; isPrivate: boolean }> = ({ label, amount, percentage, color, currency, isPrivate }) => (
  <div className="group flex items-center justify-between py-6 px-4 rounded-[1.8rem] hover:bg-white/40 dark:hover:bg-slate-800/40 border border-transparent hover:border-white/40 transition-all tap-scale cursor-pointer">
    <div className="flex items-center gap-5">
      <div className={`w-3.5 h-3.5 rounded-full ${color} shadow-glow shadow-${color.split('-')[1]}-500/30 ring-4 ring-${color.split('-')[1]}-500/10`}></div>
      <div className="flex flex-col">
        <span className="font-black text-[17px] text-slate-900 dark:text-slate-100 leading-tight">{label}</span>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 opacity-60">{percentage}</span>
      </div>
    </div>
    <div className="flex flex-col items-end">
      <span className={`font-black tabular-nums text-[18px] text-slate-900 dark:text-white transition-all duration-700 ${isPrivate ? 'blur-md opacity-30' : ''}`}>
        {isPrivate ? '••••' : new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)}
      </span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all mt-1 translate-y-1 group-hover:translate-y-0">
        <span className="text-[10px] font-black uppercase text-blue-500 tracking-tighter">View Details</span>
        <ArrowUpRight size={12} className="text-blue-500" />
      </div>
    </div>
  </div>
);

export default Dashboard;


import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useApp } from '../App';
import { Currency, PortfolioType, Portfolio } from '../types';
import { Info, ChevronDown, Zap, Plus, Receipt, TrendingUp, TrendingDown, ArrowUpRight, RefreshCcw, Clock, Activity, Sparkles, BrainCircuit, ShieldAlert, CheckCircle2, Loader2, X, AlertCircle, ChevronRight, Brain } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const Dashboard: React.FC = () => {
  const { portfolios, baseCurrency, setBaseCurrency, rates, settings, setIsPortfolioModalOpen, setIsTxModalOpen, lastUpdated, isSyncing, vantageScore, vantageAdvice, refreshVantageScore } = useApp();
  
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

  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const scoreOffset = circumference - ((vantageScore || 0) / 100) * circumference;

  const getScoreColor = (score: number) => {
    if (score > 80) return 'text-blue-500';
    if (score > 60) return 'text-emerald-500';
    if (score > 40) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <div className="w-full space-y-6 flex flex-col items-stretch pb-10">
      
      {/* Header & Currency Switcher */}
      <div className="flex items-center justify-between px-1">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Overview</h1>
        <div className="flex items-center gap-1.5 glass px-4 py-2 rounded-xl border-white/40 shadow-sm tap-scale cursor-pointer">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Unit</span>
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

      {/* Hero Net Worth Card */}
      <div className="relative overflow-hidden rounded-[2.5rem] p-8 text-white shadow-xl mesh-bg group transition-all duration-700 hover:shadow-glow/20 border-0.5 border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 w-fit">
            <TrendingUp size={10} className="text-emerald-400" />
            <p className="text-white font-black tracking-[0.2em] uppercase text-[8px]">Net Asset Value</p>
          </div>
          <h2 className={`text-5xl font-black tracking-tighter tabular-nums transition-all duration-700 drop-shadow-md ${settings.privacyMode ? 'blur-xl opacity-30' : ''}`}>
            {formatCurrency(totals.netValue)}
          </h2>
        </div>
      </div>

      {/* AI Vantage Pulse - Refactored for manual first */}
      <div 
        className="relative group overflow-hidden rounded-[2.2rem] bg-slate-950 p-6 shadow-lg transition-all duration-500 border border-white/5"
      >
        <div className="flex items-center gap-6 relative z-10">
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
             <svg viewBox="0 0 80 80" className="w-full h-full transform -rotate-90 relative z-10 block">
               <circle cx="40" cy="40" r={radius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
               <circle
                 cx="40" cy="40" r={radius}
                 fill="transparent"
                 stroke="currentColor"
                 strokeWidth="6"
                 strokeDasharray={circumference}
                 style={{ 
                   strokeDashoffset: (isSyncing || vantageScore === null) ? circumference : scoreOffset,
                   transition: 'stroke-dashoffset 2s cubic-bezier(0.34, 1.56, 0.64, 1)' 
                 }}
                 className={`${vantageScore !== null ? getScoreColor(vantageScore) : 'text-slate-700'} drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]`}
               />
             </svg>
             <div className="absolute inset-0 z-20 flex items-center justify-center">
               {isSyncing ? (
                 <Loader2 size={16} className="animate-spin text-blue-500" />
               ) : vantageScore !== null ? (
                 <span className="text-[18px] font-black text-white tracking-tighter tabular-nums leading-none">
                   {vantageScore}
                 </span>
               ) : (
                 <Brain size={16} className="text-slate-600" />
               )}
             </div>
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles size={12} className="text-blue-400" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">AI Vantage Pulse</span>
            </div>
            
            {vantageScore !== null ? (
              <div 
                onClick={() => setShowAdvicePopup(true)}
                className="cursor-pointer group/text"
              >
                <p className="text-[14px] font-bold text-white leading-snug line-clamp-1 pr-4 group-hover/text:text-blue-400 transition-colors">
                  {vantageAdvice || "Trajectory verified."}
                </p>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1 inline-flex items-center gap-1">
                  Click for Deep Analysis <ChevronRight size={8} />
                </span>
              </div>
            ) : (
              <div>
                <p className="text-[14px] font-bold text-slate-400 leading-snug mb-3">
                  Get Vantage Insights on your portfolio
                </p>
                <button 
                  onClick={() => refreshVantageScore(true)}
                  disabled={isSyncing}
                  className="bg-blue-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSyncing ? <Loader2 size={10} className="animate-spin" /> : <Zap size={10} />}
                  Analyze Portfolio
                </button>
              </div>
            )}
          </div>
          
          {vantageScore !== null && !isSyncing && (
             <button 
                onClick={() => refreshVantageScore(true)}
                className="p-3 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all"
             >
               <RefreshCcw size={14} />
             </button>
          )}
        </div>
      </div>

      {/* Market Ticker */}
      <div className="w-full glass rounded-2xl p-4 flex items-center justify-between shadow-sm border-white/30">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar flex-1 mr-4">
          {otherCurrencies.map(curr => (
            <div key={curr} className="flex items-center gap-2 shrink-0 bg-slate-100/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-white/40 dark:border-white/5">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{baseCurrency}/{curr}</span>
              <span className={`text-[12px] font-black text-slate-900 dark:text-white tabular-nums`}>
                {rates[baseCurrency][curr].toFixed(4)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-lg shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">{formattedLastUpdated}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setIsPortfolioModalOpen(true)}
          className="flex items-center justify-center gap-2.5 glossy-blue text-white py-4 rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
        >
          <Plus size={18} strokeWidth={3} />
          <span>Add Asset</span>
        </button>
        <button 
          onClick={() => setIsTxModalOpen(true)}
          className="flex items-center justify-center gap-2.5 glass py-4 rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-sm active:scale-95 transition-all"
        >
          <Receipt size={18} className="text-blue-500" strokeWidth={2.5} />
          <span className="text-slate-900 dark:text-white">New Entry</span>
        </button>
      </div>

      {/* Distribution Section */}
      <div className="glass rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col">
            <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Distribution</h3>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 opacity-60">Allocation</p>
          </div>
          <TrendingUp size={20} className="text-blue-600 opacity-20" />
        </div>
        
        <div className="space-y-1">
          <DistributionRow label="Investments" amount={totals.investments} percentage={totals.investmentsPercentage} color="bg-blue-500" currency={baseCurrency} isPrivate={settings.privacyMode} />
          <DistributionRow label="Savings" amount={totals.savings} percentage={totals.savingsPercentage} color="bg-emerald-500" currency={baseCurrency} isPrivate={settings.privacyMode} />
          <DistributionRow label="Liabilities" amount={totals.debt + totals.emiTotal} percentage="Owed" color="bg-rose-500" currency={baseCurrency} isPrivate={settings.privacyMode} />
        </div>
      </div>

      {/* AI Advice Popup */}
      {showAdvicePopup && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-2xl flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl animate-in slide-in-from-bottom duration-500 relative border border-white/10 max-h-[92dvh] overflow-hidden flex flex-col">
            <div className="p-8 pb-4 flex items-start justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600">
                  <Sparkles size={24} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Vantage Analysis</h3>
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-blue-500">AI Health Report</p>
                </div>
              </div>
              <button onClick={() => setShowAdvicePopup(false)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500"><X size={24} /></button>
            </div>
            <div className="px-8 pb-8 overflow-y-auto no-scrollbar flex-1">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 mb-6">
                <p className="text-[16px] font-normal text-slate-700 dark:text-slate-200 leading-relaxed">{vantageAdvice}</p>
              </div>
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/20 p-6 rounded-2xl border border-slate-100 dark:border-white/5">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-60">Calculated Score</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getScoreColor(vantageScore || 0)} shadow-glow`}></div>
                    <span className={`text-4xl font-black tracking-tighter tabular-nums ${getScoreColor(vantageScore || 0)}`}>{vantageScore}%</span>
                  </div>
                </div>
                <Activity size={24} className="text-slate-300" />
              </div>
            </div>
            <div className="p-8 pt-4 border-t border-slate-50 dark:border-white/5">
              <button onClick={() => setShowAdvicePopup(false)} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest">Done Reading</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DistributionRow: React.FC<{ label: string; amount: number; percentage: string; color: string; currency: string; isPrivate: boolean }> = ({ label, amount, percentage, color, currency, isPrivate }) => (
  <div className="group flex items-center justify-between py-4 px-3 rounded-xl hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all cursor-pointer">
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`}></div>
      <div className="flex flex-col min-w-0">
        <span className="font-black text-[15px] text-slate-900 dark:text-slate-100 leading-none truncate">{label}</span>
        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-60">{percentage}</span>
      </div>
    </div>
    <div className="flex items-center gap-3 shrink-0">
      <span className={`font-black tabular-nums text-[16px] text-slate-900 dark:text-white transition-all duration-700 ${isPrivate ? 'blur-md opacity-30' : ''}`}>
        {isPrivate ? '••••' : new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)}
      </span>
      <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
    </div>
  </div>
);

export default Dashboard;

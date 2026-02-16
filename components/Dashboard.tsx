import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../App';
import { Currency, PortfolioType, Portfolio } from '../types';
import { Info, ChevronDown, Zap, Plus, Receipt, TrendingUp, TrendingDown, ArrowUpRight, RefreshCcw, Clock, Activity } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { portfolios, baseCurrency, setBaseCurrency, rates, settings, setIsPortfolioModalOpen, setIsTxModalOpen, lastUpdated, isSyncing } = useApp();
  
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

  return (
    <div className="w-full space-y-7 flex flex-col items-stretch pb-10">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between px-1">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight">Overview</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Financial Pulse</p>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900/50 px-4 py-2 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unit</span>
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

        {/* Real-time Ticker Bar */}
        <div className="w-full bg-white/40 dark:bg-slate-900/30 backdrop-blur-xl rounded-3xl border border-white/40 dark:border-white/5 p-4 flex flex-col gap-2 shadow-premium transition-all">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Activity size={12} className={`text-blue-500 ${isSyncing ? 'animate-bounce' : 'animate-pulse'}`} />
              <span className="text-[10px] font-black uppercase tracking-tighter text-blue-600 dark:text-blue-400">High-Frequency Market Sync</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{formattedLastUpdated}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-1">
            {otherCurrencies.map(curr => {
              const currentRate = rates[baseCurrency][curr];
              return (
                <div key={curr} className="flex items-center gap-3 shrink-0 bg-white/50 dark:bg-slate-800/50 px-4 py-2.5 rounded-2xl border border-slate-100 dark:border-white/5 transition-colors">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{baseCurrency}/{curr}</span>
                  <span className={`text-[13px] font-black text-slate-900 dark:text-white tabular-nums tracking-tighter ${isSyncing ? 'opacity-50' : 'opacity-100'}`}>
                    {currentRate.toFixed(4)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Net Worth Card - Premium Mesh Gradient */}
        <div className="relative overflow-hidden rounded-[3rem] py-10 px-8 md:py-14 md:px-12 text-white shadow-premium mesh-bg group transition-all duration-500 hover:shadow-glow">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/30 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/20 rounded-full blur-[80px] -ml-24 -mb-24 group-hover:scale-110 transition-transform duration-700"></div>
          
          <div className="relative z-10 flex flex-col items-start gap-2">
            <div className="flex items-center gap-2 opacity-60">
              <TrendingUp size={12} className="text-emerald-400" />
              <p className="text-slate-200 font-bold tracking-[0.2em] uppercase text-[10px] md:text-xs">Net Asset Value</p>
            </div>
            <h2 className={`text-4xl md:text-6xl font-black tracking-tighter tabular-nums transition-all duration-500 ${settings.privacyMode ? 'blur-md opacity-40' : 'group-hover:translate-x-1'}`}>
              {formatCurrency(totals.netValue)}
            </h2>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => setIsPortfolioModalOpen(true)}
            className="flex items-center justify-center gap-3 bg-gradient-to-br from-blue-500 to-blue-700 text-white p-5 rounded-[2rem] font-black text-[13px] uppercase tracking-[0.15em] shadow-premium shadow-blue-500/20 active:scale-95 transition-all hover:brightness-110"
          >
            <Plus size={18} strokeWidth={3} />
            <span>Add Asset</span>
          </button>
          <button 
            onClick={() => setIsTxModalOpen(true)}
            className="flex items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-5 rounded-[2rem] font-black text-[13px] uppercase tracking-[0.15em] shadow-premium active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Receipt size={18} className="text-blue-500" strokeWidth={2.5} />
            <span className="text-slate-900 dark:text-white">Transaction</span>
          </button>
        </div>
      </div>

      {/* Distribution Breakdown */}
      <div className="bg-white/60 dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-100 dark:border-white/5 p-8 shadow-premium backdrop-blur-md">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
            <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Distribution</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Portfolio Weights</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
            <TrendingUp size={16} className="text-blue-500" />
          </div>
        </div>
        
        <div className="space-y-1">
          <TableRows label="Investments" amount={totals.investments} percentage={totals.investmentsPercentage} color="bg-blue-500" currency={baseCurrency} isPrivate={settings.privacyMode} />
          <TableRows label="Savings" amount={totals.savings} percentage={totals.savingsPercentage} color="bg-emerald-500" currency={baseCurrency} isPrivate={settings.privacyMode} />
          <TableRows label="Liabilities" amount={totals.debt + totals.emiTotal} percentage="Owed" color="bg-rose-500" currency={baseCurrency} isPrivate={settings.privacyMode} />
        </div>
      </div>
    </div>
  );
};

const TableRows: React.FC<{ label: string; amount: number; percentage: string; color: string; currency: string; isPrivate: boolean }> = ({ label, amount, percentage, color, currency, isPrivate }) => (
  <div className="group flex items-center justify-between py-5 border-b border-slate-50 dark:border-white/5 last:border-0 transition-all hover:px-2">
    <div className="flex items-center gap-4">
      <div className={`w-3 h-3 rounded-full ${color} shadow-glow shadow-${color.split('-')[1]}-500/20`}></div>
      <div className="flex flex-col">
        <span className="font-extrabold text-[15px] text-slate-900 dark:text-slate-100">{label}</span>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{percentage}</span>
      </div>
    </div>
    <div className="flex flex-col items-end">
      <span className={`font-black tabular-nums text-[16px] text-slate-900 dark:text-white transition-all duration-500 ${isPrivate ? 'blur-md opacity-40' : ''}`}>
        {isPrivate ? '••••' : new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)}
      </span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowUpRight size={10} className="text-blue-500" />
        <span className="text-[9px] font-black uppercase text-blue-500 tracking-tighter">Details</span>
      </div>
    </div>
  </div>
);

export default Dashboard;
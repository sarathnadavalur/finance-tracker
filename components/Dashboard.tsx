import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../App';
import { Currency, PortfolioType, Portfolio } from '../types';
import { TrendingUp, Globe, Download, X, Info, ExternalLink } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { portfolios, baseCurrency, setBaseCurrency, rates, profile } = useApp();
  const [showInstallTip, setShowInstallTip] = useState(false);

  useEffect(() => {
    // Check if app is NOT already installed (standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isIframe = window.self !== window.top;

    if ((!isStandalone && isMobile) || isIframe) {
      setShowInstallTip(true);
    }
  }, []);

  const openCleanTab = () => {
    // Escape the editor iframe to allow clean PWA installation
    window.open(window.location.href, '_blank');
  };

  const currentRates = rates[baseCurrency];

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
    if (pDay >= d) {
      firstPaymentDate = new Date(y, m - 1, pDay);
    } else {
      firstPaymentDate = new Date(y, m, pDay);
    }
    
    const today = new Date();
    const todayStripped = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const firstStripped = new Date(firstPaymentDate.getFullYear(), firstPaymentDate.getMonth(), firstPaymentDate.getDate());

    let paymentsMade = 0;
    if (todayStripped >= firstStripped) {
      const diffMonths = (todayStripped.getFullYear() - firstStripped.getFullYear()) * 12 + (todayStripped.getMonth() - firstStripped.getMonth());
      if (todayStripped.getDate() >= pDay) {
        paymentsMade = diffMonths + 1;
      } else {
        paymentsMade = diffMonths;
      }
    }
    return Math.max(0, total - (paymentsMade * monthly));
  };

  const convertValue = (val: number, from: Currency) => {
    if (from === baseCurrency) return val;
    const rate = rates[from][baseCurrency];
    return val * rate;
  };

  // Fixed: Moved percentage calculation inside useMemo to resolve 'unknown' type inference in JSX
  const totals = useMemo(() => {
    let savings = 0;
    let investments = 0;
    let debt = 0;
    let emiTotal = 0;

    portfolios.forEach(p => {
      const liveValue = p.type === PortfolioType.EMIS ? calculateRemainingEMI(p) : p.value;
      const valInBase = convertValue(liveValue, p.currency);
      switch(p.type) {
        case PortfolioType.SAVINGS: savings += valInBase; break;
        case PortfolioType.INVESTMENTS: investments += valInBase; break;
        case PortfolioType.DEBTS: debt += valInBase; break;
        case PortfolioType.EMIS: emiTotal += valInBase; break;
      }
    });

    const totalAssets = investments + savings || 1;

    return {
      savings,
      investments,
      debt,
      emiTotal,
      netValue: investments + savings - debt - emiTotal,
      investmentsPercentage: ((investments / totalAssets) * 100).toFixed(0) + '%',
      savingsPercentage: ((savings / totalAssets) * 100).toFixed(0) + '%'
    };
  }, [portfolios, baseCurrency, rates]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: baseCurrency,
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6 md:space-y-8 overflow-x-hidden">
      {/* Installation Prompt */}
      {showInstallTip && (
        <div className="bg-blue-600 dark:bg-blue-500 rounded-3xl p-5 text-white shadow-xl shadow-blue-500/20 relative animate-in slide-in-from-top-10 duration-500">
          <button 
            onClick={() => setShowInstallTip(false)}
            className="absolute top-4 right-4 text-white/50 hover:text-white"
          >
            <X size={18} />
          </button>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Download size={24} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <p className="font-black text-[10px] uppercase tracking-widest opacity-80 mb-0.5">Native Experience Required</p>
              <p className="text-sm font-bold leading-snug">To install as a direct Android app, you must open the link in a fresh tab first.</p>
            </div>
            <button 
              onClick={openCleanTab}
              className="flex items-center gap-2 bg-white text-blue-600 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-transform w-full md:w-auto justify-center"
            >
              <ExternalLink size={14} />
              Open Direct App
            </button>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Welcome back, {profile.name}</p>
        </div>
        
        <div className="flex items-center justify-between md:justify-end gap-3 bg-white dark:bg-slate-900/50 p-2 md:p-0 rounded-2xl border md:border-none border-slate-100 dark:border-white/5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 md:px-0">Base Currency</label>
          <select 
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value as Currency)}
            className="bg-transparent md:bg-white md:dark:bg-slate-900 border-none md:border md:border-slate-200 md:dark:border-white/10 rounded-xl px-4 py-2 font-bold shadow-none md:shadow-sm focus:outline-none cursor-pointer text-slate-900 dark:text-white text-sm"
          >
            <option value={Currency.CAD}>CAD</option>
            <option value={Currency.INR}>INR</option>
            <option value={Currency.USD}>USD</option>
          </select>
        </div>
      </div>

      {/* FX Rates Ticker */}
      <div className="glass rounded-[2rem] p-5 md:p-6 w-full flex gap-6 md:gap-12 overflow-x-auto no-scrollbar relative group transition-all duration-300">
        {Object.entries(currentRates).map(([curr, rate]) => {
          if (curr === baseCurrency) return null;
          return (
            <div key={curr} className="flex flex-col min-w-[110px] md:min-w-[120px] animate-in slide-in-from-right-2 duration-300">
              <span className="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-widest whitespace-nowrap">1 {baseCurrency} =</span>
              <span className="text-xl md:text-2xl font-black tabular-nums tracking-tighter flex items-baseline gap-1.5 text-slate-900 dark:text-slate-100">
                {(rate as number).toFixed(4)} <span className="text-slate-400 dark:text-slate-500 text-[10px] md:text-xs font-bold uppercase">{curr}</span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-[2.5rem] md:rounded-[3rem] bg-[#0f172a] dark:bg-[#0f172a] p-6 md:p-14 text-white shadow-2xl transition-all duration-500 border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 md:w-80 md:h-80 bg-blue-600/20 rounded-full blur-[80px] md:blur-[100px] -mr-32 -mt-32 md:-mr-40 md:-mt-40 animate-float"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 md:w-64 md:h-64 bg-purple-600/20 rounded-full blur-[60px] md:blur-[80px] -ml-24 -mb-24 md:-ml-32 md:-mb-32"></div>
        
        <div className="relative z-10 flex flex-col items-start gap-1">
          <p className="text-slate-400 font-bold mb-1 md:mb-2 tracking-[0.1em] uppercase text-[10px] md:text-sm">
            Estimated Net Worth
          </p>
          <h2 className="text-4xl md:text-8xl font-black tracking-tight tabular-nums transition-all duration-300 break-words max-w-full">
            {formatCurrency(totals.netValue)}
          </h2>
          <div className="flex items-center gap-2 mt-4 md:mt-6 text-[#10b981] bg-[#10b981]/10 w-fit px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl text-[11px] md:text-sm font-bold border border-[#10b981]/20">
            <TrendingUp size={14} className="md:w-[18px] md:h-[18px]" />
            <span>Synced with Market</span>
          </div>
        </div>
      </div>

      {/* Asset Allocation Table */}
      <div className="bg-white dark:bg-slate-900/40 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 dark:border-white/5 p-5 md:p-10 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6 md:mb-10">
          <div>
            <h3 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">Asset Allocation</h3>
            <p className="text-xs md:text-sm text-slate-400 dark:text-slate-500 font-medium">Portfolio distribution</p>
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Info size={16} />
          </div>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-[0.15em]">
                <th className="pb-4 md:pb-6 px-2 md:px-4">Category</th>
                <th className="pb-4 md:pb-6 px-2 md:px-4 hidden sm:table-cell">Allocation</th>
                <th className="pb-4 md:pb-6 px-2 md:px-4 text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              <TableRows 
                label="Investments" 
                amount={totals.investments} 
                percentage={totals.investmentsPercentage} 
                color="bg-blue-500" 
                currency={baseCurrency} 
              />
              <TableRows 
                label="Savings" 
                amount={totals.savings} 
                percentage={totals.savingsPercentage} 
                color="bg-emerald-500" 
                currency={baseCurrency} 
              />
              <TableRows 
                label="Liabilities" 
                amount={totals.debt + totals.emiTotal} 
                percentage="N/A" 
                color="bg-rose-500" 
                currency={baseCurrency} 
              />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const TableRows: React.FC<{ label: string; amount: number; percentage: string; color: string; currency: string }> = ({ label, amount, percentage, color, currency }) => (
  <tr className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors duration-200">
    <td className="py-4 md:py-6 px-2 md:px-4 flex items-center gap-3 md:gap-4">
      <div className={`w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full ${color} ring-2 md:ring-4 ring-offset-2 ring-transparent dark:ring-offset-slate-900 transition-all shadow-sm shrink-0`}></div>
      <span className="font-bold text-base md:text-lg text-slate-900 dark:text-slate-100 transition-colors truncate">{label}</span>
    </td>
    <td className="py-4 md:py-6 px-2 md:px-4 text-xs md:text-sm font-bold text-slate-400 dark:text-slate-500 transition-colors hidden sm:table-cell">{percentage}</td>
    <td className="py-4 md:py-6 px-2 md:px-4 text-right font-black text-lg md:text-xl tabular-nums tracking-tight text-slate-900 dark:text-white">
      {new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)}
    </td>
  </tr>
);

export default Dashboard;
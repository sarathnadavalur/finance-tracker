
import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../App';
import { Currency, PortfolioType, Portfolio } from '../types';
import { Info, ChevronDown, Zap } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { portfolios, baseCurrency, setBaseCurrency, rates, settings } = useApp();
  const [liveJitter, setLiveJitter] = useState<Record<string, number>>({});
  const [ticker, setTicker] = useState(0);

  // Live Market Simulation (Updates every second)
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker(t => t + 1);
      const newJitter: Record<string, number> = {};
      Object.values(Currency).forEach(curr => {
        newJitter[curr] = (Math.random() - 0.5) * 0.0002;
      });
      setLiveJitter(newJitter);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
  }, [portfolios, baseCurrency, rates, ticker]); // Include ticker to update totals if needed based on live jitter

  const formatCurrency = (val: number) => {
    const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: baseCurrency, maximumFractionDigits: 0 }).format(val);
    return settings.privacyMode ? '••••••' : formatted;
  };

  const otherCurrencies = Object.values(Currency).filter(c => c !== baseCurrency);

  return (
    <div className="w-full space-y-5 flex flex-col items-stretch">
      {/* Top Header & Minimalist FX Ticker */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">Overview</h1>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-100 dark:border-white/5 shadow-sm">
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Base</span>
            <select 
              value={baseCurrency} 
              onChange={(e) => setBaseCurrency(e.target.value as Currency)} 
              className="appearance-none bg-transparent border-none pr-2 font-black text-slate-900 dark:text-white text-[10px] focus:outline-none cursor-pointer"
            >
              <option value={Currency.CAD}>CAD</option>
              <option value={Currency.INR}>INR</option>
              <option value={Currency.USD}>USD</option>
            </select>
          </div>
        </div>

        {/* Minimal FX Ticker */}
        <div className="w-full bg-white dark:bg-slate-900/30 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-white/5 p-3 flex items-center gap-4 overflow-hidden shadow-sm">
          <div className="flex items-center gap-1.5 shrink-0 pr-4 border-r border-slate-100 dark:border-white/5">
            <Zap size={14} className="text-blue-500 fill-blue-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-tighter text-blue-600 dark:text-blue-400">Live</span>
          </div>
          
          <div className="flex flex-1 items-center gap-6 overflow-x-auto no-scrollbar">
            {otherCurrencies.map(curr => {
              const baseRate = rates[baseCurrency][curr];
              const drift = liveJitter[curr] || 0;
              const currentVal = baseRate + (baseRate * drift);
              return (
                <div key={curr} className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-black text-slate-400">{baseCurrency} → {curr}</span>
                  <span className="text-[10px] font-black text-slate-900 dark:text-white tabular-nums">
                    {currentVal.toFixed(4)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Net Worth Card */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0f172a] py-8 px-7 md:py-12 md:px-10 text-white shadow-xl border border-white/5 w-full">
        <div className="absolute top-0 right-0 w-24 h-24 md:w-48 md:h-48 bg-blue-600/20 rounded-full blur-[40px] md:blur-[80px] -mr-12 -mt-12 animate-float"></div>
        <div className="relative z-10 flex flex-col items-start gap-1">
          <p className="text-slate-400 font-bold tracking-[0.12em] uppercase text-[10px] md:text-xs">Net Worth</p>
          <h2 className={`text-4xl md:text-6xl font-black tracking-tighter tabular-nums transition-all duration-300 ${settings.privacyMode ? 'blur-sm opacity-50' : ''}`}>
            {formatCurrency(totals.netValue)}
          </h2>
        </div>
      </div>

      {/* Asset Table - Now full width for simplicity */}
      <div className="bg-white dark:bg-slate-900/40 rounded-[2rem] border border-slate-200 dark:border-white/5 p-6 shadow-sm backdrop-blur-sm pb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Assets</h3>
          <Info size={14} className="text-slate-400" />
        </div>
        <table className="w-full text-left">
          <tbody className="divide-y divide-slate-50 dark:divide-white/5">
            <TableRows label="Investments" amount={totals.investments} percentage={totals.investmentsPercentage} color="bg-blue-500" currency={baseCurrency} isPrivate={settings.privacyMode} />
            <TableRows label="Savings" amount={totals.savings} percentage={totals.savingsPercentage} color="bg-emerald-500" currency={baseCurrency} isPrivate={settings.privacyMode} />
            <TableRows label="Liabilities" amount={totals.debt + totals.emiTotal} percentage="N/A" color="bg-rose-500" currency={baseCurrency} isPrivate={settings.privacyMode} />
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TableRows: React.FC<{ label: string; amount: number; percentage: string; color: string; currency: string; isPrivate: boolean }> = ({ label, amount, percentage, color, currency, isPrivate }) => (
  <tr className="group">
    <td className="py-4 flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color} shrink-0`}></div>
      <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{label}</span>
    </td>
    <td className="py-4 text-[10px] font-bold text-slate-400 hidden sm:table-cell">{percentage}</td>
    <td className={`py-4 text-right font-black text-sm tabular-nums text-slate-900 dark:text-white ${isPrivate ? 'blur-[2px] opacity-50' : ''}`}>
      {isPrivate ? '•••' : new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)}
    </td>
  </tr>
);

export default Dashboard;

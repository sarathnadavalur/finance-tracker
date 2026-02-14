
import React, { useMemo } from 'react';
import { useApp } from '../App';
import { Currency, PortfolioType, Portfolio } from '../types';
import { TrendingUp, PiggyBank, CreditCard, Clock, ArrowUpRight, Activity, Globe } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { portfolios, baseCurrency, setBaseCurrency, rates, profile, lastUpdated } = useApp();

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
    
    // Logic: If pay day >= start day, first payment is in processing month.
    // Otherwise it's in the following month.
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

    return {
      savings,
      investments,
      debt,
      emiTotal,
      netValue: investments + savings - debt - emiTotal
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
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Welcome back, {profile.name}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Base Currency</label>
          <select 
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value as Currency)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-slate-900 dark:text-white"
          >
            <option value={Currency.CAD}>CAD</option>
            <option value={Currency.INR}>INR</option>
            <option value={Currency.USD}>USD</option>
          </select>
        </div>
      </div>

      {/* FX Rates Ticker */}
      <div className="glass rounded-[2rem] p-6 w-fit flex gap-12 overflow-x-auto no-scrollbar relative group transition-all duration-300">
        {Object.entries(currentRates).map(([curr, rate]) => {
          if (curr === baseCurrency) return null;
          return (
            <div key={curr} className="flex flex-col min-w-[100px] animate-in slide-in-from-right-2 duration-300">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-widest">1 {baseCurrency} =</span>
              <span className="text-2xl font-black tabular-nums tracking-tighter flex items-baseline gap-1.5 text-slate-900 dark:text-slate-100">
                {rate.toFixed(4)} <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase">{curr}</span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-[3rem] bg-[#0f172a] dark:bg-[#0f172a] p-10 md:p-14 text-white shadow-2xl transition-all duration-500 border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] -mr-40 -mt-40 animate-float"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/20 rounded-full blur-[80px] -ml-32 -mb-32"></div>
        
        <div className="relative z-10 flex flex-col items-start gap-1">
          <p className="text-slate-400 font-bold mb-2 tracking-[0.1em] uppercase text-sm">
            Estimated Net Worth
          </p>
          <h2 className="text-6xl md:text-8xl font-black tracking-tight tabular-nums transition-all duration-300">
            {formatCurrency(totals.netValue)}
          </h2>
          <div className="flex items-center gap-2 mt-6 text-[#10b981] bg-[#10b981]/10 w-fit px-4 py-2 rounded-2xl text-sm font-bold border border-[#10b981]/20">
            <TrendingUp size={18} />
            <span>Synced with Market</span>
          </div>
        </div>
      </div>

      {/* Asset Allocation Table */}
      <div className="bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-200 dark:border-white/5 p-8 md:p-10 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Asset Allocation</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">Distribution across your financial portfolio</p>
          </div>
          <button className="text-blue-600 dark:text-blue-400 text-sm font-bold hover:bg-blue-100/50 dark:hover:bg-blue-900/30 px-6 py-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl transition-colors">
            Analysis
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-[0.15em]">
                <th className="pb-6 px-4">Category</th>
                <th className="pb-6 px-4">Allocation</th>
                <th className="pb-6 px-4 text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              <TableRows 
                label="Investments" 
                amount={totals.investments} 
                percentage={(totals.investments / (totals.investments + totals.savings || 1) * 100).toFixed(0) + '%'} 
                color="bg-blue-500" 
                currency={baseCurrency} 
              />
              <TableRows 
                label="Savings" 
                amount={totals.savings} 
                percentage={(totals.savings / (totals.investments + totals.savings || 1) * 100).toFixed(0) + '%'} 
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
    <td className="py-6 px-4 flex items-center gap-4">
      <div className={`w-3.5 h-3.5 rounded-full ${color} ring-4 ring-offset-2 ring-transparent dark:ring-offset-slate-900 group-hover:ring-${color.replace('bg-', '')}/10 transition-all shadow-sm`}></div>
      <span className="font-bold text-lg text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{label}</span>
    </td>
    <td className="py-6 px-4 text-sm font-bold text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">{percentage}</td>
    <td className="py-6 px-4 text-right font-black text-xl tabular-nums tracking-tight text-slate-900 dark:text-white">
      {new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)}
    </td>
  </tr>
);

export default Dashboard;

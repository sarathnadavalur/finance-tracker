import React, { useMemo } from 'react';
import { useApp } from '../App';
import { Currency, PortfolioType, Portfolio } from '../types';
import { Info, ChevronDown } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { portfolios, baseCurrency, setBaseCurrency, rates, profile } = useApp();

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
    <div className="w-full space-y-4 flex flex-col items-stretch">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
        <div className="w-full">
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">Dashboard</h1>
        </div>
        
        <div className="w-full md:w-auto flex items-center justify-between gap-3 bg-white dark:bg-slate-900/50 px-4 py-3 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm">
          <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Base Currency</label>
          <div className="relative flex items-center gap-1 group">
            <select 
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value as Currency)}
              className="appearance-none bg-transparent border-none pr-5 font-black text-slate-900 dark:text-white text-xs focus:outline-none cursor-pointer z-10"
            >
              <option value={Currency.CAD}>CAD</option>
              <option value={Currency.INR}>INR</option>
              <option value={Currency.USD}>USD</option>
            </select>
            <ChevronDown size={12} className="absolute right-0 text-slate-400 group-hover:text-blue-500 transition-colors" />
          </div>
        </div>
      </div>

      {/* FX Rates Ticker */}
      <div className="glass rounded-[1.5rem] p-4 w-full flex gap-8 md:gap-10 overflow-x-auto no-scrollbar relative transition-all duration-300">
        {Object.entries(currentRates).map(([curr, rate]) => {
          if (curr === baseCurrency) return null;
          return (
            <div key={curr} className="flex flex-col min-w-[110px] animate-in slide-in-from-right-1 duration-300 shrink-0">
              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mb-0.5 uppercase tracking-widest whitespace-nowrap">1 {baseCurrency} =</span>
              <span className="text-xl font-black tabular-nums tracking-tighter flex items-baseline gap-1 text-slate-900 dark:text-slate-100">
                {(rate as number).toFixed(4)} <span className="text-slate-400 dark:text-slate-500 text-[9px] font-bold uppercase">{curr}</span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Hero Card - Edge-to-edge on mobile */}
      <div className="relative overflow-hidden rounded-[2rem] bg-[#0f172a] dark:bg-[#0f172a] py-6 px-7 md:py-8 md:px-10 text-white shadow-xl transition-all duration-500 border border-white/5 w-full">
        <div className="absolute top-0 right-0 w-24 h-24 md:w-48 md:h-48 bg-blue-600/20 rounded-full blur-[40px] md:blur-[80px] -mr-12 -mt-12 md:-mr-24 md:-mt-24 animate-float"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 md:w-40 md:h-40 bg-purple-600/20 rounded-full blur-[30px] md:blur-[60px] -ml-10 -mb-10 md:-ml-20 md:-mb-20"></div>
        
        <div className="relative z-10 flex flex-col items-start gap-0.5">
          <p className="text-slate-400 font-bold tracking-[0.12em] uppercase text-[9px] md:text-xs">
            Net Worth
          </p>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter tabular-nums transition-all duration-300 break-words max-w-full">
            {formatCurrency(totals.netValue)}
          </h2>
        </div>
      </div>

      {/* Asset Allocation Table - Edge-to-edge on mobile */}
      <div className="bg-white dark:bg-slate-900/40 rounded-[2rem] border border-slate-200 dark:border-white/5 p-6 md:p-8 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700 backdrop-blur-sm w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">Asset Allocation</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Global distribution</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Info size={16} />
          </div>
        </div>
        <div className="w-full">
          <table className="w-full text-left border-separate border-spacing-y-1">
            <thead>
              <tr className="text-slate-400 dark:text-slate-500 text-[9px] font-bold uppercase tracking-[0.18em]">
                <th className="pb-3 px-1">Category</th>
                <th className="pb-3 px-1 hidden sm:table-cell">Weight</th>
                <th className="pb-3 px-1 text-right">Value</th>
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
    <td className="py-4 px-1 flex items-center gap-3">
      <div className={`w-2.5 h-2.5 rounded-full ${color} ring-2 ring-offset-2 ring-transparent dark:ring-offset-slate-900 transition-all shadow-sm shrink-0`}></div>
      <span className="font-bold text-base md:text-lg text-slate-900 dark:text-slate-100 transition-colors truncate">{label}</span>
    </td>
    <td className="py-4 px-1 text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 transition-colors hidden sm:table-cell">{percentage}</td>
    <td className="py-4 px-1 text-right font-black text-lg md:text-xl tabular-nums tracking-tight text-slate-900 dark:text-white">
      {new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)}
    </td>
  </tr>
);

export default Dashboard;
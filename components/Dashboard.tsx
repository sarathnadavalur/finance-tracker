
import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../App';
import { Currency, PortfolioType, Portfolio, Transaction } from '../types';
import { db } from '../db';
import { Plus, Receipt, TrendingUp, ArrowUpRight, RefreshCcw, Loader2, X, ChevronRight, Brain, Landmark, BarChart3, ArrowDownLeft, Zap, Activity, Sparkles } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { settings } = useApp();
  return settings.dashboardV2Enabled ? <DashboardV2 /> : <DashboardV1 />;
};

const DashboardV2: React.FC = () => {
  const { portfolios, baseCurrency, setBaseCurrency, rates, settings, setIsPortfolioModalOpen, setIsTxModalOpen, setActiveTab, setActivePortfolioSection } = useApp();
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchRecent = async () => {
      const all = await db.getAllTransactions();
      setRecentTransactions(all.sort((a, b) => b.date - a.date).slice(0, 5));
    };
    fetchRecent();
  }, []);

  const calculateRemainingEMI = (p: Portfolio) => {
    if (p.type !== PortfolioType.EMIS || !p.totalEmiValue || !p.monthlyEmiAmount || !p.emiStartDate) return p.value;
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
      const valInBase = p.currency === baseCurrency ? liveValue : liveValue * (rates[p.currency]?.[baseCurrency] || 1);
      switch(p.type) {
        case PortfolioType.SAVINGS: savings += valInBase; break;
        case PortfolioType.INVESTMENTS: investments += valInBase; break;
        case PortfolioType.DEBTS: debt += valInBase; break;
        case PortfolioType.EMIS: emiTotal += valInBase; break;
      }
    });
    return {
      savings, investments, debt, emiTotal,
      net: (savings + investments) - (debt + emiTotal)
    };
  }, [portfolios, baseCurrency, rates]);

  const formatCurrency = (val: number) => {
    const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: baseCurrency, maximumFractionDigits: 0 }).format(val);
    return settings.privacyMode ? '••••••' : formatted;
  };

  const navigateToSection = (type: PortfolioType) => {
    setActivePortfolioSection(type);
    setActiveTab('portfolios');
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const otherCurrencies = Object.values(Currency).filter(c => c !== baseCurrency);

  return (
    <div className="w-full space-y-8 flex flex-col items-stretch pb-10 animate-in fade-in duration-700">
      
      {/* Header V2 */}
      <div className="flex items-center justify-between px-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Overview</h1>
        
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

      {/* Main Balance Card V2 */}
      <div className="bg-slate-900 dark:bg-slate-900/40 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] -mr-16 -mt-16"></div>
         <div className="relative z-10 flex flex-col gap-1">
           <span className="text-xs font-bold text-slate-400 uppercase tracking-widest opacity-80">Total Balance</span>
           <h2 className={`text-5xl font-black tracking-tighter tabular-nums transition-all duration-700 ${settings.privacyMode ? 'blur-xl' : ''}`}>
             {formatCurrency(totals.net)}
           </h2>
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">
             Across {portfolios.length} portfolio items
           </p>
         </div>
      </div>

      {/* Quick Actions V2 */}
      <div className="flex items-center justify-start gap-8 px-2 overflow-x-auto no-scrollbar py-2">
         <QuickActionV2 icon={<Plus size={22} />} label="Add Transaction" onClick={() => setIsTxModalOpen(true)} />
         <QuickActionV2 icon={<Landmark size={22} />} label="New Account" onClick={() => setIsPortfolioModalOpen(true)} />
         <QuickActionV2 icon={<BarChart3 size={22} />} label="Analytics" onClick={() => setActiveTab('analytics')} />
      </div>

      {/* FX Rates */}
      <div className="w-full glass rounded-2xl p-4 flex items-center justify-between shadow-sm border-white/30">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar flex-1 mr-4">
          {otherCurrencies.map(curr => (
            <div key={curr} className="flex items-center gap-2 shrink-0 bg-slate-100/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-white/40 dark:border-white/5">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{baseCurrency}/{curr}</span>
              <span className={`text-[12px] font-black text-slate-900 dark:text-white tabular-nums`}>
                {rates[baseCurrency]?.[curr]?.toFixed(4) || '1.0000'}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-lg shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
        </div>
      </div>

      {/* Portfolio Grid Card V2 */}
      <div className="space-y-4 px-1">
         <h3 className="text-lg font-bold text-slate-900 dark:text-white">Portfolio</h3>
         <div className="bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-8 shadow-premium grid grid-cols-2 gap-y-8">
            <MiniStatV2 label="Total Investments" value={totals.investments} currency={baseCurrency} isPrivate={settings.privacyMode} onClick={() => navigateToSection(PortfolioType.INVESTMENTS)} />
            <MiniStatV2 label="Total Savings" value={totals.savings} currency={baseCurrency} isPrivate={settings.privacyMode} onClick={() => navigateToSection(PortfolioType.SAVINGS)} />
            <MiniStatV2 label="Total Debt" value={totals.debt} currency={baseCurrency} color="text-rose-500" isPrivate={settings.privacyMode} onClick={() => navigateToSection(PortfolioType.DEBTS)} />
            <MiniStatV2 label="Total EMIs" value={totals.emiTotal} currency={baseCurrency} color="text-amber-500" isPrivate={settings.privacyMode} onClick={() => navigateToSection(PortfolioType.EMIS)} />
         </div>
      </div>

      {/* Recent Transactions V2 */}
      <div className="space-y-4 px-1 pb-10">
         <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
            <button onClick={() => setActiveTab('transactions')} className="text-xs font-bold text-blue-500 uppercase tracking-widest">View All</button>
         </div>
         <div className="bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-6 shadow-premium space-y-4">
            {recentTransactions.length === 0 ? (
               <p className="text-center py-6 text-xs text-slate-400 font-bold uppercase tracking-widest">No Activity Recorded</p>
            ) : (
               recentTransactions.map(tx => (
                  <TransactionRowV2 key={tx.id} tx={tx} portfolios={portfolios} isPrivate={settings.privacyMode} baseCurrency={baseCurrency} />
               ))
            )}
         </div>
      </div>
    </div>
  );
};

const QuickActionV2: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-2 group active:scale-95 transition-all">
    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 flex items-center justify-center text-blue-500 shadow-sm group-hover:shadow-glow/20 transition-all">
      {icon}
    </div>
    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight text-center max-w-[70px] leading-tight">{label}</span>
  </button>
);

const MiniStatV2: React.FC<{ label: string; value: number; currency: string; color?: string; isPrivate: boolean; onClick: () => void }> = ({ label, value, currency, color = "text-slate-900 dark:text-white", isPrivate, onClick }) => (
  <div className="flex flex-col gap-1 cursor-pointer group active:opacity-60 transition-opacity" onClick={onClick}>
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
    <span className={`text-xl font-black tabular-nums transition-all ${color} ${isPrivate ? 'blur-md opacity-30' : ''}`}>
      {new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)}
    </span>
  </div>
);

const TransactionRowV2: React.FC<{ tx: Transaction; portfolios: Portfolio[]; isPrivate: boolean; baseCurrency: string }> = ({ tx, portfolios, isPrivate, baseCurrency }) => {
  const p = portfolios.find(item => item.id === tx.portfolioId);
  const currency = p?.currency || baseCurrency;
  
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-4">
         <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
            {tx.type === 'income' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
         </div>
         <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[140px]">{tx.note || tx.category || 'Vantage Record'}</span>
            <div className="flex flex-col gap-0.5 mt-0.5">
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
                {tx.category}
              </span>
              <span className="text-[8px] font-medium text-slate-400 uppercase tracking-wider leading-none">
                {p?.name || 'Unknown Wallet'} • {new Date(tx.date).toLocaleDateString()}
              </span>
            </div>
         </div>
      </div>
      <span className={`text-sm font-black tabular-nums ${tx.type === 'income' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'} ${isPrivate ? 'blur-md opacity-30' : ''}`}>
        {tx.type === 'income' ? '+' : '-'}{new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(tx.amount)}
      </span>
    </div>
  );
};

const DashboardV1: React.FC = () => {
  const { portfolios, baseCurrency, setBaseCurrency, rates, settings, setIsPortfolioModalOpen, setIsTxModalOpen, isSyncing, vantageScore, vantageAdvice, refreshVantageScore, setActiveTab, setActivePortfolioSection } = useApp();
  const [showAdvicePopup, setShowAdvicePopup] = useState(false);

  const calculateRemainingEMI = (p: Portfolio) => {
    if (p.type !== PortfolioType.EMIS || !p.totalEmiValue || !p.monthlyEmiAmount || !p.emiStartDate) return p.value;
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
      const valInBase = p.currency === baseCurrency ? liveValue : liveValue * (rates[p.currency]?.[baseCurrency] || 1);
      switch(p.type) {
        case PortfolioType.SAVINGS: savings += valInBase; break;
        case PortfolioType.INVESTMENTS: investments += valInBase; break;
        case PortfolioType.DEBTS: debt += valInBase; break;
        case PortfolioType.EMIS: emiTotal += valInBase; break;
      }
    });
    const totalAssets = (investments + savings) || 1;
    const totalLiabilities = debt + emiTotal;
    const netValue = investments + savings - totalLiabilities;
    
    return {
      savings, investments, debt, emiTotal, totalLiabilities,
      netValue,
      investmentsPercentage: ((investments / totalAssets) * 100).toFixed(0) + '%',
      savingsPercentage: ((savings / totalAssets) * 100).toFixed(0) + '%'
    };
  }, [portfolios, baseCurrency, rates]);

  const navigateToSection = (type: PortfolioType) => {
    setActivePortfolioSection(type);
    setActiveTab('portfolios');
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const formatCurrency = (val: number) => {
    const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: baseCurrency, maximumFractionDigits: 0 }).format(val);
    return settings.privacyMode ? '••••••' : formatted;
  };

  const otherCurrencies = Object.values(Currency).filter(c => c !== baseCurrency);
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const scoreOffset = circumference - ((vantageScore || 0) / 100) * circumference;

  const getScoreColor = (score: number) => {
    if (score > 80) return 'text-blue-500';
    if (score > 60) return 'text-emerald-500';
    if (score > 40) return 'text-amber-500';
    return 'text-rose-500';
  };

  const pieData = useMemo(() => {
    const total = (totals.savings + totals.investments + totals.totalLiabilities) || 1;
    const sP = (totals.savings / total) * 100;
    const iP = (totals.investments / total) * 100;
    const lP = (totals.totalLiabilities / total) * 100;
    let cumulative = 0;
    const getStroke = (percent: number) => {
      const dash = (percent / 100) * circumference;
      const offset = - (cumulative / 100) * circumference;
      cumulative += percent;
      return { dash, offset };
    };
    return {
      savings: getStroke(sP),
      investments: getStroke(iP),
      liabilities: getStroke(lP)
    };
  }, [totals, circumference]);

  return (
    <div className="w-full space-y-6 flex flex-col items-stretch pb-10">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Overview</h1>
        <div className="flex items-center gap-1.5 glass px-4 py-2 rounded-xl border-white/40 shadow-sm tap-scale cursor-pointer">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Unit</span>
          <select value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value as Currency)} className="appearance-none bg-transparent border-none font-black text-slate-900 dark:text-white text-xs focus:outline-none cursor-pointer">
            <option value={Currency.CAD}>CAD</option>
            <option value={Currency.INR}>INR</option>
            <option value={Currency.USD}>USD</option>
          </select>
        </div>
      </div>

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

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => setIsPortfolioModalOpen(true)} className="flex items-center justify-center gap-2 glossy-blue text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">
          <Plus size={16} strokeWidth={3} />
          <span>Add Asset</span>
        </button>
        <button onClick={() => setIsTxModalOpen(true)} className="flex items-center justify-center gap-2 glass py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm active:scale-95 transition-all">
          <Receipt size={16} className="text-blue-500" strokeWidth={2.5} />
          <span className="text-slate-900 dark:text-white">New Transaction</span>
        </button>
      </div>

      {settings.aiEnabled && (
        <div className="relative group overflow-hidden rounded-[2.2rem] bg-slate-950 p-6 shadow-lg transition-all duration-500 border border-white/5">
          <div className="flex items-center gap-6 relative z-10">
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
               <svg viewBox="0 0 80 80" className="w-full h-full transform -rotate-90 relative z-10 block">
                 <circle cx="40" cy="40" r={radius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                 <circle
                   cx="40" cy="40" r={radius} fill="transparent" stroke="currentColor" strokeWidth="6" strokeDasharray={circumference}
                   style={{ strokeDashoffset: (isSyncing || vantageScore === null) ? circumference : scoreOffset, transition: 'stroke-dashoffset 2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                   className={`${vantageScore !== null ? getScoreColor(vantageScore) : 'text-slate-700'} drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]`}
                 />
               </svg>
               <div className="absolute inset-0 z-20 flex items-center justify-center">
                 {isSyncing ? <Loader2 size={16} className="animate-spin text-blue-500" /> : vantageScore !== null ? <span className="text-[18px] font-black text-white tracking-tighter tabular-nums leading-none">{vantageScore}</span> : <Brain size={16} className="text-slate-600" />}
               </div>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1"><Sparkles size={12} className="text-blue-400" /><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">AI Vantage Pulse</span></div>
              {vantageScore !== null ? <div onClick={() => setShowAdvicePopup(true)} className="cursor-pointer group/text"><p className="text-[14px] font-bold text-white leading-snug line-clamp-1 pr-4 group-hover/text:text-blue-400 transition-colors">{vantageAdvice || "Trajectory verified."}</p><span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1 inline-flex items-center gap-1">Click for Analysis <ChevronRight size={8} /></span></div> : <div><p className="text-[14px] font-bold text-slate-400 leading-snug mb-3">Analyze your portfolio health</p><button onClick={() => refreshVantageScore(true)} disabled={isSyncing} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2">{isSyncing ? <Loader2 size={10} className="animate-spin" /> : <Zap size={10} />}Refresh</button></div>}
            </div>
            {vantageScore !== null && !isSyncing && <button onClick={() => refreshVantageScore(true)} className="p-3 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all"><RefreshCcw size={14} /></button>}
          </div>
        </div>
      )}

      <div className="glass rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col"><h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Distribution</h3><p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 opacity-60">Allocation Breakdown</p></div>
          <div className="relative w-16 h-16">
            <svg viewBox="0 0 80 80" className="w-full h-full transform -rotate-90">
              <circle cx="40" cy="40" r={radius} fill="transparent" stroke="rgba(0,0,0,0.05)" strokeWidth="12" />
              <circle cx="40" cy="40" r={radius} fill="transparent" stroke="#3b82f6" strokeWidth="12" strokeDasharray={`${pieData.investments.dash} ${circumference}`} strokeDashoffset={pieData.investments.offset} className="transition-all duration-1000 ease-out" />
              <circle cx="40" cy="40" r={radius} fill="transparent" stroke="#10b981" strokeWidth="12" strokeDasharray={`${pieData.savings.dash} ${circumference}`} strokeDashoffset={pieData.savings.offset} className="transition-all duration-1000 ease-out" />
              <circle cx="40" cy="40" r={radius} fill="transparent" stroke="#ef4444" strokeWidth="12" strokeDasharray={`${pieData.liabilities.dash} ${circumference}`} strokeDashoffset={pieData.liabilities.offset} className="transition-all duration-1000 ease-out" />
            </svg>
          </div>
        </div>
        <div className="space-y-1">
          <DistributionRow label="Investments" amount={totals.investments} percentage={totals.investmentsPercentage} color="bg-blue-500" currency={baseCurrency} isPrivate={settings.privacyMode} onClick={() => navigateToSection(PortfolioType.INVESTMENTS)} />
          <DistributionRow label="Savings" amount={totals.savings} percentage={totals.savingsPercentage} color="bg-emerald-500" currency={baseCurrency} isPrivate={settings.privacyMode} onClick={() => navigateToSection(PortfolioType.SAVINGS)} />
          <DistributionRow label="Liabilities" amount={totals.totalLiabilities} percentage="Total Owed" color="bg-rose-500" currency={baseCurrency} isPrivate={settings.privacyMode} onClick={() => navigateToSection(PortfolioType.DEBTS)} />
        </div>
      </div>

      {showAdvicePopup && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-2xl flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl animate-in slide-in-from-bottom duration-500 relative border border-white/10 max-h-[92dvh] overflow-hidden flex flex-col">
            <div className="p-8 pb-4 flex items-start justify-between shrink-0">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600"><Sparkles size={24} className="animate-pulse" /></div><div><h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Vantage Analysis</h3><p className="text-[9px] font-black uppercase tracking-[0.25em] text-blue-500">AI Health Report</p></div></div>
              <button onClick={() => setShowAdvicePopup(false)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500"><X size={24} /></button>
            </div>
            <div className="px-8 pb-8 overflow-y-auto no-scrollbar flex-1"><div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 mb-6"><p className="text-[16px] font-normal text-slate-700 dark:text-slate-200 leading-relaxed">{vantageAdvice}</p></div><div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/20 p-6 rounded-2xl border border-slate-100 dark:border-white/5"><div className="flex flex-col"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-60">Health Score</span><div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${getScoreColor(vantageScore || 0)} shadow-glow`}></div><span className={`text-4xl font-black tracking-tighter tabular-nums ${getScoreColor(vantageScore || 0)}`}>{vantageScore}%</span></div></div><Activity size={24} className="text-slate-300" /></div></div>
            <div className="p-8 pt-4 border-t border-slate-50 dark:border-white/5"><button onClick={() => setShowAdvicePopup(false)} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest">Done Reading</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

const DistributionRow: React.FC<{ label: string; amount: number; percentage: string; color: string; currency: string; isPrivate: boolean; onClick: () => void }> = ({ label, amount, percentage, color, currency, isPrivate, onClick }) => (
  <div onClick={onClick} className="group flex items-center justify-between py-4 px-3 rounded-xl hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all cursor-pointer">
    <div className="flex items-center gap-3 flex-1 min-w-0"><div className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`}></div><div className="flex flex-col min-w-0"><span className="font-black text-[15px] text-slate-900 dark:text-slate-100 leading-none truncate">{label}</span><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-60">{percentage}</span></div></div>
    <div className="flex items-center gap-3 shrink-0"><span className={`font-black tabular-nums text-[16px] text-slate-900 dark:text-white transition-all duration-700 ${isPrivate ? 'blur-md opacity-30' : ''}`}>{isPrivate ? '••••' : new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)}</span><ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" /></div>
  </div>
);

export default Dashboard;

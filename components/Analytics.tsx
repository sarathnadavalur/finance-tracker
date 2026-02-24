
import React, { useMemo, useState } from 'react';
import { useApp } from '../App';
import { PortfolioType, Currency, Portfolio } from '../types';
import { ChevronLeft, BarChart3, TrendingUp, TrendingDown, PieChart, Activity, ShieldCheck, LineChart as LineChartIcon, Calendar } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const Analytics: React.FC = () => {
  const { portfolios, baseCurrency, rates, settings, setActiveTab, snapshots } = useApp();
  const [selectedMetric, setSelectedMetric] = useState<'investments' | 'savings' | 'debt' | 'emiTotal'>('investments');

  const chartData = useMemo(() => {
    return snapshots
      .sort((a, b) => a.date - b.date)
      .map(s => ({
        date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: s[selectedMetric]
      }));
  }, [snapshots, selectedMetric]);

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
    let savings = 0, investments = 0, debt = 0, emis = 0;
    portfolios.forEach(p => {
      const liveValue = p.type === PortfolioType.EMIS ? calculateRemainingEMI(p) : p.value;
      const valInBase = p.currency === baseCurrency ? liveValue : liveValue * rates[p.currency][baseCurrency];
      switch(p.type) {
        case PortfolioType.SAVINGS: savings += valInBase; break;
        case PortfolioType.INVESTMENTS: investments += valInBase; break;
        case PortfolioType.DEBTS: debt += valInBase; break;
        case PortfolioType.EMIS: emis += valInBase; break;
      }
    });
    const totalAll = (savings + investments + debt + emis) || 1;
    return {
      savings, investments, debt, emis, totalAll,
      totalAssets: savings + investments,
      totalLiabilities: debt + emis
    };
  }, [portfolios, baseCurrency, rates]);

  // Pie Chart Logic
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  
  const pieSlices = useMemo(() => {
    const sP = (totals.savings / totals.totalAll) * 100;
    const iP = (totals.investments / totals.totalAll) * 100;
    const dP = (totals.debt / totals.totalAll) * 100;
    const eP = (totals.emis / totals.totalAll) * 100;

    let cumulative = 0;
    const getSlice = (percent: number) => {
      const dash = (percent / 100) * circumference;
      const offset = - (cumulative / 100) * circumference;
      cumulative += percent;
      return { dash, offset };
    };

    return {
      savings: getSlice(sP),
      investments: getSlice(iP),
      debt: getSlice(dP),
      emis: getSlice(eP)
    };
  }, [totals, circumference]);

  const formatCurrency = (val: number) => {
    const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: baseCurrency, maximumFractionDigits: 0 }).format(val);
    return settings.privacyMode ? '••••••' : formatted;
  };

  return (
    <div className="w-full flex flex-col min-h-full pb-32 animate-in fade-in duration-500">
      <div className="pt-4 pb-8 flex items-center gap-4">
         <button 
           onClick={() => setActiveTab('dashboard')}
           className="p-3 rounded-2xl glass text-slate-500 active:scale-90 transition-all"
         >
            <ChevronLeft size={24} />
         </button>
         <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Vault Analytics</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Allocation Breakdown</p>
         </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* Growth Trends Section */}
        <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <SectionTitle title="Growth Trends" icon={<LineChartIcon size={14} className="text-blue-500" />} />
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
                 <MetricButton active={selectedMetric === 'investments'} onClick={() => setSelectedMetric('investments')} label="Inv" />
                 <MetricButton active={selectedMetric === 'savings'} onClick={() => setSelectedMetric('savings')} label="Sav" />
                 <MetricButton active={selectedMetric === 'debt'} onClick={() => setSelectedMetric('debt')} label="Debt" />
                 <MetricButton active={selectedMetric === 'emiTotal'} onClick={() => setSelectedMetric('emiTotal')} label="EMI" />
              </div>
           </div>

           <div className="liquid-glass-refractive p-8 rounded-[2.5rem] shadow-premium h-[350px] relative">
              {snapshots.length < 2 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-40">
                  <Calendar size={32} />
                  <p className="text-xs font-bold uppercase tracking-widest max-w-[200px]">Save at least 2 snapshots to see growth trends</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                      dy={10}
                    />
                    <YAxis 
                      hide 
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        border: 'none', 
                        borderRadius: '16px', 
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#fff',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                      itemStyle={{ color: '#3b82f6' }}
                      labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                      formatter={(value: number) => [`CAD ${value.toLocaleString()}`, 'Value']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={4} 
                      dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
           </div>
        </div>

        {/* Large Pie Chart Hero */}
        <div className="liquid-glass-refractive p-10 rounded-[3rem] shadow-premium flex flex-col items-center justify-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
           
           <div className="relative w-64 h-64 flex items-center justify-center mb-8">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                 <circle cx="50" cy="50" r={radius} fill="transparent" stroke="rgba(0,0,0,0.05)" strokeWidth="15" />
                 {/* Investments */}
                 <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#3b82f6" strokeWidth="15" strokeDasharray={`${pieSlices.investments.dash} ${circumference}`} strokeDashoffset={pieSlices.investments.offset} className="transition-all duration-1000 ease-out" />
                 {/* Savings */}
                 <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#10b981" strokeWidth="15" strokeDasharray={`${pieSlices.savings.dash} ${circumference}`} strokeDashoffset={pieSlices.savings.offset} className="transition-all duration-1000 ease-out" />
                 {/* Debts */}
                 <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#ef4444" strokeWidth="15" strokeDasharray={`${pieSlices.debt.dash} ${circumference}`} strokeDashoffset={pieSlices.debt.offset} className="transition-all duration-1000 ease-out" />
                 {/* EMIs */}
                 <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#f59e0b" strokeWidth="15" strokeDasharray={`${pieSlices.emis.dash} ${circumference}`} strokeDashoffset={pieSlices.emis.offset} className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">Net Wealth</span>
                 <span className={`text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter ${settings.privacyMode ? 'blur-md' : ''}`}>
                    {formatCurrency(totals.totalAssets - totals.totalLiabilities)}
                 </span>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-x-12 gap-y-6 w-full max-w-sm">
              <LegendItem color="bg-blue-500" label="Investments" percent={((totals.investments / totals.totalAll) * 100).toFixed(1)} />
              <LegendItem color="bg-emerald-500" label="Savings" percent={((totals.savings / totals.totalAll) * 100).toFixed(1)} />
              <LegendItem color="bg-rose-500" label="Debts" percent={((totals.debt / totals.totalAll) * 100).toFixed(1)} />
              <LegendItem color="bg-amber-500" label="EMIs" percent={((totals.emis / totals.totalAll) * 100).toFixed(1)} />
           </div>
        </div>

        {/* Detailed Statistics */}
        <div className="space-y-4">
           <SectionTitle title="Asset Valuation" icon={<TrendingUp size={14} className="text-emerald-500" />} />
           <div className="grid grid-cols-2 gap-4">
              <StatBox label="CASH LIQUIDITY" value={totals.savings} color="text-emerald-500" currency={baseCurrency} isPrivate={settings.privacyMode} />
              <StatBox label="MARKET VALUE" value={totals.investments} color="text-blue-500" currency={baseCurrency} isPrivate={settings.privacyMode} />
           </div>
           
           <SectionTitle title="Liability Exposure" icon={<TrendingDown size={14} className="text-rose-500" />} />
           <div className="grid grid-cols-2 gap-4">
              <StatBox label="DEFERRED DEBT" value={totals.debt} color="text-rose-500" currency={baseCurrency} isPrivate={settings.privacyMode} />
              <StatBox label="EMI BALANCE" value={totals.emis} color="text-amber-500" currency={baseCurrency} isPrivate={settings.privacyMode} />
           </div>
        </div>

        {/* Summary Breakdown */}
        <div className="bg-slate-900 dark:bg-slate-900/60 p-8 rounded-[2.5rem] shadow-xl text-white">
           <div className="flex items-center gap-3 mb-6">
              <ShieldCheck size={20} className="text-blue-400" />
              <h4 className="text-sm font-black uppercase tracking-widest">Financial Health Summary</h4>
           </div>
           <div className="space-y-4">
              <HealthRow label="Asset-to-Debt Ratio" value={(totals.totalAssets / (totals.totalLiabilities || 1)).toFixed(2)} sub="Efficiency Rating" />
              <div className="h-px bg-white/5"></div>
              <HealthRow label="Total Capital Managed" value={formatCurrency(totals.totalAll)} sub="Gross Market Exposure" isPrivate={settings.privacyMode} />
           </div>
        </div>
      </div>
    </div>
  );
};

const LegendItem: React.FC<{ color: string; label: string; percent: string }> = ({ color, label, percent }) => (
  <div className="flex items-center gap-3">
    <div className={`w-3 h-3 rounded-full ${color}`}></div>
    <div className="flex flex-col">
       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</span>
       <span className="text-sm font-black text-slate-900 dark:text-white mt-1 tabular-nums">{percent}%</span>
    </div>
  </div>
);

const SectionTitle: React.FC<{ title: string; icon: React.ReactNode }> = ({ title, icon }) => (
  <div className="flex items-center gap-2 px-2 py-1">
    {icon}
    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</span>
  </div>
);

const StatBox: React.FC<{ label: string; value: number; color: string; currency: string; isPrivate: boolean }> = ({ label, value, color, currency, isPrivate }) => (
  <div className="glass p-6 rounded-[2rem] border border-white/40 dark:border-white/5 flex flex-col gap-1">
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">{label}</span>
    <span className={`text-xl font-black tabular-nums transition-all ${color} ${isPrivate ? 'blur-md opacity-30' : ''}`}>
      {new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)}
    </span>
  </div>
);

const HealthRow: React.FC<{ label: string; value: string; sub: string; isPrivate?: boolean }> = ({ label, value, sub, isPrivate }) => (
  <div className="flex items-center justify-between">
    <div>
       <p className="text-[13px] font-bold text-slate-200">{label}</p>
       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">{sub}</p>
    </div>
    <span className={`text-lg font-black tracking-tighter tabular-nums ${isPrivate ? 'blur-md opacity-20' : ''}`}>{value}</span>
  </div>
);

const MetricButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button 
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-white dark:bg-slate-700 text-blue-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
  >
    {label}
  </button>
);

export default Analytics;

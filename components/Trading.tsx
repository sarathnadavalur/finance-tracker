
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../App';
import { Trade, Currency } from '../types';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  BarChart3, 
  X,
  Edit3,
  Globe,
  Loader2,
  RefreshCcw,
  Search,
  Zap,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Clock
} from 'lucide-react';

interface TickerData {
  price: number;
  name: string;
  exchange: string;
  marketState: 'REGULAR' | 'PRE' | 'POST' | 'CLOSED';
  lastFetched: number;
}

/**
 * Direct Market Fetcher
 * Optimized for mobile environments and native wrappers.
 * Fetches directly from high-reliability public endpoints.
 */
const fetchTickerDirect = async (symbol: string): Promise<TickerData> => {
  const upperSymbol = symbol.toUpperCase().trim();
  const isCrypto = (sym: string) => {
    const cryptoSet = new Set(['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOT', 'DOGE', 'LINK', 'MATIC', 'PEPE', 'SUI', 'APT', 'NEAR', 'SHIB', 'UNI', 'LTC', 'AVAX', 'TRX']);
    return cryptoSet.has(sym) || sym.endsWith('USD') || sym.endsWith('USDT');
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s for mobile resilience

  try {
    if (isCrypto(upperSymbol)) {
      // BINANCE DIRECT (CORS Friendly)
      const cleanSym = upperSymbol.replace('USD', '').replace('USDT', '');
      const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${cleanSym}USDT`, { 
        signal: controller.signal 
      });
      if (!res.ok) throw new Error(`Binance rejected request (${res.status})`);
      const data = await res.json();
      clearTimeout(timeoutId);
      return {
        price: parseFloat(data.price),
        name: upperSymbol,
        exchange: 'CRYPTO',
        marketState: 'REGULAR',
        lastFetched: Date.now()
      };
    } else {
      // YAHOO V8 CHART DIRECT (Stable for single-ticker quotes)
      const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${upperSymbol}?interval=1m&range=1d`, {
        signal: controller.signal
      });
      
      if (!res.ok) {
        if (res.status === 404) throw new Error("Symbol not found");
        throw new Error(`Market source unavailable (${res.status})`);
      }

      const data = await res.json();
      clearTimeout(timeoutId);

      const meta = data.chart?.result?.[0]?.meta;
      if (!meta) throw new Error("Malformed market data received");

      return {
        price: meta.regularMarketPrice,
        name: upperSymbol,
        exchange: meta.exchangeName || 'STOCKS',
        marketState: 'REGULAR', // v8 chart provides live regular price
        lastFetched: Date.now()
      };
    }
  } catch (e: any) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') throw new Error("Connection timed out. Slow network.");
    if (e.message.includes('Failed to fetch')) {
      throw new Error("Security block (CORS). This feature works best in a native app environment.");
    }
    throw e;
  }
};

const Trading: React.FC = () => {
  const { trades, addTrade, updateTrade, deleteTrade, rates, settings, addLog } = useApp();
  const [tickerCache, setTickerCache] = useState<Record<string, TickerData>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [viewCurrency, setViewCurrency] = useState<Currency>(Currency.USD);

  const syncAllTrades = useCallback(async () => {
    if (trades.length === 0) return;
    setIsSyncing(true);
    
    const newCache = { ...tickerCache };
    let changed = false;

    // Sequential fetching to avoid mobile rate-limiting issues
    for (const trade of trades) {
      try {
        const data = await fetchTickerDirect(trade.symbol);
        newCache[trade.symbol.toUpperCase()] = data;
        changed = true;
      } catch (e) {
        console.error(`Sync failed for ${trade.symbol}`, e);
      }
    }

    if (changed) setTickerCache(newCache);
    setIsSyncing(false);
  }, [trades, tickerCache]);

  useEffect(() => {
    syncAllTrades();
    const interval = setInterval(syncAllTrades, 30000); // 30s cycle
    return () => clearInterval(interval);
  }, [trades.length]);

  const stats = useMemo(() => {
    let totalInvestedView = 0;
    let totalCurrentValueView = 0;

    trades.forEach(t => {
      const liveData = tickerCache[t.symbol.toUpperCase()];
      const currentPrice = liveData?.price || t.avgCost;
      
      const investedInTradeCurr = t.avgCost * t.quantity;
      const currentValInTradeCurr = currentPrice * t.quantity;

      const rateToView = rates[t.currency][viewCurrency];
      totalInvestedView += investedInTradeCurr * rateToView;
      totalCurrentValueView += currentValInTradeCurr * rateToView;
    });

    return {
      invested: totalInvestedView,
      current: totalCurrentValueView,
      pl: totalCurrentValueView - totalInvestedView
    };
  }, [trades, tickerCache, viewCurrency, rates]);

  const formatVal = (val: number, currency: string = viewCurrency) => {
    if (settings.privacyMode) return '••••';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="w-full flex flex-col min-h-full pb-32">
      <div className="pt-4 pb-6 px-1">
        <div className="flex items-center justify-between mb-8">
           <div className="flex flex-col">
              <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight">Trading</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-blue-500 animate-spin' : 'bg-emerald-500 animate-pulse'}`}></div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em]">Real-Time Market Hub</p>
              </div>
           </div>
           
           <div className="flex items-center gap-2">
              <div className="relative group">
                <div className="flex items-center gap-1.5 glass px-4 py-2.5 rounded-2xl border-white/40 shadow-sm tap-scale cursor-pointer">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Unit</span>
                  <select 
                    value={viewCurrency} 
                    onChange={(e) => setViewCurrency(e.target.value as Currency)} 
                    className="appearance-none bg-transparent border-none font-black text-slate-900 dark:text-white text-xs focus:outline-none cursor-pointer pr-4"
                  >
                    <option value={Currency.USD}>USD</option>
                    <option value={Currency.CAD}>CAD</option>
                    <option value={Currency.INR}>INR</option>
                  </select>
                  <ChevronDown size={10} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
                </div>
              </div>

              <button 
                onClick={() => syncAllTrades()}
                disabled={isSyncing}
                className="w-12 h-12 rounded-[1.3rem] glass flex items-center justify-center text-slate-500 active:text-blue-600 shadow-sm active:scale-90 transition-all"
              >
                <RefreshCcw size={20} className={`${isSyncing ? 'animate-spin text-blue-500' : ''}`} />
              </button>

              <button 
                onClick={() => { setEditingTrade(null); setIsAddModalOpen(true); }}
                className="w-12 h-12 rounded-[1.3rem] bg-blue-600 text-white flex items-center justify-center shadow-glow active:scale-90 transition-all"
              >
                <Plus size={24} strokeWidth={3} />
              </button>
           </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-10">
           <div className="glass p-5 rounded-[2.2rem] border border-white/40 dark:border-white/5 flex flex-col justify-between">
              <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-2 opacity-60">Basis ({viewCurrency})</span>
              <p className={`text-[13px] font-black text-slate-900 dark:text-white tabular-nums truncate ${settings.privacyMode ? 'blur-md' : ''}`}>
                {formatVal(stats.invested)}
              </p>
           </div>
           <div className="glass p-5 rounded-[2.2rem] border border-white/40 dark:border-white/5 flex flex-col justify-between">
              <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-2 opacity-60">Value</span>
              <p className={`text-[13px] font-black text-slate-900 dark:text-white tabular-nums truncate ${settings.privacyMode ? 'blur-md' : ''}`}>
                {formatVal(stats.current)}
              </p>
           </div>
           <div className={`p-5 rounded-[2.2rem] border flex flex-col justify-between transition-all duration-500 ${stats.pl >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
              <div className="flex items-center justify-between mb-2">
                 <span className={`text-[8px] font-black uppercase tracking-widest ${stats.pl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>Net P/L</span>
              </div>
              <p className={`text-[13px] font-black tabular-nums truncate ${settings.privacyMode ? 'blur-md' : (stats.pl >= 0 ? 'text-emerald-600' : 'text-rose-600')}`}>
                {stats.pl >= 0 ? '+' : ''}{formatVal(stats.pl)}
              </p>
           </div>
        </div>

        <div className="space-y-3">
          {trades.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400/40 gap-6">
              <div className="w-20 h-20 rounded-[2.2rem] bg-slate-100 dark:bg-slate-900 border-4 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center">
                 <Activity size={32} className="opacity-50" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest">No positions logged</p>
            </div>
          ) : (
            trades.map(trade => (
              <TradeCard 
                key={trade.id} 
                trade={trade} 
                meta={tickerCache[trade.symbol.toUpperCase()]}
                onDelete={() => deleteTrade(trade.id)}
                onEdit={() => { setEditingTrade(trade); setIsAddModalOpen(true); }}
                formatVal={formatVal}
                isPrivate={settings.privacyMode}
                viewCurrency={viewCurrency}
                rates={rates}
              />
            ))
          )}
        </div>
      </div>

      {isAddModalOpen && (
        <AddTradeModal 
          editingTrade={editingTrade}
          onClose={() => setIsAddModalOpen(false)} 
          onSave={(t) => { 
            if (editingTrade) updateTrade(t as Trade);
            else addTrade(t);
            setIsAddModalOpen(false); 
          }}
        />
      )}
    </div>
  );
};

const TradeCard: React.FC<{ 
  trade: Trade; 
  meta?: TickerData;
  onDelete: () => void;
  onEdit: () => void;
  formatVal: (v: number, c?: string) => string;
  isPrivate: boolean;
  viewCurrency: Currency;
  rates: any;
}> = ({ trade, meta, onDelete, onEdit, formatVal, isPrivate, viewCurrency, rates }) => {
  
  const currentPrice = meta?.price || trade.avgCost;
  const diffPerUnit = currentPrice - trade.avgCost;
  const totalPLAssetCurr = diffPerUnit * trade.quantity;
  const rateToView = rates[trade.currency][viewCurrency];
  const plInView = totalPLAssetCurr * rateToView;
  
  const plPercent = ((currentPrice - trade.avgCost) / trade.avgCost) * 100;
  const isPositive = totalPLAssetCurr >= 0;

  const formatTradeCurr = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: trade.currency,
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <div 
      onClick={onEdit}
      className="glass p-6 rounded-[2.5rem] border border-white/40 dark:border-white/5 flex items-center justify-between group hover:scale-[1.01] transition-all shadow-premium cursor-pointer relative overflow-hidden"
    >
      <div className="flex items-center gap-5 flex-1 min-w-0">
        <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center shrink-0 shadow-inner ${isPositive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
           <span className="font-black text-[11px] uppercase tracking-tighter">{trade.symbol.substring(0, 3)}</span>
        </div>
        <div className="flex flex-col min-w-0">
           <h3 className="text-[17px] font-black text-slate-900 dark:text-white leading-tight uppercase truncate">{trade.symbol}</h3>
           <div className="flex items-center gap-2 mt-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{trade.quantity} Units</span>
              <div className="w-1 h-1 rounded-full bg-slate-200"></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Avg {isPrivate ? '••••' : formatTradeCurr(trade.avgCost)}</span>
           </div>
        </div>
      </div>

      <div className="text-right flex flex-col items-end gap-1 ml-4">
         <div className="flex flex-col items-end">
            <span className={`text-[19px] font-black tabular-nums tracking-tighter leading-none transition-all ${isPrivate ? 'blur-md opacity-30' : (isPositive ? 'text-emerald-500' : 'text-rose-500')}`}>
              {isPositive ? '+' : ''}{formatVal(plInView, viewCurrency)}
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
               <span className={`text-[10px] font-black uppercase tracking-tighter ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                 {Math.abs(plPercent).toFixed(2)}%
               </span>
               <div className="w-px h-2 bg-slate-200"></div>
               <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tabular-nums">
                 CMP {isPrivate ? '••••' : formatTradeCurr(currentPrice)}
               </span>
            </div>
         </div>
         <button 
           onClick={(e) => { e.stopPropagation(); onDelete(); }}
           className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
         >
           <Trash2 size={14} />
         </button>
      </div>
    </div>
  );
};

const AddTradeModal: React.FC<{ 
  editingTrade: Trade | null; 
  onClose: () => void; 
  onSave: (t: Omit<Trade, 'updatedAt'>) => void 
}> = ({ editingTrade, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    symbol: '',
    avgCost: '',
    quantity: '',
    currency: Currency.USD
  });
  const [isValidating, setIsValidating] = useState(false);
  const [validationData, setValidationData] = useState<TickerData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingTrade) {
      setFormData({
        symbol: editingTrade.symbol,
        avgCost: editingTrade.avgCost.toString(),
        quantity: editingTrade.quantity.toString(),
        currency: editingTrade.currency
      });
    }
  }, [editingTrade]);

  const validateAndFetch = async () => {
    const sym = formData.symbol.toUpperCase().trim();
    if (!sym) return;
    setIsValidating(true);
    setError(null);
    setValidationData(null);

    try {
      const data = await fetchTickerDirect(sym);
      setValidationData(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.symbol || !formData.avgCost || !formData.quantity) return;
    onSave({
      id: editingTrade ? editingTrade.id : Date.now().toString(),
      symbol: formData.symbol.toUpperCase().trim(),
      avgCost: parseFloat(formData.avgCost),
      quantity: parseFloat(formData.quantity),
      currency: formData.currency
    });
  };

  const inputStyle = "w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl px-5 py-3.5 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-300 text-sm";
  const labelStyle = "text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block ml-1";

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.8rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
         <div className="p-8">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                 {editingTrade ? 'Update Position' : 'Log Trade'}
               </h2>
               <button onClick={onClose} className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                 <X size={20} className="text-slate-500" />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
               <div className="space-y-1">
                  <label className={labelStyle}>Ticker Symbol</label>
                  <div className="flex gap-2">
                    <input 
                      required 
                      placeholder="NVDA, BTC, AAPL"
                      className={inputStyle} 
                      value={formData.symbol} 
                      onChange={e => {
                        setFormData({...formData, symbol: e.target.value.toUpperCase()});
                        setValidationData(null);
                        setError(null);
                      }} 
                    />
                    <button 
                      type="button" 
                      onClick={validateAndFetch}
                      disabled={isValidating || !formData.symbol}
                      className="px-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                      {isValidating ? <Loader2 size={16} className="animate-spin" /> : 'Fetch'}
                    </button>
                  </div>
               </div>

               {validationData && (
                 <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 flex items-center justify-between animate-in slide-in-from-top-2">
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Source Verified</p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{validationData.name} ({validationData.exchange})</p>
                    </div>
                    <p className="text-xs font-black text-emerald-600 tabular-nums">${validationData.price.toFixed(2)}</p>
                 </div>
               )}

               {error && (
                 <div className="bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20 flex items-center gap-2 animate-in slide-in-from-top-2">
                    <AlertCircle size={14} className="text-rose-500 shrink-0" />
                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest leading-relaxed">{error}</p>
                 </div>
               )}

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={labelStyle}>Avg Cost Paid</label>
                    <input required type="number" step="any" placeholder="0.00" className={inputStyle} value={formData.avgCost} onChange={e => setFormData({...formData, avgCost: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className={labelStyle}>Quantity</label>
                    <input required type="number" step="any" placeholder="1.0" className={inputStyle} value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                  </div>
               </div>

               <div className="space-y-1">
                  <label className={labelStyle}>Trade Currency</label>
                  <div className="flex gap-2">
                    {[Currency.USD, Currency.CAD, Currency.INR].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormData({...formData, currency: c})}
                        className={`flex-1 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${formData.currency === c ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
               </div>

               <div className="flex gap-4 pt-4">
                  <button type="button" onClick={onClose} className="flex-1 py-4 font-black text-[10px] uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-2xl">Cancel</button>
                  <button type="submit" className="flex-[1.5] py-4 font-black text-[10px] uppercase tracking-widest bg-blue-600 text-white rounded-2xl shadow-glow">
                    {editingTrade ? 'Update' : 'Confirm Trade'}
                  </button>
               </div>
            </form>
         </div>
      </div>
    </div>
  );
};

export default Trading;

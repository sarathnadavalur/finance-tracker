
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../App';
import { GoogleGenAI } from '@google/genai';
import { 
  Search, 
  Loader2, 
  Plus, 
  ExternalLink, 
  X,
  RefreshCw,
  TrendingUp,
  Clock,
  Globe,
  AlertTriangle,
  BarChart4,
  Target,
  ShieldCheck,
  Zap,
  Calendar,
  Activity
} from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  summary: string;
  content: string;
  impact: 'positive' | 'negative' | 'neutral' | 'critical';
  symbol: string;
  timestamp: string;
  readTime: string;
  // Metrics
  priceUsd?: string;
  priceCad?: string;
  support1?: string;
  support2?: string;
  resistance1?: string;
  resistance2?: string;
  nextEarnings?: string;
  prevEarningsResult?: string; // e.g. "Beat by 5%"
}

const LatestNews: React.FC = () => {
  const { profile, setProfile, newsCache, setNewsCache, settings, isAiRestricted, ensureApiKey, addLog } = useApp();
  const [symbolInput, setSymbolInput] = useState('');
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  
  const trackedSymbols = profile?.trackedSymbols || [];

  const addSymbol = () => {
    const sym = symbolInput.trim().toUpperCase();
    if (!sym || !profile) return;
    if (trackedSymbols.includes(sym)) {
      setSymbolInput('');
      return;
    }
    const newList = [...trackedSymbols, sym];
    setProfile({ ...profile, trackedSymbols: newList });
    setSymbolInput('');
    if (navigator.vibrate) navigator.vibrate(10);
    addLog(`Symbol added to tracker: ${sym}`, "info", "News Engine");
  };

  const removeSymbol = (symbol: string) => {
    if (!profile) return;
    const newList = trackedSymbols.filter(s => s !== symbol);
    setProfile({ ...profile, trackedSymbols: newList });
    if (navigator.vibrate) navigator.vibrate(5);
    addLog(`Symbol removed from tracker: ${symbol}`, "info", "News Engine");
  };

  const cleanJsonString = (str: string) => {
    return str.replace(/```json/g, '').replace(/```/g, '').trim();
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const callAiWithRetry = async (fn: () => Promise<any>, retries = 2, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (e: any) {
        const errorMsg = e.message || JSON.stringify(e);
        addLog(`News AI attempt ${i + 1} failed: ${errorMsg}`, "error", "News Engine");
        if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
          if (i === retries - 1) throw e;
          await sleep(delay * Math.pow(2, i));
        } else {
          throw e;
        }
      }
    }
  };

  const fetchNews = useCallback(async (isRefresh = false) => {
    if (trackedSymbols.length === 0) {
      setNewsCache([]);
      return;
    }

    // Strictly manual refresh only
    if (!isRefresh) return;

    if (!(await ensureApiKey())) return;

    setIsLoadingNews(true);
    addLog("Initiating market intelligence crawl...", "info", "News Engine");
    
    try {
      // STRICT: prioritize the manual key
      const apiKeyToUse = profile?.customApiKey || process.env.API_KEY || '';
      const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
      const model = settings.selectedModel || 'gemini-3-flash-preview';
      
      const prompt = `Act as a senior quantitative analyst. Search for current real-time data and news as of TODAY for: ${trackedSymbols.join(', ')}.

      FOR EACH SYMBOL, provide EXACTLY ONE highly detailed report (15-25 lines long).
      
      You MUST provide these specific data points for each symbol in the JSON:
      1. Current Price in USD and CAD.
      2. Support Level 1 and Support Level 2.
      3. Resistance Level 1 and Resistance Level 2.
      4. Next expected earnings date.
      5. Previous earnings performance (Beat or Missed).
      
      Output ONLY a JSON array with this structure:
      [
        {
          "id": "uuid",
          "title": "Macro Impact Headline",
          "source": "Financial Authority Name",
          "url": "Source Link",
          "summary": "Brief 1-sentence hook",
          "content": "A 15-25 line comprehensive deep-dive into current market sentiment, technical trends, and fundamental outlook.",
          "impact": "positive" | "negative" | "neutral" | "critical",
          "symbol": "TICKER",
          "timestamp": "Current Time",
          "readTime": "3 min",
          "priceUsd": "$123.45",
          "priceCad": "CA$165.20",
          "support1": "$120.00",
          "support2": "$115.50",
          "resistance1": "$130.00",
          "resistance2": "$135.00",
          "nextEarnings": "Oct 24, 2024",
          "prevEarningsResult": "Beat by 4.2%"
        }
      ]`;

      const response = await callAiWithRetry(() => 
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }]
          }
        })
      );

      if (response && response.text) {
        const jsonString = cleanJsonString(response.text);
        const curatedNews: NewsItem[] = JSON.parse(jsonString);
        setNewsCache(curatedNews);
        addLog("Market intelligence sync completed successfully", "info", "News Engine");
      }
    } catch (err: any) {
      console.error("Vantage AI Sync Failed:", err);
      addLog(`Market intelligence crawl failed: ${err.message}`, "error", "News Engine");
    } finally {
      setIsLoadingNews(false);
    }
  }, [trackedSymbols, setNewsCache, settings.selectedModel, ensureApiKey, profile?.customApiKey, addLog]);

  const getImpactColor = (impact: string) => {
    switch(impact) {
      case 'critical': return 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 ring-2 ring-rose-500/30';
      case 'negative': return 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400';
      case 'positive': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400';
      default: return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="w-full flex flex-col min-h-full pb-32">
      <div className="pt-4 pb-6 px-1 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight">Latest News</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">Vantage Market Intelligence</p>
          </div>
          <button 
            onClick={() => fetchNews(true)}
            disabled={isLoadingNews || trackedSymbols.length === 0}
            className="w-12 h-12 rounded-[1.3rem] bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 shadow-premium active:scale-95 transition-all disabled:opacity-30"
          >
            {isLoadingNews ? <Loader2 size={24} className="animate-spin text-blue-500" /> : <RefreshCw size={24} strokeWidth={2.5} />}
          </button>
        </div>

        {isAiRestricted && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
            <AlertTriangle className="text-amber-500 shrink-0" size={20} />
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">AI Quota Restricted</p>
          </div>
        )}

        <div className="relative group">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input 
                type="text"
                placeholder="Enter Asset Symbol (e.g. BTC, NVDA)..."
                className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-[1.8rem] py-5 pl-14 pr-6 font-extrabold text-[15px] text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-premium"
                value={symbolInput}
                onChange={(e) => setSymbolInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSymbol()}
              />
              <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <button 
              onClick={addSymbol}
              className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-glow active:scale-90 transition-all shrink-0"
            >
              <Plus size={24} strokeWidth={3} />
            </button>
          </div>
        </div>

        {trackedSymbols.length > 0 && (
          <div className="flex flex-wrap gap-2.5 px-1">
            {trackedSymbols.map(s => (
              <div 
                key={s} 
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full shadow-glow"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.1em]">{s}</span>
                <button onClick={() => removeSymbol(s)} className="p-0.5 rounded-full hover:bg-white/20 transition-colors">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 px-1">
        {trackedSymbols.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400/40 gap-6">
            <div className="w-24 h-24 rounded-[2.8rem] bg-slate-100 dark:bg-slate-900 border-4 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center">
               <Globe size={42} className="opacity-50" />
            </div>
            <div className="text-center px-8">
              <p className="text-base font-extrabold text-slate-500 dark:text-slate-400">Add Assets</p>
              <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-60 text-center">Track symbols to unlock AI market grounding</p>
            </div>
          </div>
        ) : newsCache.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-6">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-2">
               {isLoadingNews ? <Loader2 size={32} className="animate-spin" /> : <BarChart4 size={32} />}
            </div>
            <div className="text-center">
               <h3 className="text-lg font-black text-slate-900 dark:text-white">{isLoadingNews ? 'Consulting Market Core...' : 'Intelligence Ready'}</h3>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2 max-w-xs mx-auto">
                 {isLoadingNews ? 'Grounding data with real-time web results.' : 'Click the refresh button above to sync latest quant data for your tracked symbols.'}
               </p>
            </div>
            {!isLoadingNews && (
               <button 
                 onClick={() => fetchNews(true)}
                 className="mt-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-premium active:scale-95 transition-all"
               >
                 Sync Latest Intelligence
               </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 w-full">
            {newsCache.map((item) => (
              <NewsCard 
                key={item.id} 
                item={item} 
                onPress={() => setSelectedArticle(item)}
                getImpactColor={getImpactColor}
              />
            ))}
          </div>
        )}
      </div>

      {selectedArticle && (
        <ArticleDetailPopup 
          article={selectedArticle} 
          onClose={() => setSelectedArticle(null)} 
          getImpactColor={getImpactColor}
        />
      )}
    </div>
  );
};

const NewsCard: React.FC<{ 
  item: NewsItem; 
  onPress: () => void;
  getImpactColor: (impact: string) => string;
}> = ({ item, onPress, getImpactColor }) => {
  return (
    <div 
      onClick={onPress}
      className={`block bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 p-6 rounded-[2.5rem] shadow-premium select-none transition-all duration-300 active:scale-[0.98] cursor-pointer w-full overflow-hidden min-h-[160px] flex flex-col justify-between`}
    >
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-black uppercase tracking-widest text-blue-600 bg-blue-600/10 px-3 py-1 rounded-full whitespace-nowrap">
              {item.symbol}
            </span>
            {item.priceUsd && (
              <span className="text-[11px] font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                 {item.priceUsd}
              </span>
            )}
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full whitespace-nowrap ${getImpactColor(item.impact)}`}>
              {item.impact}
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter shrink-0">{item.timestamp}</span>
        </div>
        
        <h3 className="text-[17px] font-black tracking-tight text-slate-900 dark:text-white leading-tight mb-2 line-clamp-2">
          {item.title}
        </h3>
        
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4 font-medium opacity-80 overflow-wrap-anywhere">
          {item.summary}
        </p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-white/5 shrink-0">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{item.source}</span>
        <div className="flex items-center gap-1.5 opacity-40 shrink-0">
          <Clock size={12} />
          <span className="text-[9px] font-black uppercase tracking-widest">{item.readTime}</span>
        </div>
      </div>
    </div>
  );
};

const ArticleDetailPopup: React.FC<{ 
  article: NewsItem; 
  onClose: () => void;
  getImpactColor: (impact: string) => string;
}> = ({ article, onClose, getImpactColor }) => {
  
  // Dynamic font sizing logic - Reduced by ~15% for news content only
  const contentLen = article.content.length;
  const fontSizeClass = contentLen > 1000 ? 'text-[10px]' : contentLen > 600 ? 'text-[11px]' : 'text-[12px]';

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl animate-in slide-in-from-bottom-6 duration-500 relative flex flex-col h-auto max-h-[92vh] overflow-hidden">
        
        {/* Fixed Header */}
        <div className="pt-8 px-8 pb-5 shrink-0 flex flex-col gap-4 bg-white dark:bg-slate-900 z-10 border-b border-slate-50 dark:border-white/5">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`px-4 py-1.5 rounded-full ${getImpactColor(article.impact)}`}>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{article.impact} Priority</span>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 active:scale-90 transition-all"
              >
                <X size={20} />
              </button>
           </div>
           
           <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
             {article.title}
           </h2>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-8 py-6 no-scrollbar space-y-8">
          
          {/* Quantitative Metric Vault */}
          <div className="grid grid-cols-2 gap-3">
             <MetricRow icon={<Zap size={10} />} label="USD PRICE" value={article.priceUsd || 'N/A'} />
             <MetricRow icon={<ShieldCheck size={10} />} label="CAD PRICE" value={article.priceCad || 'N/A'} />
             <MetricRow icon={<TrendingUp size={10} className="text-emerald-500" />} label="RESISTANCE 1" value={article.resistance1 || 'N/A'} />
             <MetricRow icon={<TrendingUp size={10} className="text-emerald-400" />} label="RESISTANCE 2" value={article.resistance2 || 'N/A'} />
             <MetricRow icon={<Target size={10} className="text-rose-500" />} label="SUPPORT 1" value={article.support1 || 'N/A'} />
             <MetricRow icon={<Target size={10} className="text-rose-400" />} label="SUPPORT 2" value={article.support2 || 'N/A'} />
             <MetricRow icon={<Calendar size={10} />} label="NEXT EARNINGS" value={article.nextEarnings || 'N/A'} />
             <MetricRow icon={<Activity size={10} />} label="PREV BEAT/MISS" value={article.prevEarningsResult || 'N/A'} />
          </div>

          <div className={`${fontSizeClass} leading-relaxed text-slate-700 dark:text-slate-300 font-normal bg-slate-50 dark:bg-white/5 p-7 rounded-[2.5rem] border border-slate-100 dark:border-white/5 whitespace-pre-wrap break-words`}>
            {article.content}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="p-8 shrink-0 bg-white/95 dark:bg-slate-900/95 border-t border-slate-100 dark:border-white/5 flex gap-4">
          <a 
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-5 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-[1.8rem] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-premium shadow-blue-500/30 active:scale-95 transition-all"
          >
            <ExternalLink size={18} />
            Original Source
          </a>
        </div>
      </div>
    </div>
  );
};

const MetricRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
    <div className="flex items-center gap-2 mb-1 opacity-60">
      {icon}
      <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-[12px] font-black text-slate-900 dark:text-white tabular-nums">{value}</span>
  </div>
);

export default LatestNews;

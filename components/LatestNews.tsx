
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../App';
import { GoogleGenAI } from '@google/genai';
import { 
  Search, 
  Loader2, 
  Plus, 
  ExternalLink, 
  X,
  RefreshCw,
  Globe,
  AlertTriangle,
  BarChart4,
  Zap,
  Sparkles,
  CheckCircle2,
  Clock,
  Link as LinkIcon,
  Newspaper,
  ChevronRight
} from 'lucide-react';

interface GroundingSource {
  uri: string;
  title: string;
}

interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  summary: string;
  content: string;
  impact: 'positive' | 'negative' | 'neutral';
  symbol: string;
  timestamp: string;
  readTime: string;
  priceUsd?: string;
  resistance1?: string;
  support1?: string;
  groundingSources?: GroundingSource[];
  isAiGenerated: boolean;
}

interface SymbolStatus {
  loading: boolean;
  error?: string;
  lastUpdated?: number;
  mode: 'ai' | 'classic';
}

const LatestNews: React.FC = () => {
  const { profile, setProfile, newsCache, setNewsCache, settings, ensureApiKey, addLog } = useApp();
  const [symbolInput, setSymbolInput] = useState('');
  const [statusMap, setStatusMap] = useState<Record<string, SymbolStatus>>({});
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
  };

  const removeSymbol = (symbol: string) => {
    if (!profile) return;
    const newList = trackedSymbols.filter(s => s !== symbol);
    setProfile({ ...profile, trackedSymbols: newList });
    setNewsCache(prev => prev.filter(item => item.symbol !== symbol));
  };

  const cleanJsonString = (str: string) => {
    let sanitized = str.trim();
    // Handle cases where the model wraps JSON in Markdown code blocks
    if (sanitized.includes('```')) {
      const match = sanitized.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        sanitized = match[1];
      }
    }
    return sanitized.trim();
  };

  // FETCH METHOD 1: Classic RSS-based headlines (Yahoo Finance)
  const fetchClassicTicker = async (symbol: string) => {
    setStatusMap(prev => ({ ...prev, [symbol]: { loading: true, mode: 'classic' } }));
    
    try {
      const rssUrl = `https://finance.yahoo.com/rss/headline?s=${symbol}`;
      const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
      
      const response = await fetch(proxyUrl);
      const data = await response.json();

      if (data.status === 'ok' && data.items && data.items.length > 0) {
        const topNews = data.items.slice(0, 2).map((item: any) => ({
          id: item.guid || `${Date.now()}-${symbol}-${Math.random().toString(36).substr(2, 5)}`,
          title: item.title,
          source: item.author || 'Market Feed',
          url: item.link,
          summary: item.description?.replace(/<[^>]*>?/gm, '').substring(0, 120) + '...',
          content: item.content?.replace(/<[^>]*>?/gm, '') || item.description?.replace(/<[^>]*>?/gm, ''),
          impact: 'neutral',
          symbol,
          timestamp: 'Live Feed',
          readTime: '1 min',
          isAiGenerated: false
        }));

        setNewsCache(prev => {
          const filtered = prev.filter(item => item.symbol !== symbol);
          return [...topNews, ...filtered];
        });

        setStatusMap(prev => ({ 
          ...prev, 
          [symbol]: { loading: false, lastUpdated: Date.now(), mode: 'classic' } 
        }));
      } else {
        throw new Error("No recent headlines found");
      }
    } catch (err: any) {
      console.error(`Classic fetch failed for ${symbol}:`, err);
      setStatusMap(prev => ({ 
        ...prev, 
        [symbol]: { loading: false, error: "Feed Unavailable", mode: 'classic' } 
      }));
    }
  };

  // FETCH METHOD 2: AI-Powered Research (Gemini)
  const fetchAiTicker = async (symbol: string) => {
    setStatusMap(prev => ({ ...prev, [symbol]: { loading: true, mode: 'ai' } }));
    
    try {
      if (!profile?.customApiKey) {
        await fetchClassicTicker(symbol);
        return;
      }

      const ai = new GoogleGenAI({ apiKey: profile.customApiKey });
      const modelName = settings.selectedModel || 'gemini-3-flash-preview';
      
      const prompt = `Perform a financial news analysis for ticker: ${symbol}. 
      Output ONLY a valid JSON array of 1 object:
      [{
        "id": "${Date.now()}-${symbol}",
        "title": "Concise headline",
        "source": "Vantage Insight",
        "url": "https://finance.yahoo.com/quote/${symbol}",
        "summary": "15-word teaser",
        "content": "Professional analysis of recent market sentiment and catalyst events (50-80 words).",
        "impact": "positive" | "negative" | "neutral",
        "symbol": "${symbol}",
        "timestamp": "Real-time",
        "readTime": "2 min",
        "priceUsd": "live price",
        "resistance1": "next level",
        "support1": "floor"
      }]`;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: { 
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });

      if (response && response.text) {
        const jsonString = cleanJsonString(response.text);
        const parsed: NewsItem[] = JSON.parse(jsonString);

        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        const sources: GroundingSource[] = [];
        if (groundingMetadata?.groundingChunks) {
          groundingMetadata.groundingChunks.forEach((chunk: any) => {
            if (chunk.web) sources.push({ uri: chunk.web.uri, title: chunk.web.title });
          });
        }
        
        const enriched = parsed.map(item => ({
          ...item,
          groundingSources: sources.length > 0 ? sources : undefined,
          isAiGenerated: true
        }));

        setNewsCache(prev => {
          const filtered = prev.filter(item => item.symbol !== symbol);
          return [...enriched, ...filtered];
        });

        setStatusMap(prev => ({ 
          ...prev, 
          [symbol]: { loading: false, lastUpdated: Date.now(), mode: 'ai' } 
        }));
      }
    } catch (err: any) {
      console.warn(`AI Intelligence failed for ${symbol}, switching to Standard Feed...`, err);
      await fetchClassicTicker(symbol);
    }
  };

  const refreshAll = useCallback(async () => {
    if (trackedSymbols.length === 0) return;
    
    addLog("Purging old news and initiating full sync...", "info", "News Engine");
    
    // 1. CLEAR CURRENT CACHE for immediate visual feedback
    setNewsCache(prev => prev.filter(item => !trackedSymbols.includes(item.symbol)));
    
    // 2. RESET ALL LOADING STATES
    const initialStatus: Record<string, SymbolStatus> = {};
    trackedSymbols.forEach(s => {
      initialStatus[s] = { 
        loading: true, 
        mode: settings.aiEnabled && profile?.customApiKey ? 'ai' : 'classic' 
      };
    });
    setStatusMap(initialStatus);

    // 3. PROGRESSIVE SYNC
    for (const symbol of trackedSymbols) {
      if (settings.aiEnabled && profile?.customApiKey) {
        await fetchAiTicker(symbol);
      } else {
        await fetchClassicTicker(symbol);
      }
      // Small pause to stagger UI updates and avoid proxy rate limits
      await new Promise(r => setTimeout(r, 300));
    }
  }, [trackedSymbols, settings.aiEnabled, profile?.customApiKey, addLog]);

  const getImpactColor = (impact: string) => {
    switch(impact) {
      case 'negative': return 'bg-rose-500/10 text-rose-500';
      case 'positive': return 'bg-emerald-500/10 text-emerald-500';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-400';
    }
  };

  return (
    <div className="w-full flex flex-col min-h-full pb-32">
      <div className="pt-4 pb-6 px-1 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight">News Feed</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${settings.aiEnabled && profile?.customApiKey ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`}></div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em]">
                {settings.aiEnabled && profile?.customApiKey ? 'AI Augmented Mode' : 'Standard Feed Mode'}
              </p>
            </div>
          </div>
          <button 
            onClick={refreshAll}
            className="w-12 h-12 rounded-[1.3rem] bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 active:scale-95 transition-all shadow-premium"
          >
            <RefreshCw size={22} strokeWidth={2.5} />
          </button>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="relative flex-1">
            <input 
              type="text"
              placeholder="Track Ticker (e.g. BTC, NVDA)..."
              className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-[1.8rem] py-5 pl-14 pr-6 font-extrabold text-[15px] text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-premium"
              value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSymbol()}
            />
            <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <button onClick={addSymbol} className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-glow shrink-0 active:scale-90 transition-all">
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>

        {trackedSymbols.length > 0 && (
          <div className="flex flex-wrap gap-2 px-1">
            {trackedSymbols.map(s => (
              <div key={s} className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${statusMap[s]?.loading ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10'}`}>
                {statusMap[s]?.loading ? (
                  <Loader2 size={12} className="animate-spin text-blue-500" />
                ) : statusMap[s]?.mode === 'ai' ? (
                  <Sparkles size={12} className="text-blue-500" />
                ) : (
                  <Globe size={12} className="text-emerald-500" />
                )}
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">{s}</span>
                <button onClick={() => removeSymbol(s)} className="text-slate-400 hover:text-rose-500 ml-1"><X size={12} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 px-1 space-y-8">
        {trackedSymbols.length === 0 ? (
          <div className="py-24 text-center opacity-30 flex flex-col items-center">
            <Globe size={48} className="mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">No assets tracked</p>
          </div>
        ) : (
          trackedSymbols.map(symbol => {
            const items = newsCache.filter(n => n.symbol === symbol);
            const status = statusMap[symbol];

            return (
              <div key={symbol} className="space-y-4">
                <div className="flex items-center gap-3 px-4 py-1">
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{symbol} Stream</span>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                </div>

                {status?.loading && items.length === 0 && (
                  <div className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-900/20 border border-dashed border-slate-200 dark:border-white/5 animate-pulse flex flex-col items-center justify-center gap-4">
                    <Loader2 size={24} className="animate-spin text-blue-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       {status.mode === 'ai' ? 'Assembling Deep Insights...' : 'Connecting Market Wire...'}
                    </span>
                  </div>
                )}

                {!status?.loading && status?.error && items.length === 0 && (
                  <div className="p-8 rounded-[2.5rem] bg-rose-500/5 border border-rose-500/10 flex flex-col items-center gap-3 text-center">
                    <AlertTriangle size={24} className="text-rose-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">{status.error}</p>
                    <button onClick={() => status.mode === 'ai' ? fetchAiTicker(symbol) : fetchClassicTicker(symbol)} className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mt-2 underline">Retry Symbol</button>
                  </div>
                )}

                <div className="grid gap-4">
                  {items.map(item => (
                    <NewsCard 
                      key={item.id} 
                      item={item} 
                      onPress={() => setSelectedArticle(item)} 
                      getImpactColor={getImpactColor} 
                    />
                  ))}
                </div>
              </div>
            );
          })
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

const NewsCard: React.FC<{ item: NewsItem; onPress: () => void; getImpactColor: (impact: string) => string; }> = ({ item, onPress, getImpactColor }) => (
  <div onClick={onPress} className="bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 p-6 rounded-[2.5rem] shadow-premium transition-all active:scale-[0.98] cursor-pointer group hover:border-blue-500/20">
    <div className="flex items-start justify-between mb-4">
      <div className="flex gap-2">
        {item.isAiGenerated ? (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest">
            <Sparkles size={8} /> AI Insight
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest">
             <Newspaper size={8} /> Market Wire
          </span>
        )}
        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${getImpactColor(item.impact)}`}>{item.impact} Signal</span>
      </div>
      <div className="flex items-center gap-1.5 text-slate-400">
        <Clock size={10} />
        <span className="text-[9px] font-bold uppercase">{item.timestamp}</span>
      </div>
    </div>
    <h3 className="text-[17px] font-black text-slate-900 dark:text-white leading-tight mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">{item.title}</h3>
    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed opacity-80">{item.summary}</p>
    
    <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-50 dark:border-white/5">
       <div className="flex items-center gap-2">
         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.source}</span>
       </div>
       <div className="flex items-center gap-1 text-[9px] font-black text-blue-500 uppercase tracking-widest opacity-60">
         Read Analysis <ChevronRight size={10} />
       </div>
    </div>
  </div>
);

const ArticleDetailPopup: React.FC<{ article: NewsItem; onClose: () => void; getImpactColor: (impact: string) => string; }> = ({ article, onClose, getImpactColor }) => (
  <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
    <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-white/10">
      <div className="pt-8 px-8 pb-5 border-b border-slate-50 dark:border-white/5 flex flex-col gap-4 shrink-0">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 font-black text-[10px]">{article.symbol}</div>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getImpactColor(article.impact)}`}>
                 {article.isAiGenerated ? 'AI Augmented' : 'Market Wire'}
              </span>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 active:scale-90 transition-all"><X size={20} /></button>
         </div>
         <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{article.title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-8 py-6 no-scrollbar space-y-6">
        {article.isAiGenerated && (
          <div className="grid grid-cols-2 gap-3">
             <MetricRow label="MARKET PRICE" value={article.priceUsd || 'N/A'} />
             <MetricRow label="NEXT RESISTANCE" value={article.resistance1 || 'N/A'} />
             <MetricRow label="SUPPORT FLOOR" value={article.support1 || 'N/A'} />
             <MetricRow label="EST. READ TIME" value={article.readTime || '2 min'} />
          </div>
        )}
        
        <div className="text-[14px] leading-relaxed text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-white/5 p-7 rounded-[2.5rem] whitespace-pre-wrap font-medium">
          {article.content || article.summary}
        </div>

        {article.groundingSources && (
          <div className="space-y-3 pt-2">
             <div className="flex items-center gap-2 px-2">
                <Globe size={12} className="text-blue-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Grounding Sources</span>
             </div>
             <div className="grid gap-2">
                {article.groundingSources.map((source, idx) => (
                  <a 
                    key={idx} 
                    href={source.uri} 
                    target="_blank" 
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 group transition-all"
                  >
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate pr-4">{source.title || source.uri}</span>
                    <ExternalLink size={12} className="text-slate-400 group-hover:text-blue-500 shrink-0" />
                  </a>
                ))}
             </div>
          </div>
        )}
      </div>
      <div className="p-8 border-t border-slate-100 dark:border-white/5 flex flex-col gap-3">
        <a href={article.url} target="_blank" className="w-full py-5 bg-blue-600 text-white rounded-[1.8rem] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-glow active:scale-95 transition-all">
           Direct Article Link <ExternalLink size={16} />
        </a>
        <button onClick={onClose} className="w-full py-4 text-slate-400 font-black text-[9px] uppercase tracking-widest">Close Reader</button>
      </div>
    </div>
  </div>
);

const MetricRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">{label}</span>
    <span className="text-[13px] font-black text-slate-900 dark:text-white tabular-nums truncate block">{value}</span>
  </div>
);

export default LatestNews;

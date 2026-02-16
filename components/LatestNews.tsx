
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
  Globe
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
  currentPrice?: string;
}

const LatestNews: React.FC = () => {
  const { profile, setProfile, newsCache, setNewsCache, settings } = useApp();
  const [symbolInput, setSymbolInput] = useState('');
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  
  const trackedSymbols = profile.trackedSymbols || [];

  const addSymbol = () => {
    const sym = symbolInput.trim().toUpperCase();
    if (!sym) return;
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
    const newList = trackedSymbols.filter(s => s !== symbol);
    setProfile({ ...profile, trackedSymbols: newList });
    if (navigator.vibrate) navigator.vibrate(5);
  };

  const cleanJsonString = (str: string) => {
    // Remove markdown code blocks if present
    return str.replace(/```json/g, '').replace(/```/g, '').trim();
  };

  // Efficient Single AI Query with Grounding
  const fetchNews = useCallback(async (isRefresh = false) => {
    if (trackedSymbols.length === 0) {
      setNewsCache([]);
      return;
    }

    // Skip if we have a cache and it's not a forced refresh
    if (!isRefresh && newsCache.length > 0) return;

    setIsLoadingNews(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const model = settings.selectedModel || 'gemini-3-flash-preview';
      
      const prompt = `Perform a Google Search for the ABSOLUTE LATEST real-time financial market news and trading prices as of today for these symbols: ${trackedSymbols.join(', ')}.
      
      Requirements:
      1. For each symbol, provide up to 2 segmented news cards.
      2. You MUST include real-time current prices based on today's search results.
      3. Include specific financial metrics in the content: Support, Resistance, RSI, and 24h Volume.
      4. Distinguish between 'positive', 'negative', 'neutral', and 'critical' impacts.
      
      Return results ONLY as a strictly formatted JSON array of objects. Do not include any preamble or markdown formatting. 
      
      Format Structure:
      [
        {
          "id": "unique-id",
          "title": "Clear headline",
          "source": "Source Name",
          "url": "Direct news link",
          "summary": "Short summary",
          "content": "Detailed analysis with specific numbers",
          "impact": "positive" | "negative" | "neutral" | "critical",
          "symbol": "TICKER",
          "timestamp": "Just now",
          "readTime": "2 min",
          "currentPrice": "$123.45"
        }
      ]`;

      // NOTE: We do NOT set responseMimeType or responseSchema here 
      // because they are incompatible with the googleSearch tool in current API versions.
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      const responseText = response.text || '[]';
      const jsonString = cleanJsonString(responseText);
      const curatedNews: NewsItem[] = JSON.parse(jsonString);
      
      const priorityMap = { critical: 0, negative: 1, positive: 2, neutral: 3 };
      const sorted = curatedNews.sort((a, b) => priorityMap[a.impact] - priorityMap[b.impact]);
      
      setNewsCache(sorted);
    } catch (err) {
      console.error("Vantage AI Sync Failed:", err);
      // If we failed to parse, we might want to try one more time without the strict JSON prompt 
      // or show an error state to the user.
    } finally {
      setIsLoadingNews(false);
    }
  }, [trackedSymbols, newsCache.length, setNewsCache, settings.selectedModel]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

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
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">Session Grounding Active</p>
          </div>
          <button 
            onClick={() => fetchNews(true)}
            disabled={isLoadingNews || trackedSymbols.length === 0}
            className="w-12 h-12 rounded-[1.3rem] bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 shadow-premium active:scale-95 transition-all disabled:opacity-30"
          >
            {isLoadingNews ? <Loader2 size={24} className="animate-spin text-blue-500" /> : <RefreshCw size={24} strokeWidth={2.5} />}
          </button>
        </div>

        <div className="relative group">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input 
                type="text"
                placeholder="Enter Asset Symbol (e.g. APP, NVDA)..."
                className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-[1.8rem] py-5 pl-14 pr-6 font-extrabold text-[15px] text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-premium placeholder:text-slate-400/60"
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
          <div className="flex flex-wrap gap-2.5 px-1 animate-in fade-in slide-in-from-top-1 duration-300">
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
              <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-60 text-center">Type a symbol and click '+' to sync AI curated market news</p>
            </div>
          </div>
        ) : isLoadingNews ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-4">
            <Loader2 size={40} className="animate-spin text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 text-center">AI Grounding in Progress...</span>
          </div>
        ) : (
          <div className="grid gap-4 w-full">
            {newsCache.map((item) => (
              <NewsCard 
                key={item.id} 
                item={item} 
                onLongPress={() => setSelectedArticle(item)}
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
  onLongPress: () => void;
  getImpactColor: (impact: string) => string;
}> = ({ item, onLongPress, getImpactColor }) => {
  const timerRef = useRef<number | null>(null);
  const [isPressing, setIsPressing] = useState(false);

  const startPress = () => {
    setIsPressing(true);
    timerRef.current = window.setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50);
      onLongPress();
      setIsPressing(false);
    }, 600);
  };

  const endPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsPressing(false);
  };

  return (
    <div 
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      className={`block bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 p-6 rounded-[2.5rem] shadow-premium select-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-2
        ${isPressing ? 'scale-[0.97] brightness-95 shadow-none ring-2 ring-blue-500/20' : 'hover:border-blue-500/30 active:scale-[0.99]'}
        w-full overflow-hidden min-h-[180px] flex flex-col justify-between`}
    >
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-black uppercase tracking-widest text-blue-600 bg-blue-600/10 px-3 py-1 rounded-full whitespace-nowrap">
              {item.symbol}
            </span>
            {item.currentPrice && (
              <span className="text-[11px] font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                 {item.currentPrice}
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
        <div className="flex items-center gap-2 min-w-0">
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{item.source}</span>
        </div>
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
  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl animate-in slide-in-from-bottom-6 duration-500 relative flex flex-col h-auto max-h-[85vh] overflow-hidden">
        
        {/* Fixed Header */}
        <div className="pt-8 px-8 pb-5 shrink-0 flex flex-col gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 border-b border-slate-50 dark:border-white/5">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-wrap">
                <div className={`px-4 py-1.5 rounded-full ${getImpactColor(article.impact)}`}>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{article.impact} Priority</span>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l border-slate-200 dark:border-white/10 pl-3">{article.timestamp}</span>
              </div>
              <button 
                onClick={onClose}
                className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 active:scale-90 transition-all flex items-center justify-center"
              >
                <X size={22} />
              </button>
           </div>
           
           <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-2 break-words">
                {article.title}
              </h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black text-blue-500 uppercase tracking-widest">{article.source}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{article.readTime}</span>
                </div>
                {article.currentPrice && (
                  <div className="px-3 py-1 bg-blue-600 text-white rounded-xl text-[12px] font-black">
                    {article.currentPrice}
                  </div>
                )}
              </div>
            </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-8 py-6 no-scrollbar space-y-6">
          <p className="text-[16px] leading-relaxed text-slate-700 dark:text-slate-300 font-medium bg-slate-50 dark:bg-white/5 p-7 rounded-[2.5rem] border border-slate-100 dark:border-white/5 whitespace-pre-wrap break-words">
            {article.content}
          </p>
        </div>

        {/* Fixed Footer */}
        <div className="p-8 shrink-0 bg-white/95 dark:bg-slate-900/95 border-t border-slate-100 dark:border-white/5 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4.5 rounded-[1.8rem] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 active:scale-95 transition-all text-xs uppercase tracking-widest"
          >
            Dismiss
          </button>
          <a 
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-[1.5] py-4.5 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-premium shadow-blue-500/30 active:scale-95 transition-all"
          >
            <ExternalLink size={18} />
            Visit Source
          </a>
        </div>
      </div>
    </div>
  );
};

export default LatestNews;

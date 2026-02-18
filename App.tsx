
import React, { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  Settings as SettingsIcon, 
  User,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  History,
  Activity,
  Newspaper,
  AlertTriangle,
  Key,
  Terminal,
  BarChart3
} from 'lucide-react';
import { Portfolio, Currency, UserProfile, AppSettings, ExchangeRates, Transaction, Goal, PortfolioType, LogEntry, Trade } from './types';
import { INITIAL_RATES } from './constants';
import { db } from './db';
import Dashboard from './components/Dashboard';
import Portfolios from './components/Portfolios';
import Settings from './components/Settings';
import Insights from './components/Insights';
import Transactions from './components/Transactions';
import LatestNews from './components/LatestNews';
import Trading from './components/Trading';
import Analytics from './components/Analytics';
import AuthGateway from './components/AuthGateway';
import UnlockScreen from './components/UnlockScreen';
import PortfolioForm from './components/PortfolioForm';
import { TransactionModal } from './components/Transactions';
import { GoogleGenAI } from '@google/genai';

interface AppContextType {
  portfolios: Portfolio[];
  setPortfolios: React.Dispatch<React.SetStateAction<Portfolio[]>>;
  addPortfolio: (p: Omit<Portfolio, 'updatedAt'>) => void;
  updatePortfolio: (p: Portfolio) => void;
  deletePortfolio: (id: string) => void;
  trades: Trade[];
  setTrades: React.Dispatch<React.SetStateAction<Trade[]>>;
  addTrade: (t: Omit<Trade, 'updatedAt'>) => void;
  updateTrade: (t: Trade) => void;
  deleteTrade: (id: string) => void;
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  addGoal: (g: Omit<Goal, 'updatedAt'>) => void;
  updateGoal: (g: Goal) => void;
  deleteGoal: (id: string) => void;
  baseCurrency: Currency;
  setBaseCurrency: React.Dispatch<React.SetStateAction<Currency>>;
  profile: UserProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  rates: ExchangeRates;
  lastUpdated: Date;
  signOut: () => Promise<void>;
  reloadData: () => Promise<void>;
  shouldOpenProfile: boolean;
  setShouldOpenProfile: (val: boolean) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  activePortfolioSection: PortfolioType | null;
  setActivePortfolioSection: (section: PortfolioType | null) => void;
  setIsTxModalOpen: (val: boolean) => void;
  setIsPortfolioModalOpen: (val: boolean) => void;
  newsCache: any[];
  setNewsCache: React.Dispatch<React.SetStateAction<any[]>>;
  vantageScore: number | null;
  setVantageScore: React.Dispatch<React.SetStateAction<number | null>>;
  vantageAdvice: string;
  setVantageAdvice: React.Dispatch<React.SetStateAction<string>>;
  isSyncing: boolean;
  refreshVantageScore: (force?: boolean) => Promise<void>;
  isAiRestricted: boolean;
  hasApiKey: boolean;
  ensureApiKey: () => Promise<boolean>;
  logs: LogEntry[];
  addLog: (msg: string, type?: 'error' | 'info', context?: string) => void;
  clearLogs: () => void;
}

type TabType = 'dashboard' | 'transactions' | 'portfolios' | 'settings' | 'insights' | 'news' | 'trading' | 'analytics';

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [activePortfolioSection, setActivePortfolioSection] = useState<PortfolioType | null>(null);
  const [shouldOpenProfile, setShouldOpenProfile] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [baseCurrency, setBaseCurrency] = useState<Currency>(Currency.CAD);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings>({ 
    darkMode: false, 
    fontSize: 'M', 
    privacyMode: false, 
    autoSync: true,
    selectedModel: 'gemini-3-flash-preview',
    developerMode: false,
    tradingEnabled: false,
    aiEnabled: true,
    biometricEnabled: true,
    dashboardV2Enabled: false
  });
  const [rates, setRates] = useState<ExchangeRates>(INITIAL_RATES);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAiRestricted, setIsAiRestricted] = useState(false);
  const [showKeyWarning, setShowKeyWarning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  const [newsCache, setNewsCache] = useState<any[]>([]);
  const [vantageScore, setVantageScore] = useState<number | null>(null);
  const [vantageAdvice, setVantageAdvice] = useState<string>('');

  const backgroundTimeRef = useRef<number | null>(null);
  const lockGracePeriodRef = useRef<number>(3 * 60 * 1000); 

  const hasApiKey = !!(profile?.customApiKey);

  const addLog = useCallback((message: string, type: 'error' | 'info' = 'info', context?: string) => {
    setLogs(prev => [{ timestamp: Date.now(), message, type, context }, ...prev].slice(0, 100));
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  const ensureApiKey = async (): Promise<boolean> => {
    if (!profile?.customApiKey) {
      addLog("AI action blocked: Missing API Key", "error", "Security Guard");
      setShowKeyWarning(true);
      return false;
    }
    return true;
  };

  const reloadData = useCallback(async () => {
    const [savedPortfolios, savedGoals, savedProfile, savedSettings, savedTrades] = await Promise.all([
      db.getAllPortfolios(),
      db.getAllGoals(),
      db.getProfile(),
      db.getSettings(),
      db.getAllTrades()
    ]);
    
    if (savedPortfolios) setPortfolios(savedPortfolios);
    if (savedGoals) setGoals(savedGoals);
    if (savedTrades) setTrades(savedTrades);
    if (savedProfile) {
      setProfile(savedProfile);
      setIsAuth(true);
      if (savedProfile.pin) setIsLocked(true);
    } else {
      setIsAuth(false);
    }
    if (savedSettings) setSettings(prev => ({ ...prev, ...savedSettings }));
  }, []);

  const calculateFinancialSummary = useCallback(() => {
    let savings = 0, investments = 0, debt = 0, emis = 0;
    portfolios.forEach(p => {
      const valInBase = p.currency === baseCurrency ? p.value : p.value * rates[p.currency][baseCurrency];
      if (p.type === PortfolioType.SAVINGS) savings += valInBase;
      if (p.type === PortfolioType.INVESTMENTS) investments += valInBase;
      if (p.type === PortfolioType.DEBTS) debt += valInBase;
      if (p.type === PortfolioType.EMIS) emis += valInBase;
    });
    return {
      assets: savings + investments,
      liabilities: debt + emis,
      count: portfolios.length,
      net: (savings + investments) - (debt + emis)
    };
  }, [portfolios, baseCurrency, rates]);

  const callAiWithRetry = async (fn: () => Promise<any>, retries = 3, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (e: any) {
        const errorMsg = e.message || JSON.stringify(e);
        addLog(`AI call failed (attempt ${i + 1}): ${errorMsg}`, "error", "Vantage Core");
        
        if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
          setIsAiRestricted(true);
          if (i === retries - 1) throw e;
          await sleep(delay * Math.pow(2, i));
        } else if (errorMsg.includes('API key not valid') || errorMsg.includes('invalid api key') || errorMsg.includes('401')) {
          setShowKeyWarning(true);
          throw e;
        } else {
          throw e;
        }
      }
    }
  };

  const refreshVantageScore = useCallback(async (force: boolean = false) => {
    if (!settings.aiEnabled || portfolios.length === 0 || isSyncing) return;
    if (!force) return;

    if (!(await ensureApiKey())) return;

    setIsSyncing(true);
    try {
      const summaryData = calculateFinancialSummary();
      const apiKeyToUse = profile?.customApiKey || process.env.API_KEY || '';
      const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
      
      const response = await callAiWithRetry(() => 
        ai.models.generateContent({
          model: settings.selectedModel || 'gemini-3-flash-preview',
          contents: `Analyze financial health. Summary: ${JSON.stringify(summaryData)}. Base Unit: ${baseCurrency}. Return JSON: { "score": 0-100, "advice": "One clear paragraph." }`,
          config: { responseMimeType: "application/json" }
        })
      );

      if (response && response.text) {
        const result = JSON.parse(response.text);
        setVantageScore(result.score);
        setVantageAdvice(result.advice);
        setIsAiRestricted(false);
        addLog("Vantage Pulse score updated successfully", "info", "Health Check");
      }
    } catch (e: any) {
      console.error("Pulse sync failed", e);
      addLog(`Pulse Analysis Critical failure: ${e.message}`, "error", "Health Check");
    } finally {
      setIsSyncing(false);
    }
  }, [portfolios, baseCurrency, settings.aiEnabled, settings.selectedModel, isSyncing, calculateFinancialSummary, ensureApiKey, profile?.customApiKey, addLog]);

  useEffect(() => {
    const initApp = async () => {
      try {
        await db.init();
        await reloadData();
        setIsReady(true);
      } catch (err) {
        console.error("Critical: Failed to initialize native engine", err);
      }
    };
    initApp();
  }, [reloadData]);

  const signOut = async () => {
    setProfile(null);
    setIsAuth(false);
    setIsLocked(false);
    backgroundTimeRef.current = null;
    setNewsCache([]);
    setVantageScore(null);
    setVantageAdvice('');
    setIsAiRestricted(false);
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        backgroundTimeRef.current = Date.now();
      } else if (document.visibilityState === 'visible') {
        const now = Date.now();
        const lastSeen = backgroundTimeRef.current;

        if (isAuth && profile?.pin && !isLocked && lastSeen) {
          const gap = now - lastSeen;
          if (gap > lockGracePeriodRef.current) {
            setIsLocked(true);
          }
        }
        backgroundTimeRef.current = null;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuth, profile?.pin, isLocked]);

  const handleAuthComplete = async (newProfile: UserProfile) => {
    setProfile(newProfile);
    setIsAuth(true);
    setIsLocked(false);
    await db.saveProfile(newProfile);
    await reloadData();
  };

  useEffect(() => {
    if (isReady && profile) db.saveProfile(profile);
  }, [profile, isReady]);

  useEffect(() => {
    if (isReady) db.saveSettings(settings);
    
    const sizes = { S: '14px', M: '16px', L: '18px', XL: '20px' };
    document.documentElement.style.fontSize = sizes[settings.fontSize] || '16px';
    
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
      metaThemeColor?.setAttribute('content', '#020617');
    } else {
      document.documentElement.classList.remove('dark');
      metaThemeColor?.setAttribute('content', '#f8fafc');
    }
  }, [settings, isReady]);

  const fetchRealRates = async () => {
    try {
      const response = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD');
      if (!response.ok) throw new Error('Primary API failed');
      const json = await response.json();
      
      if (json && json.data && json.data.rates) {
        const data = json.data.rates;
        const usdToCad = parseFloat(data.CAD);
        const usdToInr = parseFloat(data.INR);
        
        const newRates: ExchangeRates = {
          USD: { USD: 1, CAD: usdToCad, INR: usdToInr },
          CAD: { USD: 1 / usdToCad, CAD: 1, INR: usdToInr / usdToCad },
          INR: { USD: 1 / usdToInr, CAD: usdToCad / usdToInr, INR: 1 }
        };
        
        setRates(newRates);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.warn("Market Sync Failed", error);
    }
  };

  useEffect(() => {
    fetchRealRates();
    const interval = setInterval(fetchRealRates, 30000); 
    return () => clearInterval(interval);
  }, []);

  const addPortfolio = (p: Omit<Portfolio, 'updatedAt'>) => {
    const newP = { ...p, updatedAt: Date.now() };
    setPortfolios(prev => [...prev, newP]);
    db.savePortfolio(newP);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const updatePortfolio = (p: Portfolio) => {
    const updated = { ...p, updatedAt: Date.now() };
    setPortfolios(prev => prev.map(item => item.id === p.id ? updated : item));
    db.savePortfolio(updated);
  };
  
  const deletePortfolio = (id: string) => {
    setPortfolios(prev => prev.filter(p => p.id !== id));
    db.deletePortfolio(id);
    if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
  };

  const addTrade = (t: Omit<Trade, 'updatedAt'>) => {
    const newT = { ...t, updatedAt: Date.now() };
    setTrades(prev => [...prev, newT]);
    db.saveTrade(newT);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const updateTrade = (t: Trade) => {
    const updated = { ...t, updatedAt: Date.now() };
    setTrades(prev => prev.map(item => item.id === t.id ? updated : item));
    db.saveTrade(updated);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const deleteTrade = (id: string) => {
    setTrades(prev => prev.filter(t => t.id !== id));
    db.deleteTrade(id);
    if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
  };

  const addGoal = (g: Omit<Goal, 'updatedAt'>) => {
    const newG = { ...g, updatedAt: Date.now() };
    setGoals(prev => [...prev, newG]);
    db.saveGoal(newG);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const updateGoal = (g: Goal) => {
    const updated = { ...g, updatedAt: Date.now() };
    setGoals(prev => prev.map(item => item.id === g.id ? updated : item));
    db.saveGoal(updated);
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    db.deleteGoal(id);
    if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
  };

  if (!isReady) {
    return (
      <div className="h-[100dvh] w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#020617] text-blue-600">
        <Loader2 size={48} className="animate-spin mb-4" />
        <p className="font-black tracking-widest text-[10px] uppercase opacity-50">Initializing Native Engine</p>
      </div>
    );
  }

  if (!isAuth || !profile) {
    return <AuthGateway onComplete={handleAuthComplete} />;
  }

  const contextValue = {
    portfolios,
    setPortfolios,
    addPortfolio,
    updatePortfolio,
    deletePortfolio,
    trades,
    setTrades,
    addTrade,
    updateTrade,
    deleteTrade,
    goals,
    setGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    baseCurrency,
    setBaseCurrency,
    profile,
    setProfile,
    settings,
    setSettings,
    rates,
    lastUpdated,
    signOut,
    reloadData,
    shouldOpenProfile,
    setShouldOpenProfile,
    activeTab,
    setActiveTab,
    activePortfolioSection,
    setActivePortfolioSection,
    setIsTxModalOpen,
    setIsPortfolioModalOpen,
    newsCache,
    setNewsCache,
    vantageScore,
    setVantageScore,
    vantageAdvice,
    setVantageAdvice,
    isSyncing,
    refreshVantageScore,
    isAiRestricted,
    hasApiKey,
    ensureApiKey,
    logs,
    addLog,
    clearLogs
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="h-full min-h-[100dvh] flex flex-col md:flex-row max-w-7xl mx-auto bg-slate-50 dark:bg-[#020617] transition-all duration-500 antialiased overflow-hidden w-full relative">
        {isLocked && <UnlockScreen profile={profile} onUnlock={() => setIsLocked(false)} />}

        <header className="md:hidden pt-4 px-5 pb-3 flex justify-between items-center shrink-0 glass sticky top-0 z-40 w-full border-b border-white/20 dark:border-white/5">
          <div 
            className="flex items-center gap-3 cursor-pointer active:opacity-70 tap-scale flex-1"
            onClick={() => {
              setActiveTab('settings');
              setShouldOpenProfile(true);
              if (navigator.vibrate) navigator.vibrate(5);
            }}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white overflow-hidden font-bold text-xs shadow-glow shadow-inner-light">
               {profile?.firstName?.[0] || '?'}
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white leading-none">{profile?.name || 'Vantage User'}</span>
              <div className="flex items-center gap-1 mt-0.5">
                <ShieldCheck size={10} className="text-emerald-500" />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Vault Secured</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isAiRestricted && (
              <div className="flex items-center justify-center p-2 text-amber-500 animate-pulse" title="AI Rate Limited">
                <AlertTriangle size={18} />
              </div>
            )}
            <button 
              onClick={() => {
                setSettings(s => ({ ...s, privacyMode: !s.privacyMode }));
                if (navigator.vibrate) navigator.vibrate(5);
              }}
              className={`p-2.5 rounded-2xl transition-all duration-300 ${settings.privacyMode ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-slate-200/50 dark:bg-slate-800/50 text-slate-500'}`}
            >
              {settings.privacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <button 
              onClick={() => {
                setActiveTab('settings');
                if (navigator.vibrate) navigator.vibrate(5);
              }}
              className={`p-2.5 rounded-2xl transition-all duration-300 ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-200/50 dark:bg-slate-800/50 text-slate-500'}`}
            >
              <SettingsIcon size={18} />
            </button>
          </div>
        </header>

        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-lg glass md:relative md:w-64 md:left-0 md:translate-x-0 md:bottom-0 md:border-none md:bg-transparent z-50 rounded-[2.5rem] px-2 py-2 shadow-2xl md:shadow-none transition-all duration-500 md:flex md:flex-col md:items-stretch overflow-hidden">
          <div className="flex md:flex-col justify-between items-center md:items-start md:p-6 gap-1 md:gap-1.5">
            <div className="hidden md:flex flex-col gap-5 mb-10 w-full">
               <div 
                  className="flex items-center gap-4 cursor-pointer active:opacity-70 transition-all p-3 rounded-[2rem] hover:bg-white/40 dark:hover:bg-slate-800/40"
                  onClick={() => {
                    setActiveTab('settings');
                    setShouldOpenProfile(true);
                    if (navigator.vibrate) navigator.vibrate(5);
                  }}
                >
                  <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white overflow-hidden font-black shadow-glow shadow-inner-light">
                     {profile?.firstName?.[0] || '?'}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white leading-none mb-1 truncate">{profile?.name || 'Vantage User'}</span>
                    <div className="flex items-center gap-1">
                      <ShieldCheck size={12} className="text-emerald-500" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] truncate">Active Vault</span>
                    </div>
                  </div>
               </div>
            </div>

            <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Dashboard" />
            <TabButton active={activeTab === 'portfolios'} onClick={() => setActiveTab('portfolios')} icon={<Wallet size={20} />} label="Assets" />
            {settings.tradingEnabled && (
              <TabButton active={activeTab === 'trading'} onClick={() => setActiveTab('trading')} icon={<BarChart3 size={20} />} label="Trading" />
            )}
            <TabButton active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<History size={20} />} label="Activity" />
            {settings.aiEnabled && (
              <TabButton active={activeTab === 'insights'} onClick={() => setActiveTab('insights')} icon={<Sparkles size={20} />} label="AI Hub" />
            )}
            <TabButton active={activeTab === 'news'} onClick={() => setActiveTab('news')} icon={<Newspaper size={20} />} label="News" />
            <div className="hidden md:block w-full">
              <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon size={20} />} label="Settings" />
            </div>
          </div>
        </nav>

        <main className="flex-1 overflow-y-auto pb-32 md:pb-8 scroll-smooth scroll-container no-scrollbar w-full">
          <div className="w-full px-5 pt-4 md:px-10 md:pt-10 animate-in fade-in slide-in-from-bottom-5 duration-700 flex flex-col items-stretch max-w-5xl mx-auto">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'portfolios' && <Portfolios />}
            {activeTab === 'trading' && settings.tradingEnabled && <Trading />}
            {activeTab === 'transactions' && <Transactions />}
            {activeTab === 'insights' && settings.aiEnabled && <Insights />}
            {activeTab === 'news' && <LatestNews />}
            {activeTab === 'settings' && <Settings />}
            {activeTab === 'analytics' && <Analytics />}
          </div>
        </main>

        {isPortfolioModalOpen && (
          <PortfolioForm onClose={() => setIsPortfolioModalOpen(false)} />
        )}

        {isTxModalOpen && (
          <TransactionModal 
            onClose={() => setIsTxModalOpen(false)} 
            onSuccess={() => { reloadData(); setIsTxModalOpen(false); }}
          />
        )}

        {/* API Key Missing Popup */}
        {showKeyWarning && (
          <div className="fixed inset-0 z-[300] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
             <div className="bg-white dark:bg-slate-900 w-full max-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-500 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-[1.2rem] bg-amber-500/10 flex items-center justify-center text-amber-500 mb-6">
                   <Key size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">AI Activation Required</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
                  To provide market intelligence and portfolio analysis, Vantage requires your personal Gemini API Key. Please update your key in Settings.
                </p>
                <div className="flex flex-col gap-3 w-full">
                  <button 
                    onClick={() => { setShowKeyWarning(false); setActiveTab('settings'); }}
                    className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest shadow-premium active:scale-95 transition-all"
                  >
                    Go to Settings
                  </button>
                  <button 
                    onClick={() => setShowKeyWarning(false)}
                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest active:scale-95 transition-all"
                  >
                    Dismiss
                  </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
};

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label }) => {
  return (
    <button 
      onClick={() => { onClick(); if (navigator.vibrate) navigator.vibrate(5); }}
      className={`
        flex flex-col md:flex-row items-center gap-1.5 md:gap-4 p-2.5 md:px-5 md:py-4 rounded-[1.8rem] flex-1 md:w-full transition-all duration-300 tap-scale
        ${active 
          ? 'text-blue-600 bg-white/60 dark:bg-blue-600/10 shadow-lg md:shadow-md' 
          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/30 dark:hover:bg-slate-800/30'}
      `}
    >
      <div className={`transition-all duration-300 ${active ? 'scale-110 drop-shadow-glow' : 'scale-100 opacity-80'}`}>
        {icon}
      </div>
      <span className={`text-[9px] md:text-[15px] font-black md:font-black tracking-tight ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
    </button>
  );
};

export default App;

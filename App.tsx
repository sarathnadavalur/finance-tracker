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
  Newspaper
} from 'lucide-react';
import { Portfolio, Currency, UserProfile, AppSettings, ExchangeRates, Transaction, Goal } from './types';
import { INITIAL_RATES } from './constants';
import { db } from './db';
import Dashboard from './components/Dashboard';
import Portfolios from './components/Portfolios';
import Settings from './components/Settings';
import Insights from './components/Insights';
import Transactions from './components/Transactions';
import LatestNews from './components/LatestNews';
import AuthGateway from './components/AuthGateway';
import UnlockScreen from './components/UnlockScreen';
import PortfolioForm from './components/PortfolioForm';
import { TransactionModal } from './components/Transactions';

interface AppContextType {
  portfolios: Portfolio[];
  setPortfolios: React.Dispatch<React.SetStateAction<Portfolio[]>>;
  addPortfolio: (p: Omit<Portfolio, 'updatedAt'>) => void;
  updatePortfolio: (p: Portfolio) => void;
  deletePortfolio: (id: string) => void;
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  addGoal: (g: Omit<Goal, 'updatedAt'>) => void;
  updateGoal: (g: Goal) => void;
  deleteGoal: (id: string) => void;
  baseCurrency: Currency;
  setBaseCurrency: (c: Currency) => void;
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  rates: ExchangeRates;
  lastUpdated: Date;
  signOut: () => Promise<void>;
  reloadData: () => Promise<void>;
  shouldOpenProfile: boolean;
  setShouldOpenProfile: (val: boolean) => void;
  setActiveTab: (tab: 'dashboard' | 'transactions' | 'portfolios' | 'settings' | 'insights' | 'news') => void;
  setIsTxModalOpen: (val: boolean) => void;
  setIsPortfolioModalOpen: (val: boolean) => void;
  newsCache: any[];
  setNewsCache: (news: any[]) => void;
  vantageScore: number | null;
  setVantageScore: (score: number | null) => void;
  vantageAdvice: string;
  setVantageAdvice: (advice: string) => void;
  isSyncing: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'portfolios' | 'settings' | 'insights' | 'news'>('dashboard');
  const [shouldOpenProfile, setShouldOpenProfile] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [baseCurrency, setBaseCurrency] = useState<Currency>(Currency.CAD);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings>({ 
    darkMode: false, 
    fontSize: 16, 
    privacyMode: false, 
    autoSync: true,
    selectedModel: 'gemini-3-flash-preview'
  });
  const [rates, setRates] = useState<ExchangeRates>(INITIAL_RATES);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [newsCache, setNewsCache] = useState<any[]>([]);
  const [vantageScore, setVantageScore] = useState<number | null>(null);
  const [vantageAdvice, setVantageAdvice] = useState<string>('');

  const backgroundTimeRef = useRef<number | null>(null);
  const lockGracePeriodRef = useRef<number>(3 * 60 * 1000); 

  const reloadData = useCallback(async () => {
    const [savedPortfolios, savedGoals, savedProfile, savedSettings] = await Promise.all([
      db.getAllPortfolios(),
      db.getAllGoals(),
      db.getProfile(),
      db.getSettings()
    ]);
    
    if (savedPortfolios) setPortfolios(savedPortfolios);
    if (savedGoals) setGoals(savedGoals);
    if (savedProfile) {
      setProfile(savedProfile);
      setIsAuth(true);
      if (savedProfile.pin) setIsLocked(true);
    } else {
      setIsAuth(false);
    }
    if (savedSettings) setSettings(prev => ({ ...prev, ...savedSettings }));
  }, []);

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
    
    document.documentElement.style.fontSize = `${settings.fontSize}px`;
    
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
    if (isSyncing) return;
    setIsSyncing(true);
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
      try {
        const fbResponse = await fetch('https://open.er-api.com/v6/latest/USD');
        const fbJson = await fbResponse.json();
        if (fbJson && fbJson.rates) {
          const data = fbJson.rates;
          const usdToCad = parseFloat(data.CAD);
          const usdToInr = parseFloat(data.INR);
          setRates({
            USD: { USD: 1, CAD: usdToCad, INR: usdToInr },
            CAD: { USD: 1 / usdToCad, CAD: 1, INR: usdToInr / usdToCad },
            INR: { USD: 1 / usdToInr, CAD: usdToCad / usdToInr, INR: 1 }
          });
          setLastUpdated(new Date());
        }
      } catch (fbError) {
        console.warn("Market Sync Failed - All endpoints unreachable", fbError);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchRealRates();
    const interval = setInterval(fetchRealRates, 5000); 
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
    setActiveTab,
    setIsTxModalOpen,
    setIsPortfolioModalOpen,
    newsCache,
    setNewsCache,
    vantageScore,
    setVantageScore,
    vantageAdvice,
    setVantageAdvice,
    isSyncing
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
               {profile.firstName[0]}
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white leading-none">{profile.name}</span>
              <div className="flex items-center gap-1 mt-0.5">
                <ShieldCheck size={10} className="text-emerald-500" />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Vault Secured</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => {
                setSettings(s => ({ ...s, privacyMode: !s.privacyMode }));
                if (navigator.vibrate) navigator.vibrate(5);
              }}
              className={`p-2.5 rounded-2xl transition-all duration-300 ${settings.privacyMode ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-slate-200/50 dark:bg-slate-800/50 text-slate-500'}`}
            >
              {settings.privacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
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
                     {profile.firstName[0]}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white leading-none mb-1 truncate">{profile.name}</span>
                    <div className="flex items-center gap-1">
                      <ShieldCheck size={12} className="text-emerald-500" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] truncate">Active Vault</span>
                    </div>
                  </div>
               </div>
            </div>

            <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Dashboard" />
            <TabButton active={activeTab === 'portfolios'} onClick={() => setActiveTab('portfolios')} icon={<Wallet size={20} />} label="Assets" />
            <TabButton active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<History size={20} />} label="Activity" />
            <TabButton active={activeTab === 'insights'} onClick={() => setActiveTab('insights')} icon={<Sparkles size={20} />} label="AI Hub" />
            <TabButton active={activeTab === 'news'} onClick={() => setActiveTab('news')} icon={<Newspaper size={20} />} label="News" />
            <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon size={20} />} label="Settings" />
          </div>
        </nav>

        <main className="flex-1 overflow-y-auto pb-32 md:pb-8 scroll-smooth scroll-container no-scrollbar w-full">
          <div className="w-full px-5 pt-4 md:px-10 md:pt-10 animate-in fade-in slide-in-from-bottom-5 duration-700 flex flex-col items-stretch max-w-5xl mx-auto">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'portfolios' && <Portfolios />}
            {activeTab === 'transactions' && <Transactions />}
            {activeTab === 'insights' && <Insights />}
            {activeTab === 'news' && <LatestNews />}
            {activeTab === 'settings' && <Settings />}
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
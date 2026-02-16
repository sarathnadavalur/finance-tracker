
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
  History
} from 'lucide-react';
import { Portfolio, Currency, UserProfile, AppSettings, ExchangeRates } from './types';
import { INITIAL_RATES } from './constants';
import { db } from './db';
import Dashboard from './components/Dashboard';
import Portfolios from './components/Portfolios';
import Settings from './components/Settings';
import Insights from './components/Insights';
import Transactions from './components/Transactions';
import AuthGateway from './components/AuthGateway';
import UnlockScreen from './components/UnlockScreen';

interface AppContextType {
  portfolios: Portfolio[];
  setPortfolios: React.Dispatch<React.SetStateAction<Portfolio[]>>;
  addPortfolio: (p: Omit<Portfolio, 'updatedAt'>) => void;
  updatePortfolio: (p: Portfolio) => void;
  deletePortfolio: (id: string) => void;
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
  setActiveTab: (tab: 'dashboard' | 'transactions' | 'portfolios' | 'settings' | 'insights') => void;
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'portfolios' | 'settings' | 'insights'>('dashboard');
  const [shouldOpenProfile, setShouldOpenProfile] = useState(false);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [baseCurrency, setBaseCurrency] = useState<Currency>(Currency.CAD);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings>({ darkMode: false, fontSize: 16, privacyMode: false, autoSync: true });
  const [rates, setRates] = useState<ExchangeRates>(INITIAL_RATES);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const backgroundTimeRef = useRef<number | null>(null);
  const lockGracePeriodRef = useRef<number>(3 * 60 * 1000); 

  const reloadData = useCallback(async () => {
    const [savedPortfolios, savedProfile, savedSettings] = await Promise.all([
      db.getAllPortfolios(),
      db.getProfile(),
      db.getSettings()
    ]);
    
    if (savedPortfolios) setPortfolios(savedPortfolios);
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
    
    // Set root font size for rem-based scaling
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
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await response.json();
      if (data && data.rates) {
        const usdToCad = data.rates.CAD;
        const usdToInr = data.rates.INR;
        const newRates: ExchangeRates = {
          USD: { USD: 1, CAD: usdToCad, INR: usdToInr },
          CAD: { USD: 1 / usdToCad, CAD: 1, INR: usdToInr / usdToCad },
          INR: { USD: 1 / usdToInr, CAD: usdToCad / usdToInr, INR: 1 }
        };
        setRates(newRates);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Exchange Rate Sync Failed", error);
    }
  };

  useEffect(() => {
    fetchRealRates();
    const interval = setInterval(fetchRealRates, 300000);
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
    setActiveTab
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="h-full min-h-[100dvh] flex flex-col md:flex-row max-w-7xl mx-auto bg-slate-50 dark:bg-[#020617] transition-colors duration-300 antialiased overflow-hidden w-full relative">
        {isLocked && <UnlockScreen profile={profile} onUnlock={() => setIsLocked(false)} />}

        <header className="md:hidden pt-3 px-4 pb-3 flex justify-between items-center border-b border-slate-200 dark:border-white/5 shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-40 w-full">
          <div 
            className="flex items-center gap-2 cursor-pointer active:opacity-70 transition-opacity flex-1"
            onClick={() => {
              setActiveTab('settings');
              setShouldOpenProfile(true);
              if (navigator.vibrate) navigator.vibrate(5);
            }}
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white overflow-hidden font-black text-[10px]">
               {profile.firstName[0]}
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white leading-none">{profile.name}</span>
              <div className="flex items-center gap-1 mt-0.5">
                <ShieldCheck size={10} className="text-emerald-500" />
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Local Vault Active</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => {
                setSettings(s => ({ ...s, privacyMode: !s.privacyMode }));
                if (navigator.vibrate) navigator.vibrate(5);
              }}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {settings.privacyMode ? <EyeOff size={18} className="text-rose-500" /> : <Eye size={18} className="text-slate-500" />}
            </button>
          </div>
        </header>

        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-t border-slate-200 dark:border-white/5 md:relative md:w-56 md:border-t-0 md:border-r md:bg-transparent z-30 pb-[env(safe-area-inset-bottom,0)] shrink-0">
          <div className="flex md:flex-col justify-around md:justify-start items-center p-1.5 md:p-5 md:gap-2">
            <div className="hidden md:flex flex-col gap-4 mb-8 w-full px-2">
               <div 
                  className="flex items-center gap-3 cursor-pointer active:opacity-70 transition-opacity"
                  onClick={() => {
                    setActiveTab('settings');
                    setShouldOpenProfile(true);
                    if (navigator.vibrate) navigator.vibrate(5);
                  }}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white overflow-hidden font-black">
                     {profile.firstName[0]}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white leading-none mb-1 truncate">{profile.name}</span>
                    <div className="flex items-center gap-1">
                      <ShieldCheck size={10} className="text-emerald-500" />
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">Local Vault</span>
                    </div>
                  </div>
               </div>
            </div>

            <TabButton active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); if(navigator.vibrate) navigator.vibrate(5); }} icon={<LayoutDashboard size={22} />} label="Home" />
            <TabButton active={activeTab === 'transactions'} onClick={() => { setActiveTab('transactions'); if(navigator.vibrate) navigator.vibrate(5); }} icon={<History size={22} />} label="Activity" />
            <TabButton active={activeTab === 'portfolios'} onClick={() => { setActiveTab('portfolios'); if(navigator.vibrate) navigator.vibrate(5); }} icon={<Wallet size={22} />} label="Wallets" />
            <TabButton active={activeTab === 'insights'} onClick={() => { setActiveTab('insights'); if(navigator.vibrate) navigator.vibrate(5); }} icon={<Sparkles size={22} />} label="AI Advisor" />
            <TabButton active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); if(navigator.vibrate) navigator.vibrate(5); }} icon={<SettingsIcon size={22} />} label="Settings" />
          </div>
        </nav>

        <main className="flex-1 overflow-y-auto pb-24 md:pb-6 scroll-smooth scroll-container no-scrollbar w-full">
          <div className="w-full p-4 md:p-6 animate-in fade-in slide-in-from-bottom-2 duration-500 flex flex-col items-stretch">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'transactions' && <Transactions />}
            {activeTab === 'portfolios' && <Portfolios />}
            {activeTab === 'insights' && <Insights />}
            {activeTab === 'settings' && <Settings />}
          </div>
        </main>
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

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`
      flex flex-col md:flex-row items-center gap-1 md:gap-3 p-2 md:px-3 md:py-2.5 rounded-xl w-full transition-all duration-300
      ${active 
        ? 'text-blue-600 md:bg-blue-50 dark:md:bg-blue-600/10 md:shadow-sm' 
        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}
    `}
  >
    {icon}
    <span className="text-[9px] md:text-sm font-bold tracking-tight">{label}</span>
  </button>
);

export default App;

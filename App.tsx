import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  Settings as SettingsIcon, 
  User,
  Moon,
  Sun,
  Loader2
} from 'lucide-react';
import { Portfolio, Currency, UserProfile, AppSettings, ExchangeRates } from './types';
import { INITIAL_RATES } from './constants';
import { db } from './db';
import Dashboard from './components/Dashboard';
import Portfolios from './components/Portfolios';
import Settings from './components/Settings';

interface AppContextType {
  portfolios: Portfolio[];
  setPortfolios: React.Dispatch<React.SetStateAction<Portfolio[]>>;
  addPortfolio: (p: Portfolio) => void;
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
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'portfolios' | 'settings'>('dashboard');
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [baseCurrency, setBaseCurrency] = useState<Currency>(Currency.CAD);
  const [profile, setProfile] = useState<UserProfile>({ name: 'Guest User', email: 'guest@example.com' });
  const [settings, setSettings] = useState<AppSettings>({ darkMode: false, fontSize: 16 });
  const [rates, setRates] = useState<ExchangeRates>(INITIAL_RATES);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const initApp = async () => {
      try {
        await db.init();
        const [savedPortfolios, savedProfile, savedSettings] = await Promise.all([
          db.getAllPortfolios(),
          db.getProfile(),
          db.getSettings()
        ]);
        if (savedPortfolios) setPortfolios(savedPortfolios);
        if (savedProfile) setProfile(savedProfile);
        if (savedSettings) setSettings(savedSettings);
        setIsReady(true);
      } catch (err) {
        console.error("Critical: Failed to initialize native database", err);
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    if (isReady) db.saveProfile(profile);
  }, [profile, isReady]);

  useEffect(() => {
    if (isReady) db.saveSettings(settings);
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

  useEffect(() => {
    const jitterInterval = setInterval(() => {
      setRates(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        const jitter = () => (1 + (Math.random() - 0.5) * 0.0001);
        next.CAD.INR *= jitter();
        next.CAD.USD *= jitter();
        next.INR.CAD = 1 / next.CAD.INR;
        next.USD.CAD = 1 / next.CAD.USD;
        next.USD.INR = next.USD.CAD * next.CAD.INR;
        next.INR.USD = 1 / next.USD.INR;
        return next;
      });
    }, 1000);
    return () => clearInterval(jitterInterval);
  }, []);

  const addPortfolio = (p: Portfolio) => {
    setPortfolios(prev => [...prev, p]);
    db.savePortfolio(p);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const updatePortfolio = (p: Portfolio) => {
    setPortfolios(prev => prev.map(item => item.id === p.id ? p : item));
    db.savePortfolio(p);
  };
  
  const deletePortfolio = (id: string) => {
    setPortfolios(prev => prev.filter(p => p.id !== id));
    db.deletePortfolio(id);
    if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
  };

  if (!isReady) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#020617] text-blue-600">
        <Loader2 size={48} className="animate-spin mb-4" />
        <p className="font-black tracking-widest text-[10px] uppercase opacity-50">Initializing Native Engine</p>
      </div>
    );
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
    lastUpdated
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div 
        className="h-full flex flex-col md:flex-row max-w-7xl mx-auto bg-slate-50 dark:bg-[#020617] transition-colors duration-300 antialiased overflow-hidden w-full"
        style={{ fontSize: `${settings.fontSize}px` }}
      >
        <header className="md:hidden pt-[env(safe-area-inset-top,0.5rem)] px-4 pb-2 flex justify-between items-center border-b border-slate-200 dark:border-white/5 shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-40 w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
              <User size={16} />
            </div>
            <span className="font-black text-base tracking-tight text-slate-900 dark:text-white">{profile.name}</span>
          </div>
          <button 
            onClick={() => setSettings(s => ({ ...s, darkMode: !s.darkMode }))}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {settings.darkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-slate-600" />}
          </button>
        </header>

        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-t border-slate-200 dark:border-white/5 md:relative md:w-56 md:border-t-0 md:border-r md:bg-transparent z-50 pb-[env(safe-area-inset-bottom,0)] shrink-0">
          <div className="flex md:flex-col justify-around md:justify-start items-center p-1.5 md:p-5 md:gap-2">
            <div className="hidden md:flex items-center gap-3 mb-8 w-full px-2">
              <div className="w-9 h-9 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <User size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white leading-none mb-1 truncate max-w-[120px]">{profile.name}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">FinVue Pro</span>
              </div>
            </div>

            <TabButton active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); if(navigator.vibrate) navigator.vibrate(5); }} icon={<LayoutDashboard size={22} />} label="Dashboard" />
            <TabButton active={activeTab === 'portfolios'} onClick={() => { setActiveTab('portfolios'); if(navigator.vibrate) navigator.vibrate(5); }} icon={<Wallet size={22} />} label="Wallet" />
            <TabButton active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); if(navigator.vibrate) navigator.vibrate(5); }} icon={<SettingsIcon size={22} />} label="Settings" />
          </div>
        </nav>

        <main className="flex-1 overflow-y-auto pb-24 md:pb-6 scroll-smooth scroll-container no-scrollbar w-full">
          <div className="w-full p-4 md:p-6 animate-in fade-in slide-in-from-bottom-2 duration-500 flex flex-col items-stretch">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'portfolios' && <Portfolios />}
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
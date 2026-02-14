
import React, { useRef } from 'react';
import { useApp } from '../App';
import { User, Moon, Sun, Type, Trash2, Shield, Bell, Download, Upload, Database } from 'lucide-react';

const Settings: React.FC = () => {
  const { profile, setProfile, settings, setSettings, portfolios, setPortfolios } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportData = () => {
    const exportPayload = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      profile: profile,
      portfolios: portfolios,
      settings: settings
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finvue_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (data && data.portfolios && data.profile) {
          if (confirm('Importing this file will overwrite your current data. Continue?')) {
            setPortfolios(data.portfolios);
            setProfile(data.profile);
            if (data.settings) setSettings(data.settings);
            alert('Data imported successfully!');
          }
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Error parsing backup file.');
        console.error(err);
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetApp = () => {
    if (window.confirm('Delete everything? This will wipe all portfolios and settings permanently.')) {
      // 1. Clear physical storage
      localStorage.clear();
      
      // 2. Clear state pointers to avoid race conditions during reload
      setPortfolios([]);
      setProfile({ name: 'Guest User', email: 'guest@example.com' });
      
      // 3. Force hard browser refresh by setting location explicitly
      window.location.href = window.location.origin + window.location.pathname;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <div>
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Configure your profile and application preferences</p>
      </div>

      {/* Profile Section */}
      <section className="bg-white dark:bg-slate-900/50 backdrop-blur-sm rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-600/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <User size={24} />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Profile Data</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Display Name</label>
            <input 
              type="text"
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={profile.name}
              onChange={(e) => setProfile({...profile, name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Email Address</label>
            <input 
              type="email"
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={profile.email}
              onChange={(e) => setProfile({...profile, email: e.target.value})}
            />
          </div>
        </div>
      </section>

      {/* Data Management Section */}
      <section className="bg-white dark:bg-slate-900/50 backdrop-blur-sm rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-600/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Database size={24} />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Data & Backup</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={exportData}
            className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl group hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/30"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <Download size={20} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-900 dark:text-white">Export Backup</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">Save to JSON</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl group hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <Upload size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-900 dark:text-white">Import Backup</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">Restore data</p>
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".json" 
              onChange={handleImport}
            />
          </button>
        </div>
      </section>

      {/* Visual Preferences */}
      <section className="bg-white dark:bg-slate-900/50 backdrop-blur-sm rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-600/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Shield size={24} />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Preferences</h2>
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">
                {settings.darkMode ? <Moon size={22} className="text-yellow-400" /> : <Sun size={22} className="text-orange-500" />}
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Dark Mode</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Enable high-contrast night theme</p>
              </div>
            </div>
            <button 
              onClick={() => setSettings({...settings, darkMode: !settings.darkMode})}
              className={`w-14 h-8 rounded-full transition-colors relative focus:outline-none ${settings.darkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${settings.darkMode ? 'right-1' : 'left-1'}`}></div>
            </button>
          </div>

          <div className="space-y-4 px-2">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                <Type size={22} className="text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Font Size</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Adjust the scale of app text</p>
              </div>
            </div>
            <div className="pt-4">
              <input 
                type="range"
                min="12"
                max="24"
                step="1"
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                value={settings.fontSize}
                onChange={(e) => setSettings({...settings, fontSize: parseInt(e.target.value)})}
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-4 uppercase tracking-widest">
                <span>Small</span>
                <span className="text-blue-600 dark:text-blue-400">{settings.fontSize}px</span>
                <span>Large</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-rose-50 dark:bg-rose-950/20 rounded-[2.5rem] p-8 border border-rose-100 dark:border-rose-900/30 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600">
              <Trash2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-rose-800 dark:text-rose-400">Reset Data</h2>
              <p className="text-sm text-rose-600 dark:text-rose-400/60 font-medium">Wipe all portfolios and reset profile</p>
            </div>
          </div>
          <button 
            onClick={resetApp}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-rose-500/20 active:scale-95"
          >
            Reset App
          </button>
        </div>
      </section>

      <div className="text-center pt-10 pb-20">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">FinVue v1.0.5 - Modern Finance Native</p>
      </div>
    </div>
  );
};

export default Settings;


import React, { useRef } from 'react';
import { useApp } from '../App';
import { db } from '../db';
import { User, Moon, Sun, Type, Trash2, Shield, Download, Upload, Database } from 'lucide-react';

const Settings: React.FC = () => {
  const { profile, setProfile, settings, setSettings, portfolios, setPortfolios } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportData = () => {
    const exportPayload = {
      version: "1.1",
      timestamp: new Date().toISOString(),
      profile,
      portfolios,
      settings
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finvue_native_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (data && data.portfolios && data.profile) {
          if (confirm('Importing this file will overwrite your Internal Database. Continue?')) {
            // Bulk update DB
            await db.clearAll();
            for (const p of data.portfolios) {
              await db.savePortfolio(p);
            }
            await db.saveProfile(data.profile);
            if (data.settings) await db.saveSettings(data.settings);
            
            // Reload app to re-hydrate from DB
            window.location.reload();
          }
        }
      } catch (err) {
        alert('Invalid native backup file.');
      }
    };
    reader.readAsText(file);
  };

  const resetApp = async () => {
    if (window.confirm('Wipe Internal Database? This will erase all data permanently from this device.')) {
      if (navigator.vibrate) navigator.vibrate([100, 30, 100]);
      await db.clearAll();
      localStorage.clear();
      window.location.href = window.location.origin + window.location.pathname;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <div className="pt-4">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Native standalone preferences</p>
      </div>

      {/* Profile Section */}
      <section className="bg-white dark:bg-slate-900/50 backdrop-blur-sm rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-600/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <User size={24} />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Profile</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Display Name</label>
            <input 
              type="text"
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              value={profile.name}
              onChange={(e) => setProfile({...profile, name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email Address</label>
            <input 
              type="email"
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              value={profile.email}
              onChange={(e) => setProfile({...profile, email: e.target.value})}
            />
          </div>
        </div>
      </section>

      {/* Data Section */}
      <section className="bg-white dark:bg-slate-900/50 backdrop-blur-sm rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-600/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Database size={24} />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Internal Database</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={exportData}
            className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl group transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">
                <Download size={20} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-900 dark:text-white">Backup DB</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">To JSON</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl group transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">
                <Upload size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-900 dark:text-white">Restore DB</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Overwrite device</p>
              </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
          </button>
        </div>
      </section>

      {/* Preferences Section */}
      <section className="bg-white dark:bg-slate-900/50 backdrop-blur-sm rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-600/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Shield size={24} />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Appearance</h2>
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">
                {settings.darkMode ? <Moon size={22} className="text-yellow-400" /> : <Sun size={22} className="text-orange-500" />}
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Native Dark Mode</p>
                <p className="text-xs text-slate-500">System contrast theme</p>
              </div>
            </div>
            <button 
              onClick={() => setSettings({...settings, darkMode: !settings.darkMode})}
              className={`w-14 h-8 rounded-full transition-colors relative ${settings.darkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${settings.darkMode ? 'right-1' : 'left-1'}`}></div>
            </button>
          </div>

          <div className="space-y-4 px-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                <Type size={22} className="text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">UI Scale</p>
                <p className="text-xs text-slate-500">Adjust readability</p>
              </div>
            </div>
            <div className="pt-2">
              <input 
                type="range"
                min="12"
                max="24"
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                value={settings.fontSize}
                onChange={(e) => setSettings({...settings, fontSize: parseInt(e.target.value)})}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-rose-50 dark:bg-rose-950/20 rounded-[2.5rem] p-8 border border-rose-100 dark:border-rose-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600">
              <Trash2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-rose-800 dark:text-rose-400">Wipe Engine</h2>
              <p className="text-sm text-rose-600 dark:text-rose-400/60 font-medium">Clear native database storage</p>
            </div>
          </div>
          <button 
            onClick={resetApp}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl transition-all shadow-lg"
          >
            Clear All
          </button>
        </div>
      </section>

      <div className="text-center pt-10 pb-20">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">FinVue Standalone v1.1.2</p>
      </div>
    </div>
  );
};

export default Settings;

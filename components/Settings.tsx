
import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { db } from '../db';
import { 
  User, Moon, Trash2, Shield, 
  Download, Upload, RefreshCcw, 
  Fingerprint, ChevronRight, X, 
  Mail, LogOut, Loader2, Type,
  Cpu, Key, Save, Terminal, Code,
  Trash, BarChart3, Lock, Sparkles,
  Delete, LayoutTemplate, Maximize
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { UserProfile, AppSettings, LogEntry, FontSizeLabel } from '../types';

const Settings: React.FC = () => {
  const { profile, setProfile, settings, setSettings, signOut, shouldOpenProfile, setShouldOpenProfile, hasApiKey, logs, clearLogs, addLog, reloadData } = useApp();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showPinResetModal, setShowPinResetModal] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [dataActionLoading, setDataActionLoading] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(profile?.customApiKey || '');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      if (!settings.aiEnabled) return;
      
      const apiKeyToUse = profile?.customApiKey || process.env.GEMINI_API_KEY || process.env.API_KEY || '';
      if (!apiKeyToUse) return;

      setIsLoadingModels(true);
      try {
        const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
        const models = [];
        const response = await ai.models.list();
        for await (const model of response) {
          if (model.name.includes('gemini')) {
            models.push(model);
          }
        }
        setAvailableModels(models);
      } catch (e) {
        console.error("Failed to fetch models", e);
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
  }, [settings.aiEnabled, profile?.customApiKey]);

  useEffect(() => {
    if (shouldOpenProfile) {
      setShowProfileModal(true);
      setShouldOpenProfile(false);
    }
  }, [shouldOpenProfile, setShouldOpenProfile]);

  useEffect(() => {
    const checkBio = async () => {
      const available = !!window.PublicKeyCredential && 
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      setBioAvailable(available);
    };
    checkBio();
  }, []);

  const handleSaveApiKey = async () => {
    if (!profile) return;
    setIsSavingKey(true);
    const key = localApiKey.trim();
    const updatedProfile = { ...profile, customApiKey: key };
    setProfile(updatedProfile);
    await db.saveProfile(updatedProfile);
    if (navigator.vibrate) navigator.vibrate(10);
    addLog(key ? "Custom Gemini API Key commit successful" : "Custom Gemini API Key removed", "info", "Security Vault");
    setTimeout(() => setIsSavingKey(false), 800);
  };

  const handleExport = async () => {
    setDataActionLoading(true);
    try {
      const [portfolios, profileData, settingsData, transactions, goals, trades, snapshots] = await Promise.all([
        db.getAllPortfolios(),
        db.getProfile(),
        db.getSettings(),
        db.getAllTransactions(),
        db.getAllGoals(),
        db.getAllTrades(),
        db.getAllSnapshots()
      ]);
      const sanitizedProfile = profileData ? { ...profileData } : null;
      if (sanitizedProfile) { 
        delete sanitizedProfile.biometricId; 
        delete sanitizedProfile.customApiKey; 
        delete sanitizedProfile.pin;
      }
      const backup = { 
        version: '2.6.0', 
        timestamp: Date.now(), 
        profile: sanitizedProfile, 
        settings: settingsData, 
        portfolios, 
        transactions,
        goals,
        trades,
        snapshots
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vantage_vault_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      addLog("Vault data exported to file", "info", "Maintenance");
    } catch (err) { addLog("Vault export failed", "error", "Maintenance"); } finally { setDataActionLoading(false); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setDataActionLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.portfolios && !data.transactions) throw new Error("Invalid format");

        if (data.portfolios) {
          for (const p of data.portfolios) await db.savePortfolio(p);
        }
        if (data.transactions) {
          for (const t of data.transactions) await db.saveTransaction(t);
        }
        if (data.goals) {
          for (const g of data.goals) await db.saveGoal(g);
        }
        if (data.trades) {
          for (const tr of data.trades) await db.saveTrade(tr);
        }
        if (data.snapshots) {
          for (const s of data.snapshots) await db.saveSnapshot(s);
        }
        if (data.settings) {
          const newSettings = { ...settings, ...data.settings };
          setSettings(newSettings);
          await db.saveSettings(newSettings);
        }
        
        await reloadData();
        addLog("Vault data imported successfully", "info", "Maintenance");
        alert("Import complete! Your data has been merged/restored.");
      } catch (err) {
        addLog("Vault import failed: Invalid file", "error", "Maintenance");
        alert("Failed to import. Ensure the file is a valid Vantage backup.");
      } finally {
        setDataActionLoading(false);
        e.target.value = ''; 
      }
    };
    reader.readAsText(file);
  };

  const resetApp = async () => {
    if (window.confirm('Wipe Internal Database? This will erase all data permanently.')) {
      await db.clearAll(); localStorage.clear(); window.location.href = window.location.origin + window.location.pathname;
    }
  };

  return (
    <div className="w-full pb-20">
      <div className="pt-6 pb-8 px-5">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">Settings</h1>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">System Configuration</p>
      </div>

      <button onClick={() => setShowProfileModal(true)} className="w-full bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-white/5 py-5 px-5 flex items-center justify-between group active:bg-slate-50 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600 relative shrink-0 font-black">
            {profile?.firstName?.[0] || '?'}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-[3px] border-white dark:border-[#020617]"></div>
          </div>
          <div className="text-left"><p className="font-black text-slate-900 dark:text-white text-lg leading-none">{profile?.name || 'Vantage User'}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Local Identity Secured</p></div>
        </div>
        <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500" />
      </button>

      <div className="mt-8 space-y-8 w-full">
        <SettingsGroup title="Interface">
          <SettingsRow icon={<Moon size={16} className="text-blue-500" />} label="Dark Mode" action={<button onClick={() => setSettings({...settings, darkMode: !settings.darkMode})} className={`w-10 h-6 rounded-full relative transition-colors ${settings.darkMode ? 'bg-blue-600' : 'bg-slate-300'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.darkMode ? 'right-1' : 'left-1'}`}></div></button>} />
          <SettingsRow icon={<Type size={16} className="text-purple-500" />} label="Font Size" action={<div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">{(['S', 'M', 'L', 'XL'] as FontSizeLabel[]).map(size => (<button key={size} onClick={() => setSettings({...settings, fontSize: size})} className={`px-3 py-1.5 rounded-lg text-[10px] font-black ${settings.fontSize === size ? 'bg-white dark:bg-slate-700 text-blue-600' : 'text-slate-400'}`}>{size}</button>))}</div>} />
          <SettingsRow icon={<Maximize size={16} className="text-blue-500" />} label="Scale Factor" action={<div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">{[0.7, 0.85, 1, 1.15, 1.3].map(scale => (<button key={scale} onClick={() => setSettings({...settings, scaleFactor: scale})} className={`px-2 py-1.5 rounded-lg text-[9px] font-black ${settings.scaleFactor === scale ? 'bg-white dark:bg-slate-700 text-blue-600' : 'text-slate-400'}`}>{scale}x</button>))}</div>} />
          
          <div className="p-5 border-b border-slate-100 dark:border-white/5 last:border-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                  <Sparkles size={16} className="text-purple-500" />
                </div>
                <span className="font-bold text-sm text-slate-700 dark:text-slate-200">Glossy Index</span>
              </div>
              <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{settings.glossyIndex || 50}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={settings.glossyIndex || 50} 
              onChange={(e) => setSettings({...settings, glossyIndex: parseInt(e.target.value)})}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Matte</span>
              <span>Glass</span>
            </div>
          </div>
        </SettingsGroup>

        <SettingsGroup title="Beta Lab">
          <SettingsRow icon={<LayoutTemplate size={16} className="text-blue-500" />} label="Try New Dashboard (V2)" action={<button onClick={() => setSettings({...settings, dashboardV2Enabled: !settings.dashboardV2Enabled})} className={`w-10 h-6 rounded-full relative transition-colors ${settings.dashboardV2Enabled ? 'bg-blue-600' : 'bg-slate-300'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.dashboardV2Enabled ? 'right-1' : 'left-1'}`}></div></button>} />
          <SettingsRow icon={<BarChart3 size={16} className="text-emerald-500" />} label="Enable Trading Hub" action={<button onClick={() => setSettings({...settings, tradingEnabled: !settings.tradingEnabled})} className={`w-10 h-6 rounded-full relative transition-colors ${settings.tradingEnabled ? 'bg-emerald-600' : 'bg-slate-300'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.tradingEnabled ? 'right-1' : 'left-1'}`}></div></button>} />
        </SettingsGroup>

        <SettingsGroup title="Intelligence Core">
          <SettingsRow icon={<Sparkles size={16} className="text-blue-500" />} label="Enable AI Intelligence" action={<button onClick={() => setSettings({...settings, aiEnabled: !settings.aiEnabled})} className={`w-10 h-6 rounded-full relative transition-colors ${settings.aiEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.aiEnabled ? 'right-1' : 'left-1'}`}></div></button>} />
          {settings.aiEnabled && (
            <div className="p-5 space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400">Gemini API Key</label>
                <div className="flex gap-2">
                  <input type="password" placeholder="Paste key..." className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-5 py-3.5 font-bold text-sm outline-none" value={localApiKey} onChange={(e) => setLocalApiKey(e.target.value)} />
                  <button onClick={handleSaveApiKey} disabled={isSavingKey} className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-600 text-white shadow-lg">{isSavingKey ? <RefreshCcw size={20} className="animate-spin" /> : <Save size={20} />}</button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-slate-400">AI Model Selection</label>
                  {isLoadingModels && <Loader2 size={14} className="animate-spin text-blue-500" />}
                </div>
                <div className="relative">
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-5 py-3.5 font-bold text-sm outline-none appearance-none cursor-pointer"
                    value={settings.selectedModel || 'gemini-3-flash-preview'}
                    onChange={(e) => setSettings({...settings, selectedModel: e.target.value})}
                    disabled={isLoadingModels || availableModels.length === 0}
                  >
                    {availableModels.length === 0 && !isLoadingModels && (
                      <option value={settings.selectedModel}>{settings.selectedModel}</option>
                    )}
                    {availableModels.map(model => {
                      const isFree = model.name.toLowerCase().includes('flash') || model.name.toLowerCase().includes('lite');
                      return (
                        <option key={model.name} value={model.name}>
                          {model.displayName || model.name} {isFree ? '(Free)' : '(Paid)'}
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronRight size={16} className="rotate-90" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  {availableModels.find(m => m.name === settings.selectedModel)?.description || 'Select the AI model that powers Vantage Insights.'}
                </p>
              </div>
            </div>
          )}
        </SettingsGroup>

        <SettingsGroup title="Data Management">
          <SettingsRow 
            icon={<Download size={16} className="text-blue-500" />} 
            label="Export Vault (.json)" 
            action={
              <button 
                onClick={handleExport} 
                disabled={dataActionLoading} 
                className="text-[9px] font-black uppercase px-3 py-1.5 bg-blue-500/10 text-blue-500 rounded-lg disabled:opacity-50"
              >
                {dataActionLoading ? 'Processing...' : 'Export'}
              </button>
            } 
          />
          <SettingsRow 
            icon={<Upload size={16} className="text-purple-500" />} 
            label="Import Vault (.json)" 
            action={
              <label className="text-[9px] font-black uppercase px-3 py-1.5 bg-purple-500/10 text-purple-500 rounded-lg cursor-pointer">
                {dataActionLoading ? 'Processing...' : 'Import'}
                <input type="file" accept=".json" className="hidden" onChange={handleImport} disabled={dataActionLoading} />
              </label>
            } 
          />
        </SettingsGroup>

        <SettingsGroup title="Danger Zone">
          <SettingsRow icon={<Trash2 size={16} className="text-rose-500" />} label="Destroy Local Database" destructive action={<button onClick={resetApp} className="text-[9px] font-black uppercase px-3 py-1.5 bg-rose-500/10 text-rose-500 rounded-lg">Clear</button>} />
        </SettingsGroup>
      </div>

      {showProfileModal && profile && <ProfileModal profile={profile} onClose={() => setShowProfileModal(false)} onUpdate={(p) => { setProfile(p); db.saveProfile(p); }} onSignOut={async () => { await signOut(); setShowProfileModal(false); }} />}
    </div>
  );
};

const SettingsGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="w-full space-y-px"><h3 className="text-[10px] font-black text-slate-400 uppercase px-5 mb-3">{title}</h3><div className="bg-white dark:bg-slate-900/50 border-y divide-y divide-slate-100 dark:divide-white/5">{children}</div></div>
);

const SettingsRow: React.FC<{ icon: React.ReactNode; label: string; action?: React.ReactNode; destructive?: boolean }> = ({ icon, label, action, destructive }) => (
  <div className="flex items-center justify-between py-3 px-5"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center">{icon}</div><span className={`text-[14px] font-bold ${destructive ? 'text-rose-500' : 'text-slate-800 dark:text-slate-100'}`}>{label}</span></div>{action}</div>
);

const ProfileModal: React.FC<{ profile: UserProfile; onClose: () => void; onUpdate: (p: UserProfile) => void; onSignOut: () => void }> = ({ profile, onClose, onUpdate, onSignOut }) => {
  const [formData, setFormData] = useState({ ...profile });
  const handleSave = () => { onUpdate(formData); onClose(); };
  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4"><div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-2xl relative"><div className="flex items-center justify-between mb-8"><div><h2 className="text-2xl font-black">Identity Hub</h2></div><button onClick={onClose} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500"><X size={20} /></button></div><div className="space-y-6 mb-8"><input className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-5 py-4 font-bold" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value, name: `${e.target.value} ${formData.lastName}`})} /><input className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-5 py-4 font-bold" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value, name: `${formData.firstName} ${e.target.value}`})} /></div><button onClick={handleSave} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl">Update Identity</button><button onClick={onSignOut} className="w-full mt-3 py-4 text-rose-500 font-bold">Sign Out</button></div></div>
  );
};

export default Settings;

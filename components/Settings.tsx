
import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { db } from '../db';
import { 
  User, Moon, Trash2, Shield, 
  Download, Upload, RefreshCcw, 
  Fingerprint, ChevronRight, X, 
  Mail, LogOut, Loader2, FileJson,
  Database, Type, Activity,
  Cpu
} from 'lucide-react';
import { UserProfile, Portfolio, Transaction, AppSettings } from '../types';

const Settings: React.FC = () => {
  const { profile, setProfile, settings, setSettings, signOut, shouldOpenProfile, setShouldOpenProfile } = useApp();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [dataActionLoading, setDataActionLoading] = useState(false);

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

  const handleExport = async () => {
    setDataActionLoading(true);
    try {
      const [portfolios, profileData, settingsData, transactions] = await Promise.all([
        db.getAllPortfolios(),
        db.getProfile(),
        db.getSettings(),
        db.getAllTransactions()
      ]);

      const backup = {
        version: '2.2.0',
        timestamp: Date.now(),
        profile: profileData,
        settings: settingsData,
        portfolios,
        transactions
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vantage_vault_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
    } catch (err) {
      alert("Failed to export vault data.");
    } finally {
      setDataActionLoading(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("Importing this vault will overwrite all current local data. This action cannot be undone. Continue?")) {
      e.target.value = '';
      return;
    }

    setDataActionLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.profile || !data.portfolios) throw new Error("Invalid vault format");

        await db.clearAll();
        
        if (data.profile) await db.saveProfile(data.profile);
        if (data.settings) await db.saveSettings(data.settings);
        
        for (const p of data.portfolios) {
          await db.savePortfolio(p);
        }
        
        if (data.transactions) {
          for (const t of data.transactions) {
            await db.saveTransaction(t);
          }
        }

        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        window.location.reload(); 
      } catch (err) {
        alert("Import failed. The file may be corrupted or in an incompatible format.");
      } finally {
        setDataActionLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const setupBiometrics = async () => {
    try {
      setIsRegistering(true);
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const userID = new Uint8Array(16);
      window.crypto.getRandomValues(userID);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: { name: "Vantage App", id: window.location.hostname },
        user: { id: userID, name: profile.email, displayName: profile.name },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
        authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
        timeout: 60000,
        attestation: "none",
      };

      const credential = await navigator.credentials.create({ publicKey: publicKeyCredentialCreationOptions }) as PublicKeyCredential;
      if (credential) {
        const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        setProfile({ ...profile, biometricId: credentialId });
        if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
      }
    } catch (err) {
      console.error("Biometric registration failed", err);
    } finally {
      setIsRegistering(false);
    }
  };

  const resetApp = async () => {
    if (window.confirm('Wipe Internal Database? This will erase all data permanently.')) {
      if (navigator.vibrate) navigator.vibrate(100);
      await db.clearAll();
      localStorage.clear();
      window.location.href = window.location.origin + window.location.pathname;
    }
  };

  return (
    <div className="w-full pb-20">
      <div className="pt-6 pb-8 px-5">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">Settings</h1>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">System Configuration</p>
      </div>

      <div className="w-full">
        <button 
          onClick={() => setShowProfileModal(true)}
          className="w-full bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-white/5 py-5 px-5 flex items-center justify-between group active:bg-slate-50 dark:active:bg-slate-800 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600 relative shrink-0 font-black">
              {profile.firstName[0]}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-[3px] border-white dark:border-[#020617]"></div>
            </div>
            <div className="text-left overflow-hidden">
              <p className="font-black text-slate-900 dark:text-white text-lg leading-none truncate">{profile.name}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Local Identity Secured</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
        </button>
      </div>

      <div className="mt-8 space-y-8 w-full">
        <SettingsGroup title="Interface">
          <SettingsRow 
            icon={<Moon size={16} className="text-blue-500" />} 
            label="Dark Mode" 
            action={
              <button 
                onClick={() => setSettings({...settings, darkMode: !settings.darkMode})}
                className={`w-10 h-6 rounded-full transition-colors relative ${settings.darkMode ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all ${settings.darkMode ? 'right-1' : 'left-1'}`}></div>
              </button>
            } 
          />
          <SettingsRow 
            icon={<Type size={16} className="text-purple-500" />} 
            label="Font Size" 
            action={
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 w-8 text-center">{settings.fontSize}px</span>
                <input 
                  type="range"
                  min="12"
                  max="22"
                  value={settings.fontSize}
                  onChange={(e) => setSettings({...settings, fontSize: parseInt(e.target.value)})}
                  className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            } 
          />
          <SettingsRow 
            icon={<Cpu size={16} className="text-emerald-500" />} 
            label="AI Brain" 
            action={
              <select 
                value={settings.selectedModel}
                onChange={(e) => setSettings({...settings, selectedModel: e.target.value})}
                className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-2 py-1.5 font-black text-[10px] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 uppercase tracking-tighter"
              >
                <option value="gemini-flash-lite-latest">Flash Lite (Free & Ultra Fast)</option>
                <option value="gemini-3-flash-preview">Flash (Free & Fast)</option>
                <option value="gemini-3-pro-preview">Pro (Complex & Slow)</option>
              </select>
            }
          />
          <SettingsRow 
            icon={<Fingerprint size={16} className="text-indigo-500" />} 
            label="Biometric Protection" 
            disabled={!bioAvailable}
            action={
              bioAvailable ? (
                <button 
                  onClick={setupBiometrics}
                  className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${profile.biometricId ? 'text-emerald-500 bg-emerald-500/10' : 'text-blue-500 bg-blue-500/10'}`}
                >
                  {profile.biometricId ? 'Verified' : 'Setup'}
                </button>
              ) : <span className="text-[9px] font-black text-slate-400">N/A</span>
            }
          />
        </SettingsGroup>

        <SettingsGroup title="Backup & Recovery">
          <div className="px-5 py-4 bg-blue-50/50 dark:bg-blue-900/10 border-y border-blue-100 dark:border-blue-500/10">
            <div className="flex items-start gap-3">
              <Shield size={16} className="text-blue-500 mt-1 shrink-0" />
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-wider">
                Privacy first: Your data never leaves this device. Use these tools to manually export backups or migrate your vault to a new device.
              </p>
            </div>
          </div>
          <SettingsRow 
            icon={<Upload size={16} className="text-sky-500" />} 
            label="Export Data" 
            action={
              <button 
                onClick={handleExport}
                disabled={dataActionLoading}
                className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all disabled:opacity-30"
              >
                {dataActionLoading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              </button>
            } 
          />
          <SettingsRow 
            icon={<Download size={16} className="text-indigo-500" />} 
            label="Import Data" 
            action={
              <div className="relative">
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImport}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={dataActionLoading}
                />
                <div className="p-1.5 text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-all">
                  <Download size={16} />
                </div>
              </div>
            } 
          />
        </SettingsGroup>

        <SettingsGroup title="Danger Zone">
          <SettingsRow 
            icon={<Trash2 size={16} className="text-rose-500" />} 
            label="Destroy Local Database" 
            destructive
            action={
              <button 
                onClick={resetApp}
                className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-rose-500/10 text-rose-500 rounded-lg active:scale-95 transition-all"
              >
                Clear
              </button>
            } 
          />
        </SettingsGroup>
      </div>

      <div className="text-center pt-16">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Vantage Portable v2.2.0</p>
      </div>

      {showProfileModal && (
        <ProfileModal 
          profile={profile} 
          onClose={() => setShowProfileModal(false)} 
          onUpdate={(p) => {
            setProfile(p);
            db.saveProfile(p);
          }}
          onSignOut={async () => {
            await signOut();
            setShowProfileModal(false);
          }}
        />
      )}
    </div>
  );
};

const SettingsGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="w-full space-y-px">
    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] px-5 mb-3">{title}</h3>
    <div className="bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-white/5 divide-y divide-slate-100 dark:divide-white/5 w-full">
      {children}
    </div>
  </div>
);

const SettingsRow: React.FC<{ icon: React.ReactNode; label: string; action?: React.ReactNode; destructive?: boolean; disabled?: boolean }> = ({ icon, label, action, destructive, disabled }) => (
  <div className={`flex items-center justify-between py-3 px-5 w-full ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <span className={`text-[14px] font-bold tracking-tight truncate ${destructive ? 'text-rose-500' : 'text-slate-800 dark:text-slate-100'}`}>{label}</span>
    </div>
    <div className="shrink-0 ml-4">
      {action}
    </div>
  </div>
);

const ProfileModal: React.FC<{ profile: UserProfile; onClose: () => void; onUpdate: (p: UserProfile) => void; onSignOut: () => void }> = ({ profile, onClose, onUpdate, onSignOut }) => {
  const [formData, setFormData] = useState({ ...profile, trackedSymbols: profile.trackedSymbols || [] });
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleChange = (field: keyof UserProfile, value: any) => {
    const newData = { ...formData, [field]: value };
    if (field === 'firstName' || field === 'lastName') {
      newData.name = `${newData.firstName} ${newData.lastName}`.trim();
    }
    setFormData(newData);
  };

  const handleRemoveSymbol = (symbol: string) => {
    const newList = formData.trackedSymbols?.filter(s => s !== symbol) || [];
    setFormData({ ...formData, trackedSymbols: newList });
    if (navigator.vibrate) navigator.vibrate(5);
  };

  const handleSave = () => {
    onUpdate(formData);
    onClose();
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleSignOutClick = async () => {
    setIsSigningOut(true);
    if (navigator.vibrate) navigator.vibrate([10, 50]);
    onSignOut();
  };

  const inputStyle = "w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-[14px]";
  const labelStyle = "text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1.5 block";

  return (
    <div className="fixed inset-0 z-[200] bg-[#020617]/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 relative overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Identity Hub</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Vault Manager</p>
          </div>
          <button onClick={onClose} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 active:scale-90 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar pb-6 px-1">
          <div className="p-4 rounded-2xl border bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-emerald-500" />
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600">Local Vault Active</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Verified Session</span>
              </div>
            </div>
            <button 
              onClick={handleSignOutClick}
              disabled={isSigningOut}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50 shadow-sm"
            >
              {isSigningOut ? <RefreshCcw size={14} className="animate-spin" /> : <LogOut size={14} />}
              Exit
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={labelStyle}>First Name</label>
              <input className={inputStyle} value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className={labelStyle}>Last Name</label>
              <input className={inputStyle} value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <label className={labelStyle}>Electronic Mail</label>
            <div className="relative">
              <input className={inputStyle} value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
              <Mail size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Manage Tracked Symbols */}
          <div className="space-y-3">
            <label className={labelStyle}>Tracked Assets</label>
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-white/5">
              {formData.trackedSymbols.length === 0 ? (
                <p className="text-[10px] font-bold text-slate-400 uppercase text-center py-2">No tracked symbols yet</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.trackedSymbols.map(s => (
                    <div 
                      key={s} 
                      className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm"
                    >
                      <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300">{s}</span>
                      <button onClick={() => handleRemoveSymbol(s)} className="text-rose-500 p-0.5">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <button onClick={handleSave} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-500/30 active:scale-[0.98] transition-all text-base mt-4 flex items-center justify-center gap-2">
          Update Identity
        </button>
      </div>
    </div>
  );
};

export default Settings;

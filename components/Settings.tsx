
import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../App';
import { db } from '../db';
import { 
  User, Moon, Sun, Type, Trash2, Shield, Download, Upload, 
  Database, Fingerprint, CheckCircle2, Cloud, CloudSync, 
  RefreshCcw, AlertTriangle, ShieldCheck 
} from 'lucide-react';

const Settings: React.FC = () => {
  const { profile, setProfile, settings, setSettings, portfolios, syncStatus, triggerSync } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    const checkBio = async () => {
      const available = !!window.PublicKeyCredential && 
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      setBioAvailable(available);
    };
    checkBio();
  }, []);

  const handleCloudToggle = async () => {
    if (!profile.syncEnabled) {
      // Feature D: Initial OAuth Request (Mocked)
      // In a real build, this would trigger gapi.auth2.getAuthInstance().signIn()
      const confirm = window.confirm("Connect to Google Drive for secure encrypted backups?");
      if (confirm) {
        setProfile({ ...profile, syncEnabled: true });
        triggerSync();
      }
    } else {
      setProfile({ ...profile, syncEnabled: false });
    }
  };

  const manualBackup = async () => {
    setSyncLoading(true);
    await triggerSync();
    setSyncLoading(false);
    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
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

      {/* Feature D: Cloud Sync Section */}
      <section className="bg-white dark:bg-slate-900/50 backdrop-blur-sm rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-600/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Cloud size={24} />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Cloud Connectivity</h2>
          </div>
          <button 
            onClick={handleCloudToggle}
            className={`w-14 h-8 rounded-full transition-colors relative ${profile.syncEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
          >
            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${profile.syncEnabled ? 'right-1' : 'left-1'}`}></div>
          </button>
        </div>

        {profile.syncEnabled ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-transparent hover:border-blue-500/30 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <CloudSync size={20} className="text-blue-500" />
                  <span className="font-bold text-slate-900 dark:text-white">Auto-Sync</span>
                </div>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">Background backup every 5 minutes and on change.</p>
                <button 
                  onClick={() => setSettings({...settings, autoSync: !settings.autoSync})}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${settings.autoSync ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}
                >
                  {settings.autoSync ? 'Always Active' : 'Paused'}
                </button>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-transparent hover:border-blue-500/30 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <RefreshCcw size={20} className="text-blue-500" />
                  <span className="font-bold text-slate-900 dark:text-white">Manual Pull</span>
                </div>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">Force merge remote Drive data into local database.</p>
                <button 
                  onClick={manualBackup}
                  disabled={syncLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
                >
                  {syncLoading ? <RefreshCcw size={12} className="animate-spin" /> : <CloudSync size={12} />}
                  <span>Sync Now</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-emerald-500" />
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Conflict Handling: Last Write Wins</span>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Last: {profile.lastCloudSync ? new Date(profile.lastCloudSync).toLocaleTimeString() : 'Never'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Cloud size={32} />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Cloud Backups Disabled</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">Connect your Google account to sync data across all your devices securely.</p>
            </div>
          </div>
        )}
      </section>

      {/* Security Section */}
      <section className="bg-white dark:bg-slate-900/50 backdrop-blur-sm rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-600/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Shield size={24} />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Privacy & Security</h2>
        </div>

        <div className="space-y-4">
          <div className={`flex items-center justify-between p-6 rounded-3xl transition-all ${bioAvailable ? 'bg-slate-50 dark:bg-slate-800' : 'opacity-50 grayscale'}`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">
                <Fingerprint size={22} className="text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Biometric Lock</p>
                <p className="text-xs text-slate-500">Native device authentication</p>
              </div>
            </div>
            {bioAvailable && (
              <button 
                onClick={setupBiometrics}
                disabled={isRegistering}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${profile.biometricId ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 active:scale-95'}`}
              >
                {isRegistering ? 'Wait...' : profile.biometricId ? 'Active' : 'Enable'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="bg-white dark:bg-slate-900/50 backdrop-blur-sm rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-600/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Sun size={24} />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Display</h2>
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">
                {settings.darkMode ? <Moon size={22} className="text-yellow-400" /> : <Sun size={22} className="text-orange-500" />}
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Dark Mode</p>
                <p className="text-xs text-slate-500">Optimized for OLED</p>
              </div>
            </div>
            <button 
              onClick={() => setSettings({...settings, darkMode: !settings.darkMode})}
              className={`w-14 h-8 rounded-full transition-colors relative ${settings.darkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${settings.darkMode ? 'right-1' : 'left-1'}`}></div>
            </button>
          </div>
        </div>
      </section>

      {/* Data Section */}
      <section className="bg-white dark:bg-slate-900/50 backdrop-blur-sm rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-600/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Database size={24} />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Maintenance</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={resetApp} className="flex items-center justify-between p-6 bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 rounded-3xl group transition-all">
            <div className="flex items-center gap-4 text-left">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">
                <Trash2 size={20} className="text-rose-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Wipe Data</p>
                <p className="text-[10px] text-rose-500 uppercase tracking-widest">Local & Sync</p>
              </div>
            </div>
          </button>
        </div>
      </section>

      <div className="text-center pt-10 pb-20">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Vantage Standalone v2.0.0 (Cloud Sync)</p>
      </div>
    </div>
  );
};

export default Settings;

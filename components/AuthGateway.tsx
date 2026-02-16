
import React, { useState, useRef } from 'react';
import { ChartPie, ArrowRight, Delete, DollarSign, Sparkles, ShieldCheck, Upload, FileJson } from 'lucide-react';
import { UserProfile } from '../types';
import { db } from '../db';

interface AuthGatewayProps {
  onComplete: (profile: UserProfile) => void;
}

const AuthGateway: React.FC<AuthGatewayProps> = ({ onComplete }) => {
  // Direct entry to identity setup
  const [step, setStep] = useState<'identity' | 'security-choice' | 'pin-setup' | 'pin-confirm' | 'success'>('identity');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleBackupImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
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
        
        // Trigger success state and reload
        setStep('success');
        setTimeout(() => {
          onComplete(data.profile);
        }, 1500);
      } catch (err) {
        alert("Import failed. The file may be corrupted or in an incompatible format.");
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const finalizeLocalAccount = (passcode?: string) => {
    const finalProfile: UserProfile = {
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      authMethod: 'local',
      pin: passcode,
      lastActive: Date.now()
    };
    
    setStep('success');
    setTimeout(() => {
      onComplete(finalProfile);
    }, 2000);
  };

  const handlePinInput = (digit: string) => {
    if (navigator.vibrate) navigator.vibrate(5);
    
    if (step === 'pin-setup') {
      if (pin.length < 4) {
        const next = pin + digit;
        setPin(next);
        if (next.length === 4) setTimeout(() => setStep('pin-confirm'), 300);
      }
    } else if (step === 'pin-confirm') {
      if (confirmPin.length < 4) {
        const next = confirmPin + digit;
        setConfirmPin(next);
        if (next.length === 4) {
          if (next === pin) finalizeLocalAccount(next);
          else {
            setPinError(true);
            if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
            setTimeout(() => { setConfirmPin(''); setPinError(false); }, 500);
          }
        }
      }
    }
  };

  const clearLast = () => {
    if (step === 'pin-setup') setPin(prev => prev.slice(0, -1));
    if (step === 'pin-confirm') setConfirmPin(prev => prev.slice(0, -1));
  };

  const inputStyle = "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl px-5 py-3.5 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400";
  const labelStyle = "text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-1.5 block";

  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-[300] bg-[#020617] flex flex-col items-center justify-center p-8 animate-in fade-in duration-700">
        <div className="w-24 h-24 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500 mb-12 animate-pulse">
           <Sparkles size={48} />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-center leading-tight tracking-tighter animate-in slide-in-from-bottom-8 duration-1000">
          <span className="bg-gradient-to-br from-white via-blue-200 to-blue-400 bg-clip-text text-transparent">
            Welcome to Vantage
          </span>
        </h1>
        <p className="text-slate-400 font-bold tracking-widest text-[10px] uppercase mt-4 opacity-50 text-center">Evolve your finance journey from here</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 dark:bg-[#020617] flex flex-col items-center justify-center py-12 px-6 overflow-y-auto no-scrollbar">
      {/* Branding Overlay (Static) */}
      <div className="flex flex-col items-center w-full max-w-sm mb-12 animate-in fade-in duration-1000">
        <div className="w-20 h-20 rounded-[2rem] bg-blue-600 shadow-2xl shadow-blue-500/40 flex items-center justify-center text-white mb-6 animate-float relative overflow-visible">
          <ChartPie size={36} />
          <div className="absolute top-[14px] right-[14px] bg-blue-600 border-[2.5px] border-white dark:border-slate-900 rounded-full w-7 h-7 flex items-center justify-center shadow-xl">
             <DollarSign size={14} strokeWidth={4} />
          </div>
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">Vantage</h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold tracking-[0.2em] text-[10px] uppercase mt-1">All your finances in one place</p>
      </div>

      {/* Setup Steps */}
      {step === 'identity' && (
        <div className="w-full max-w-sm animate-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Profile Setup</h2>
            <p className="text-xs text-slate-500 font-medium">Lets create your secure local account</p>
          </div>
          
          <form onSubmit={(e) => { e.preventDefault(); setStep('security-choice'); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelStyle}>First Name</label>
                <input required className={inputStyle} value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className={labelStyle}>Last Name</label>
                <input required className={inputStyle} value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelStyle}>Email Address</label>
              <input required type="email" className={inputStyle} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 mt-4 active:scale-95 transition-all">
              <span>Continue</span>
              <ArrowRight size={18} />
            </button>

            <div className="relative flex items-center justify-center py-4">
              <div className="absolute inset-0 flex items-center px-4">
                <div className="w-full border-t border-slate-200 dark:border-white/5"></div>
              </div>
              <span className="relative bg-slate-50 dark:bg-[#020617] px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">or</span>
            </div>

            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 active:bg-slate-50 dark:active:bg-slate-800 transition-all shadow-sm"
            >
              <Upload size={18} className="text-blue-500" />
              <span>Continue with Backup</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".json" 
              onChange={handleBackupImport} 
            />
          </form>
        </div>
      )}

      {step === 'security-choice' && (
        <div className="w-full max-w-sm animate-in slide-in-from-right duration-300 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600 mb-6">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 text-center">Vault Security</h2>
          <p className="text-xs text-slate-500 mb-10 text-center font-medium max-w-[240px]">Add an extra layer of protection to keep your data truly private.</p>
          <div className="space-y-4 w-full">
            <button onClick={() => setStep('pin-setup')} className="w-full p-5 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Set Passcode</button>
            <button onClick={() => finalizeLocalAccount()} className="w-full p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl font-black text-lg text-slate-900 dark:text-white active:bg-slate-50 transition-all">Skip for Now</button>
          </div>
        </div>
      )}

      {(step === 'pin-setup' || step === 'pin-confirm') && (
        <div className="fixed inset-0 z-[230] bg-slate-50 dark:bg-[#020617] p-6 animate-in zoom-in duration-300 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-black mb-12 text-slate-900 dark:text-white tracking-tight">{step === 'pin-setup' ? 'Set Vault PIN' : 'Confirm Vault PIN'}</h2>
          <div className="flex gap-4 mb-16">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 ${(step === 'pin-setup' ? pin : confirmPin).length > i ? (pinError ? 'bg-rose-500 border-rose-500 animate-shake' : 'bg-blue-600 border-blue-600 scale-125 shadow-lg shadow-blue-600/30') : 'border-slate-300 dark:border-slate-700'}`}></div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0].map((num, i) => (
              num !== '' ? (
                <button key={i} onClick={() => handlePinInput(num.toString())} className="w-16 h-16 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-2xl font-black text-slate-900 dark:text-white active:bg-blue-50 dark:active:bg-blue-600/20 active:scale-90 transition-all shadow-sm">{num}</button>
              ) : <div key={i} />
            ))}
            <button key="delete-btn" onClick={clearLast} className="w-16 h-16 flex items-center justify-center text-slate-400 active:scale-90 transition-all"><Delete size={24} /></button>
          </div>
          <button onClick={() => setStep('security-choice')} className="mt-12 text-[10px] font-black uppercase tracking-widest text-slate-400">Cancel</button>
        </div>
      )}
    </div>
  );
};

export default AuthGateway;

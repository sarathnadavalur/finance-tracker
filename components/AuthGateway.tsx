
import React, { useState } from 'react';
import { ChartPie, Cloud, Lock, ArrowRight, Fingerprint, Delete, DollarSign, User, Mail, Calendar, UserPlus, ShieldOff, Sparkles } from 'lucide-react';
import { UserProfile, AuthMethod } from '../types';

interface AuthGatewayProps {
  onComplete: (profile: UserProfile) => void;
}

const AuthGateway: React.FC<AuthGatewayProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'choice' | 'identity' | 'security-choice' | 'pin-setup' | 'pin-confirm' | 'success'>('choice');
  const [authMethod, setAuthMethod] = useState<AuthMethod>(null);
  
  // Identity state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    gender: '',
    age: '',
    dob: ''
  });

  // PIN state
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleChoice = (method: AuthMethod) => {
    setAuthMethod(method);
    if (navigator.vibrate) navigator.vibrate(10);
    
    if (method === 'local') {
      setStep('identity');
    } else {
      onComplete({
        name: 'Google User',
        firstName: 'Google',
        lastName: 'User',
        email: 'user@gmail.com',
        authMethod: 'google',
        lastActive: Date.now()
      });
    }
  };

  const handleIdentitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navigator.vibrate) navigator.vibrate(10);
    setStep('security-choice');
  };

  const finalizeAccount = (passcode?: string) => {
    const finalProfile: UserProfile = {
      name: `${formData.firstName} ${formData.lastName}`,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      gender: formData.gender || undefined,
      age: formData.age || undefined,
      dob: formData.dob || undefined,
      authMethod: 'local',
      pin: passcode,
      lastActive: Date.now()
    };
    
    setStep('success');
    setTimeout(() => {
      onComplete(finalProfile);
    }, 2500);
  };

  const handlePinInput = (digit: string) => {
    if (navigator.vibrate) navigator.vibrate(5);
    
    if (step === 'pin-setup') {
      if (pin.length < 4) {
        const next = pin + digit;
        setPin(next);
        if (next.length === 4) {
          setTimeout(() => setStep('pin-confirm'), 300);
        }
      }
    } else if (step === 'pin-confirm') {
      if (confirmPin.length < 4) {
        const next = confirmPin + digit;
        setConfirmPin(next);
        if (next.length === 4) {
          if (next === pin) {
            finalizeAccount(next);
          } else {
            setPinError(true);
            if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
            setTimeout(() => {
              setConfirmPin('');
              setPinError(false);
            }, 500);
          }
        }
      }
    }
  };

  const clearLast = () => {
    if (step === 'pin-setup') setPin(prev => prev.slice(0, -1));
    if (step === 'pin-confirm') setConfirmPin(prev => prev.slice(0, -1));
    if (navigator.vibrate) navigator.vibrate(5);
  };

  // Helper UI Styles
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
            Let's start your finance journey from here
          </span>
        </h1>
        <div className="absolute bottom-12 flex items-center gap-2 opacity-30">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce"></div>
        </div>
      </div>
    );
  }

  if (step === 'pin-setup' || step === 'pin-confirm') {
    const currentVal = step === 'pin-setup' ? pin : confirmPin;
    return (
      <div className="fixed inset-0 z-[200] bg-slate-50 dark:bg-[#020617] flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 rounded-3xl bg-blue-600/10 flex items-center justify-center text-blue-600 mb-6">
          <Lock size={32} />
        </div>
        <h2 className="text-2xl font-black tracking-tight mb-2 text-slate-900 dark:text-white">
          {step === 'pin-setup' ? 'Set Account PIN' : 'Confirm Your PIN'}
        </h2>
        <p className="text-sm text-slate-500 mb-10 text-center max-w-[240px]">
          {step === 'pin-setup' ? 'Create a 4-digit code to protect your financial records.' : 'Re-enter your PIN to verify.'}
        </p>
        
        <div className={`flex gap-4 mb-16 transition-transform ${pinError ? 'animate-bounce text-rose-500' : ''}`}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${currentVal.length > i ? (pinError ? 'bg-rose-500 border-rose-500' : 'bg-blue-600 border-blue-600 scale-110 shadow-lg shadow-blue-600/30') : 'border-slate-300 dark:border-slate-700'}`}></div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6 w-full max-w-[280px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button key={num} onClick={() => handlePinInput(num.toString())} className="w-16 h-16 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-2xl font-black text-slate-900 dark:text-white flex items-center justify-center active:bg-slate-100 dark:active:bg-slate-800 active:scale-90 transition-all shadow-sm">
              {num}
            </button>
          ))}
          <div className="w-16 h-16"></div>
          <button onClick={() => handlePinInput('0')} className="w-16 h-16 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-2xl font-black text-slate-900 dark:text-white flex items-center justify-center active:bg-slate-100 dark:active:bg-slate-800 active:scale-90 transition-all shadow-sm">
            0
          </button>
          <button onClick={clearLast} className="w-16 h-16 rounded-full flex items-center justify-center text-slate-400 active:text-rose-500 active:scale-90 transition-all">
            <Delete size={24} />
          </button>
        </div>
      </div>
    );
  }

  if (step === 'identity') {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-50 dark:bg-[#020617] flex flex-col items-stretch overflow-y-auto no-scrollbar scroll-smooth">
        <header className="px-6 py-8 flex items-center gap-4 border-b border-slate-100 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600">
            <UserPlus size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Create Account</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Local Identity Setup</p>
          </div>
        </header>

        <form onSubmit={handleIdentitySubmit} className="p-6 space-y-6 max-w-lg mx-auto w-full pb-20">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={labelStyle}>First Name *</label>
              <input required type="text" className={inputStyle} value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="John" />
            </div>
            <div className="space-y-1">
              <label className={labelStyle}>Last Name *</label>
              <input required type="text" className={inputStyle} value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Doe" />
            </div>
          </div>

          <div className="space-y-1">
            <label className={labelStyle}>Email (Username) *</label>
            <input required type="email" className={inputStyle} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" />
          </div>

          <div className="h-px bg-slate-100 dark:bg-white/5 my-4"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Optional Details</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={labelStyle}>Gender</label>
              <select className={inputStyle} value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className={labelStyle}>Age</label>
              <input type="number" className={inputStyle} value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} placeholder="25" />
            </div>
          </div>

          <div className="space-y-1">
            <label className={labelStyle}>Date of Birth</label>
            <input type="date" className={inputStyle} value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all text-lg flex items-center justify-center gap-2">
            <span>Next Step</span>
            <ArrowRight size={20} />
          </button>
        </form>
      </div>
    );
  }

  if (step === 'security-choice') {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-50 dark:bg-[#020617] flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 rounded-[2rem] bg-amber-500/10 flex items-center justify-center text-amber-500 mb-8">
           <Lock size={36} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 text-center">Account Security</h2>
        <p className="text-sm text-slate-500 mb-12 text-center max-w-[280px]">How would you like to protect your data on this device?</p>
        
        <div className="w-full max-w-xs space-y-4">
          <button 
            onClick={() => setStep('pin-setup')}
            className="w-full p-6 bg-blue-600 rounded-[2rem] text-white shadow-xl shadow-blue-500/30 flex items-center gap-4 active:scale-95 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center"><Fingerprint size={24} /></div>
            <div className="text-left">
              <p className="font-black text-lg leading-none mb-1">Passcode</p>
              <p className="text-[10px] font-bold uppercase opacity-60">Highly Secure</p>
            </div>
          </button>

          <button 
            onClick={() => finalizeAccount()}
            className="w-full p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2rem] flex items-center gap-4 active:scale-95 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"><ShieldOff size={24} /></div>
            <div className="text-left">
              <p className="font-black text-lg leading-none mb-1 text-slate-900 dark:text-white">Skip Security</p>
              <p className="text-[10px] font-bold uppercase text-slate-400">Not Recommended</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 dark:bg-[#020617] flex flex-col items-center justify-between py-12 px-6 md:p-12 overflow-y-auto no-scrollbar">
      <div className="flex flex-col items-center w-full">
        <div className="w-24 h-24 rounded-[2.5rem] bg-blue-600 shadow-2xl shadow-blue-500/40 flex items-center justify-center text-white mb-8 animate-float relative overflow-visible">
          <ChartPie size={44} />
          <div className="absolute top-[20px] right-[20px] bg-blue-600 border-[3px] border-white rounded-full w-9 h-9 flex items-center justify-center shadow-xl">
             <DollarSign size={18} strokeWidth={4} />
          </div>
        </div>
        
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black tracking-tighter mb-3 text-slate-900 dark:text-white">Vantage</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold tracking-tight text-sm">Track your finances at one place</p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          <button 
            onClick={() => handleChoice('local')}
            className="w-full text-left p-6 rounded-[2rem] bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden active:scale-95"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-600/10 flex items-center justify-center text-emerald-600">
                <Fingerprint size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-lg text-slate-900 dark:text-white leading-tight">Local Account</h3>
                <p className="text-xs text-slate-500 font-medium">Device-locked, Private</p>
              </div>
              <ArrowRight size={20} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
            </div>
          </button>

          <button 
            onClick={() => handleChoice('google')}
            className="w-full text-left p-6 rounded-[2rem] bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden active:scale-95"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-600/10 flex items-center justify-center text-blue-600">
                <Cloud size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-lg text-slate-900 dark:text-white leading-tight">Google Account</h3>
                <p className="text-xs text-slate-500 font-medium">Cloud Backup & Sync</p>
              </div>
              <ArrowRight size={20} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthGateway;

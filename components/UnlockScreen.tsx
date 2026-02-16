
import React, { useState, useEffect } from 'react';
import { Lock, ChartPie, DollarSign, Fingerprint, Delete, AlertCircle, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../types';

interface UnlockScreenProps {
  profile: UserProfile;
  onUnlock: () => void;
}

const UnlockScreen: React.FC<UnlockScreenProps> = ({ profile, onUnlock }) => {
  const [pin, setPin] = useState('');
  const [isError, setIsError] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    if (profile.biometricId) {
      handleBiometricUnlock();
    }
  }, []);

  const handleBiometricUnlock = async () => {
    if (!profile.biometricId || !window.PublicKeyCredential) return;

    try {
      setIsAuthenticating(true);
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const credentialId = Uint8Array.from(atob(profile.biometricId), c => c.charCodeAt(0));

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials: [{
          id: credentialId,
          type: "public-key",
          transports: ["internal"],
        }],
        userVerification: "required",
        timeout: 60000,
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      });

      if (assertion) {
        if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
        onUnlock();
      }
    } catch (err) {
      console.warn("Biometric auto-trigger failed or was cancelled.", err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePinInput = (digit: string) => {
    if (isError) setIsError(false);
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (navigator.vibrate) navigator.vibrate(5);

      if (newPin.length === 4) {
        if (newPin === profile.pin) {
          setTimeout(onUnlock, 200);
        } else {
          setIsError(true);
          if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const clearLast = () => {
    setPin(prev => prev.slice(0, -1));
    if (navigator.vibrate) navigator.vibrate(5);
  };

  return (
    <div className="fixed inset-0 z-[500] bg-slate-50 dark:bg-[#020617] flex flex-col items-center justify-center p-4 animate-in fade-in duration-500 overflow-y-auto no-scrollbar">
      <div className="flex flex-col items-center w-full max-w-sm py-8 transition-all duration-500">
        
        {/* Compact Logo Header */}
        <div className="w-16 h-16 rounded-[1.2rem] bg-blue-600 shadow-2xl shadow-blue-500/30 flex items-center justify-center text-white mb-4 relative animate-float">
          <ChartPie size={28} />
          <div className="absolute -top-1 -right-1 bg-blue-600 border-[2px] border-white dark:border-slate-900 rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
             <DollarSign size={10} strokeWidth={4} />
          </div>
        </div>

        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-0.5">Vantage Secure</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Welcome back, {profile.name.split(' ')[0]}</p>

        <div className="flex flex-col items-center w-full">
          {profile.biometricId && (
            <button 
              onClick={handleBiometricUnlock}
              disabled={isAuthenticating}
              className="mb-6 flex flex-col items-center group transition-all"
            >
              <div className="relative mb-2">
                <div className={`absolute inset-0 bg-blue-500/20 rounded-full scale-[1.3] animate-pulse ${isAuthenticating ? 'opacity-100' : 'opacity-0'}`}></div>
                <div className="w-12 h-12 rounded-full bg-blue-600/10 dark:bg-blue-600/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner active:scale-90 transition-all z-10 relative">
                  <Fingerprint size={24} />
                </div>
              </div>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-500">
                {isAuthenticating ? 'Verifying...' : 'Automatic Biometrics'}
              </span>
            </button>
          )}

          {/* PIN Indicators */}
          <div className={`flex gap-5 mb-8 transition-transform ${isError ? 'animate-bounce text-rose-500' : ''}`}>
            {[0, 1, 2, 3].map(i => (
              <div 
                key={i} 
                className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 
                  ${pin.length > i ? 'bg-blue-600 border-blue-600 scale-125 shadow-lg shadow-blue-600/40' : 'border-slate-300 dark:border-slate-700'}
                  ${isError ? 'border-rose-500 bg-rose-500' : ''}
                `}
              ></div>
            ))}
          </div>

          {isError && (
            <div className="flex items-center gap-1.5 text-rose-500 mb-6 animate-in fade-in zoom-in duration-300 bg-rose-500/10 px-4 py-1.5 rounded-full">
              <AlertCircle size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest">Access Denied</span>
            </div>
          )}

          {/* Responsive Pin Pad Layout */}
          <div className="grid grid-cols-3 gap-x-6 gap-y-4 md:gap-x-8 md:gap-y-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button 
                key={num} 
                onClick={() => handlePinInput(num.toString())}
                className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white dark:bg-slate-900/50 border border-slate-200/50 dark:border-white/10 text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center justify-center active:bg-blue-600 active:text-white active:scale-90 transition-all shadow-sm"
              >
                {num}
              </button>
            ))}
            <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center">
              {profile.biometricId && <ShieldCheck size={24} className="text-emerald-500/30" />}
            </div>
            <button 
              onClick={() => handlePinInput('0')}
              className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white dark:bg-slate-900/50 border border-slate-200/50 dark:border-white/10 text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center justify-center active:bg-blue-600 active:text-white active:scale-90 transition-all shadow-sm"
            >
              0
            </button>
            <button 
              onClick={clearLast}
              className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 active:scale-90 transition-all"
            >
              <Delete size={24} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center opacity-30 pb-4">
        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">Vantage Encryption v2.6</p>
      </div>
    </div>
  );
};

export default UnlockScreen;


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
    // Auto-trigger biometrics if available and registered
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
      console.error("Biometric authentication failed", err);
      // Fallback to PIN is always available
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
    <div className="fixed inset-0 z-[100] bg-slate-50/80 dark:bg-[#020617]/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 animate-in slide-in-from-bottom duration-500 overflow-hidden">
      <div className="flex flex-col items-center max-w-sm w-full">
        {/* Vantage Logo Header */}
        <div className="w-16 h-16 rounded-2xl bg-blue-600 shadow-xl shadow-blue-500/30 flex items-center justify-center text-white mb-6 relative animate-float">
          <ChartPie size={28} />
          <div className="absolute -top-1 -right-1 bg-blue-600 border-2 border-white dark:border-slate-900 rounded-full w-6 h-6 flex items-center justify-center">
             <DollarSign size={10} strokeWidth={4} />
          </div>
        </div>

        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">Vantage Secure</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10">Welcome back, {profile.name.split(' ')[0]}</p>

        <div className="flex flex-col items-center w-full">
          {/* Biometric Prompt */}
          {profile.biometricId && (
            <button 
              onClick={handleBiometricUnlock}
              disabled={isAuthenticating}
              className="mb-12 flex flex-col items-center group transition-all"
            >
              <div className="relative mb-3">
                <div className={`absolute inset-0 bg-blue-500/20 rounded-full scale-[1.5] animate-ping ${isAuthenticating ? 'opacity-100' : 'opacity-0'}`}></div>
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/40 active:scale-90 transition-all z-10 relative">
                  <Fingerprint size={32} />
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Tap for Biometrics</span>
            </button>
          )}

          {/* PIN Indicators */}
          <div className={`flex gap-5 mb-12 transition-transform ${isError ? 'animate-bounce text-rose-500' : ''}`}>
            {[0, 1, 2, 3].map(i => (
              <div 
                key={i} 
                className={`w-3 h-3 rounded-full border-2 transition-all duration-300 
                  ${pin.length > i ? 'bg-blue-600 border-blue-600 scale-125 shadow-lg shadow-blue-600/30' : 'border-slate-300 dark:border-slate-700'}
                  ${isError ? 'border-rose-500 bg-rose-500' : ''}
                `}
              ></div>
            ))}
          </div>

          {isError && (
            <div className="flex items-center gap-1 text-rose-500 mb-8 animate-in fade-in duration-300">
              <AlertCircle size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Incorrect PIN</span>
            </div>
          )}

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button 
                key={num} 
                onClick={() => handlePinInput(num.toString())}
                className="w-14 h-14 rounded-full bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 text-xl font-black text-slate-900 dark:text-white flex items-center justify-center active:bg-blue-50 dark:active:bg-blue-600/20 active:scale-90 transition-all shadow-sm"
              >
                {num}
              </button>
            ))}
            <div className="w-14 h-14 flex items-center justify-center">
              {profile.biometricId && <ShieldCheck size={20} className="text-blue-500/40" />}
            </div>
            <button 
              onClick={() => handlePinInput('0')}
              className="w-14 h-14 rounded-full bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 text-xl font-black text-slate-900 dark:text-white flex items-center justify-center active:bg-blue-50 dark:active:bg-blue-600/20 active:scale-90 transition-all shadow-sm"
            >
              0
            </button>
            <button 
              onClick={clearLast}
              className="w-14 h-14 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 active:scale-90 transition-all"
            >
              <Delete size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-16 text-center opacity-30">
        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">Vantage Core Security v2.1</p>
      </div>
    </div>
  );
};

export default UnlockScreen;

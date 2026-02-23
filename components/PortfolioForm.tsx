
import React, { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import { useApp } from '../App';
import { PortfolioType, Currency, Portfolio } from '../types';

interface PortfolioFormProps {
  onClose: () => void;
  editingPortfolio?: Portfolio;
}

const PortfolioForm: React.FC<PortfolioFormProps> = ({ onClose, editingPortfolio }) => {
  const { addPortfolio, updatePortfolio } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    type: PortfolioType.SAVINGS,
    currency: Currency.CAD,
    value: '0',
    totalEmiValue: '',
    emiStartDate: '',
    monthlyEmiAmount: '',
    paymentDate: '1'
  });

  useEffect(() => {
    if (editingPortfolio) {
      setFormData({
        name: editingPortfolio.name,
        type: editingPortfolio.type,
        currency: editingPortfolio.currency,
        value: editingPortfolio.value.toString(),
        totalEmiValue: editingPortfolio.totalEmiValue?.toString() || '',
        emiStartDate: editingPortfolio.emiStartDate || '',
        monthlyEmiAmount: editingPortfolio.monthlyEmiAmount?.toString() || '',
        paymentDate: editingPortfolio.paymentDate || '1'
      });
    }
  }, [editingPortfolio]);

  const isEMI = formData.type === PortfolioType.EMIS;

  useEffect(() => {
    if (isEMI && formData.totalEmiValue && formData.monthlyEmiAmount && formData.emiStartDate) {
      const total = parseFloat(formData.totalEmiValue);
      const monthly = parseFloat(formData.monthlyEmiAmount);
      
      const [y, m, d] = formData.emiStartDate.split('-').map(Number);
      if (!y || !m || !d) return;
      
      const pDay = parseInt(formData.paymentDate) || 1;
      
      let firstPaymentDate;
      if (pDay >= d) {
        firstPaymentDate = new Date(y, m - 1, pDay);
      } else {
        firstPaymentDate = new Date(y, m, pDay);
      }
      
      const today = new Date();
      const todayStripped = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const firstPaymentStripped = new Date(firstPaymentDate.getFullYear(), firstPaymentDate.getMonth(), firstPaymentDate.getDate());

      if (!isNaN(total) && !isNaN(monthly)) {
        let paymentsMade = 0;
        
        if (todayStripped >= firstPaymentStripped) {
          const diffMonths = (todayStripped.getFullYear() - firstPaymentStripped.getFullYear()) * 12 + (todayStripped.getMonth() - firstPaymentStripped.getMonth());
          if (todayStripped.getDate() >= pDay) {
            paymentsMade = diffMonths + 1;
          } else {
            paymentsMade = diffMonths;
          }
        }

        const remaining = Math.max(0, total - (paymentsMade * monthly));
        setFormData(prev => ({ ...prev, value: remaining.toFixed(0) }));
      }
    }
  }, [formData.totalEmiValue, formData.monthlyEmiAmount, formData.emiStartDate, formData.paymentDate, isEMI]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const portfolioData: Portfolio = {
      id: editingPortfolio ? editingPortfolio.id : Date.now().toString(),
      name: formData.name,
      type: formData.type,
      currency: formData.currency,
      value: parseFloat(formData.value) || 0,
      totalEmiValue: isEMI ? parseFloat(formData.totalEmiValue) : undefined,
      emiStartDate: isEMI ? formData.emiStartDate : undefined,
      monthlyEmiAmount: isEMI ? parseFloat(formData.monthlyEmiAmount) : undefined,
      paymentDate: isEMI ? formData.paymentDate : undefined,
      updatedAt: editingPortfolio?.updatedAt || Date.now()
    };

    if (editingPortfolio) {
      updatePortfolio(portfolioData);
    } else {
      addPortfolio(portfolioData);
    }
    onClose();
  };

  const labelStyle = "text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2.5 block ml-3 opacity-70";
  const inputStyle = "w-full bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/10 rounded-[2rem] px-7 py-5 font-black text-slate-900 dark:text-white outline-none focus:ring-8 focus:ring-blue-500/10 transition-all text-base placeholder:opacity-30 shadow-inner-light";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[95vh] flex flex-col my-auto">
        <div className="p-6 md:p-8 overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
              {editingPortfolio ? 'Edit Portfolio' : 'New Portfolio'}
            </h2>
            <button onClick={onClose} className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 active:scale-90 transition-all">
              <X size={26} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className={labelStyle}>Portfolio Name</label>
              <input 
                required
                type="text"
                placeholder="Asset or Liability name"
                className={inputStyle}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className={labelStyle}>Category</label>
                <select 
                  className={inputStyle + " appearance-none cursor-pointer"}
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as PortfolioType})}
                >
                  {Object.values(PortfolioType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className={labelStyle}>Currency</label>
                <select 
                  className={inputStyle + " appearance-none cursor-pointer"}
                  value={formData.currency}
                  onChange={(e) => setFormData({...formData, currency: e.target.value as Currency})}
                >
                  {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelStyle}>
                {isEMI ? 'Current Owed Amount' : 'Available Balance'}
              </label>
              <input 
                required
                type="number"
                step="0.01"
                readOnly={isEMI}
                className={`${inputStyle} ${isEMI ? 'text-blue-600 dark:text-blue-400 bg-blue-50/20' : ''} text-2xl tracking-tight`}
                value={formData.value}
                onChange={(e) => setFormData({...formData, value: e.target.value})}
              />
            </div>

            {isEMI && (
              <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] border border-slate-100 dark:border-white/5 space-y-6 animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className={labelStyle}>Principal</label>
                    <input type="number" step="0.01" placeholder="0.00" className={inputStyle} value={formData.totalEmiValue} onChange={(e) => setFormData({...formData, totalEmiValue: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className={labelStyle}>Monthly EMI</label>
                    <input type="number" step="0.01" placeholder="0.00" className={inputStyle} value={formData.monthlyEmiAmount} onChange={(e) => setFormData({...formData, monthlyEmiAmount: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className={labelStyle}>Start Date</label>
                    <input type="date" className={inputStyle} value={formData.emiStartDate} onChange={(e) => setFormData({...formData, emiStartDate: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className={labelStyle}>Bill Date</label>
                    <input type="number" min="1" max="31" placeholder="1" className={inputStyle} value={formData.paymentDate} onChange={(e) => setFormData({...formData, paymentDate: e.target.value})} />
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 px-8 py-5 rounded-[1.8rem] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all text-[13px] uppercase tracking-widest"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 px-8 py-5 rounded-[1.8rem] font-black bg-blue-600 text-white shadow-premium active:scale-[0.98] transition-all text-[13px] uppercase tracking-widest shadow-glow"
              >
                {editingPortfolio ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PortfolioForm;

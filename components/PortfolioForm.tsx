
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

  // Refined EMI Calculation Logic
  useEffect(() => {
    if (isEMI && formData.totalEmiValue && formData.monthlyEmiAmount && formData.emiStartDate) {
      const total = parseFloat(formData.totalEmiValue);
      const monthly = parseFloat(formData.monthlyEmiAmount);
      
      const [y, m, d] = formData.emiStartDate.split('-').map(Number);
      if (!y || !m || !d) return;
      
      const pDay = parseInt(formData.paymentDate) || 1;
      
      // Calculate actual first payment date
      // If payment day is >= processed day, it happens in the same month
      // Otherwise, it starts next month
      let firstPaymentDate;
      if (pDay >= d) {
        firstPaymentDate = new Date(y, m - 1, pDay);
      } else {
        firstPaymentDate = new Date(y, m, pDay);
      }
      
      const today = new Date();
      // Set to midnight for clean comparison
      const todayStripped = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const firstPaymentStripped = new Date(firstPaymentDate.getFullYear(), firstPaymentDate.getMonth(), firstPaymentDate.getDate());

      if (!isNaN(total) && !isNaN(monthly)) {
        let paymentsMade = 0;
        
        if (todayStripped >= firstPaymentStripped) {
          // Months between first payment and now
          const diffMonths = (todayStripped.getFullYear() - firstPaymentStripped.getFullYear()) * 12 + (todayStripped.getMonth() - firstPaymentStripped.getMonth());
          
          // If we have reached the payment day of the current month
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
    // Fix: Added missing required property 'updatedAt' to satisfy the Portfolio interface.
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

  const labelStyle = "text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2 block";
  const inputStyle = "w-full bg-[#f8fafc] dark:bg-slate-800/50 border-none rounded-2xl px-6 py-5 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-300";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 md:p-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {editingPortfolio ? 'Edit Portfolio' : 'Add Portfolio'}
            </h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X size={28} className="text-slate-900 dark:text-white" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className={labelStyle}>Portfolio Name</label>
              <input 
                required
                type="text"
                placeholder="Item name"
                className={inputStyle}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelStyle}>Type</label>
                <select 
                  className={inputStyle + " appearance-none cursor-pointer"}
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as PortfolioType})}
                >
                  {Object.values(PortfolioType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
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

            <div className="space-y-1">
              <label className={labelStyle}>
                {isEMI ? 'Current Owed Amount' : 'Current Value'}
              </label>
              <input 
                required
                type="number"
                step="0.01"
                readOnly={isEMI}
                className={`${inputStyle} ${isEMI ? 'text-blue-600 dark:text-blue-400' : ''}`}
                value={formData.value}
                onChange={(e) => setFormData({...formData, value: e.target.value})}
              />
              {isEMI && (
                <p className="text-[10px] font-bold text-blue-500/80 mt-2 uppercase tracking-widest">
                  Calculated Automatically
                </p>
              )}
            </div>

            {isEMI && (
              <div className="space-y-6 pt-6 mt-4 border-t border-slate-100 dark:border-white/5 animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Info size={16} />
                  <span className="text-[11px] font-black uppercase tracking-widest">EMI Details</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={labelStyle}>Total Loan Value</label>
                    <input 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className={inputStyle}
                      value={formData.totalEmiValue}
                      onChange={(e) => setFormData({...formData, totalEmiValue: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelStyle}>Monthly EMI</label>
                    <input 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className={inputStyle}
                      value={formData.monthlyEmiAmount}
                      onChange={(e) => setFormData({...formData, monthlyEmiAmount: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={labelStyle}>Start Date</label>
                    <input 
                      type="date"
                      className={inputStyle}
                      value={formData.emiStartDate}
                      onChange={(e) => setFormData({...formData, emiStartDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelStyle}>Payment Date</label>
                    <input 
                      type="number"
                      min="1"
                      max="31"
                      placeholder="1"
                      className={inputStyle}
                      value={formData.paymentDate}
                      onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-8">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 px-8 py-5 rounded-[1.5rem] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-lg"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 px-8 py-5 rounded-[1.5rem] font-bold bg-blue-600 text-white shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.98] transition-all text-lg"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PortfolioForm;

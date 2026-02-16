
import React, { useState, useEffect } from 'react';
import { X, Target, Info, Check } from 'lucide-react';
import { useApp } from '../App';
import { Currency, Goal, PortfolioType } from '../types';

interface GoalFormProps {
  onClose: () => void;
  editingGoal?: Goal;
}

const GoalForm: React.FC<GoalFormProps> = ({ onClose, editingGoal }) => {
  const { addGoal, updateGoal, portfolios } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currency: Currency.CAD,
    portfolioIds: [] as string[],
    deadline: '',
    color: 'bg-blue-500'
  });

  const availablePortfolios = portfolios.filter(p => p.type === PortfolioType.SAVINGS || p.type === PortfolioType.INVESTMENTS);

  useEffect(() => {
    if (editingGoal) {
      setFormData({
        name: editingGoal.name,
        targetAmount: editingGoal.targetAmount.toString(),
        currency: editingGoal.currency,
        portfolioIds: editingGoal.portfolioIds,
        deadline: editingGoal.deadline || '',
        color: editingGoal.color
      });
    }
  }, [editingGoal]);

  const togglePortfolio = (id: string) => {
    setFormData(prev => ({
      ...prev,
      portfolioIds: prev.portfolioIds.includes(id)
        ? prev.portfolioIds.filter(pid => pid !== id)
        : [...prev.portfolioIds, id]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const goalData: Goal = {
      id: editingGoal ? editingGoal.id : Date.now().toString(),
      name: formData.name,
      targetAmount: parseFloat(formData.targetAmount) || 0,
      currency: formData.currency,
      portfolioIds: formData.portfolioIds,
      deadline: formData.deadline || undefined,
      color: formData.color,
      updatedAt: Date.now()
    };

    if (editingGoal) {
      updateGoal(goalData);
    } else {
      addGoal(goalData);
    }
    onClose();
  };

  const labelStyle = "text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block ml-1";
  const inputStyle = "w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl px-5 py-3.5 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-300 text-sm";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto no-scrollbar">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Target size={22} />
               </div>
               <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    {editingGoal ? 'Edit Milestone' : 'Smart Goal'}
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Financial Target</p>
               </div>
            </div>
            <button onClick={onClose} className="p-2.5 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-500 active:scale-90 transition-all">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className={labelStyle}>Goal Title</label>
              <input 
                required
                type="text"
                placeholder="e.g. New Home Fund, Emergency Pot"
                className={inputStyle}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelStyle}>Target Amount</label>
                <input 
                  required
                  type="number"
                  placeholder="0.00"
                  className={inputStyle}
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className={labelStyle}>Currency</label>
                <select 
                  className={inputStyle + " appearance-none"}
                  value={formData.currency}
                  onChange={(e) => setFormData({...formData, currency: e.target.value as Currency})}
                >
                  {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <label className={labelStyle + " mb-0"}>Linked Accounts</label>
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-500">{formData.portfolioIds.length} Selected</span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2 p-1 no-scrollbar">
                {availablePortfolios.length === 0 ? (
                  <div className="py-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Savings accounts found</p>
                  </div>
                ) : (
                  availablePortfolios.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePortfolio(p.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.portfolioIds.includes(p.id) ? 'bg-blue-500/10 border-blue-500 text-blue-600' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-xs font-black tracking-tight">{p.name}</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{p.type} • {p.currency}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${formData.portfolioIds.includes(p.id) ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                        {formData.portfolioIds.includes(p.id) && <Check size={12} strokeWidth={4} />}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelStyle}>Target Deadline (Optional)</label>
              <input 
                type="date"
                className={inputStyle}
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-[1.5] px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-blue-600 text-white shadow-glow active:scale-[0.98] transition-all"
              >
                {editingGoal ? 'Update Goal' : 'Initialize Goal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GoalForm;

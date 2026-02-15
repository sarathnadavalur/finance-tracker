import React, { useState } from 'react';
import { Plus, Wallet } from 'lucide-react';
import { useApp } from '../App';
import { Portfolio, PortfolioType } from '../types';
import PortfolioCard from './PortfolioCard';
import PortfolioForm from './PortfolioForm';

const Portfolios: React.FC = () => {
  const { portfolios } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);

  const segments = [
    PortfolioType.SAVINGS,
    PortfolioType.INVESTMENTS,
    PortfolioType.DEBTS,
    PortfolioType.EMIS
  ];

  const handleEdit = (p: Portfolio) => {
    setEditingPortfolio(p);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPortfolio(null);
  };

  return (
    <div className="space-y-6 md:space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Portfolios</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Asset and liability management</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="hidden md:flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all hover:-translate-y-0.5 active:scale-95 text-sm"
        >
          <Plus size={18} />
          <span>Add Portfolio</span>
        </button>
      </div>

      {segments.map(type => {
        const filtered = portfolios.filter(p => p.type === type);
        if (filtered.length === 0) return null;

        return (
          <section key={type} className="animate-in fade-in slide-in-from-left-2 duration-500">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-sm font-black tracking-tight text-slate-800 dark:text-slate-200 uppercase tracking-widest">{type}</h2>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800 opacity-50"></div>
              <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">{filtered.length}</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {filtered.map(portfolio => (
                <PortfolioCard 
                  key={portfolio.id} 
                  portfolio={portfolio} 
                  onEdit={() => handleEdit(portfolio)}
                />
              ))}
            </div>
          </section>
        );
      })}

      {portfolios.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
            <Wallet size={36} />
          </div>
          <h3 className="text-lg font-bold mb-1">No portfolios yet</h3>
          <p className="text-xs text-slate-500 max-w-[200px] mb-6">Track your savings, investments or debts by adding one.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg text-sm"
          >
            <Plus size={18} />
            <span>Create First</span>
          </button>
        </div>
      )}

      <button 
        onClick={() => setIsModalOpen(true)}
        className="md:hidden fixed bottom-20 right-4 w-12 h-12 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform z-50 border-4 border-white dark:border-slate-900"
      >
        <Plus size={24} />
      </button>

      {isModalOpen && (
        <PortfolioForm 
          onClose={handleCloseModal} 
          editingPortfolio={editingPortfolio || undefined}
        />
      )}
    </div>
  );
};

export default Portfolios;

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
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Portfolios</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your financial assets and liabilities</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="hidden md:flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all hover:-translate-y-1 active:scale-95"
        >
          <Plus size={20} />
          <span>Add Portfolio</span>
        </button>
      </div>

      {segments.map(type => {
        const filtered = portfolios.filter(p => p.type === type);
        if (filtered.length === 0) return null;

        return (
          <section key={type} className="animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-lg font-black tracking-tight text-slate-800 dark:text-slate-200 uppercase">{type}</h2>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800 opacity-50"></div>
              <span className="text-xs font-bold text-slate-400 px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full">{filtered.length}</span>
            </div>
            
            {/* Optimized grid for smaller cards: 2 on mobile, 3 on tablet, 4 on desktop */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-6">
            <Wallet size={48} />
          </div>
          <h3 className="text-xl font-bold mb-2">No portfolios yet</h3>
          <p className="text-slate-500 max-w-xs mb-8">Start adding your savings, investments or debts to track your net worth.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg"
          >
            <Plus size={20} />
            <span>Create First Portfolio</span>
          </button>
        </div>
      )}

      <button 
        onClick={() => setIsModalOpen(true)}
        className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform z-50 border-4 border-white dark:border-slate-900"
      >
        <Plus size={28} />
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

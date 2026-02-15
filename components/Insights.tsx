
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../App';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { Sparkles, Send, Loader2, BrainCircuit, TrendingUp, ShieldCheck } from 'lucide-react';
import { PortfolioType, Currency } from '../types';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

const Insights: React.FC = () => {
  const { portfolios, baseCurrency, profile, settings, addPortfolio, deletePortfolio } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: `Hello ${profile.name}! I'm your Vantage AI advisor. I've analyzed your ${portfolios.length} portfolios. How can I help you grow your wealth today?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleQuery = async (query: string) => {
    if (!query.trim() || isLoading) return;

    const userMsg = { role: 'user' as const, content: query };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const model = 'gemini-3-flash-preview';

      const createPortfolioTool: FunctionDeclaration = {
        name: 'createPortfolio',
        description: 'Creates a new financial portfolio or account for the user.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'The name of the portfolio (e.g., CIBC Savings, TD Wealth).' },
            type: { 
              type: Type.STRING, 
              enum: Object.values(PortfolioType),
              description: 'The category of the portfolio.' 
            },
            currency: { 
              type: Type.STRING, 
              enum: Object.values(Currency),
              description: 'The currency code (CAD, USD, or INR).' 
            },
            value: { type: Type.NUMBER, description: 'The current balance or value of the portfolio.' }
          },
          required: ['name', 'type', 'currency', 'value']
        }
      };

      const deletePortfolioTool: FunctionDeclaration = {
        name: 'deletePortfolio',
        description: 'Deletes an existing portfolio by name.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'The name of the portfolio to delete.' }
          },
          required: ['name']
        }
      };
      
      const context = `
        User Data:
        - Portfolios: ${JSON.stringify(portfolios)}
        - Base Currency: ${baseCurrency}
        - Profile Name: ${profile.name}
        
        System Instruction:
        You are a world-class personal finance advisor. 
        You have tools to manage portfolios. Use them whenever the user asks to add, create, or delete a portfolio.
        When you create a portfolio, confirm the details to the user.
        Formatting: Use Markdown for bold text. Keep responses brief for mobile viewing.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: `${context}\n\nUser Question: ${query}`,
        config: {
          tools: [{ functionDeclarations: [createPortfolioTool, deletePortfolioTool] }]
        }
      });

      let finalContent = response.text || "";

      if (response.functionCalls) {
        for (const call of response.functionCalls) {
          if (call.name === 'createPortfolio') {
            const args = call.args as any;
            addPortfolio({
              id: Date.now().toString(),
              name: args.name,
              type: args.type as PortfolioType,
              currency: args.currency as Currency,
              value: args.value
            });
            if (!finalContent) finalContent = `✅ Added **${args.name}** to your ${args.type} portfolios with a value of ${args.currency} ${args.value}.`;
          }

          if (call.name === 'deletePortfolio') {
            const args = call.args as any;
            const target = portfolios.find(p => p.name.toLowerCase().includes(args.name.toLowerCase()));
            if (target) {
              deletePortfolio(target.id);
              if (!finalContent) finalContent = `🗑️ Deleted the **${target.name}** portfolio as requested.`;
            } else {
              if (!finalContent) finalContent = `I couldn't find a portfolio named "${args.name}" to delete.`;
            }
          }
        }
      }

      if (!finalContent && !response.functionCalls) {
        finalContent = "I analyzed your request but couldn't perform that specific action. Could you clarify the name or amount?";
      }

      setMessages(prev => [...prev, { role: 'ai', content: finalContent }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', content: "Connection to the Vantage Core was interrupted. Please check your network." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    { label: 'Analyze Net Worth', icon: <TrendingUp size={14} /> },
    { label: 'Investment Tips', icon: <BrainCircuit size={14} /> },
    { label: 'Debt Strategy', icon: <ShieldCheck size={14} /> }
  ];

  return (
    <div className="h-[calc(100vh-140px)] md:h-full flex flex-col space-y-4 max-w-4xl mx-auto w-full overflow-hidden">
      <div className="pt-2 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight">AI Insights</h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">Vantage Intelligence Engine</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600 animate-pulse">
          <Sparkles size={20} />
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900/40 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col relative backdrop-blur-md">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 no-scrollbar scroll-smooth">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-300`}>
              <div className={`max-w-[90%] md:max-w-[80%] p-3.5 md:p-4 rounded-[1.5rem] text-sm leading-relaxed shadow-sm break-words ${
                m.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none font-medium' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-200/50 dark:border-white/5'
              }`}>
                {m.content.split('\n').filter(line => line.trim() !== '').map((line, j) => (
                  <p key={j} className="mb-1.5 last:mb-0">{line}</p>
                ))}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-3xl rounded-bl-none shadow-sm">
                <Loader2 size={18} className="animate-spin text-blue-600" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex flex-wrap gap-2 mb-4">
            {suggestions.map(s => (
              <button 
                key={s.label}
                onClick={() => handleQuery(s.label)}
                className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 hover:border-blue-500 transition-all shadow-sm active:scale-95"
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleQuery(input); }} className="relative flex items-center">
            <input 
              type="text"
              placeholder="Ask about your wealth..."
              className="w-full bg-white dark:bg-slate-950 border-none rounded-2xl px-5 py-3.5 pr-14 font-bold text-slate-900 dark:text-white shadow-inner focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm placeholder:text-slate-400"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-1.5 p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 active:scale-90 disabled:opacity-50 disabled:active:scale-100 transition-all"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Insights;

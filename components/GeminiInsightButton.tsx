import React, { useState } from 'react';
import { Sparkles, X, Loader2, Diamond } from 'lucide-react';
import { useApp } from '../App';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';

export const GeminiInsightButton: React.FC<{
  contextData: any;
  prompt: string;
  title?: string;
}> = ({ contextData, prompt, title = "AI Insights" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { profile, settings } = useApp();

  const handleGenerate = async () => {
    setIsOpen(true);
    if (insight) return; // Already generated
    
    setIsLoading(true);
    setError(null);
    
    try {
      const apiKeyToUse = profile?.customApiKey || process.env.GEMINI_API_KEY || process.env.API_KEY || '';
      if (!apiKeyToUse) {
        throw new Error("Gemini API Key is missing. Please add it in Settings.");
      }
      
      const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
      const modelName = settings.selectedModel || 'gemini-3-flash-preview';
      
      const fullPrompt = `${prompt}\n\nHere is the data context (JSON):\n${JSON.stringify(contextData, null, 2)}\n\nCRITICAL INSTRUCTION: Your response MUST be extremely concise, strictly limited to 5-6 lines maximum. Provide beautiful, actionable insights. Use markdown formatting. Do not output raw JSON.`;
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: fullPrompt,
      });
      
      setInsight(response.text || "No insights generated.");
    } catch (err: any) {
      setError(err.message || "Failed to generate insights.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!settings.aiEnabled) return null;

  return (
    <>
      <button 
        onClick={handleGenerate}
        className="w-14 h-14 rounded-[1.8rem] bg-indigo-600/20 backdrop-blur-md flex items-center justify-center text-indigo-400 shadow-glow shadow-indigo-500/20 active:scale-90 transition-all tap-scale shrink-0 border border-indigo-500/30 group"
      >
        <div className="animate-[spin_4s_linear_infinite] [transform-style:preserve-3d]">
          <Diamond size={28} strokeWidth={2} className="drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/70 backdrop-blur-xl flex items-end sm:items-center sm:justify-center sm:p-6 animate-in fade-in duration-500 overflow-y-auto">
          <div className="w-full sm:max-w-2xl bg-white dark:bg-slate-900 rounded-t-[3rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-premium animate-in slide-in-from-bottom duration-700 max-h-[95vh] flex flex-col sm:my-auto">
            <div className="flex justify-between items-center mb-8 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                  <div className="animate-[spin_4s_linear_infinite] [transform-style:preserve-3d]">
                    <Diamond size={28} />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">
                    {title}
                  </h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 opacity-60 mt-2">Powered by Gemini</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 active:scale-90 tap-scale transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
              {isLoading ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-6">
                  <div className="animate-[spin_2s_linear_infinite] [transform-style:preserve-3d] text-indigo-500">
                    <Diamond size={48} />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] opacity-60">Analyzing Data...</span>
                </div>
              ) : error ? (
                <div className="py-10 text-center text-rose-500">
                  <p className="font-bold">{error}</p>
                  <button 
                    onClick={() => { setInsight(null); handleGenerate(); }}
                    className="mt-4 px-6 py-2 bg-rose-500/10 rounded-full text-sm font-bold uppercase tracking-widest"
                  >
                    Retry
                  </button>
                </div>
              ) : insight ? (
                <div className="markdown-body prose dark:prose-invert prose-slate max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:font-medium prose-p:leading-relaxed prose-li:font-medium">
                  <Markdown>{insight}</Markdown>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

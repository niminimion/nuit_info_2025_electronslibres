import React, { useState, useRef, useEffect } from 'react';
import { AppProps, AppID } from '../../types';
import { TRANSLATIONS } from '../../constants';

const TerminalApp: React.FC<AppProps> = ({ lang, launchApp }) => {
  const [history, setHistory] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const t = (key: string) => TRANSLATIONS[key][lang];

  useEffect(() => {
    if (history.length === 0) {
      setHistory([t('term.welcome')]);
    }
  }, [lang]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = async (cmd: string) => {
    const trimmedCmd = cmd.trim().toLowerCase();
    
    if (!trimmedCmd) return;

    const newHistory = [...history, `${t('term.prompt')} ${cmd}`];
    setHistory(newHistory);
    setInput('');

    if (['snake', 'python', 'game'].includes(trimmedCmd)) {
        setHistory(h => [...h, '>> LAUNCHING HIDDEN PROTOCOL...', '>> ENJOY THE SNAKE.']);
        setTimeout(() => {
            if (launchApp) launchApp(AppID.SNAKE);
        }, 1000);
        return;
    }

    if (trimmedCmd === 'help') {
        setHistory(h => [...h, 'Available commands:', '- help: Show this menu', '- clear: Clear screen', '- snake: ???', '- [any question]: Ask NIRD AI']);
        return;
    }

    if (trimmedCmd === 'clear') {
        setHistory([]);
        return;
    }

    setIsProcessing(true);
    
    try {
        // Call our backend API instead of Google SDK directly
        // This solves all CORS and Env Var issues on Vercel
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: cmd })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'API Request Failed');
        }
        
        setHistory(h => [...h, `>> ${data.reply}`]);

    } catch (e) {
        // Fallback if API fails (e.g. local dev without serverless)
        console.error("AI Error:", e);
        
        // Mock Fallback
        const responses = [
            "NIRD OS recommends using open source software to reduce e-waste.",
            "Big Tech is watching. Keep your data local.",
            "Did you know Linux extends hardware life by 5+ years?",
            "Resistance is not futile. It is necessary.",
            "Analyzing... Solution: Install NIRD on all school computers."
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        setHistory(h => [...h, `>> [Offline Mode] ${randomResponse}`]);
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="h-full bg-black p-4 font-mono text-nird-green overflow-hidden flex flex-col text-sm md:text-base">
      <div className="flex-1 overflow-y-auto space-y-2">
        {history.map((line, i) => (
          <div key={i} className="break-words">{line}</div>
        ))}
        {isProcessing && <div className="animate-pulse">{">>"} Processing...</div>}
        <div ref={bottomRef} />
      </div>
      <div className="flex mt-2 border-t border-nird-green/30 pt-2">
        <span className="mr-2 text-nird-green shrink-0">{t('term.prompt')}</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isProcessing && handleCommand(input)}
          className="flex-1 bg-transparent border-none outline-none text-white focus:ring-0"
          autoFocus
        />
      </div>
    </div>
  );
};

export default TerminalApp;
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AppID, WindowState, Language } from './types';
import { APP_CONFIG, TRANSLATIONS } from './constants';
import Window from './components/Window';
import TycoonApp from './components/apps/TycoonApp';
import TowerDefenseApp from './components/apps/TowerDefenseApp';
import InfoApp from './components/apps/InfoApp';
import TerminalApp from './components/apps/TerminalApp';
import SnakeApp from './components/apps/SnakeApp';
import MusicPlayerApp from './components/apps/MusicPlayerApp';
import SettingsApp from './components/apps/SettingsApp';
import { Menu, Wifi, Battery, Volume2, Globe, VolumeX, Volume1 } from 'lucide-react';

const BootScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [text, setText] = useState('');
  const fullText = "LOADING NIRD KERNEL V1.0...\nMOUNTING FILE SYSTEM...\nCHECKING PERMISSIONS...\nRESISTANCE INITIALIZED.";
  
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) {
        clearInterval(interval);
        setTimeout(onComplete, 800);
      }
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black text-nird-green font-mono p-10 z-50 flex flex-col">
      <div className="whitespace-pre-line text-lg md:text-2xl">{text}<span className="animate-pulse">_</span></div>
    </div>
  );
};

const App: React.FC = () => {
  const [booted, setBooted] = useState(false);
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [lang, setLang] = useState<Language>('fr');
  const [startOpen, setStartOpen] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const t = (key: string) => TRANSLATIONS[key][lang];

  const launchApp = (appId: AppID) => {
    const existing = windows.find(w => w.appId === appId);
    if (existing) {
      // Bring to front
      setWindows(prev => prev.map(w => w.id === existing.id ? { ...w, isMinimized: false, zIndex: getNextZIndex() } : w));
      return;
    }

    const config = APP_CONFIG[appId];
    // Center logic
    const width = Math.min(config.defaultWidth, window.innerWidth - 20);
    const height = Math.min(config.defaultHeight, window.innerHeight - 80);
    const x = Math.max(0, (window.innerWidth - width) / 2) + (windows.length * 20);
    const y = Math.max(0, (window.innerHeight - height) / 2) + (windows.length * 20);

    const newWindow: WindowState = {
      id: `${appId}-${Date.now()}`,
      appId,
      title: config.title[lang],
      x,
      y,
      width,
      height,
      isMinimized: false,
      isMaximized: false,
      zIndex: getNextZIndex(),
    };

    setWindows(prev => [...prev, newWindow]);
    setStartOpen(false);
  };

  const closeWindow = (id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  };

  const minimizeWindow = (id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: !w.isMinimized } : w));
  };
  
  const toggleMaximize = (id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w));
  };

  const focusWindow = (id: string) => {
    setWindows(prev => {
      const maxZ = Math.max(...prev.map(w => w.zIndex), 0);
      return prev.map(w => w.id === id ? { ...w, zIndex: maxZ + 1 } : w);
    });
  };

  const getNextZIndex = () => {
    return Math.max(...windows.map(w => w.zIndex), 0) + 1;
  };

  const toggleLang = () => {
    setLang(prev => prev === 'fr' ? 'en' : prev === 'en' ? 'zh' : 'fr');
  };

  const handleFactoryReset = () => {
    // Clear local storage if any (future proofing)
    localStorage.clear();
    // Reload the page
    window.location.reload();
  };

  if (!booted) return <BootScreen onComplete={() => setBooted(true)} />;

  return (
    <div className="h-screen w-screen overflow-hidden bg-cover bg-center font-sans select-none relative"
         style={{ backgroundImage: 'url("https://picsum.photos/1920/1080?grayscale&blur=2")', backgroundColor: '#111' }}
         onClick={() => { if (startOpen) setStartOpen(false); if (showVolumeSlider) setShowVolumeSlider(false); }}>
      
      {/* Desktop Background Overlay (Matrix Effect) */}
      <div className="absolute inset-0 bg-green-900/10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, rgba(0,255,65,0.05) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      {/* Desktop Icons */}
      <div className="absolute top-4 left-4 bottom-16 flex flex-col flex-wrap content-start gap-4 z-0 pointer-events-none">
        {(Object.keys(APP_CONFIG) as AppID[]).filter(id => !APP_CONFIG[id].hidden).map(id => (
          <div 
            key={id}
            onDoubleClick={() => launchApp(id)}
            className="group flex flex-col items-center gap-1 cursor-pointer w-28 p-2 rounded hover:bg-white/10 transition-colors pointer-events-auto"
          >
            <div className="w-12 h-12 drop-shadow-[0_0_5px_rgba(0,0,0,0.8)] transition-transform group-hover:scale-110 flex items-center justify-center">
              {APP_CONFIG[id].icon}
            </div>
            <span className="text-white text-xs font-medium text-center shadow-black drop-shadow-md bg-black/50 px-2 rounded whitespace-nowrap overflow-hidden text-ellipsis w-full">
              {APP_CONFIG[id].title[lang]}
            </span>
          </div>
        ))}
      </div>

      {/* Windows Layer */}
      {windows.map(w => (
        <Window 
          key={w.id} 
          window={w} 
          onClose={closeWindow} 
          onMinimize={minimizeWindow}
          onMaximize={toggleMaximize}
          onFocus={focusWindow}
        >
          {w.appId === AppID.TYCOON && <TycoonApp lang={lang} />}
          {w.appId === AppID.DEFENSE && <TowerDefenseApp lang={lang} />}
          {w.appId === AppID.INFO && <InfoApp lang={lang} />}
          {w.appId === AppID.TERMINAL && <TerminalApp lang={lang} launchApp={launchApp} />}
          {w.appId === AppID.SNAKE && <SnakeApp lang={lang} />}
          {w.appId === AppID.MUSIC && <MusicPlayerApp lang={lang} volume={volume} />}
          {w.appId === AppID.SETTINGS && (
            <SettingsApp 
                lang={lang} 
                resetSystem={handleFactoryReset}
            />
          )}
        </Window>
      ))}

      {/* Taskbar */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-zinc-900 border-t border-zinc-700 flex items-center px-2 z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.5)]">
        {/* Start Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); setStartOpen(!startOpen); setShowVolumeSlider(false); }}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-sm transition-colors ${startOpen ? 'bg-nird-green text-black font-bold' : 'hover:bg-zinc-700 text-white'}`}
        >
          <Menu size={20} />
          <span className="font-bold tracking-wider">NIRD</span>
        </button>

        {/* Open Windows Tabs */}
        <div className="flex-1 flex items-center px-4 gap-2 overflow-x-auto">
          {windows.map(w => (
            <button
              key={w.id}
              onClick={() => {
                if (w.isMinimized) minimizeWindow(w.id);
                focusWindow(w.id);
              }}
              className={`flex items-center gap-2 px-3 py-1 text-xs md:text-sm max-w-[150px] truncate border-b-2 transition-colors ${
                !w.isMinimized && w.zIndex === Math.max(...windows.map(ww => ww.zIndex)) 
                  ? 'border-nird-green bg-zinc-800 text-white' 
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <div className="w-4 h-4">{APP_CONFIG[w.appId].icon}</div>
              <span className="truncate">{w.title}</span>
            </button>
          ))}
        </div>

        {/* Tray */}
        <div className="flex items-center gap-4 px-4 text-gray-400 text-xs md:text-sm relative">
           <button onClick={toggleLang} className="flex items-center gap-1 hover:text-white px-2 py-1 hover:bg-zinc-700 rounded">
             <Globe size={16} />
             <span className="uppercase font-bold">{lang}</span>
           </button>
           <Wifi size={16} />
           
           {/* Volume Control */}
           <div className="relative">
                <button 
                    onClick={(e) => { e.stopPropagation(); setShowVolumeSlider(!showVolumeSlider); }}
                    className="hover:text-white p-1 rounded hover:bg-zinc-700 flex items-center justify-center w-8 h-8"
                >
                    {volume === 0 ? <VolumeX size={16} /> : volume < 0.5 ? <Volume1 size={16} /> : <Volume2 size={16} />}
                </button>
                
                {/* Volume Slider Popup (Improved Layout) */}
                {showVolumeSlider && (
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-600 p-3 rounded shadow-xl flex items-center gap-2 w-48 z-50 animate-in slide-in-from-bottom-2"
                    >
                         <VolumeX size={16} className="text-gray-400 flex-shrink-0" onClick={() => setVolume(0)} style={{cursor: 'pointer'}}/>
                         <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.01" 
                            value={volume} 
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="flex-1 accent-nird-green h-1 bg-zinc-600 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-xs text-white w-8 text-right font-mono">{Math.round(volume * 100)}%</span>
                    </div>
                )}
           </div>

           <Battery size={16} />
           <span className="text-white font-mono">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Start Menu */}
      {startOpen && (
        <div 
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-12 left-2 w-64 bg-zinc-900 border border-zinc-700 shadow-2xl z-50 animate-in slide-in-from-bottom-5"
        >
           <div className="p-4 border-b border-zinc-700 bg-zinc-800">
             <div className="text-white font-bold">NIRD User</div>
             <div className="text-xs text-nird-green">Administrator</div>
           </div>
           <div className="py-2">
             {(Object.keys(APP_CONFIG) as AppID[]).filter(id => !APP_CONFIG[id].hidden).map(id => (
               <button 
                key={id}
                onClick={() => launchApp(id)}
                className="w-full text-left px-4 py-2 text-gray-300 hover:bg-nird-green hover:text-black flex items-center gap-3 transition-colors"
               >
                 <div className="w-5 h-5">{APP_CONFIG[id].icon}</div>
                 {APP_CONFIG[id].title[lang]}
               </button>
             ))}
           </div>
           <div className="border-t border-zinc-700 p-2">
              <button 
                onClick={() => window.location.reload()}
                className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-900/50 rounded flex items-center gap-2"
              >
                {t('os.shutdown')}
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

// Root Render
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element to mount to");
const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

export default App;
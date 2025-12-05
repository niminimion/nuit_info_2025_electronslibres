import React from 'react';
import { AppProps } from '../../types';
import { TRANSLATIONS } from '../../constants';
import { Monitor, RefreshCcw, AlertTriangle, Users, Zap } from 'lucide-react';

const SettingsApp: React.FC<AppProps> = ({ lang, resetSystem }) => {
  const t = (key: string) => TRANSLATIONS[key][lang];

  const handleReset = () => {
    if (confirm(t('settings.resetdesc'))) {
        if (resetSystem) resetSystem();
    }
  };

  const teamMembers = [
    "KEDJINDA Pidenam Bernice",
    "KAMENDE SIANI Halexya",
    "MOTTO Harley",
    "CAI Xinran",
    "LEE Jia Qi"
  ];

  return (
    <div className="h-full bg-slate-900 text-white flex flex-col">
      
      {/* Sidebar / Content Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-full md:w-48 bg-slate-800 p-4 border-r border-slate-700 flex flex-col gap-2">
            <div className="flex items-center gap-2 p-2 bg-slate-700 rounded text-sm font-bold">
                <Monitor size={16} /> {t('settings.system')}
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
            
            {/* System Info */}
            <div className="mb-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Monitor className="text-nird-green" /> NIRD OS v1.0
                </h3>
                <p className="text-gray-400 text-sm">Kernel: Linux (Custom Build)</p>
                <p className="text-gray-400 text-sm">Uptime: {Math.floor(performance.now() / 1000)}s</p>
            </div>

            <hr className="border-slate-700 my-6" />

            {/* Team Credits */}
            <div className="mb-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-cyan-400">
                    <Users className="text-cyan-400" /> Équipe / Team
                </h3>
                
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <Zap className="text-yellow-400 animate-pulse" size={24} />
                        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 uppercase tracking-wider">
                            ELECTRONS LIBRES
                        </h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {teamMembers.map((member, index) => (
                            <div key={index} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                                <div className="w-1.5 h-1.5 bg-nird-green rounded-full"></div>
                                <span className="font-mono text-sm md:text-base">{member}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <hr className="border-slate-700 my-6" />

            {/* Danger Zone */}
            <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-500">
                    <AlertTriangle /> Danger Zone
                </h3>
                
                <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-4 flex items-center justify-between">
                    <div>
                        <div className="font-bold text-red-400">{t('settings.reset')}</div>
                        <div className="text-xs text-red-300/70">{t('settings.resetdesc')}</div>
                    </div>
                    <button 
                        onClick={handleReset}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-sm flex items-center gap-2 transition-colors"
                    >
                        <RefreshCcw size={16} /> Reset
                    </button>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsApp;
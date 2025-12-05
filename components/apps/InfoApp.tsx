import React, { useState } from 'react';
import { AppProps } from '../../types';
import { TRANSLATIONS } from '../../constants';
import { AlertTriangle, Leaf, Wrench } from 'lucide-react';

const InfoApp: React.FC<AppProps> = ({ lang }) => {
  const [activeTab, setActiveTab] = useState(0);

  const t = (key: string) => TRANSLATIONS[key][lang];

  return (
    <div className="flex flex-col h-full bg-white text-gray-900">
      <div className="flex border-b border-gray-300 bg-gray-100">
        {[t('info.tab1'), t('info.tab2'), t('info.tab3')].map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 font-medium text-sm focus:outline-none ${
              activeTab === i
                ? 'bg-white border-t-2 border-nird-green text-nird-green'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto font-sans">
        {activeTab === 0 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertTriangle size={32} />
              <h2 className="text-2xl font-bold">{t('info.p1.title')}</h2>
            </div>
            <p className="text-lg leading-relaxed">{t('info.p1.content')}</p>
            <div className="bg-red-50 p-4 rounded border border-red-100 mt-4">
              <h3 className="font-bold mb-2">Did you know?</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Millions of tons of e-waste are generated annually.</li>
                <li>Schools spend 30% of their budget on software licenses.</li>
                <li>Big Tech telemetry tracks student data.</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="space-y-4 animate-in fade-in duration-300">
             <div className="flex items-center gap-2 text-nird-green mb-2">
              <Leaf size={32} />
              <h2 className="text-2xl font-bold">{t('info.p2.title')}</h2>
            </div>
            <p className="text-lg leading-relaxed">{t('info.p2.content')}</p>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="p-4 bg-green-50 rounded text-center">
                <div className="font-bold text-green-700">Inclusif</div>
                <div className="text-sm">Accessible to all schools</div>
              </div>
              <div className="p-4 bg-green-50 rounded text-center">
                <div className="font-bold text-green-700">Responsable</div>
                <div className="text-sm">Data privacy first</div>
              </div>
              <div className="p-4 bg-green-50 rounded text-center">
                <div className="font-bold text-green-700">Durable</div>
                <div className="text-sm">Runs on 10yo PCs</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="space-y-4 animate-in fade-in duration-300">
             <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Wrench size={32} />
              <h2 className="text-2xl font-bold">{t('info.tab3')}</h2>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-800 font-mono px-2 py-1 rounded text-xs mt-1">STEP 1</span>
                <span>Audit your school's "obsolete" hardware. Don't throw it away!</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-800 font-mono px-2 py-1 rounded text-xs mt-1">STEP 2</span>
                <span>Flash NIRD OS onto a USB drive.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-800 font-mono px-2 py-1 rounded text-xs mt-1">STEP 3</span>
                <span>Boot from USB and install. Welcome to the resistance.</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoApp;

import React, { useEffect, useState } from 'react';
import { playSound, initAudio } from '../utils/sound';
import { Language } from '../types';
import { translations } from '../utils/translations';

interface BootSequenceProps {
  onComplete: () => void;
  lang: Language;
}

const BootSequence: React.FC<BootSequenceProps> = ({ onComplete, lang }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [showButton, setShowButton] = useState(false);
  const t = translations[lang];

  useEffect(() => {
    // Reset logs when language changes (though usually boot happens once)
    setLogs([]);
    setShowButton(false);
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < t.boot.length) {
        setLogs(prev => [...prev, t.boot[index]]);
        index++;
      } else {
        clearInterval(interval);
        setShowButton(true);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [lang]);

  const handleStart = () => {
    initAudio();
    playSound.click();
    playSound.startAmbience();
    playSound.success();
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center font-mono text-green-500 p-8">
      <div className="w-full max-w-lg border border-green-900/50 p-6 bg-black/90 shadow-[0_0_50px_rgba(0,255,65,0.1)] relative">
        {/* Decorative Header */}
        <div className="border-b border-green-500/30 pb-2 mb-4 flex justify-between items-center opacity-50 text-xs">
           <span>NEURAL.ID_BOOT_MANAGER</span>
           <span>SECURE_BOOT: ENABLED</span>
        </div>

        <div className="space-y-1 mb-8 h-48 overflow-y-auto custom-scrollbar">
          {logs.map((log, i) => (
            <div key={i} className="text-sm">
              <span className="opacity-50 mr-2">
                {`[${(Math.random() * 1000).toFixed(4)}]`}
              </span>
              {log}
            </div>
          ))}
          <div className="w-2 h-4 bg-green-500 animate-pulse inline-block mt-1"></div>
        </div>

        {showButton && (
          <button 
            onClick={handleStart}
            className="w-full py-4 bg-green-500 text-black font-bold text-lg tracking-[0.2em] hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.5)] transition-all clip-button animate-in fade-in zoom-in duration-300"
          >
            {t.bootButton}
          </button>
        )}
      </div>
      
      <div className="absolute bottom-8 text-[10px] opacity-30 text-center">
        COPYRIGHT © 2077 GLOBAL HERITAGE CORP.<br/>
        UNAUTHORIZED ACCESS IS A FEDERAL CRIME.
      </div>
    </div>
  );
};

export default BootSequence;
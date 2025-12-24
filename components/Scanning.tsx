
import React, { useEffect, useState } from 'react';
import { ScanLog, Language } from '../types';
import { playSound } from '../utils/sound';
import { translations } from '../utils/translations';

interface ScanningProps {
  image: string;
  onComplete: () => void;
  lang: Language;
}

const Scanning: React.FC<ScanningProps> = ({ image, onComplete, lang }) => {
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [progress, setProgress] = useState(0);
  const t = translations[lang].scanning;

  useEffect(() => {
    // Start scanning sound
    playSound.scan();

    let logIndex = 0;
    const logInterval = setInterval(() => {
      if (logIndex < t.logs.length) {
        setLogs(prev => [...prev.slice(-5), { id: Date.now(), text: t.logs[logIndex] }]);
        playSound.click(); // Small tick sound for each log
        logIndex++;
      }
    }, 400);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 99) {
          clearInterval(progressInterval);
          clearInterval(logInterval);
          setTimeout(onComplete, 800); 
          return 99;
        }
        return prev + 1.2; // Slightly slower for drama
      });
    }, 60);

    return () => {
      clearInterval(logInterval);
      clearInterval(progressInterval);
    };
  }, [onComplete, lang]);

  return (
    <div className="w-full max-w-2xl flex flex-col items-center animate-in fade-in duration-500">
      
      {/* HIGH TECH SCANNING CONTAINER */}
      <div className="relative w-72 h-72 mb-8 p-1 overflow-hidden group">
        
        {/* Hexagon Border / Tech Frame */}
        <div className="absolute inset-0 border-[1px] border-green-500/30 clip-corner"></div>
        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-green-500"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-green-500"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-green-500"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-green-500"></div>

        {/* IMAGE */}
        <img 
          src={image} 
          alt="Scanning" 
          className="w-full h-full object-cover filter grayscale contrast-125 opacity-60"
        />

        {/* --- DYNAMIC OVERLAYS --- */}
        
        {/* 1. Radar Sweep */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-500/20 to-transparent h-1/4 w-full animate-[scan_1.5s_infinite_linear] border-b border-green-500 shadow-[0_0_15px_rgba(0,255,65,0.5)]"></div>

        {/* 2. Grid System */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,65,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.1)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20"></div>

        {/* 3. Targeting Reticle (Rotating) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-green-500/40 rounded-full animate-[spin_4s_linear_infinite]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-2 bg-green-500"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-2 bg-green-500"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-1 bg-green-500"></div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-1 bg-green-500"></div>
        </div>

        {/* 4. Face Markers (Random Blips) */}
        <div className="absolute top-[30%] left-[40%] w-2 h-2 bg-green-500/80 rounded-full animate-ping"></div>
        <div className="absolute top-[30%] right-[40%] w-2 h-2 bg-green-500/80 rounded-full animate-ping delay-100"></div>
        <div className="absolute bottom-[35%] left-[50%] w-20 h-10 border border-green-500/50 -translate-x-1/2 rounded-full animate-pulse"></div>

        {/* Status Badge */}
        <div className="absolute top-2 right-2 text-[10px] bg-green-900/80 text-green-400 px-2 py-0.5 border border-green-500/50 animate-pulse">
          TARGET ACQUIRED
        </div>
      </div>

      {/* Progress Bar with Data Stream feel */}
      <div className="w-full max-w-md mb-6">
          <div className="flex justify-between text-[10px] text-green-500/60 mb-1 font-mono">
              <span>BUFFER: {Math.floor(progress * 1024)}KB</span>
              <span>{Math.floor(progress)}%</span>
          </div>
          <div className="w-full bg-gray-900 h-2 border border-green-900 relative overflow-hidden">
            <div 
              className="h-full bg-green-500 shadow-[0_0_10px_#0f0]"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
      </div>

      {/* TERMINAL LOGS */}
      <div className="w-full max-w-md font-mono text-xs h-32 overflow-hidden flex flex-col justify-end items-start border-l-2 border-green-500/20 pl-4 bg-gradient-to-r from-green-900/10 to-transparent py-2">
        {logs.map((log) => (
          <div key={log.id} className="animate-in slide-in-from-left-4 fade-in duration-300 w-full truncate">
            <span className="text-green-500/40 mr-2">
                {`[${(log.id % 10000).toString().padStart(4, '0')}]`}
            </span>
            <span className="text-green-400">&gt; {log.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Scanning;

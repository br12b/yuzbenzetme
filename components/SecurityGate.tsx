
import React, { useState, useEffect } from 'react';
import { AnalysisReport, Language } from '../types';
import { translations } from '../utils/translations';
import { playSound } from '../utils/sound';

interface SecurityGateProps {
  onUnlock: () => void;
  report: AnalysisReport;
  userImage: string;
  lang: Language;
}

const SecurityGate: React.FC<SecurityGateProps> = ({ onUnlock, report, userImage, lang }) => {
  const [processing, setProcessing] = useState(false);
  const [hackProgress, setHackProgress] = useState(0);
  const [hackLog, setHackLog] = useState<string[]>([]);
  const t = translations[lang].security;

  useEffect(() => {
    playSound.locked(); // Access denied sound effect
  }, []);

  useEffect(() => {
    if (processing) {
        const interval = setInterval(() => {
            setHackProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    onUnlock();
                    return 100;
                }
                // Random jumps in progress for "hacking" feel
                return prev + Math.random() * 5;
            });
            
            // Generate random hex codes
            const hex = Math.random().toString(16).substr(2, 8).toUpperCase();
            setHackLog(prev => [`0x${hex} :: DECRYPTING SECTOR ${Math.floor(Math.random() * 99)}`, ...prev.slice(0, 5)]);
            playSound.click();

        }, 100);
        return () => clearInterval(interval);
    }
  }, [processing, onUnlock]);

  const handleUnlock = () => {
    playSound.click();
    setProcessing(true);
    playSound.scan(); // Play scanning/computing sound during decryption
  };

  return (
    <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8 items-center justify-center animate-in zoom-in-95 duration-500">
      
      {/* TEASER CARD (BLURRED RESULT) */}
      <div className="relative w-full max-w-sm group">
        
        {/* The Blur Filter Overlay */}
        <div className="absolute inset-0 z-20 backdrop-blur-xl bg-black/60 flex flex-col items-center justify-center border border-green-900 rounded-xl overflow-hidden">
            {/* Animated Lock */}
            <div className={`relative mb-6 ${processing ? 'animate-bounce' : ''}`}>
                 <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 animate-pulse"></div>
                 <svg className={`w-16 h-16 ${processing ? 'text-green-500' : 'text-red-500'} transition-colors duration-300`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={processing ? "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" : "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"} />
                </svg>
            </div>

            {/* Stamp */}
            {!processing && (
                <div className="border-4 border-red-500 text-red-500 font-bold text-2xl p-2 -rotate-12 opacity-80 mask-image tracking-widest uppercase">
                    {t.censored}
                </div>
            )}

            {/* Processing Logs */}
            {processing && (
                <div className="w-full px-8 font-mono text-[10px] text-green-500 space-y-1 opacity-80">
                    {hackLog.map((log, i) => (
                        <div key={i} className="truncate">{log}</div>
                    ))}
                </div>
            )}
        </div>

        {/* The Content Being Teased (Visible underneath blur) */}
        <div className="bg-black/80 border border-green-900 rounded-xl p-6 opacity-40 pointer-events-none select-none grayscale">
            <div className="flex justify-between items-start mb-4 border-b border-green-900 pb-2">
                <h3 className="text-xl font-bold text-white">CITIZEN ID</h3>
            </div>
            <div className="flex gap-4">
                <div className="w-24 h-32 bg-gray-900 rounded overflow-hidden">
                     <img src={userImage} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-2">
                    <div>
                        <span className="text-[9px] uppercase block">SUBJECT</span>
                        <span className="text-sm font-bold bg-white text-black px-1">CLASSIFIED</span>
                    </div>
                    <div>
                        <span className="text-[9px] uppercase block">MATCH</span>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-green-500">%{report.mainMatch.percentage}</span>
                            <span className="text-xs text-green-500 animate-pulse">!!!</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* SECURITY ACTION PANEL */}
      <div className="w-full max-w-md cyber-box p-8 flex flex-col clip-corner bg-black/90 border-l-4 border-l-red-500 relative overflow-hidden">
        {/* Warning Stripes */}
        <div className="absolute top-0 right-0 w-16 h-16 opacity-20" style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ff0000 10px, #ff0000 20px)' }}></div>

        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white font-['Rajdhani'] flex items-center gap-3">
            <span className="text-red-500 animate-pulse">⚠</span>
            {t.alert}
        </h2>
        
        <div className="h-[1px] w-full bg-gradient-to-r from-red-500 via-red-900 to-transparent my-4"></div>

        <div className="space-y-4 mb-8">
            <p className="text-xs text-red-300 font-mono leading-relaxed border-l-2 border-red-900 pl-3">
                {t.reason}
            </p>

            <div className="flex items-center gap-3 text-sm font-mono text-green-100/80 bg-green-900/10 p-2 rounded">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {t.matchFound}: <span className="text-green-400 font-bold">%{report.mainMatch.percentage}</span>
            </div>
            
            <ul className="space-y-2 pl-2">
                {t.features.map((feature, i) => (
                    <li key={i} className="text-xs text-gray-400 flex items-center gap-2">
                        <span className="w-1 h-1 bg-green-500 rounded-full shadow-[0_0_5px_#0f0]"></span>
                        {feature}
                    </li>
                ))}
            </ul>
        </div>

        <button
          onClick={handleUnlock}
          disabled={processing}
          className="w-full py-5 bg-white/5 border border-green-500 text-green-400 font-bold text-lg uppercase tracking-widest hover:bg-green-500 hover:text-black hover:shadow-[0_0_20px_rgba(0,255,65,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed clip-button relative overflow-hidden group"
        >
            {processing ? (
                <div className="relative w-full h-full flex items-center justify-center">
                    <div className="absolute inset-0 bg-green-900/30 w-full transition-all duration-100 ease-linear" style={{ width: `${hackProgress}%` }}></div>
                    <span className="relative z-10 flex items-center gap-2">
                         <span className="animate-spin text-xl">⟳</span>
                         {t.process} {Math.floor(hackProgress)}%
                    </span>
                </div>
            ) : (
                <span className="relative z-10 flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                    {t.unlock}
                </span>
            )}
        </button>

        <div className="mt-4 text-[9px] text-center text-gray-600 flex justify-center items-center gap-2 uppercase tracking-widest">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            {t.secure}
        </div>
      </div>
    </div>
  );
};

export default SecurityGate;

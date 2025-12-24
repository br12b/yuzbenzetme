
import React, { useRef } from 'react';
import { AnalysisMode, AnalysisStyle, Language } from '../types';
import { playSound } from '../utils/sound';
import { translations } from '../utils/translations';

interface LandingProps {
  onImageUpload: (file: File) => void;
  onModeSelect: (mode: AnalysisMode) => void;
  onStyleSelect: (style: AnalysisStyle) => void;
  selectedMode: AnalysisMode;
  selectedStyle: AnalysisStyle;
  lang: Language;
}

// --- HIGH TECH SVG ICONS ---
const Icons = {
  Heritage: () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 text-green-500" stroke="currentColor" strokeWidth="1">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" className="opacity-20" />
      <path d="M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0" />
      <path d="M12 2v20M2 12h20" className="opacity-20" strokeDasharray="2 2" />
      <path d="M7 7c1.5-1.5 3.5-2 5-1s2 3.5 1 5c-1 1.5-3.5 2-5 1s-2-3.5-1-5z" strokeOpacity="0.8" />
      <path d="M17 17c-1.5 1.5-3.5 2-5 1s-2-3.5-1-5c1-1.5 3.5-2 5-1s2 3.5 1 5z" strokeOpacity="0.8" />
    </svg>
  ),
  PastLife: () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 text-green-500" stroke="currentColor" strokeWidth="1">
       <circle cx="12" cy="12" r="10" className="opacity-30" />
       <path d="M12 6v6l4 2" />
       <path d="M12 2v2m0 16v2M2 12h2m16 0h2" />
       <path d="M12 12m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" strokeDasharray="4 4" className="animate-[spin_10s_linear_infinite] origin-center" />
       <path d="M7.75 7.75l-1.5 -1.5" />
       <path d="M17.75 17.75l-1.5 -1.5" />
    </svg>
  ),
  Cyber: () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 text-green-500" stroke="currentColor" strokeWidth="1">
      <path d="M9 3v2m6-2v2M6 9H4m2 6H4m14-6h2m-2 6h2M9 19v2m6-2v2" />
      <rect x="6" y="6" width="12" height="12" rx="2" className="opacity-50" />
      <path d="M9 9h6v6H9z" fill="currentColor" fillOpacity="0.1" />
      <path d="M9 12h6M12 9v6" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  )
};

const Landing: React.FC<LandingProps> = ({ 
  onImageUpload, 
  onModeSelect, 
  onStyleSelect, 
  selectedMode, 
  selectedStyle, 
  lang 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[lang].landing;

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  const modes = [
    { id: AnalysisMode.HERITAGE, ...t.modes.heritage, icon: Icons.Heritage },
    { id: AnalysisMode.PAST_LIFE, ...t.modes.pastLife, icon: Icons.PastLife },
    { id: AnalysisMode.CYBER_ARCHETYPE, ...t.modes.cyber, icon: Icons.Cyber }
  ];

  return (
    <div className="flex flex-col items-center w-full max-w-4xl px-4 py-8 animate-in fade-in duration-700">
      
      {/* HERO SECTION */}
      <div className="mb-12 text-center relative group cursor-default" onMouseEnter={() => playSound.hover()}>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] font-['Rajdhani']">
          NEURAL<span className="text-green-500">.ID</span>
        </h1>
        <div className="flex items-center justify-center gap-4 mt-2 text-green-500/60 text-xs tracking-[0.5em] font-mono">
            <span>{t.heroSubtitle[0]}</span>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>{t.heroSubtitle[1]}</span>
        </div>
        
        {/* Decor lines */}
        <div className="absolute -left-12 top-1/2 w-8 h-[1px] bg-green-500/30 hidden md:block"></div>
        <div className="absolute -right-12 top-1/2 w-8 h-[1px] bg-green-500/30 hidden md:block"></div>
      </div>

      {/* STYLE TOGGLE (Scientific vs Roast) */}
      <div className="w-full max-w-lg mb-8 p-[2px] bg-gradient-to-r from-transparent via-green-900/50 to-transparent">
        <div className="flex bg-black border border-green-900/50 rounded-sm relative overflow-hidden">
            <div className={`absolute top-0 bottom-0 w-1/2 bg-green-900/30 border border-green-500/30 transition-all duration-300 ${selectedStyle === AnalysisStyle.SCIENTIFIC ? 'left-0' : 'left-1/2'}`}></div>
            
            <button 
                onClick={() => { playSound.click(); onStyleSelect(AnalysisStyle.SCIENTIFIC); }}
                className={`flex-1 py-3 text-xs font-bold tracking-widest relative z-10 transition-colors ${selectedStyle === AnalysisStyle.SCIENTIFIC ? 'text-green-400' : 'text-gray-600'}`}
            >
                {t.style.scientific}
            </button>
            <button 
                onClick={() => { playSound.click(); onStyleSelect(AnalysisStyle.ROAST); }}
                className={`flex-1 py-3 text-xs font-bold tracking-widest relative z-10 transition-colors ${selectedStyle === AnalysisStyle.ROAST ? 'text-red-400' : 'text-gray-600'}`}
            >
                 🔥 {t.style.roast}
            </button>
        </div>
        <div className="text-[9px] text-center mt-1 text-gray-500 uppercase tracking-wide">{t.style.desc}</div>
      </div>

      {/* MODE SELECTION GRID */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {modes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;
            
            return (
                <button
                    key={mode.id}
                    onClick={() => onModeSelect(mode.id)}
                    onMouseEnter={() => playSound.hover()}
                    className={`relative group clip-corner text-left transition-all duration-300 h-full
                        ${isSelected 
                            ? 'bg-green-900/20 border-l-4 border-green-500 shadow-[0_0_30px_rgba(0,255,65,0.15)]' 
                            : 'bg-[#0a0a0a] border-l-2 border-gray-800 hover:border-green-500/50 hover:bg-white/5'
                        }
                    `}
                >
                    {/* Corner accents */}
                    <div className={`absolute top-0 right-0 w-4 h-4 border-t border-r transition-colors ${isSelected ? 'border-green-500' : 'border-gray-800'}`}></div>
                    <div className={`absolute bottom-0 left-0 w-4 h-4 border-b border-l transition-colors ${isSelected ? 'border-green-500' : 'border-gray-800'}`}></div>

                    <div className="p-6 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                             <div className={`p-2 rounded-sm border ${isSelected ? 'border-green-500/50 bg-green-500/10' : 'border-gray-800 bg-black'}`}>
                                <Icon />
                             </div>
                             {isSelected && <div className="text-[10px] font-bold text-green-500 animate-pulse">AKTİF</div>}
                        </div>
                        
                        <h3 className={`text-xl font-bold font-['Rajdhani'] mb-1 ${isSelected ? 'text-white' : 'text-gray-300 group-hover:text-green-400'}`}>
                            {mode.title}
                        </h3>
                        <div className="text-[10px] text-green-500/70 tracking-widest uppercase mb-3">
                            {mode.subtitle}
                        </div>
                        <p className="text-xs text-gray-500 font-mono leading-relaxed group-hover:text-gray-400">
                            {mode.desc}
                        </p>
                    </div>
                </button>
            );
        })}
      </div>

      {/* UPLOAD ACTION AREA */}
      <div className="w-full max-w-lg relative group">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept="image/*"
        />
        
        {/* Hex decoration around button */}
        <div className="absolute -inset-1 bg-gradient-to-r from-green-500 via-transparent to-green-500 opacity-20 blur group-hover:opacity-40 transition-opacity duration-500 rounded-lg"></div>
        
        <button
          onClick={triggerUpload}
          onMouseEnter={() => playSound.hover()}
          className="relative w-full clip-button bg-black hover:bg-green-900/10 text-green-500 hover:text-white border border-green-500/50 hover:border-green-400 py-6 px-8 transition-all duration-300 group"
        >
            <div className="flex items-center justify-center gap-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-green-500 blur-lg opacity-20 animate-pulse"></div>
                    <svg className="w-8 h-8 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                </div>
                <div className="text-left">
                    <div className="text-xl font-bold font-['Rajdhani'] tracking-widest">{t.uploadBtn}</div>
                    <div className="text-[10px] opacity-60 font-mono">{t.uploadDesc}</div>
                </div>
            </div>

            {/* Tech Decoration */}
            <div className="absolute right-4 bottom-2 text-[9px] opacity-30 font-mono">{t.systemReady}</div>
            <div className="absolute top-0 left-0 w-2 h-2 bg-green-500"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500"></div>
        </button>
      </div>
      
      <div className="mt-8 flex gap-8 opacity-30 text-[10px]">
        <div>{t.secureConnection}: <span className="text-green-500">{t.encrypted}</span></div>
        <div>{t.serverLatency}: <span className="text-green-500">12ms</span></div>
      </div>

    </div>
  );
};

export default Landing;


import React from 'react';
import { AnalysisReport, Language } from '../types';
import { translations } from '../utils/translations';

interface HolographicCardProps {
  report: AnalysisReport;
  userImage: string;
  lang: Language;
}

const HolographicCard: React.FC<HolographicCardProps> = ({ report, userImage, lang }) => {
  const t = translations[lang].card;

  return (
    <div className="relative group perspective-1000 w-full max-w-sm mx-auto my-4">
      {/* GLOW BEHIND */}
      <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
      
      {/* CARD BODY */}
      <div className="relative bg-black/90 border border-green-500/50 rounded-xl p-5 overflow-hidden backdrop-blur-sm shadow-[0_0_50px_rgba(0,255,65,0.1)]">
        
        {/* Holographic Texture Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none transform translate-y-full group-hover:-translate-y-full" style={{ transitionDuration: '1.5s' }}></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10"></div>

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4 border-b border-green-500/30 pb-2">
            <div>
                <div className="text-[9px] text-green-400 tracking-[0.3em] font-bold">{t.org}</div>
                <h3 className="text-2xl font-bold font-['Rajdhani'] text-white tracking-wide">{t.title}</h3>
            </div>
            <div className="w-10 h-10 rounded-full border border-green-500 flex items-center justify-center bg-green-900/20">
                <svg className="w-6 h-6 text-green-400 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4"/></svg>
            </div>
        </div>

        {/* CONTENT */}
        <div className="flex gap-4">
            {/* LARGE USER IMAGE */}
            <div className="w-32 h-40 bg-gray-900 rounded-md border border-green-500/50 overflow-hidden relative shadow-inner shrink-0">
                 <img src={userImage} className="w-full h-full object-cover opacity-90 mix-blend-normal hover:mix-blend-luminosity transition-all" />
                 
                 {/* Tech overlays on image */}
                 <div className="absolute top-0 right-0 p-1">
                     <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_red]"></div>
                 </div>
                 <div className="absolute bottom-0 left-0 w-full h-6 bg-gradient-to-t from-green-900/90 to-transparent"></div>
                 <div className="absolute top-0 w-full h-[1px] bg-green-400/50 animate-[scan_3s_infinite]"></div>
            </div>
            
            {/* DATA FIELDS - Added min-w-0 to prevent flex child overflow */}
            <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                <div className="space-y-2">
                    <div>
                        <span className="text-[8px] text-gray-500 uppercase tracking-wider block mb-0.5">{t.subject}</span>
                        <span className="text-xs font-bold text-green-300 font-mono bg-green-900/20 px-1 truncate block">{t.unknown}</span>
                    </div>
                    <div>
                        <span className="text-[8px] text-gray-500 uppercase tracking-wider block mb-0.5">{t.origin}</span>
                        {/* Reduced text size to text-sm and added line-clamp-3 for better fit */}
                        <span className="text-sm font-bold text-white font-mono break-words leading-tight line-clamp-3 block" title={report.mainMatch.name}>
                            {report.mainMatch.name}
                        </span>
                    </div>
                </div>
                
                <div>
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-[8px] text-gray-500 uppercase tracking-wider">{t.dna}</span>
                        <span className="text-xs font-bold text-green-400">{report.mainMatch.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-green-500 h-full shadow-[0_0_10px_#00ff41]" style={{ width: `${report.mainMatch.percentage}%` }}></div>
                    </div>
                </div>
            </div>
        </div>

        {/* FOOTER CODE */}
        <div className="mt-4 pt-2 border-t border-green-500/30 flex justify-between items-end opacity-70">
            <div className="font-mono text-[8px] text-green-500/60 break-all leading-tight w-2/3">
                ID: {Math.random().toString(36).substring(7).toUpperCase()} // {t.sector}
            </div>
            <div className="text-xl font-bold text-white opacity-80 barcode-font tracking-widest">
                *8831*
            </div>
        </div>
      </div>
    </div>
  );
};

export default HolographicCard;

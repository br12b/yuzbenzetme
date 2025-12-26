
import React, { useState, useEffect } from 'react';
import { AnalysisReport, Language } from '../types';
import HolographicCard from './HolographicCard';
import { playSound } from '../utils/sound';
import { translations } from '../utils/translations';
import { 
    ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';

interface ResultProps {
  report: AnalysisReport;
  userImage: string;
  onRestart: () => void;
  lang: Language;
}

// --- TYPEWRITER COMPONENT ---
const TypewriterText: React.FC<{ text: string; speed?: number }> = ({ text, speed = 30 }) => {
    const [displayedText, setDisplayedText] = useState('');
    
    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            if (index < text.length) {
                setDisplayedText((prev) => prev + text.charAt(index));
                if (Math.random() > 0.8) playSound.click();
                index++;
            } else {
                clearInterval(interval);
            }
        }, speed);
        return () => clearInterval(interval);
    }, [text, speed]);

    return <span>{displayedText}</span>;
};

const Result: React.FC<ResultProps> = ({ report, userImage, onRestart, lang }) => {
  useEffect(() => {
    playSound.success();
  }, []);

  const t = translations[lang].result;
  
  const radarData = [
      { subject: t.attributes.intelligence, A: report.attributes?.intelligence || 50, fullMark: 100 },
      { subject: t.attributes.dominance, A: report.attributes?.dominance || 50, fullMark: 100 },
      { subject: t.attributes.creativity, A: report.attributes?.creativity || 50, fullMark: 100 },
      { subject: t.attributes.resilience, A: report.attributes?.resilience || 50, fullMark: 100 },
      { subject: t.attributes.charisma, A: report.attributes?.charisma || 50, fullMark: 100 },
  ];

  const getShareText = () => {
    return t.shareText.replace('{name}', report.mainMatch.name).replace('{percent}', report.mainMatch.percentage);
  };

  const handleShareWhatsApp = () => {
      playSound.click();
      const text = getShareText();
      const url = window.location.href;
      window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, '_blank');
  };

  const handleShareTwitter = () => {
      playSound.click();
      const text = getShareText();
      const url = window.location.href;
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const getMetricLabel = (key: string) => {
      const map: any = {
          cheekbones: t.attributeNames.cheekbones,
          eyes: t.attributeNames.eyes,
          jawline: t.attributeNames.jawline
      };
      return map[key] || key;
  };

  return (
    <div className="w-full max-w-6xl animate-in slide-in-from-bottom-10 fade-in duration-700 pb-12 relative">
      
      {/* HEADER */}
      <div className="text-center mb-10">
        <h2 className="text-4xl md:text-5xl font-bold tracking-widest cyber-text-shadow font-['Rajdhani']">{t.header}</h2>
        <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
            <p className="text-xs tracking-[0.5em] opacity-60">{t.verified}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COL 1: IDENTITY & MATCH */}
        <div className="lg:col-span-1 space-y-6">
          <div className="cyber-box p-6 flex flex-col items-center clip-corner">
            <HolographicCard report={report} userImage={userImage} lang={lang} />
            
            <div className="text-center w-full mt-4">
                <div className="text-[10px] text-green-500/50 tracking-[0.3em] uppercase mb-1">{t.primaryMatch}</div>
                <h3 className="text-3xl font-bold text-white mb-2 font-['Rajdhani']">{report.mainMatch.name}</h3>
                <div className="text-5xl font-bold text-green-500 my-2 drop-shadow-[0_0_10px_rgba(0,255,65,0.5)]">
                    %{report.mainMatch.percentage}
                </div>
                <p className="text-xs text-justify opacity-80 font-mono leading-relaxed mt-4">
                    {report.mainMatch.reason}
                </p>
            </div>
          </div>
        </div>

        {/* COL 2: RADAR CHART (ENHANCED) */}
        <div className="lg:col-span-1 space-y-6">
            <div className="cyber-box p-4 h-full flex flex-col clip-corner relative overflow-hidden">
                 {/* Decoration: Background Grid */}
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,65,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

                 <h4 className="text-lg font-bold mb-4 border-l-4 border-green-500 pl-3 flex justify-between items-center relative z-10">
                    <span>{t.neuralMap}</span>
                    <span className="text-[10px] opacity-50 font-mono animate-pulse">LIVE_FEED</span>
                 </h4>
                 
                 <div className="flex-grow min-h-[300px] relative flex items-center justify-center">
                    {/* Rotating Rings Background */}
                    <div className="absolute w-48 h-48 border border-green-500/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
                    <div className="absolute w-36 h-36 border border-green-500/10 rounded-full animate-[spin_7s_linear_infinite_reverse]"></div>
                    
                    {/* Corner Markers */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-green-500/50"></div>
                    <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-green-500/50"></div>
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-green-500/50"></div>
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-green-500/50"></div>

                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid stroke="#004411" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#00ff41', fontSize: 11, fontWeight: 'bold', fontFamily: 'Share Tech Mono' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                                name="Attributes"
                                dataKey="A"
                                stroke="#00ff41"
                                strokeWidth={2}
                                fill="#00ff41"
                                fillOpacity={0.4}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                 </div>

                 <div className="mt-6 grid grid-cols-1 gap-2 relative z-10">
                    {Object.entries(report.metrics).map(([key, value]) => (
                        <div key={key} className="bg-black/40 p-2 border-l-2 border-green-500/50 hover:bg-green-900/20 transition-colors flex justify-between items-center" onMouseEnter={() => playSound.hover()}>
                             <span className="text-[9px] uppercase opacity-70">
                                {getMetricLabel(key)}
                             </span>
                             <span className="text-xs text-green-100 font-bold text-right pl-2">{value}</span>
                        </div>
                    ))}
                 </div>
            </div>
        </div>

        {/* COL 3: SOUL SIGNATURE */}
        <div className="lg:col-span-1 space-y-6">
             <div className="cyber-box p-6 border-green-500 border-2 shadow-[0_0_20px_rgba(0,255,65,0.2)] bg-green-900/10 h-full flex flex-col clip-corner">
                <h4 className="text-xl font-bold mb-4 flex items-center gap-2 font-['Rajdhani']">
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {t.soulSignature}
                </h4>
                
                <div className="flex-grow font-mono text-sm leading-relaxed text-green-100/90 text-justify mb-6 relative">
                     {/* Decoration */}
                    <div className="absolute -left-3 top-0 bottom-0 w-[1px] bg-gradient-to-b from-green-500/50 to-transparent"></div>
                    
                    <span className="text-green-500 mr-2">&gt;&gt; {t.decipher}:</span>
                    <TypewriterText text={report.soulSignature} speed={25} />
                    <span className="animate-pulse inline-block w-2 h-4 bg-green-500 ml-1 align-middle"></span>
                </div>

                <div className="border-t border-green-500/30 pt-4">
                    <h5 className="text-xs font-bold mb-3 opacity-70 flex items-center gap-2">
                        {t.alternatives}
                        <span className="h-[1px] bg-green-500/30 flex-grow"></span>
                    </h5>
                    <div className="space-y-2">
                        {report.alternatives.map((alt, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs group cursor-default p-1 hover:bg-green-500/10 rounded" onMouseEnter={() => playSound.hover()}>
                                <span className="text-white/80 group-hover:text-green-400 transition-colors">&gt; {alt.name}</span>
                                <span className="font-bold text-green-500">%{alt.percentage}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="mt-12 space-y-6 border-t border-green-900 pt-8">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <button 
                onClick={handleShareWhatsApp}
                className="flex items-center gap-2 px-8 py-4 bg-[#25D366]/10 border border-[#25D366]/50 text-[#25D366] hover:bg-[#25D366] hover:text-black transition-all font-bold uppercase tracking-wide text-sm clip-button w-full md:w-auto justify-center group"
                onMouseEnter={() => playSound.hover()}
            >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.017-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                <span>{t.share}</span>
            </button>

            <button 
                onClick={handleShareTwitter}
                className="flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/20 text-white hover:bg-white hover:text-black transition-all font-bold uppercase tracking-wide text-sm clip-button w-full md:w-auto justify-center group"
                onMouseEnter={() => playSound.hover()}
            >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                <span>{t.post}</span>
            </button>
        </div>

        <div className="flex justify-center pt-8">
            <button 
                onClick={() => { playSound.click(); onRestart(); }}
                className="px-8 py-3 opacity-40 hover:opacity-100 text-green-500 hover:text-white transition-all text-xs tracking-[0.2em] border-b border-transparent hover:border-green-500"
                onMouseEnter={() => playSound.hover()}
            >
                {t.reset}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Result;

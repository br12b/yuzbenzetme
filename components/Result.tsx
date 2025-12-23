import React from 'react';
import { AnalysisReport } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ResultProps {
  report: AnalysisReport;
  userImage: string;
  onRestart: () => void;
}

const Result: React.FC<ResultProps> = ({ report, userImage, onRestart }) => {
  const matchPercentage = parseInt(report.mainMatch.percentage);
  const data = [
    { name: 'Match', value: matchPercentage },
    { name: 'Diff', value: 100 - matchPercentage },
  ];
  const COLORS = ['#00ff41', '#1a1a1a'];

  // Share Content Generator
  const getShareText = () => {
    return `🧬 GLOBAL HERITAGE SCAN COMPLETED\n\n👤 TARGET MATCH: ${report.mainMatch.name}\n📊 GENETIC ACCURACY: %${report.mainMatch.percentage}\n👁️ TRAIT: ${report.metrics.eyes}\n\n🔍 Biyometrik analizini şimdi yap:`;
  };

  const handleShareTwitter = () => {
    const text = getShareText();
    const url = window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const handleShareWhatsApp = () => {
    const text = getShareText();
    const url = window.location.href;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, '_blank');
  };

  const handleNativeShare = async () => {
    const shareData = {
      title: 'Global Heritage Biometric Report',
      text: getShareText(),
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
        // Fallback or alert
        alert("Tarayıcınız yerel paylaşımı desteklemiyor, lütfen butonları kullanın.");
    }
  };

  return (
    <div className="w-full max-w-5xl animate-in slide-in-from-bottom-10 fade-in duration-700 pb-12">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold tracking-widest cyber-text-shadow">BIOMETRIC ANALYSIS REPORT</h2>
        <p className="text-xs tracking-[0.5em] mt-2 opacity-60">CLASSIFIED // EYES ONLY</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Visuals & Main Match */}
        <div className="space-y-6">
          <div className="cyber-box p-6 flex flex-col items-center">
            <div className="relative w-48 h-48 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-green-500/20"></div>
                <img 
                  src={userImage} 
                  alt="User" 
                  className="w-full h-full object-cover rounded-full opacity-80"
                />
                 {/* Recharts Overlay for 'Match Ring' */}
                <div className="absolute -inset-4 z-10">
                   <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={90}
                        outerRadius={100}
                        startAngle={90}
                        endAngle={-270}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
            </div>
            
            <h3 className="text-3xl font-bold text-white mt-4">{report.mainMatch.name}</h3>
            <div className="text-5xl font-bold text-green-500 my-2 drop-shadow-lg">
                %{report.mainMatch.percentage}
            </div>
            <p className="text-sm text-center opacity-80 border-t border-green-500/30 pt-4 mt-2">
                {report.mainMatch.reason}
            </p>
          </div>

          <div className="cyber-box p-6">
             <h4 className="text-xl font-bold mb-4 border-b border-green-500/30 pb-2">ALTERNATİF EŞLEŞMELER</h4>
             <div className="space-y-4">
                {report.alternatives.map((alt, idx) => (
                    <div key={idx} className="flex justify-between items-center group">
                        <span className="text-lg group-hover:text-white transition-colors">
                            {idx + 1}. {alt.name}
                        </span>
                        <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-900 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 opacity-60" style={{ width: `${alt.percentage}%`}}></div>
                            </div>
                            <span className="font-bold">%{alt.percentage}</span>
                        </div>
                    </div>
                ))}
             </div>
          </div>
        </div>

        {/* Right Column: Detailed Metrics */}
        <div className="space-y-6">
            <div className="cyber-box p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-20">
                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>
                </div>
                <h4 className="text-xl font-bold mb-6 border-l-4 border-green-500 pl-3">YÜZ METRİKLERİ</h4>
                
                <div className="grid gap-6">
                    <div>
                        <span className="text-xs uppercase opacity-50 block mb-1">Elmacık Kemikleri (Zygomatic)</span>
                        <p className="text-white border border-green-500/20 bg-green-500/5 p-3 rounded">
                            {report.metrics.cheekbones}
                        </p>
                    </div>
                    <div>
                        <span className="text-xs uppercase opacity-50 block mb-1">Göz Yapısı (Orbital)</span>
                        <p className="text-white border border-green-500/20 bg-green-500/5 p-3 rounded">
                            {report.metrics.eyes}
                        </p>
                    </div>
                    <div>
                        <span className="text-xs uppercase opacity-50 block mb-1">Çene Hattı (Mandible)</span>
                        <p className="text-white border border-green-500/20 bg-green-500/5 p-3 rounded">
                            {report.metrics.jawline}
                        </p>
                    </div>
                </div>
            </div>

            <div className="cyber-box p-6 border-green-500 border-2 shadow-[0_0_15px_rgba(0,255,65,0.3)]">
                <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                    THE SOUL SIGNATURE
                </h4>
                <p className="leading-relaxed text-justify opacity-90 text-sm md:text-base">
                    {report.soulSignature}
                </p>
            </div>
        </div>
      </div>

      {/* Social Share & Action Section */}
      <div className="mt-12 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            
            {/* WhatsApp Share */}
            <button 
                onClick={handleShareWhatsApp}
                className="flex items-center gap-2 px-6 py-3 bg-[#25D366]/20 border border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-black transition-all font-bold uppercase tracking-wide group"
            >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.017-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                <span>Share Whatsapp</span>
            </button>

            {/* Twitter/X Share */}
            <button 
                onClick={handleShareTwitter}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/50 text-white hover:bg-white hover:text-black transition-all font-bold uppercase tracking-wide"
            >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                <span>Share X</span>
            </button>
            
             {/* General/Native Share (Mobile) */}
             <button 
                onClick={handleNativeShare}
                className="flex items-center gap-2 px-6 py-3 bg-green-900/30 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black transition-all font-bold uppercase tracking-wide md:hidden"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                <span>Share</span>
            </button>
        </div>

        <div className="flex justify-center">
            <button 
                onClick={onRestart}
                className="px-8 py-3 opacity-60 hover:opacity-100 text-green-500 hover:text-white transition-all text-xs tracking-[0.2em] border-b border-transparent hover:border-green-500"
            >
                [ INITIATE NEW SCAN ]
            </button>
        </div>
      </div>
    </div>
  );
};

export default Result;
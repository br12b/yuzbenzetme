import React, { useState } from 'react';
import { AnalysisReport } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
// @ts-ignore
import html2canvas from 'html2canvas';

interface ResultProps {
  report: AnalysisReport;
  userImage: string;
  onRestart: () => void;
}

const Result: React.FC<ResultProps> = ({ report, userImage, onRestart }) => {
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const matchPercentage = parseInt(report.mainMatch.percentage);
  const data = [
    { name: 'Match', value: matchPercentage },
    { name: 'Diff', value: 100 - matchPercentage },
  ];
  const COLORS = ['#00ff41', '#1a1a1a'];

  const getShareText = () => {
    return `🧬 GLOBAL HERITAGE REPORT\n👤 MATCH: ${report.mainMatch.name}\n📊 SCORE: %${report.mainMatch.percentage}\n\n🔍 Biyometrik analizini şimdi yap:`;
  };

  const downloadImage = (url: string) => {
    const link = document.createElement('a');
    link.download = `GlobalHeritage_Match_${Date.now()}.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSmartShare = async () => {
    setIsGeneratingCard(true);
    const element = document.getElementById('biometric-id-card');
    
    if (!element) {
        setIsGeneratingCard(false);
        return;
    }

    try {
        // Force font load check
        await document.fonts.ready;

        // Specific config to ensure correct rendering
        const canvas = await html2canvas(element, {
            backgroundColor: '#050505',
            scale: 2, // High resolution
            useCORS: true, 
            logging: false,
            width: 600,
            height: 900,
            windowWidth: 600,
            windowHeight: 900,
            onclone: (clonedDoc) => {
                const clonedElement = clonedDoc.getElementById('biometric-id-card');
                if (clonedElement) {
                    clonedElement.style.display = 'flex';
                }
            }
        });

        const dataUrl = canvas.toDataURL('image/png');
        
        // Convert to blob for sharing
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        
        if (blob) {
            const file = new File([blob], 'biometric-match.png', { type: 'image/png' });

            // Try Native Share (Mobile)
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                 try {
                    await navigator.share({
                        files: [file],
                        title: 'Global Heritage Match',
                        text: getShareText(),
                        url: window.location.href
                    });
                 } catch (shareError) {
                    console.warn("Share aborted or failed.");
                    // Optional fallback if needed, but usually users just cancel share sheet
                 }
            } else {
                // Desktop or unsupported share
                downloadImage(dataUrl);
            }
        } else {
            // Blob failed, fallback to dataURL download
            downloadImage(dataUrl);
        }

    } catch (error) {
        console.error("Card generation failed", error);
        alert("Kart oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
        setIsGeneratingCard(false);
    }
  };

  const handleShareWhatsApp = () => {
      const text = getShareText();
      const url = window.location.href;
      window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, '_blank');
  };

  const handleShareTwitter = () => {
      const text = getShareText();
      const url = window.location.href;
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  return (
    <div className="w-full max-w-5xl animate-in slide-in-from-bottom-10 fade-in duration-700 pb-12 relative">
      
      {/* HEADER */}
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
            
            <h3 className="text-3xl font-bold text-white mt-4 text-center">{report.mainMatch.name}</h3>
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

      {/* --- HIDDEN ID CARD TEMPLATE (Fixed & Improved) --- */}
      {/* We place it in a container that hides it from view but keeps it rendered for html2canvas */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '0px', height: '0px', overflow: 'hidden', pointerEvents: 'none' }}>
        <div id="biometric-id-card" style={{ 
            width: '600px', 
            height: '900px', 
            backgroundColor: '#050505',
            backgroundImage: "radial-gradient(circle at 50% 50%, #111 0%, #000 100%)",
            color: '#00ff41',
            fontFamily: "'Share Tech Mono', monospace",
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            padding: '40px',
            boxSizing: 'border-box'
        }}>
            
            {/* Overlay Patterns */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(0, 255, 65, .03) 25%, rgba(0, 255, 65, .03) 26%, transparent 27%, transparent 74%, rgba(0, 255, 65, .03) 75%, rgba(0, 255, 65, .03) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 255, 65, .03) 25%, rgba(0, 255, 65, .03) 26%, transparent 27%, transparent 74%, rgba(0, 255, 65, .03) 75%, rgba(0, 255, 65, .03) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px', pointerEvents: 'none' }}></div>
            <div style={{ position: 'absolute', top: '20px', right: '20px', width: '100px', height: '100px', border: '1px solid rgba(0,255,65,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                 <div style={{ width: '80%', height: '80%', border: '1px solid rgba(0,255,65,0.5)', borderRadius: '50%', borderLeftColor: 'transparent', transform: 'rotate(45deg)' }}></div>
            </div>

            {/* Header */}
            <div style={{ borderBottom: '2px solid #00ff41', paddingBottom: '20px', marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 10 }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: 'bold', letterSpacing: '0.1em', color: '#fff', margin: 0, lineHeight: 1 }}>GLOBAL HERITAGE</h1>
                    <h2 style={{ fontSize: '16px', letterSpacing: '0.3em', opacity: 0.8, margin: '10px 0 0 0' }}>BIOMETRIC IDENTITY</h2>
                </div>
                <div style={{ textAlign: 'right', fontSize: '10px', opacity: 0.6 }}>
                    <div>CLASS-A // SECURE</div>
                    <div>ID: {Math.floor(Math.random() * 999999)}</div>
                </div>
            </div>

            {/* Main Visual Section */}
            <div style={{ display: 'flex', gap: '30px', marginBottom: '40px', height: '250px', position: 'relative', zIndex: 10 }}>
                {/* Photo */}
                <div style={{ width: '220px', height: '250px', border: '2px solid #00ff41', padding: '4px', position: 'relative' }}>
                    <img src={userImage} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%) contrast(1.2)' }} alt="Subject" />
                    {/* Corner Markers */}
                    <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '15px', height: '15px', borderTop: '4px solid #fff', borderLeft: '4px solid #fff' }}></div>
                    <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '15px', height: '15px', borderBottom: '4px solid #fff', borderRight: '4px solid #fff' }}></div>
                    <div style={{ position: 'absolute', bottom: '10px', left: 0, right: 0, textAlign: 'center', background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 0' }}>SUBJECT DETECTED</div>
                </div>
                
                {/* Match Info */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '5px' }}>PRIMARY MATCH IDENTIFIED</div>
                        <div style={{ fontSize: '42px', fontWeight: 'bold', color: '#fff', lineHeight: '1.1', textTransform: 'uppercase' }}>{report.mainMatch.name}</div>
                    </div>
                    
                    <div style={{ border: '1px solid rgba(0,255,65,0.3)', background: 'rgba(0,255,65,0.05)', padding: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                             <span style={{ fontSize: '56px', fontWeight: 'bold', lineHeight: 1, color: '#fff' }}>%{report.mainMatch.percentage}</span>
                             <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.8 }}>Genetic<br/>Accuracy</div>
                             </div>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: '#111', marginTop: '10px', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${report.mainMatch.percentage}%`, height: '100%', background: '#00ff41' }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: 'auto', position: 'relative', zIndex: 10 }}>
                {[
                    { label: 'ZYGOMATIC STRUCTURE', val: report.metrics.cheekbones },
                    { label: 'ORBITAL ANALYSIS', val: report.metrics.eyes },
                    { label: 'MANDIBLE ANGLE', val: report.metrics.jawline },
                    { label: 'SOUL SIGNATURE', val: report.soulSignature.substring(0, 30) + "..." }
                ].map((item, i) => (
                    <div key={i} style={{ border: '1px solid rgba(0,255,65,0.2)', padding: '12px' }}>
                        <div style={{ fontSize: '10px', opacity: 0.5, marginBottom: '5px' }}>{item.label}</div>
                        <div style={{ fontSize: '14px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.val}</div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div style={{ borderTop: '2px solid #00ff41', paddingTop: '20px', marginTop: '30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     {/* Fake QR */}
                     <div style={{ width: '40px', height: '40px', background: '#fff', padding: '2px' }}>
                        <div style={{ width: '100%', height: '100%', backgroundColor: '#000', backgroundImage: 'linear-gradient(45deg, #fff 25%, transparent 25%, transparent 75%, #fff 75%, #fff), linear-gradient(45deg, #fff 25%, transparent 25%, transparent 75%, #fff 75%, #fff)', backgroundSize: '10px 10px', backgroundPosition: '0 0, 5px 5px' }}></div>
                     </div>
                     <div style={{ fontSize: '10px', opacity: 0.6, lineHeight: 1.4 }}>
                        VERIFIED BY GEMINI AI<br/>
                        OFFICIAL RECORD
                     </div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', border: '2px solid #fff', padding: '5px 15px', transform: 'rotate(-5deg)', opacity: 0.8 }}>
                    APPROVED
                </div>
            </div>

        </div>
      </div>

      {/* Social Share & Action Section */}
      <div className="mt-12 space-y-6">
        
        {/* BIG DOWNLOAD/SHARE BUTTON */}
        <div className="flex justify-center mb-6">
             <button 
                onClick={handleSmartShare}
                disabled={isGeneratingCard}
                className="group relative px-8 py-5 bg-green-600 text-black font-bold text-xl uppercase tracking-widest hover:bg-green-500 transition-all shadow-[0_0_20px_rgba(0,255,65,0.4)] hover:shadow-[0_0_40px_rgba(0,255,65,0.6)] disabled:opacity-50 disabled:cursor-wait flex items-center gap-4 overflow-hidden"
            >
                <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-white/20 skew-x-[-20deg] group-hover:left-[200%] transition-all duration-500"></div>

                {isGeneratingCard ? (
                     <>
                        <svg className="animate-spin h-6 w-6 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Kart Hazırlanıyor...
                     </>
                ) : (
                    <>
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        <span>KARTI İNDİR / PAYLAŞ</span>
                    </>
                )}
            </button>
        </div>

        <p className="text-center text-xs opacity-50 mb-4">*Mobil cihazlarda paylaşım ekranı açılır. Masaüstünde iner.</p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <button 
                onClick={handleShareWhatsApp}
                className="flex items-center gap-2 px-6 py-3 bg-[#25D366]/10 border border-[#25D366]/50 text-[#25D366] hover:bg-[#25D366] hover:text-black transition-all font-bold uppercase tracking-wide text-sm"
            >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.017-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                <span>WhatsApp</span>
            </button>

            <button 
                onClick={handleShareTwitter}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/20 text-white hover:bg-white hover:text-black transition-all font-bold uppercase tracking-wide text-sm"
            >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                <span>X / Twitter</span>
            </button>
        </div>

        <div className="flex justify-center pt-8">
            <button 
                onClick={onRestart}
                className="px-8 py-3 opacity-40 hover:opacity-100 text-green-500 hover:text-white transition-all text-xs tracking-[0.2em] border-b border-transparent hover:border-green-500"
            >
                [ YENİ TARAMA BAŞLAT ]
            </button>
        </div>
      </div>
    </div>
  );
};

export default Result;
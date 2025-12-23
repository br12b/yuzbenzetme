import React from 'react';
import { AnalysisReport } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

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

      <div className="mt-12 text-center">
        <button 
            onClick={onRestart}
            className="px-8 py-3 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black transition-colors uppercase tracking-widest text-sm"
        >
            New Scan
        </button>
      </div>
    </div>
  );
};

export default Result;
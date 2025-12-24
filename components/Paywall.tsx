
import React, { useState, useEffect } from 'react';
import { AnalysisReport, Language } from '../types';
import { translations } from '../utils/translations';
import { playSound } from '../utils/sound';

interface PaywallProps {
  onPay: () => void;
  report: AnalysisReport; // We need the report to show the "Teaser" (percentages)
  userImage: string;
  lang: Language;
}

const Paywall: React.FC<PaywallProps> = ({ onPay, report, userImage, lang }) => {
  const [processing, setProcessing] = useState(false);
  const t = translations[lang].paywall;

  useEffect(() => {
    playSound.locked(); // Access denied sound
  }, []);

  const handlePay = () => {
    playSound.click();
    setProcessing(true);
    
    // Simulate payment gateway steps
    setTimeout(() => {
      // Step 1: Connecting
      playSound.click();
    }, 1000);

    setTimeout(() => {
        // Step 2: Processing
        playSound.scan();
    }, 2500);

    setTimeout(() => {
      // Step 3: Success
      onPay();
    }, 4000);
  };

  return (
    <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8 items-center justify-center animate-in zoom-in-95 duration-500">
      
      {/* TEASER CARD (BLURRED RESULT) */}
      <div className="relative w-full max-w-sm">
        {/* The Blur Filter Overlay */}
        <div className="absolute inset-0 z-20 backdrop-blur-md bg-black/50 flex flex-col items-center justify-center border border-red-500/50 rounded-xl overflow-hidden">
            {/* Stamp */}
            <div className="border-4 border-red-500 text-red-500 font-bold text-3xl p-2 rotate-[-15deg] opacity-80 mask-image">
                {t.censored}
            </div>
            <div className="mt-4 text-xs text-red-400 font-mono text-center px-4">
                {t.reason}
            </div>
            {/* Lock Icon */}
            <div className="mt-6 animate-pulse">
                <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            </div>
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
                        <span className="text-sm font-bold bg-white text-black px-1">CENSORED</span>
                    </div>
                    <div>
                        <span className="text-[9px] uppercase block">MATCH</span>
                        <div className="flex items-center gap-2">
                            {/* We show the percentage to hook them! */}
                            <span className="text-2xl font-bold text-green-500">%{report.mainMatch.percentage}</span>
                            <span className="text-xs text-green-500 animate-pulse">!!!</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* PAYMENT ACTION PANEL */}
      <div className="w-full max-w-md cyber-box p-8 flex flex-col clip-corner bg-black/90">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white font-['Rajdhani'] flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
            {t.alert}
        </h2>
        
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-green-500 to-transparent my-4"></div>

        <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-sm font-mono text-green-100/80">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {t.matchFound}: <span className="text-green-400 font-bold">%{report.mainMatch.percentage}</span>
            </div>
            
            <ul className="space-y-2 pl-2">
                {t.features.map((feature, i) => (
                    <li key={i} className="text-xs text-gray-400 flex items-center gap-2">
                        <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                        {feature}
                    </li>
                ))}
            </ul>
        </div>

        <button
          onClick={handlePay}
          disabled={processing}
          className="w-full py-5 bg-gradient-to-r from-green-600 to-green-700 text-black font-bold text-lg uppercase tracking-widest hover:from-green-500 hover:to-green-600 hover:shadow-[0_0_20px_rgba(0,255,65,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed clip-button relative overflow-hidden group"
        >
            {processing ? (
                <div className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{t.process}</span>
                </div>
            ) : (
                <span className="relative z-10">{t.unlock}</span>
            )}
            
            {/* Shiny effect */}
            {!processing && <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] group-hover:animate-[shine_1s_infinite]"></div>}
        </button>

        <div className="mt-4 text-[10px] text-center text-gray-600 flex justify-center items-center gap-2">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            {t.secure}
        </div>
      </div>
    </div>
  );
};

export default Paywall;

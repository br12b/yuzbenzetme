
import React, { useState } from 'react';
import { AppStep, AnalysisReport, AnalysisMode, AnalysisStyle, Language } from './types';
import Landing from './components/Landing';
import Scanning from './components/Scanning';
import Result from './components/Result';
import MatrixRain from './components/MatrixRain';
import BootSequence from './components/BootSequence';
import GlitchOverlay from './components/GlitchOverlay';
import { analyzeImage } from './services/geminiService';
import { playSound } from './utils/sound';
import { translations } from './utils/translations';

const App: React.FC = () => {
  const [booted, setBooted] = useState(false);
  const [lang, setLang] = useState<Language>('tr'); 
  const [step, setStep] = useState<AppStep>(AppStep.LANDING);
  
  // New States
  const [mode, setMode] = useState<AnalysisMode>(AnalysisMode.HERITAGE);
  const [style, setStyle] = useState<AnalysisStyle>(AnalysisStyle.SCIENTIFIC);
  
  const [image, setImage] = useState<string | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const t = translations[lang];
  
  // Glitch state
  const [glitchActive, setGlitchActive] = useState(false);

  const toggleLanguage = () => {
    playSound.click();
    setLang(prev => prev === 'tr' ? 'en' : 'tr');
    triggerGlitch(200);
  };

  const triggerGlitch = (duration = 300) => {
      setGlitchActive(true);
      playSound.glitch();
      setTimeout(() => setGlitchActive(false), duration);
  };

  const handleBootComplete = () => {
      setBooted(true);
      triggerGlitch(500); 
  };

  const handleImageUpload = (file: File) => {
    playSound.click(); 
    triggerGlitch(200); 
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      setStep(AppStep.SCANNING);
    };
    reader.readAsDataURL(file);
  };

  const handleModeSelect = (m: AnalysisMode) => {
    playSound.click();
    setMode(m);
  };
  
  const handleStyleSelect = (s: AnalysisStyle) => {
    setStyle(s);
  };

  const handleScanComplete = async () => {
    if (!image) return;
    
    setStep(AppStep.ANALYZING);
    triggerGlitch(200);

    try {
      const data = await analyzeImage(image, mode, style, lang);
      setReport(data);
      // DIRECTLY GO TO RESULT for instant gratification/meme sharing
      setStep(AppStep.RESULT);
    } catch (err: any) {
      console.error(err);
      playSound.error();
      triggerGlitch(600); 
      const errorMessage = err?.message || t.error.unknown;
      setError(errorMessage);
      setStep(AppStep.ERROR);
    }
  };

  const resetApp = () => {
    setStep(AppStep.LANDING);
    setImage(null);
    setReport(null);
    setError(null);
    triggerGlitch(300);
  };

  if (!booted) {
      return <BootSequence onComplete={handleBootComplete} lang={lang} />;
  }

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden bg-black text-green-500 font-mono flex flex-col items-center justify-center p-4">
      
      {/* GLOBAL EFFECTS */}
      <MatrixRain />
      <GlitchOverlay active={glitchActive} />
      
      {/* Dynamic Backgrounds (Grid) */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-grid opacity-10"></div>
      
      {/* Ambient Glow */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-green-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-green-900/20 blur-[120px] rounded-full pointer-events-none"></div>

      {/* LANGUAGE SWITCHER */}
      <button 
        onClick={toggleLanguage}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 border border-green-900 bg-black/50 px-3 py-1 text-xs hover:bg-green-900/50 transition-colors backdrop-blur-md clip-button"
      >
        <span className={lang === 'tr' ? 'text-white font-bold' : 'opacity-50'}>TR</span>
        <span className="opacity-30">/</span>
        <span className={lang === 'en' ? 'text-white font-bold' : 'opacity-50'}>EN</span>
      </button>

      <div className="z-10 w-full max-w-5xl relative flex flex-col items-center">
        {/* Sticky Header for Status */}
        {step !== AppStep.LANDING && (
            <header className="absolute -top-12 left-0 w-full flex justify-between items-center text-[10px] md:text-xs opacity-50 border-b border-green-900 pb-2 animate-in fade-in">
                <div className="flex gap-4">
                    <span>SİS.V.5.4.0</span>
                    <span className="uppercase text-green-400">PROTOKOL: {mode}</span>
                    <span className="uppercase text-green-400 opacity-70">[{style}]</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span>ONLINE</span>
                </div>
            </header>
        )}

        <main className="w-full flex flex-col items-center justify-center min-h-[600px]">
          {step === AppStep.LANDING && (
            <Landing 
                onImageUpload={handleImageUpload} 
                onModeSelect={handleModeSelect}
                onStyleSelect={handleStyleSelect}
                selectedMode={mode}
                selectedStyle={style}
                lang={lang}
            />
          )}
          
          {step === AppStep.SCANNING && image && (
            <Scanning image={image} onComplete={handleScanComplete} lang={lang} />
          )}

          {step === AppStep.ANALYZING && (
            <div className="text-center animate-pulse relative p-12 cyber-box clip-corner">
              <div className="absolute top-0 left-0 w-full h-1 bg-green-500/50 animate-[scan_1s_infinite_linear]"></div>
              <h2 className="text-3xl font-bold mb-4 font-['Rajdhani'] tracking-widest text-white">{t.analyzing.title}</h2>
              <p className="text-sm opacity-75 uppercase tracking-[0.2em] text-green-400">{t.analyzing.subtitle}</p>
              
              <div className="mt-8 flex justify-center gap-2">
                 <div className="w-2 h-8 bg-green-500 animate-[pulse_0.5s_infinite]"></div>
                 <div className="w-2 h-8 bg-green-500 animate-[pulse_0.5s_infinite_0.1s]"></div>
                 <div className="w-2 h-8 bg-green-500 animate-[pulse_0.5s_infinite_0.2s]"></div>
                 <div className="w-2 h-8 bg-green-500 animate-[pulse_0.5s_infinite_0.3s]"></div>
              </div>
            </div>
          )}

          {step === AppStep.RESULT && report && image && (
            <Result report={report} userImage={image} onRestart={resetApp} lang={lang} />
          )}

          {step === AppStep.ERROR && (
             <div className="cyber-box p-8 text-center max-w-md border-red-500 shadow-[0_0_30px_rgba(255,0,0,0.2)] clip-corner bg-black/90">
                <div className="mb-6 flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 animate-pulse"></div>
                        <svg className="w-20 h-20 text-red-500 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
                <h2 className="text-red-500 text-4xl font-bold mb-2 tracking-widest font-['Rajdhani']">{t.error.title}</h2>
                <div className="h-[1px] w-full bg-red-900 my-4"></div>
                <div className="text-red-400 text-sm font-mono break-words opacity-80 mb-8">
                    {error}
                </div>
                <button 
                  onClick={resetApp}
                  className="w-full py-4 bg-transparent border border-red-500 text-red-500 hover:bg-red-500 hover:text-black transition-all uppercase tracking-widest font-bold clip-button"
                >
                  {t.error.reset}
                </button>
             </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;

import React, { useState } from 'react';
import { AppStep, AnalysisReport } from './types';
import Landing from './components/Landing';
import Scanning from './components/Scanning';
import Result from './components/Result';
import { analyzeImage } from './services/geminiService';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.LANDING);
  const [image, setImage] = useState<string | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      setStep(AppStep.SCANNING);
    };
    reader.readAsDataURL(file);
  };

  const handleScanComplete = async () => {
    if (!image) return;
    
    setStep(AppStep.ANALYZING);
    try {
      const data = await analyzeImage(image);
      setReport(data);
      setStep(AppStep.RESULT);
    } catch (err: any) {
      console.error(err);
      const errorMessage = err?.message || "Bilinmeyen sunucu hatası";
      setError(`Sistem Hatası: ${errorMessage}`);
      setStep(AppStep.ERROR);
    }
  };

  const resetApp = () => {
    setStep(AppStep.LANDING);
    setImage(null);
    setReport(null);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-black text-green-500 font-mono flex flex-col items-center justify-center p-4">
      
      {/* Background Matrix/Cyberpunk Elements */}
      <div className="fixed inset-0 pointer-events-none opacity-10 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')]"></div>
      </div>

      <div className="z-10 w-full max-w-4xl relative">
        <header className="absolute -top-16 left-0 w-full flex justify-between items-center text-xs opacity-50 mb-8">
            <span>SYS.V.4.0.1</span>
            <span>SECURE_CONNECTION: TRUE</span>
        </header>

        <main className="min-h-[600px] flex flex-col items-center justify-center">
          {step === AppStep.LANDING && (
            <Landing onImageUpload={handleImageUpload} />
          )}
          
          {step === AppStep.SCANNING && image && (
            <Scanning image={image} onComplete={handleScanComplete} />
          )}

          {step === AppStep.ANALYZING && (
            <div className="text-center animate-pulse">
              <h2 className="text-2xl font-bold mb-4">REPORT_GENERATING...</h2>
              <p className="text-sm opacity-75">Decrypting Neural Patterns</p>
              <div className="w-64 h-2 bg-gray-900 mt-4 mx-auto border border-green-500 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 animate-[width_2s_infinite]"></div>
              </div>
            </div>
          )}

          {step === AppStep.RESULT && report && image && (
            <Result report={report} userImage={image} onRestart={resetApp} />
          )}

          {step === AppStep.ERROR && (
             <div className="cyber-box p-8 text-center max-w-md">
                <h2 className="text-red-500 text-3xl font-bold mb-4">SYSTEM_FAILURE</h2>
                <p className="mb-6 text-sm break-words">{error}</p>
                <button 
                  onClick={resetApp}
                  className="px-6 py-2 bg-red-900 text-white border border-red-500 hover:bg-red-700 transition-colors uppercase tracking-widest"
                >
                  Reboot System
                </button>
             </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
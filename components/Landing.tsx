import React, { useRef } from 'react';

interface LandingProps {
  onImageUpload: (file: File) => void;
}

const Landing: React.FC<LandingProps> = ({ onImageUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in duration-700">
      <div className="mb-6 relative">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter cyber-text-shadow">
          GLOBAL HERITAGE
        </h1>
        <h2 className="text-xl md:text-2xl tracking-[0.5em] mt-2 opacity-80">
          BIOMETRIC MATCHER
        </h2>
        <div className="absolute -inset-4 border border-green-500/20 blur-sm -z-10"></div>
      </div>

      <div className="max-w-xl text-sm md:text-base leading-relaxed opacity-90 border-l-2 border-green-500 pl-4 text-left">
        <p className="mb-2">>> INITIATING BIOMETRIC SEQUENCE...</p>
        <p className="mb-2">>> TARGET: IDENTIFY HISTORICAL LINEAGE.</p>
        <p>>> PROTOCOL: DEEP FACIAL ANALYSIS.</p>
      </div>

      <div className="mt-8 group">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept="image/*"
        />
        <button
          onClick={triggerUpload}
          className="relative px-12 py-6 bg-black border-2 border-green-500 text-green-500 font-bold text-xl uppercase tracking-widest overflow-hidden transition-all duration-300 hover:bg-green-500 hover:text-black hover:shadow-[0_0_20px_#00ff00]"
        >
          <span className="relative z-10 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Yüz Tarayıcıyı Başlat
          </span>
        </button>
        <p className="mt-4 text-xs opacity-50 uppercase">
          *Accepted formats: JPEG, PNG. High resolution required for max accuracy.
        </p>
      </div>
    </div>
  );
};

export default Landing;
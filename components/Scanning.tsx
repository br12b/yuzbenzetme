import React, { useEffect, useState } from 'react';
import { ScanLog } from '../types';

interface ScanningProps {
  image: string;
  onComplete: () => void;
}

const LOG_MESSAGES = [
  "Initializing Camera Feed...",
  "Detecting Facial Landmarks...",
  "Mapping Zygomatic Bones...",
  "Calculating Golden Ratio...",
  "Interpupillary Distance: 62mm...",
  "Connecting to Global Database...",
  "Scanning 15,000+ Historical Records...",
  "Cross-referencing Medieval Archives...",
  "Analyzing Renaissance Portraits...",
  "Biometric Match Found..."
];

const Scanning: React.FC<ScanningProps> = ({ image, onComplete }) => {
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let logIndex = 0;
    const logInterval = setInterval(() => {
      if (logIndex < LOG_MESSAGES.length) {
        setLogs(prev => [...prev.slice(-4), { id: Date.now(), text: LOG_MESSAGES[logIndex] }]);
        logIndex++;
      }
    }, 400);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 99) {
          clearInterval(progressInterval);
          clearInterval(logInterval);
          setTimeout(onComplete, 800); // Slight delay at 99% before finishing
          return 99;
        }
        return prev + 1.5;
      });
    }, 60);

    return () => {
      clearInterval(logInterval);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <div className="w-full max-w-2xl flex flex-col items-center">
      <div className="relative w-64 h-64 mb-8 cyber-box p-1">
        <img 
          src={image} 
          alt="Scanning" 
          className="w-full h-full object-cover filter grayscale contrast-125"
        />
        <div className="scan-line"></div>
        <div className="absolute top-2 right-2 text-xs bg-black px-1 border border-green-500 animate-pulse">
          REC
        </div>
        
        {/* Face Markers overlay simulation */}
        <div className="absolute top-1/3 left-1/4 w-2 h-2 border border-green-500 rounded-full"></div>
        <div className="absolute top-1/3 right-1/4 w-2 h-2 border border-green-500 rounded-full"></div>
        <div className="absolute bottom-1/4 left-1/2 w-4 h-4 border-b border-green-500 -translate-x-1/2"></div>
      </div>

      <div className="w-full bg-gray-900 h-6 border border-green-500/50 mb-4 relative overflow-hidden">
        <div 
          className="h-full bg-green-500 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        ></div>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-black mix-blend-screen">
          {Math.floor(progress)}% COMPLETED
        </span>
      </div>

      <div className="w-full font-mono text-sm h-32 overflow-hidden flex flex-col justify-end items-start border-l border-green-500/30 pl-4">
        {logs.map((log) => (
          <div key={log.id} className="animate-in slide-in-from-bottom-2 fade-in duration-300">
            <span className="opacity-50 mr-2">[{new Date(log.id).toLocaleTimeString().split(' ')[0]}]</span>
            {`> ${log.text}`}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Scanning;
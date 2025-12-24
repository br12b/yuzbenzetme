import React from 'react';

const GlitchOverlay: React.FC<{ active: boolean }> = ({ active }) => {
  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden mix-blend-hard-light opacity-50">
       <div className="w-full h-full animate-glitch-1 bg-red-500/10 absolute top-0 left-0"></div>
       <div className="w-full h-full animate-glitch-2 bg-blue-500/10 absolute top-0 left-0 translate-x-1"></div>
       <div className="w-full h-2 bg-white absolute top-1/4 opacity-20 animate-scan"></div>
       
       <style>{`
         @keyframes glitch-1 {
           0% { clip-path: inset(20% 0 80% 0); transform: translate(-2px, 1px); }
           20% { clip-path: inset(60% 0 10% 0); transform: translate(2px, -1px); }
           40% { clip-path: inset(40% 0 50% 0); transform: translate(-2px, 2px); }
           60% { clip-path: inset(80% 0 5% 0); transform: translate(2px, -2px); }
           80% { clip-path: inset(10% 0 70% 0); transform: translate(-1px, 1px); }
           100% { clip-path: inset(30% 0 50% 0); transform: translate(1px, -1px); }
         }
         @keyframes glitch-2 {
           0% { clip-path: inset(10% 0 60% 0); transform: translate(2px, -1px); }
           20% { clip-path: inset(80% 0 5% 0); transform: translate(-2px, 2px); }
           40% { clip-path: inset(30% 0 20% 0); transform: translate(1px, 1px); }
           60% { clip-path: inset(10% 0 80% 0); transform: translate(-1px, -2px); }
           80% { clip-path: inset(50% 0 30% 0); transform: translate(2px, 1px); }
           100% { clip-path: inset(20% 0 60% 0); transform: translate(-2px, 1px); }
         }
         .animate-glitch-1 { animation: glitch-1 0.2s infinite linear alternate-reverse; }
         .animate-glitch-2 { animation: glitch-2 0.2s infinite linear alternate-reverse; }
       `}</style>
    </div>
  );
};

export default GlitchOverlay;
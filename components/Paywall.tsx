import React, { useState } from 'react';

interface PaywallProps {
  onPay: () => void;
}

const Paywall: React.FC<PaywallProps> = ({ onPay }) => {
  const [processing, setProcessing] = useState(false);

  const handlePay = () => {
    setProcessing(true);
    // Simulate transaction delay
    setTimeout(() => {
      onPay();
    }, 2000);
  };

  return (
    <div className="relative cyber-box p-8 md:p-12 max-w-xl w-full text-center animate-in zoom-in-95 duration-500">
      <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-green-500"></div>
      <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-green-500"></div>

      <h2 className="text-3xl font-bold mb-2">ANALYSIS COMPLETE (99%)</h2>
      <div className="h-1 w-24 bg-green-500 mx-auto mb-6"></div>

      <p className="mb-6 text-lg">
        Biyometrik verilerin işlendi. Genetik mirasın tarihteki <span className="text-white font-bold animate-pulse">EFSANEVİ BİR LİDER</span> ile %95 uyum gösteriyor.
      </p>

      <div className="bg-green-900/10 border border-green-500/30 p-4 mb-8 text-left text-sm">
        <h3 className="font-bold border-b border-green-500/30 pb-2 mb-2">RAPOR İÇERİĞİ:</h3>
        <ul className="list-disc list-inside space-y-1 opacity-80">
          <li>Detaylı Yüz Metrikleri (Altın Oran)</li>
          <li>En Yüksek Uyumlu Tarihi Figür</li>
          <li>Genetik Köken Analizi</li>
          <li>"Soul Signature" Karakter Yorumu</li>
        </ul>
      </div>

      <div className="flex flex-col gap-4">
        <button
          onClick={handlePay}
          disabled={processing}
          className="w-full py-4 bg-green-600 text-black font-bold text-xl uppercase hover:bg-green-500 hover:shadow-[0_0_15px_#00ff00] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? 'TRANSACTION PENDING...' : 'RAPORU AÇ (1 USDT)'}
        </button>
        <p className="text-xs opacity-40">
          *Bu bir simülasyondur. Gerçek para çekilmeyecektir. Demo amaçlıdır.
        </p>
      </div>
    </div>
  );
};

export default Paywall;
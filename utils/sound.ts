
// Gelişmiş Sinematik Ses Motoru
const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
let audioCtx: AudioContext | null = null;
let ambientNodes: { osc1: OscillatorNode, osc2: OscillatorNode, gain: GainNode } | null = null;

// Tarayıcı kısıtlamaları yüzünden AudioContext ilk kullanıcı etkileşimiyle başlatılmalı.
export const initAudio = () => {
    if (!audioCtx) {
        audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
};

const createNoiseBuffer = () => {
    if (!audioCtx) return null;
    const bufferSize = audioCtx.sampleRate * 2; // 2 seconds
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
};

// --- SOUND FUNCTIONS ---

export const playSound = {
  // Arka plan gerilim sesi (Drone)
  startAmbience: () => {
    if (!audioCtx || ambientNodes) return;
    
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    // Derin bas tonları
    osc1.type = 'sawtooth';
    osc1.frequency.value = 50; 
    
    osc2.type = 'sine';
    osc2.frequency.value = 52; // Detune effect (Binaural beat hissi)

    filter.type = 'lowpass';
    filter.frequency.value = 200;

    gain.gain.value = 0.03; // Çok düşük ses (rahatsız etmesin)

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.start();
    osc2.start();

    ambientNodes = { osc1, osc2, gain };
  },

  stopAmbience: () => {
      if (ambientNodes) {
          ambientNodes.gain.gain.exponentialRampToValueAtTime(0.001, audioCtx!.currentTime + 2);
          setTimeout(() => {
            ambientNodes?.osc1.stop();
            ambientNodes?.osc2.stop();
            ambientNodes = null;
          }, 2000);
      }
  },

  hover: () => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  },

  click: () => {
    if (!audioCtx) return;
    // Mekanik "Click" sesi
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  },

  scan: () => {
    if (!audioCtx) return;
    // Veri işleme sesi (Data Computing)
    const osc = audioCtx.createOscillator();
    const mod = audioCtx.createOscillator(); // LFO
    const modGain = audioCtx.createGain();
    const gain = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 2);

    mod.type = 'square';
    mod.frequency.value = 15; // 15Hz titreme
    
    modGain.gain.value = 500;

    mod.connect(modGain);
    modGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    mod.start();
    osc.stop(audioCtx.currentTime + 2);
    mod.stop(audioCtx.currentTime + 2);
  },

  glitch: () => {
      if (!audioCtx) return;
      const buffer = createNoiseBuffer();
      if (!buffer) return;

      const source = audioCtx.createBufferSource();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      source.buffer = buffer;
      filter.type = 'highpass';
      filter.frequency.value = 1000;

      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      
      source.start();
      source.stop(audioCtx.currentTime + 0.2);
  },

  // Access Denied (Paywall hit)
  locked: () => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 0.4);
    
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    // Double beep
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
    
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(100, audioCtx.currentTime + 0.25);
    osc2.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 0.45);
    gain2.gain.setValueAtTime(0.3, audioCtx.currentTime + 0.25);
    gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
    
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(audioCtx.currentTime + 0.25);
    osc2.stop(audioCtx.currentTime + 0.45);
  },

  success: () => {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    
    // Chord: Cmaj7 (C, E, G, B) futuristic sweep
    [523.25, 659.25, 783.99, 987.77].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        
        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 2);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 2);
    });
  },

  error: () => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 0.5); // Pitch down
    
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  }
};

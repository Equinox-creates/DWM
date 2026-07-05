let isMuted = false;

export const setMuted = (muted: boolean) => {
  isMuted = muted;
};

export const getMuted = () => isMuted;

let sharedCtx: AudioContext | null = null;

const getCtx = () => {
    if (!sharedCtx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        sharedCtx = new AudioContextClass();
    }
    if (sharedCtx.state === 'suspended') {
        sharedCtx.resume();
    }
    return sharedCtx;
};

const playSimpleSound = (freqs: number[], type: OscillatorType = 'sine', duration = 0.1, volume = 0.05) => {
    if (isMuted) return;
    try {
        const ctx = getCtx();
        const now = ctx.currentTime;
        
        freqs.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const startTime = now + (i * 0.02); // Stagger for multiple frequencies
            
            osc.type = type;
            osc.frequency.setValueAtTime(freq, startTime);
            
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(volume, startTime + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(startTime);
            osc.stop(startTime + duration + 0.1);
            
            // Critical cleanup to avoid context limits
            osc.onended = () => {
                osc.disconnect();
                gain.disconnect();
            };
        });
    } catch (e) {
        console.warn("Audio playback failed", e);
    }
};

export const playButtonSound = () => {
    // Professional soft tick
    playSimpleSound([800], 'sine', 0.04, 0.015);
};

export const playSendSound = () => {
    // Peaceful ascending chime
    playSimpleSound([600, 900, 1200], 'sine', 0.4, 0.02);
};

export const playDeleteSound = () => {
    // Soft descending thud
    playSimpleSound([180, 120], 'sine', 0.2, 0.03);
};

export const playToastSound = (type: 'enter' | 'exit') => {
    if (type === 'enter') {
        playSimpleSound([659.25, 987.77], 'sine', 0.3, 0.02);
    } else {
        playSimpleSound([987.77, 659.25], 'sine', 0.3, 0.02);
    }
};

const audioCtx = typeof window !== 'undefined' ? new AudioContext() : null;

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15): void {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

export function playCompleteSound(): void {
  if (!audioCtx) return;
  // Two ascending tones — satisfying "ding ding"
  playTone(600, 0.15, 'sine', 0.12);
  setTimeout(() => playTone(900, 0.2, 'sine', 0.1), 100);
}

export function playClickSound(): void {
  playTone(400, 0.06, 'square', 0.05);
}

export function playDeleteSound(): void {
  playTone(300, 0.1, 'sawtooth', 0.06);
  setTimeout(() => playTone(200, 0.15, 'sawtooth', 0.04), 80);
}

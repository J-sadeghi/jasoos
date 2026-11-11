// Short "time is up" sound made with the Web Audio API (no sound file needed) + vibration.
let ctx = null;

/** Must be called from a tap (browsers only allow sound after a user gesture). */
export function unlockAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
  } catch { /* ignore */ }
}

export function playAlarm(withSound) {
  try { navigator.vibrate?.([300, 150, 300, 150, 500]); } catch { /* ignore */ }
  if (!withSound || !ctx) return;
  try {
    const t0 = ctx.currentTime;
    [0, 0.28, 0.56].forEach((d, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = i === 2 ? 1046 : 784;
      gain.gain.setValueAtTime(0.0001, t0 + d);
      gain.gain.exponentialRampToValueAtTime(0.35, t0 + d + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + d + (i === 2 ? 0.5 : 0.22));
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0 + d);
      osc.stop(t0 + d + 0.55);
    });
  } catch { /* ignore */ }
}

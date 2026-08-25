import { useAudioStore } from "../stores/audioStore.js";

let audioCtx = null;

function getContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioCtx = new AudioContextClass();
  }
  // Browsers suspend the context until a user gesture; every play() call
  // is already the result of one (a click), so resume is always safe here.
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

/** Plays a short synthesized tone (or sequence of tones). No audio files — everything here is generated, so there's nothing to license. */
function playTones(tones) {
  if (useAudioStore.getState().muted) return;
  const ctx = getContext();
  if (!ctx) return;

  let startTime = ctx.currentTime;
  for (const { freq, duration, type = "sine", gain = 0.06 } of tones) {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gainNode.gain.setValueAtTime(gain, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gainNode).connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
    startTime += duration * 0.7; // slight overlap for sequences reads as one sound, not stuttering
  }
}

export const sound = {
  click: () => playTones([{ freq: 520, duration: 0.05, type: "square", gain: 0.04 }]),
  select: () => playTones([{ freq: 660, duration: 0.07, type: "sine", gain: 0.05 }]),
  notification: () => playTones([{ freq: 880, duration: 0.08 }, { freq: 1100, duration: 0.1 }]),
  discovery: () => playTones([{ freq: 440, duration: 0.1 }, { freq: 660, duration: 0.1 }, { freq: 880, duration: 0.15 }]),
  combatWin: () => playTones([{ freq: 523, duration: 0.09 }, { freq: 659, duration: 0.09 }, { freq: 784, duration: 0.18 }]),
  combatLoss: () => playTones([{ freq: 330, duration: 0.15, type: "sawtooth", gain: 0.05 }, { freq: 220, duration: 0.25, type: "sawtooth", gain: 0.05 }]),
};

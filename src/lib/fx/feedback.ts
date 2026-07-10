import { readFxPreferences } from "@/lib/fx/preferences";

export type FeedbackKind = "click" | "success" | "error";

function reducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  audioCtx ??= new Ctx();
  return audioCtx;
}

/** Short Web Audio beep — no external assets. */
export function playTone(kind: FeedbackKind = "click") {
  const prefs = readFxPreferences();
  if (!prefs.sound || reducedMotion()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (kind === "success") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(990, now + 0.08);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.04, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (kind === "error") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.035, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.18);
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.025, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch {
    /* ignore autoplay / context errors */
  }
}

export function haptic(ms = 12) {
  const prefs = readFxPreferences();
  if (!prefs.haptic || reducedMotion()) return;
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* ignore */
  }
}

export function feedback(kind: FeedbackKind = "click") {
  playTone(kind);
  if (kind === "success") haptic(18);
  else if (kind === "error") haptic(30);
  else haptic(8);
}

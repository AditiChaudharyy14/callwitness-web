import { useSyncExternalStore } from "react";

// Witzy's voice: the browser's own speech synthesis, off by default. The preference is remembered
// in localStorage. Browsers only allow speech after a user gesture, so nothing plays until the
// visitor turns sound on (or clicks Witzy with sound already on).

const STORAGE_KEY = "witzy-sound";
const listeners = new Set<() => void>();
let sound = false;
let loaded = false;
let hiddenHooked = false;

export const speechSupported = () => typeof window !== "undefined" && "speechSynthesis" in window;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    sound = window.localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    /* storage unavailable: stay off */
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

const soundSnapshot = () => {
  load();
  return sound;
};

export function useSound() {
  return useSyncExternalStore(subscribe, soundSnapshot, () => false);
}

const noopSubscribe = () => () => {};
export function useSpeechSupported() {
  return useSyncExternalStore(noopSubscribe, speechSupported, () => false);
}

export function setSound(on: boolean) {
  sound = on;
  loaded = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    /* not persisted; still applies for this visit */
  }
  if (!on) cancelSpeech();
  listeners.forEach((l) => l());
}

export function cancelSpeech() {
  if (speechSupported()) window.speechSynthesis.cancel();
}

function englishVoice() {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang === "en-US") ?? voices.find((v) => v.lang.startsWith("en")) ?? null;
}

/** Speaks a line if sound is on, replacing whatever Witzy was saying. */
export function speak(text: string) {
  load();
  if (!sound || !speechSupported()) return;
  if (!hiddenHooked) {
    hiddenHooked = true;
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelSpeech();
    });
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.pitch = 1.7;
  utterance.rate = 1.05;
  const voice = englishVoice();
  if (voice) utterance.voice = voice;
  utterance.lang = voice?.lang ?? "en-US";
  synth.speak(utterance);
}

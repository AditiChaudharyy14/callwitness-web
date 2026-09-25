import { useSyncExternalStore } from "react";

// The hero ledger announces tampering on window so other parts of the page (the Witness, the nav
// logo) can react. The current state is also kept here, so anything mounting later still sees it.
export const TAMPER_EVENT = "cw:tamper";
export const RESET_EVENT = "cw:reset";

export type TamperDetail = { row: number };

let broken = false;

export function emitTamper(row: number) {
  broken = true;
  window.dispatchEvent(new CustomEvent<TamperDetail>(TAMPER_EVENT, { detail: { row } }));
}

export function emitReset() {
  broken = false;
  window.dispatchEvent(new CustomEvent(RESET_EVENT));
}

export const isChainBroken = () => broken;

function subscribe(onChange: () => void) {
  window.addEventListener(TAMPER_EVENT, onChange);
  window.addEventListener(RESET_EVENT, onChange);
  return () => {
    window.removeEventListener(TAMPER_EVENT, onChange);
    window.removeEventListener(RESET_EVENT, onChange);
  };
}

export function useChainBroken() {
  return useSyncExternalStore(subscribe, isChainBroken, () => false);
}

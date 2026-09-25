import { useSyncExternalStore } from "react";

// The hero ledger announces tampering on window so other parts of the page (the Witness, the nav
// logo) can react. The current state is also kept here, so anything mounting later still sees it.
export const TAMPER_EVENT = "cw:tamper";
export const RESET_EVENT = "cw:reset";
// Witzy's "Show me" button asks the ledger to point at the record worth editing.
export const INVITE_EVENT = "cw:invite";

/** Short text Witzy says when the chain breaks at `row` (0-based). */
export const tamperLine = (row: number) => `Caught it! Someone changed record ${String(row + 1).padStart(2, "0")}.`;
export const RESET_LINE = "Phew. Every record checks out again.";

export function emitInvite() {
  window.dispatchEvent(new CustomEvent(INVITE_EVENT));
}

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

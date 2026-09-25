// One window pointermove listener shared by everything that follows the cursor
// (the hero particles and Witzy's gaze). It is attached while anyone is subscribed.
type Listener = (e: PointerEvent) => void;

const listeners = new Set<Listener>();
const dispatch = (e: PointerEvent) => listeners.forEach((l) => l(e));

export function onPointerMove(listener: Listener) {
  if (!listeners.size) window.addEventListener("pointermove", dispatch, { passive: true });
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.removeEventListener("pointermove", dispatch);
  };
}

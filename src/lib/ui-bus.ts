/**
 * Lightweight counter of open overlays (modals and panels).
 *
 * When even one overlay is open, global and single-key shortcuts must stay
 * silent so nothing behind the modal is triggered by accident; only Escape
 * is responsible for closing the overlay. Every modal/panel announces its
 * open and closed state through the useOverlay hook.
 */

let openLayers = 0;

export function overlaysOpen(): boolean {
  return openLayers > 0;
}

export function acquireLayer(): () => void {
  openLayers += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    openLayers = Math.max(0, openLayers - 1);
  };
}

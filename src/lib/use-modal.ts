/**
 * Unified behavior for open overlays (modal, panel, guide):
 *   register in the overlay counter (so shortcuts behind stay silent), close on
 *   Escape, trap Tab inside the overlay and restore focus to the previous
 *   element when it closes.
 * This means every modal in the app follows one accessibility standard and a
 * keyboard user never gets stuck behind an open modal.
 */

import { useEffect, useRef } from 'react';
import { acquireLayer } from './ui-bus';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useModalBehavior<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T | null>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const el = ref.current;
    const release = acquireLayer();
    const previous = document.activeElement as HTMLElement | null;

    const focusables = () =>
      el ? Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];

    el?.setAttribute('tabindex', '-1');
    const raf = requestAnimationFrame(() => {
      const list = focusables();
      (list[0] ?? el)?.focus();
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab' || !el) return;
      const list = focusables();
      if (list.length === 0) {
        e.preventDefault();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const inside = active ? el.contains(active) : false;
      if (e.shiftKey && (active === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };

    /* capture so Escape is intercepted before any other global listener */
    window.addEventListener('keydown', onKey, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey, true);
      release();
      previous?.focus?.();
    };
  }, [open]);

  return ref;
}

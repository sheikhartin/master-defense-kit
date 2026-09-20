/**
 * Global shortcuts that work in every tab:
 *   guide (H / ?), focus mode (F), sound (M), close (Esc),
 *   jump to a section (Alt + 1 to 5), export the current section as PDF
 *   (Alt + P) and export the whole site as PDF (Alt + Shift + P).
 *
 * Precision rules:
 *   match on e.code (independent of the Persian/English layout), ignore while an
 *   overlay is open or the user is typing in a text input, and ignore
 *   Ctrl/Meta so browser shortcuts (such as Ctrl+P for print) are not hijacked.
 *   Single-key shortcuts only work while the user keeps them enabled
 *   (WCAG 2.1.4 accessibility); Alt combinations are always active.
 */

import { useEffect, useRef } from 'react';
import { printScopeOfTab, useApp, type TabId } from './app-context';
import { isEditableTarget, snapshot } from './keys';
import { overlaysOpen } from './ui-bus';

const TAB_ORDER: TabId[] = ['home', 'practice', 'cheat', 'qa', 'checklist'];

export function useGlobalShortcuts() {
  const app = useApp();
  const appRef = useRef(app);
  useEffect(() => {
    appRef.current = app;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const a = appRef.current;
      const k = snapshot(e);

      if (overlaysOpen()) return; // overlay open: only Escape, which the overlay itself handles
      if (isEditableTarget(e)) return; // typing in a note/input: stay silent

      // Alt combinations are always active (outside the scope of the WCAG single-key rule)
      if (k.alt && !k.ctrl && !k.meta) {
        const m = /^Digit([1-5])$/.exec(k.code);
        if (m) {
          e.preventDefault();
          a.go(TAB_ORDER[Number(m[1]) - 1]);
          return;
        }
        if (k.code === 'KeyP') {
          e.preventDefault();
          /* Alt + P: PDF of the current section; Alt + Shift + P: the whole site */
          a.openPrint(k.shift ? 'all' : printScopeOfTab[a.tab]);
          return;
        }
        return;
      }
      // any other modifier (Ctrl/Cmd) means a browser shortcut; leave it alone
      if (k.ctrl || k.meta || k.alt) return;

      if (k.code === 'Escape') {
        if (a.focus) a.setFocus(false);
        return;
      }

      // single-key shortcuts, only with user consent
      if (!a.shortcutsOn) return;
      if (k.code === 'KeyF' && !k.repeat) {
        a.setFocus(!a.focus);
        return;
      }
      if (k.code === 'KeyM' && !k.repeat) {
        a.setAudible(!a.audible);
        return;
      }
      if (k.code === 'KeyH' || (k.code === 'Slash' && k.shift)) {
        e.preventDefault();
        a.setGuideOpen(true);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

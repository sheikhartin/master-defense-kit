/**
 * Pure keyboard helpers (no React) so every hook follows one rule.
 *
 * Why e.code instead of e.key? This app is Persian and many users have a
 * Persian keyboard layout active; on a Persian layout the same physical "R"
 * key produces a different letter, so single-letter shortcuts simply did not
 * work. e.code refers to the physical position of the key and is independent
 * of the active language layout, so shortcuts behave identically on Persian
 * and English keyboards.
 */

/** Key event summary for matching */
export interface KeySnapshot {
  code: string;
  key: string;
  shift: boolean;
  ctrl: boolean;
  alt: boolean;
  meta: boolean;
  repeat: boolean;
}

export function snapshot(e: KeyboardEvent): KeySnapshot {
  return {
    code: e.code,
    key: e.key,
    shift: e.shiftKey,
    ctrl: e.ctrlKey,
    alt: e.altKey,
    meta: e.metaKey,
    repeat: e.repeat,
  };
}

/** Does the event come from a text input? If so, shortcuts must stay silent. */
export function isEditableTarget(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  const tag = t.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    t.isContentEditable === true
  );
}

/** Does the event come from an interactive element with native Space/Enter behavior? */
export function isInteractiveTarget(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  const tag = t.tagName;
  return (
    tag === 'BUTTON' ||
    tag === 'A' ||
    tag === 'INPUT' ||
    tag === 'SELECT' ||
    tag === 'TEXTAREA' ||
    tag === 'SUMMARY' ||
    t.isContentEditable === true ||
    t.getAttribute('role') === 'checkbox' ||
    t.getAttribute('role') === 'button' ||
    t.getAttribute('role') === 'switch'
  );
}

/** Is the key a single-character combination (subject to WCAG 2.1.4)? */
export function isCharacterOnly(k: KeySnapshot): boolean {
  if (k.ctrl || k.alt || k.meta) return false;
  // printable characters without a modifier other than Shift
  return k.key.length === 1 && !k.repeat ? true : k.key.length === 1;
}

/** Map the number row to slide numbers: 0 means 10 and with Shift it means 11 to 20;
 *  the final jump is clamped by the consumer to slides available in the current plan.
 */
export function digitFromCode(code: string, shift: boolean): number | null {
  const m = /^Digit(\d)$/.exec(code);
  if (!m) return null;
  const d = Number(m[1]);
  const base = d === 0 ? 10 : d;
  return shift ? base + 10 : base;
}

/** Human readable label for the guide */
export function labelFor(code: string, shift = false): string {
  const map: Record<string, string> = {
    ArrowLeft: 'کلید چپ',
    ArrowRight: 'کلید راست',
    PageDown: 'PageDown',
    PageUp: 'PageUp',
    Home: 'Home',
    End: 'End',
    Space: 'Space',
    Enter: 'Enter',
    Escape: 'Esc',
    Slash: '/',
  };
  const base = map[code] ?? code.replace(/^Key|^Digit/, '');
  return shift ? `Shift + ${base}` : base;
}

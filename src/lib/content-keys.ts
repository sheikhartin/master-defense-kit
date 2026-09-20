/**
 * Builders for localStorage keys of slides and notes.
 * New keys are based on the stable content id; reads also accept the legacy
 * number / opt based keys as a fallback.
 */

import { readStore, writeStore } from './storage';
import type { PersonalNote } from '../types';

export function slideHlKey(id: string) {
  return `slide-hl:${id}`;
}
export function speechHlKey(id: string, i: number) {
  return `speech-hl:${id}-${i}`;
}
export function coachNoteHlKey(id: string, i: number) {
  return `note-hl:${id}-${i}`;
}
export function slideNoteKey(id: string) {
  return `slide-note:${id}`;
}

/** Read a flag with a legacy key fallback */
export function readFlagWithLegacy(primary: string, legacy: string[]): boolean {
  const cur = readStore<boolean | null>(primary, null);
  if (cur !== null) return !!cur;
  for (const k of legacy) {
    const v = readStore<boolean | null>(k, null);
    if (v !== null) {
      writeStore(primary, !!v);
      return !!v;
    }
  }
  return false;
}

export function emptyPersonalNote(): PersonalNote {
  return { text: '', important: false, extras: [] };
}

/** Parse a personal note: legacy string or new object */
export function parsePersonalNote(raw: unknown): PersonalNote {
  if (typeof raw === 'string') {
    return { text: raw, important: false, extras: [] };
  }
  if (raw && typeof raw === 'object') {
    const o = raw as Partial<PersonalNote>;
    return {
      text: typeof o.text === 'string' ? o.text : '',
      important: !!o.important,
      extras: Array.isArray(o.extras)
        ? o.extras
            .filter((e) => e && typeof e === 'object')
            .map((e, i) => ({
              id: typeof e.id === 'string' ? e.id : `x${i}`,
              text: typeof e.text === 'string' ? e.text : '',
              important: !!e.important,
            }))
        : [],
    };
  }
  return emptyPersonalNote();
}

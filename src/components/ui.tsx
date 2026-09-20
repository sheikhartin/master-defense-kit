/**
 * Small shared UI parts: section head, personal note box,
 * soft highlight button and chips.
 */

import { useCallback, useEffect, useState } from 'react';
import { NotebookPen, Plus, Star, Trash2 } from 'lucide-react';
import { readStore, useStoredFlag, writeStore } from '../lib/storage';
import { clockOf, toPersianDigits } from '../lib/persian';
import { emptyPersonalNote, parsePersonalNote, slideNoteKey } from '../lib/content-keys';
import type { PersonalNote } from '../types';
import type { ReactNode } from 'react';

/** Section head with a Persian numeral */
export function SectionHead({
  index,
  title,
  subtitle,
}: {
  index?: number;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      {index !== undefined && (
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-pine/20 bg-pine-soft text-sm font-bold text-pine-deep">
          {toPersianDigits(index)}
        </span>
      )}
      <div>
        <h2 className="text-xl font-extrabold text-ink md:text-2xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>}
      </div>
    </div>
  );
}

/** Personal note box with an importance flag and starrable key lines */
export function NoteBox({
  storageKey,
  legacyKeys = [],
  compact = false,
}: {
  storageKey: string;
  /** Legacy keys for migration */
  legacyKeys?: string[];
  compact?: boolean;
}) {
  const [note, setNote] = useState<PersonalNote>(() => {
    const primary = readStore<unknown>(storageKey, null);
    if (primary !== null) return parsePersonalNote(primary);
    for (const k of legacyKeys) {
      const leg = readStore<unknown>(k, null);
      if (leg !== null) {
        const parsed = parsePersonalNote(leg);
        writeStore(storageKey, parsed);
        return parsed;
      }
    }
    return emptyPersonalNote();
  });

  const persist = useCallback(
    (next: PersonalNote) => {
      setNote(next);
      writeStore(storageKey, next);
    },
    [storageKey],
  );

  const setText = (text: string) => persist({ ...note, text });
  const toggleImportant = () => persist({ ...note, important: !note.important });

  const addExtra = () => {
    const id = `e${Date.now().toString(36)}`;
    persist({
      ...note,
      extras: [...note.extras, { id, text: '', important: false }],
    });
  };

  const updateExtra = (id: string, patch: Partial<PersonalNote['extras'][number]>) => {
    persist({
      ...note,
      extras: note.extras.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  };

  const removeExtra = (id: string) => {
    persist({ ...note, extras: note.extras.filter((e) => e.id !== id) });
  };

  return (
    <div
      className={`rounded-xl border bg-surface-2/60 ${
        note.important ? 'border-ochre/50 bg-ochre-soft/40' : 'border-line'
      } ${compact ? 'p-2' : 'p-3'}`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="flex items-center gap-1.5 text-xs font-bold text-muted">
          <NotebookPen className="h-3.5 w-3.5" />
          یادداشت شخصی
          {(note.text || note.extras.some((e) => e.text)) && (
            <span className="text-pine">ذخیره شد</span>
          )}
        </label>
        <button
          type="button"
          className={`note-marker ${note.important ? 'text-ochre' : ''}`}
          aria-pressed={note.important}
          title={note.important ? 'حذف علامت مهم' : 'علامت مهم برای کل یادداشت'}
          onClick={toggleImportant}
        >
          <Star className={`h-4 w-4 ${note.important ? 'fill-ochre' : ''}`} />
        </button>
      </div>
      <textarea
        value={note.text}
        onChange={(e) => setText(e.target.value)}
        rows={compact ? 1 : 3}
        placeholder="یادداشت کوتاه خودت را این‌جا بنویس؛ فقط روی همین دستگاه ذخیره می‌شود."
        className="w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 text-sm leading-7 text-ink placeholder:text-muted/70 focus:border-pine/50 focus:outline-none"
      />

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[0.72rem] font-bold text-muted">یادداشت‌های کلیدی</p>
          <button type="button" className="btn btn-quiet btn-sm" onClick={addExtra}>
            <Plus className="h-3.5 w-3.5" />
            افزودن
          </button>
        </div>
        {note.extras.map((ex) => (
          <div
            key={ex.id}
            className={`flex items-start gap-2 rounded-xl px-2.5 py-2 ${
              ex.important ? 'hl-block' : 'border border-line bg-surface'
            }`}
          >
            <button
              type="button"
              className={`note-marker mt-1.5 shrink-0 ${ex.important ? 'text-ochre' : ''}`}
              aria-pressed={ex.important}
              title={ex.important ? 'حذف علامت مهم' : 'علامت مهم'}
              onClick={() => updateExtra(ex.id, { important: !ex.important })}
            >
              <Star className={`h-3.5 w-3.5 ${ex.important ? 'fill-ochre' : ''}`} />
            </button>
            <input
              type="text"
              value={ex.text}
              onChange={(e) => updateExtra(ex.id, { text: e.target.value })}
              placeholder="نکته کوتاه…"
              className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-sm text-ink focus:border-line focus:outline-none"
            />
            <button
              type="button"
              className="note-marker mt-1.5 shrink-0"
              title="حذف"
              onClick={() => removeExtra(ex.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Soft highlight for a note */
export function MarkButton({
  storageKey,
  label = 'نکته مهم',
  active = false,
  onChange,
}: {
  storageKey?: string;
  label?: string;
  active?: boolean;
  onChange?: (v: boolean) => void;
}) {
  const [stored, toggleStored] = useStoredFlag(storageKey ?? `mark:${label}`);
  const on = storageKey ? stored : active;
  const toggle = () => {
    if (storageKey) toggleStored();
    else onChange?.(!on);
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      className={`chip ${on ? 'chip-ochre' : 'chip-mute'} hover:border-ochre/40`}
    >
      <Star className={`h-3 w-3 ${on ? 'fill-ochre text-ochre' : ''}`} />
      {on ? 'مهم شد' : label}
    </button>
  );
}

/** Colored chip */
export function Tag({ tone, children }: { tone: 'pine' | 'ochre' | 'clay' | 'mute'; children: ReactNode }) {
  const cls = {
    pine: 'chip-pine',
    ochre: 'chip-ochre',
    clay: 'chip-clay',
    mute: 'chip-mute',
  }[tone];
  return <span className={`chip ${cls}`}>{children}</span>;
}

/**
 * Persian time range, for example from 09:30 to 10:15 (rendered with Persian digits).
 */
export function TimeRange({ from, to, className = '' }: { from: number; to: number; className?: string }) {
  return (
    <span className={`time-range ${className}`}>
      <span className="timer-num">{clockOf(from)}</span>
      <span> تا </span>
      <span className="timer-num">{clockOf(to)}</span>
    </span>
  );
}

/** Slide note key builder (helper for consumers) */
export { slideNoteKey };

/** Small hook to sync the storage key when the slide changes */
export function usePersonalNote(storageKey: string, legacyKeys: string[] = []) {
  const [note, setNote] = useState<PersonalNote>(() => emptyPersonalNote());
  useEffect(() => {
    const primary = readStore<unknown>(storageKey, null);
    if (primary !== null) {
      setNote(parsePersonalNote(primary));
      return;
    }
    for (const k of legacyKeys) {
      const leg = readStore<unknown>(k, null);
      if (leg !== null) {
        const parsed = parsePersonalNote(leg);
        writeStore(storageKey, parsed);
        setNote(parsed);
        return;
      }
    }
    setNote(emptyPersonalNote());
  }, [storageKey, legacyKeys.join('|')]);
  return [note, setNote] as const;
}

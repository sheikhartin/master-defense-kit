/**
 * اجزای کوچک و مشترک رابط کاربر: سربرگ بخش، جعبه یادداشت شخصی،
 * دکمه هایلایت نرم و برچسب‌ها.
 */

import { NotebookPen, Star } from 'lucide-react';
import { useStoredFlag, useStoredNote } from '../lib/storage';
import { toPersianDigits } from '../lib/persian';
import type { ReactNode } from 'react';

/** سربرگ یک بخش با شماره فارسی */
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

/** جعبه یادداشت شخصی که در localStorage ذخیره می‌شود */
export function NoteBox({ storageKey, compact = false }: { storageKey: string; compact?: boolean }) {
  const [text, setText] = useStoredNote(storageKey);
  return (
    <div className={`rounded-xl border border-line bg-surface-2/60 ${compact ? 'p-2' : 'p-3'}`}>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-muted">
        <NotebookPen className="h-3.5 w-3.5" />
        یادداشت شخصی
        {text && <span className="text-pine">ذخیره شد</span>}
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={compact ? 1 : 3}
        placeholder="یادداشت کوتاه خودت را این‌جا بنویس؛ فقط روی همین دستگاه ذخیره می‌شود."
        className="w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 text-sm leading-7 text-ink placeholder:text-muted/70 focus:border-pine/50 focus:outline-none"
      />
    </div>
  );
}

/** هایلایت نرم یک نکته */
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

/** برچسب رنگی */
export function Tag({ tone, children }: { tone: 'pine' | 'ochre' | 'clay' | 'mute'; children: ReactNode }) {
  const cls = {
    pine: 'chip-pine',
    ochre: 'chip-ochre',
    clay: 'chip-clay',
    mute: 'chip-mute',
  }[tone];
  return <span className={`chip ${cls}`}>{children}</span>;
}

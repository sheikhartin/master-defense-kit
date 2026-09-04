/**
 * چک‌لیست روز دفاع: تیک‌زدن تعاملی با ذخیره در حافظه محلی
 * و کارت‌های «بگو، نگو» برای کنترل لحن.
 */

import { Check, ShieldAlert, ShieldCheck, Square } from 'lucide-react';
import { checklistGroups, doDonts } from '../data/checklist';
import { useStoredState } from '../lib/storage';
import { SectionHead, Tag } from '../components/ui';
import { toPersianDigits } from '../lib/persian';

export default function ChecklistLab() {
  return (
    <div className="stagger space-y-12">
      <section className="card p-7 md:p-9">
        <span className="eyebrow">
          <Check className="h-3.5 w-3.5" />
          روز دفاع
        </span>
        <h2 className="mt-3 text-2xl font-black leading-10 text-ink md:text-3xl">
          چک‌لیست‌ها و عبارت‌های درست
        </h2>
        <p className="mt-2 max-w-2xl text-[1rem] leading-8 text-ink-soft">
          تیک‌ها همین‌جا در دستگاه شما ذخیره می‌شوند؛ یک روز مانده به دفاع همه را مرور کن
          و شب دفاع فقط به همان چیزهایی که تیک زده‌ای نگاه کن.
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {checklistGroups.map((g, gi) => (
          <GroupCard key={g.id} group={g} order={gi + 1} />
        ))}

        {/* کارت لحن */}
        <section className="card self-start p-6 md:p-7 lg:col-span-2">
          <SectionHead title="بگو یا نگو" subtitle="شش جفت پرتکرار؛ لحن دفاع با همین تفاوت‌ها ساخته می‌شود" />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {doDonts.map((d, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-line">
                <div className="flex items-center gap-2 border-b border-line bg-clay-soft/40 px-4 py-2.5">
                  <ShieldAlert className="h-4 w-4 text-clay" />
                  <span className="text-xs font-extrabold text-clay">نگو</span>
                </div>
                <p className="px-4 py-3 text-[0.88rem] leading-7 text-ink-soft">{d.bad}</p>
                <div className="flex items-center gap-2 border-y border-line bg-pine-wash px-4 py-2.5">
                  <ShieldCheck className="h-4 w-4 text-pine" />
                  <span className="text-xs font-extrabold text-pine-deep">بگو</span>
                </div>
                <p className="px-4 py-3 text-[0.88rem] font-bold leading-7 text-ink">{d.good}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function GroupCard({ group, order }: { group: (typeof checklistGroups)[number]; order: number }) {
  const [done, setDone] = useStoredState<Record<number, boolean>>(`ck:${group.id}`, {});
  const total = group.items.length;
  const marked = group.items.filter((_, i) => done[i]).length;

  return (
    <section className="card p-6 md:p-7">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.7rem] font-extrabold text-muted">چک‌لیست {toPersianDigits(order)}</p>
          <h3 className="mt-1 text-lg font-extrabold text-ink">{group.title}</h3>
        </div>
        <Tag tone={marked === total && total > 0 ? 'pine' : 'mute'}>
          {toPersianDigits(marked)} از {toPersianDigits(total)}
        </Tag>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-pine/10">
        <div
          className="h-full rounded-full bg-pine transition-all duration-300"
          style={{ width: `${total ? (marked / total) * 100 : 0}%` }}
        />
      </div>
      <ul className="space-y-1">
        {group.items.map((item, i) => {
          const on = !!done[i];
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => setDone((prev) => ({ ...prev, [i]: !prev[i] }))}
                aria-pressed={on}
                className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-right transition-colors ${
                  on ? 'bg-pine-wash' : 'hover:bg-surface-2'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                    on ? 'border-pine bg-pine text-surface' : 'border-line-strong bg-surface'
                  }`}
                  aria-hidden="true"
                >
                  {on ? <Check className="h-3.5 w-3.5" /> : <Square className="h-3 w-3 text-transparent" />}
                </span>
                <span className={`text-[0.92rem] leading-7 ${on ? 'font-bold text-pine-deep' : 'text-ink-soft'}`}>
                  {item}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

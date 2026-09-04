/**
 * نشان برند داخل برنامه (سربرگ و حالت تمرکز).
 *
 * این مؤلفه دقیقاً همان هندسه و پالت «src/lib/brand.mjs» را رندر می‌کند که
 * اسکریپت ساخت آیکون هم از آن استفاده می‌کند؛ بنابراین فاوآیکون، آیکون نصب و
 * نشان سربرگ همگی یک نشانه بصری واحد هستند و هیچ‌گاه از هم جدا نمی‌افتند.
 */

import { BRAND_COLORS, BRAND_NAME, brandGeometry } from '../lib/brand.mjs';

export default function BrandMark({ className = 'h-6 w-6' }: { className?: string }) {
  const g = brandGeometry(512);
  return (
    <svg viewBox="0 0 512 512" className={className} fill="none" aria-hidden="true">
      <rect width="512" height="512" rx={g.radius} fill={BRAND_COLORS.pine} />
      <path
        d={g.shield}
        stroke={BRAND_COLORS.cream}
        strokeWidth={g.shieldWidth}
        strokeLinejoin="round"
      />
      <path
        d={g.hands}
        stroke={BRAND_COLORS.cream}
        strokeWidth={g.handsWidth}
        strokeLinecap="round"
      />
      {g.pivot && <circle cx={g.pivot.cx} cy={g.pivot.cy} r={g.pivot.r} fill={BRAND_COLORS.ochre} />}
      <title>{BRAND_NAME.full}</title>
    </svg>
  );
}

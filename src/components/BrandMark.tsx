/**
 * نشان برند داخل برنامه (سربرگ و پابرگ).
 * هندسه از brand.mjs؛ رنگ پس‌زمینه از پالت فعال (CSS --color-accent).
 */

import { BRAND_COLORS, BRAND_NAME, brandGeometry } from '../lib/brand.mjs';

export default function BrandMark({ className = 'h-6 w-6' }: { className?: string }) {
  const g = brandGeometry(512);
  return (
    <svg
      viewBox="0 0 512 512"
      className={`brand-mark ${className}`}
      fill="none"
      aria-hidden="true"
      role="img"
    >
      <rect width="512" height="512" rx={g.radius} fill="var(--color-accent, #1e5a49)" />
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

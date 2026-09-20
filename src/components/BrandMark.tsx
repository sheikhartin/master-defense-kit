/**
 * نشان برند داخل برنامه (سربرگ و پابرگ).
 * هندسه از brand.mjs؛ کاشی با رنگ پالت فعال (CSS --color-accent) و
 * سپر طلایی + میکروفون کرم که در همه نسخه‌های نشان ثابت می‌مانند.
 */

import { APP_ICON, BRAND_NAME, brandGeometry } from '../lib/brand.mjs';

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
        stroke={APP_ICON.shield}
        strokeWidth={g.shieldWidth}
        strokeLinejoin="round"
      />
      {g.mic.map((p, i) => (
        <path key={i} d={p.d} stroke={APP_ICON.mic} strokeWidth={p.width} strokeLinecap="round" />
      ))}
      <title>{BRAND_NAME.full}</title>
    </svg>
  );
}

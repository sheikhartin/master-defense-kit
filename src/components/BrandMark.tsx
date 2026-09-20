/**
 * نشان برند داخل برنامه (سربرگ و پابرگ).
 * لوگو در همه‌جا یک نشان ثابت است: پس‌زمینه مشکی + سپر طلایی + میکروفون کرم.
 * با پالت‌های برنامه تغییر نمی‌کند (تصمیم D13 در docs/PLAN.md).
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
      <rect width="512" height="512" rx={g.radius} fill={APP_ICON.bg} />
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

/**
 * In-app brand mark (header and footer).
 * The logo is one fixed mark everywhere: black background + gold shield + cream microphone.
 * It does not change with the app palettes (decision D13 in docs/PLAN.md).
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

/**
 * Brand mark for the BCOA Master's Defense Kit - the single source of truth.
 *
 * This file is deliberately plain JavaScript (no TypeScript) so both the app
 * can import it (src/components/BrandMark.tsx) and the icon build script can
 * use it in Node (scripts/build-brand.mjs). That means the favicon, the install
 * icons, the iOS icon and the in-app header mark are all built from one
 * geometry and can never drift apart.
 *
 * Mark concept: "shield and voice".
 * shield -> symbol of defense (a thesis defense) and confidence
 * microphone -> the spoken defense; voice and delivery
 *
 * Two uses of the mark:
 * 1) Install icons (PWA, iOS, favicon) are built from the fixed global
 *    APP_ICON palette: black background + gold shield + cream microphone.
 *    These icons deliberately do not change with the app palettes
 *    (decision D13 in docs/PLAN.md) because the installed icon rarely changes
 *    and must be a standard, recognizable logo.
 * 2) The in-app mark (header and footer) and the tab favicon are exactly this
 *    same fixed black mark. The logo never changes color with the app palettes
 *    (decision D13 in docs/PLAN.md); palettes only change UI colors (buttons,
 *    navigation, progress).
 *
 * Optical size: at very small sizes (16 and 32 pixels) the stroke weight grows
 * slightly so the mark does not blur away in a browser tab; the geometry is
 * exactly the same and only the stroke weight changes.
 */

/** Brand colors; exactly the design-system color tokens from src/index.css */
export const BRAND_COLORS = {
  pine: '#1e5a49', // pine green: default tile of the in-app mark
  gold: '#c9a14b', // brand gold: the shield (fixed in every version of the mark)
  cream: '#f4f0e6', // cream: the microphone (the app paper color)
};

/** Fixed logo palette; one global mark that never changes anywhere */
export const APP_ICON = {
  bg: '#000000', // black: the fixed logo background (install, tab, header)
  shield: BRAND_COLORS.gold,
  mic: BRAND_COLORS.cream,
};

/** Display names (for the manifest and metadata) */
export const BRAND_NAME = {
  full: 'بستار دفاع ارشد BCOA',
  short: 'بستار دفاع',
};

/**
 * Mark geometry in a 512x512 coordinate system.
 * @typedef {{
 * tile: number,
 * radius: number,
 * shield: string,
 * shieldWidth: number,
 * mic: Array<{ d: string, width: number }>,
 * }} BrandGeometry
 */

/** Base geometry (large sizes: 48 pixels and up, plus the vector version) */
const BASE = {
  tile: 512,
  radius: 120,

  /* Shield: two rounded corners on top, two straight arms and a curve converging to the bottom point */
  shield:
    'M 162 108 H 350 A 26 26 0 0 1 376 134 V 250 ' +
    'C 376 322 324 372 256 404 ' +
    'C 188 372 136 322 136 250 V 134 ' +
    'A 26 26 0 0 1 162 108 Z',
  shieldWidth: 32,

  /* Microphone: capsule (vertical line with a round head), head, ribs and base; optically centered inside the shield */
  mic: [
    { d: 'M 256 182 V 226', width: 54 },
    { d: 'M 204 218 C 204 270 228 296 256 296 C 284 296 308 270 308 218', width: 24 },
    { d: 'M 256 296 V 328', width: 24 },
    { d: 'M 228 328 H 284', width: 24 },
  ],
};

/**
 * Optically compact version for 16 and 32 pixels: same geometry with a heavier
 * stroke weight so the microphone does not turn into a blob in a browser tab.
 */
const COMPACT = {
  ...BASE,
  shieldWidth: 46,
  mic: [
    { d: 'M 256 182 V 226', width: 66 },
    { d: 'M 198 216 C 198 274 226 298 256 298 C 286 298 314 274 314 216', width: 36 },
    { d: 'M 256 298 V 326', width: 36 },
    { d: 'M 224 326 H 288', width: 36 },
  ],
};

/**
 * Geometry suited to one specific size.
 * @param {number} size pixels
 * @returns {BrandGeometry}
 */
export function brandGeometry(size) {
  return size <= 32 ? COMPACT : BASE;
}

/** Scale factor for the maskable icon (80% safe area) */
export const MASKABLE_SCALE = 0.78;

/**
 * Mark SVG with a configurable background color (for previews and tooling).
 * Default: the fixed install-icon palette (APP_ICON).
 * @param {{ tile?: string, shield?: string, mic?: string, size?: number }} [opts]
 * @returns {string}
 */
export function brandSvg(opts = {}) {
  const size = opts.size ?? 512;
  const g = brandGeometry(size);
  const tile = opts.tile ?? APP_ICON.bg;
  const shield = opts.shield ?? APP_ICON.shield;
  const mic = opts.mic ?? APP_ICON.mic;
  const micEls = g.mic
    .map(
      (p) =>
        `<path d="${p.d}" fill="none" stroke="${mic}" stroke-width="${p.width}" stroke-linecap="round"/>`,
    )
    .join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-labelledby="bcoa-title">` +
    `<title id="bcoa-title">${BRAND_NAME.full}</title>` +
    `<rect width="512" height="512" rx="${g.radius}" fill="${tile}"/>` +
    `<path d="${g.shield}" fill="none" stroke="${shield}" stroke-width="${g.shieldWidth}" stroke-linejoin="round"/>` +
    micEls +
    `</svg>`
  );
}

export default { BRAND_COLORS, BRAND_NAME, APP_ICON, brandGeometry, MASKABLE_SCALE, brandSvg };

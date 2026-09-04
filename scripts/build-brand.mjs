/**
 * ساخت همه آیکون‌های برنامه از یک منبع واحد.
 * اجرا: npm run icons
 *
 * خروجی‌ها (همه در public/ و همه محلی):
 *   icon.svg                 نشان برداری برای فاوآیکون مرورگرهای جدید
 *   favicon.ico              نسخه ۱۶ و ۳۲ و ۴۸ برای مرورگرهای قدیمی و نوار ویندوز
 *   apple-touch-icon.png     ۱۸۰×۱۸۰ برای افزودن به صفحه اصلی iOS
 *   pwa-192x192.png          آیکون نصب اندروید
 *   pwa-512x512.png          آیکون نصب و تصویر شروع
 *   pwa-maskable-512.png     نسخه maskable با منطقه امن ۸۰٪
 *
 * افزون بر این، یک برگه پیش‌نمایش در .cache/brand-preview.png ساخته می‌شود تا
 * بتوان نشان را در اندازه‌های واقعی (۵۱۲ تا ۱۶ پیکسل) با چشم بررسی کرد.
 * هیچ وابستگی بیرونی ندارد و کاملاً آفلاین اجرا می‌شود.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BRAND_COLORS, BRAND_NAME, MASKABLE_SCALE, brandGeometry } from '../src/lib/brand.mjs';
import { encodeICO, encodePNG, parsePath, rasterize } from './lib/raster.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const CACHE = join(ROOT, '.cache');

/** شکل‌های نشان (بدون پس‌زمینه) به ترتیب نقاشی، در دستگاه مختصات ۵۱۲×۵۱۲ */
function markShapes(size) {
  const g = brandGeometry(size);
  return [
    {
      kind: 'stroke',
      subs: parsePath(g.shield),
      width: g.shieldWidth,
      color: BRAND_COLORS.cream,
    },
    { kind: 'stroke', subs: parsePath(g.hands), width: g.handsWidth, color: BRAND_COLORS.cream },
    ...(g.pivot ? [{ kind: 'disc', cx: g.pivot.cx, cy: g.pivot.cy, r: g.pivot.r, color: BRAND_COLORS.ochre }] : []),
  ];
}

/** نشان روی کاشی گرد (برای فاوآیکون و آیکون نصب با گوشه‌های شفاف) */
function tileShapes(size) {
  const g = brandGeometry(size);
  return [{ kind: 'tile', size: g.tile, radius: g.radius, color: BRAND_COLORS.pine }, ...markShapes(size)];
}

/** نشان روی پس‌زمینه یکدست و بدون گوشه گرد (maskable و iOS) */
function bleedShapes(size) {
  return [{ kind: 'bg', color: BRAND_COLORS.pine }, ...markShapes(size)];
}

function pngFor(size, opts = {}) {
  return encodePNG(rasterize(size, opts.bleed ? bleedShapes(size) : tileShapes(size), opts));
}

/* ------------------------------------------------------------------ */
/* ۱) نسخه برداری (SVG)                                               */
/* ------------------------------------------------------------------ */

function buildSvg() {
  const g = brandGeometry(512);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-labelledby="bcoa-title">
  <title id="bcoa-title">${BRAND_NAME.full}</title>
  <!-- این فایل با «npm run icons» از src/lib/brand.mjs ساخته می‌شود؛ دستی ویرایش نشود -->
  <rect width="512" height="512" rx="${g.radius}" fill="${BRAND_COLORS.pine}"/>
  <path d="${g.shield}" fill="none" stroke="${BRAND_COLORS.cream}" stroke-width="${g.shieldWidth}" stroke-linejoin="round"/>
  <path d="${g.hands}" fill="none" stroke="${BRAND_COLORS.cream}" stroke-width="${g.handsWidth}" stroke-linecap="round"/>
  ${
    g.pivot
      ? `<circle cx="${g.pivot.cx}" cy="${g.pivot.cy}" r="${g.pivot.r}" fill="${BRAND_COLORS.ochre}"/>`
      : ''
  }
</svg>
`;
}

/* ------------------------------------------------------------------ */
/* ۲) برگه پیش‌نمایش (برای بازبینی چشمی، وارد مخزن نمی‌شود)          */
/* ------------------------------------------------------------------ */

function paste(target, img, x, y) {
  for (let r = 0; r < img.height; r++) {
    for (let c = 0; c < img.width; c++) {
      const si = (r * img.width + c) * 4;
      const di = ((y + r) * target.width + (x + c)) * 4;
      const a = img.data[si + 3] / 255;
      target.data[di] = Math.round(img.data[si] * a + target.data[di] * (1 - a));
      target.data[di + 1] = Math.round(img.data[si + 1] * a + target.data[di + 1] * (1 - a));
      target.data[di + 2] = Math.round(img.data[si + 2] * a + target.data[di + 2] * (1 - a));
      target.data[di + 3] = 255;
    }
  }
}

function buildPreview() {
  const sizes = [512, 192, 48, 32, 16];
  const gap = 40;
  const width = sizes.reduce((a, s) => a + s, 0) + gap * (sizes.length + 1);
  const height = 512 + gap * 2;
  const sheet = { width, height, data: new Uint8Array(width * height * 4) };
  /* پس‌زمینه کاغذ برنامه تا کنتراست واقعی دیده شود */
  const paper = [0xf4, 0xf0, 0xe6];
  for (let i = 0; i < sheet.data.length; i += 4) {
    sheet.data[i] = paper[0];
    sheet.data[i + 1] = paper[1];
    sheet.data[i + 2] = paper[2];
    sheet.data[i + 3] = 255;
  }
  let x = gap;
  for (const s of sizes) {
    paste(sheet, rasterize(s, tileShapes(s)), x, height - gap - s);
    x += s + gap;
  }
  return encodePNG(sheet);
}

/** ضریب نگاشت وقتی نشان باید بخشی از بوم را بگیرد (منطقه امن) */
const fitScale = (size, fraction) => (size * fraction) / 512;

/* ------------------------------------------------------------------ */
/* ۳) اجرا                                                            */
/* ------------------------------------------------------------------ */

mkdirSync(PUBLIC, { recursive: true });
mkdirSync(CACHE, { recursive: true });

const outputs = [
  ['icon.svg', Buffer.from(buildSvg(), 'utf8')],
  /* iOS خودش ماسک گرد می‌گذارد؛ پس زمینه یکدست و بدون گوشه گرد و با حاشیه امن */
  ['apple-touch-icon.png', pngFor(180, { bleed: true, scale: fitScale(180, 0.8) })],
  ['pwa-192x192.png', pngFor(192)],
  ['pwa-512x512.png', pngFor(512)],
  /* maskable: نشان داخل منطقه امن ۸۰٪ و پس‌زمینه یکدست تا برش اندروید چیزی را نبرد */
  ['pwa-maskable-512.png', pngFor(512, { bleed: true, scale: fitScale(512, MASKABLE_SCALE) })],
  [
    'favicon.ico',
    encodeICO([
      { size: 16, png: pngFor(16) },
      { size: 32, png: pngFor(32) },
      { size: 48, png: pngFor(48) },
    ]),
  ],
];

for (const [name, buf] of outputs) {
  writeFileSync(join(PUBLIC, name), buf);
  console.log(`[icon] public/${name}  ${(buf.length / 1024).toFixed(1)} KiB`);
}

writeFileSync(join(CACHE, 'brand-preview.png'), buildPreview());
console.log('[icon] .cache/brand-preview.png  (بازبینی چشمی ۵۱۲ تا ۱۶ پیکسل)');

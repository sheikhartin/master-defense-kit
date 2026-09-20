/**
 * نشان برند «بستار دفاع ارشد BCOA» - تنها منبع حقیقت.
 *
 * این فایل عمداً JavaScript ساده (بدون TypeScript) است تا هم برنامه
 * بتواند آن را وارد کند (src/components/BrandMark.tsx) و هم اسکریپت ساخت
 * آیکون در نود (scripts/build-brand.mjs). یعنی فاوآیکون، آیکون نصب،
 * آیکون iOS و نشان داخل سربرگ، همگی از یک هندسه ساخته می‌شوند و هرگز
 * از هم جدا نمی‌افتند.
 *
 * مفهوم نشان: «سپر و صدا».
 * سپر -> نماد دفاع (جلسه دفاع پایان‌نامه) و اطمینان
 * میکروفون -> گفتار دفاع؛ بیان و صدا
 *
 * دو کاربرد نشان:
 * 1) آیکون‌های نصب (PWA، iOS، favicon) از پالت ثابت و سراسری APP_ICON
 *    ساخته می‌شوند: پس‌زمینه مشکی + سپر طلایی + میکروفون کرم. این
 *    آیکون‌ها عمداً با پالت‌های برنامه تغییر نمی‌کنند (تصمیم D10 در
 *    docs/PLAN.md) چون آیکون نصب‌شده روی دستگاه نادر تغییر می‌کند و باید
 *    یک نشان استاندارد و شناخته‌شده باشد.
 * 2) نشان داخل برنامه (سربرگ و پابرگ) و فاوآیکون تب، دقیقاً همین نشان
 *    ثابت سیاه هستند. لوگو در هیچ‌جا با پالت‌های برنامه تغییر رنگ نمی‌دهد
 *    (تصمیم D13 در docs/PLAN.md)؛ پالت‌ها فقط رنگ‌های رابط (دکمه، ناوبری،
 *    پیشرفت) را عوض می‌کنند.
 *
 * اندازه نوری (optical size): در اندازه‌های خیلی کوچک (۱۶ و ۳۲ پیکسل)
 * ضخامت خط‌ها کمی بیشتر می‌شود تا نشان در تب مرورگر محو نشود؛ شکل هندسی
 * دقیقاً همان است و فقط وزن قلم تغییر می‌کند.
 */

/** رنگ‌های برند؛ دقیقاً همان توکن‌های رنگ سیستم طراحی در src/index.css */
export const BRAND_COLORS = {
  pine: '#1e5a49', // سبز کاج: کاشی پیش‌فرض نشان داخل برنامه
  gold: '#c9a14b', // طلایی برند: سپر (ثابت در همه نسخه‌های نشان)
  cream: '#f4f0e6', // کرم: میکروفون (رنگ کاغذ برنامه)
};

/** پالت ثابت لوگو؛ یک نشان سراسری که در هیچ‌جا تغییر نمی‌کند */
export const APP_ICON = {
  bg: '#000000', // مشکی: پس‌زمینه ثابت لوگو (نصب، تب، سربرگ)
  shield: BRAND_COLORS.gold,
  mic: BRAND_COLORS.cream,
};

/** نام‌های نمایشی (برای manifest و متادیتا) */
export const BRAND_NAME = {
  full: 'بستار دفاع ارشد BCOA',
  short: 'بستار دفاع',
};

/**
 * هندسه نشان در دستگاه مختصات ۵۱۲×۵۱۲.
 * @typedef {{
 * tile: number,
 * radius: number,
 * shield: string,
 * shieldWidth: number,
 * mic: Array<{ d: string, width: number }>,
 * }} BrandGeometry
 */

/** هندسه پایه (اندازه‌های بزرگ: ۴۸ پیکسل به بالا و نسخه برداری) */
const BASE = {
  tile: 512,
  radius: 120,

  /* سپر: دو گوشه گرد در بالا، دو بازوی straight و انحنای همگرا به سمت نقطه پایین */
  shield:
    'M 162 108 H 350 A 26 26 0 0 1 376 134 V 250 ' +
    'C 376 322 324 372 256 404 ' +
    'C 188 372 136 322 136 250 V 134 ' +
    'A 26 26 0 0 1 162 108 Z',
  shieldWidth: 32,

  /* میکروفون: کپسول (خط عمودی با سر گرد)، دانه، دنده و پایه؛ مرکزنگاری نوری داخل سپر */
  mic: [
    { d: 'M 256 182 V 226', width: 54 },
    { d: 'M 204 218 C 204 270 228 296 256 296 C 284 296 308 270 308 218', width: 24 },
    { d: 'M 256 296 V 328', width: 24 },
    { d: 'M 228 328 H 284', width: 24 },
  ],
};

/**
 * نسخه فشرده نوری برای ۱۶ و ۳۲ پیکسل: همان هندسه با وزن خط بیشتر
 * تا میکروفون در تب مرورگر به لکه تبدیل نشود.
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
 * هندسه مناسب یک اندازه مشخص.
 * @param {number} size پیکسل
 * @returns {BrandGeometry}
 */
export function brandGeometry(size) {
  return size <= 32 ? COMPACT : BASE;
}

/** ضریب کوچک‌کردن نشان برای آیکون maskable (منطقه امن ۸۰٪) */
export const MASKABLE_SCALE = 0.78;

/**
 * SVG نشان با رنگ پس‌زمینه قابل تنظیم (برای فاوآیکون پویا و پیش‌نمایش).
 * پیش‌فرض: پالت ثابت آیکون نصب (APP_ICON).
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

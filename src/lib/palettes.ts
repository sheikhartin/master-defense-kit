/**
 * پالت‌های حرفه‌ای رابط: خنثی‌های مشترک (کاغذ کرم) + رنگ تأکید متغیر.
 * ochre (اهمیت) و clay (هشدار) در همه پالت‌ها ثابت می‌مانند.
 *
 * هنگام اعمال پالت، فاوآیکون تب مرورگر هم با brandSvg هم‌رنگ می‌شود:
 * فقط رنگ کاشی عوض می‌شود؛ سپر طلایی و میکروفون کرم ثابت می‌مانند.
 * آیکون‌های نصب PWA (PNG/ICO در public/) همیشه نسخه ثابت و سراسری
 * APP_ICON (پس‌زمینه سبز تیره + سپر طلایی + میکروفون) هستند و عمداً
 * با پالت‌ها تغییر نمی‌کنند (تصمیم D10 در docs/PLAN.md).
 */

import type { PaletteId } from '../types';
import { brandSvg } from './brand.mjs';

export interface PaletteDef {
  id: PaletteId;
  /** برچسب فارسی */
  label: string;
  /** برچسب انگلیسی کوتاه */
  en: string;
  /** رنگ تأکید اصلی (پس‌زمینه نشان برند و دکمه‌های اصلی) */
  accent: string;
  accentDeep: string;
  accentSoft: string;
  accentWash: string;
  /** RGB برای سایه‌های درخشش */
  accentRgb: string;
}

export const PALETTES: PaletteDef[] = [
  {
    id: 'green',
    label: 'سبز کاج',
    en: 'Pine green',
    accent: '#1e5a49',
    accentDeep: '#163f35',
    accentSoft: '#e6efe8',
    accentWash: '#eef4ed',
    accentRgb: '30, 90, 73',
  },
  {
    id: 'blue',
    label: 'آبی دریایی',
    en: 'Ocean blue',
    accent: '#1e4f7a',
    accentDeep: '#153a5c',
    accentSoft: '#e4eef6',
    accentWash: '#eef4f9',
    accentRgb: '30, 79, 122',
  },
  {
    id: 'orange',
    label: 'نارنجی خاکی',
    en: 'Earth orange',
    accent: '#a85a1f',
    accentDeep: '#7a4014',
    accentSoft: '#f6e8d8',
    accentWash: '#faf1e6',
    accentRgb: '168, 90, 31',
  },
  {
    id: 'purple',
    label: 'بنفش آرام',
    en: 'Soft purple',
    accent: '#5b4578',
    accentDeep: '#3f2f56',
    accentSoft: '#eee8f4',
    accentWash: '#f4f0f8',
    accentRgb: '91, 69, 120',
  },
  {
    id: 'red',
    label: 'قرمز آجری',
    en: 'Brick red',
    accent: '#8b3a32',
    accentDeep: '#642923',
    accentSoft: '#f3e4e2',
    accentWash: '#f8efed',
    accentRgb: '139, 58, 50',
  },
];

export const DEFAULT_PALETTE: PaletteId = 'green';

export function paletteOf(id: PaletteId): PaletteDef {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

/** به‌روزرسانی فاوآیکون SVG تب مرورگر با رنگ کاشی پالت فعال (سپر و میکروفون ثابت) */
function applyFavicon(accent: string): void {
  if (typeof document === 'undefined') return;
  try {
    const svg = brandSvg({ tile: accent });
    const href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    let link = document.querySelector<HTMLLinkElement>('link[data-dynamic-favicon="1"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/svg+xml';
      link.setAttribute('data-dynamic-favicon', '1');
      document.head.appendChild(link);
    }
    link.href = href;
  } catch {
    /* اگر مرورگر data-URL را نپذیرد، فاوآیکون ثابت public/icon.svg می‌ماند */
  }
}

/** اعمال توکن‌های پالت روی ریشه سند + فاوآیکون تب */
export function applyPalette(id: PaletteId): void {
  const p = paletteOf(id);
  const root = document.documentElement;
  root.dataset.theme = p.id;
  root.style.setProperty('--color-accent', p.accent);
  root.style.setProperty('--color-accent-deep', p.accentDeep);
  root.style.setProperty('--color-accent-soft', p.accentSoft);
  root.style.setProperty('--color-accent-wash', p.accentWash);
  root.style.setProperty('--accent-rgb', p.accentRgb);
  /* سازگاری با توکن‌های تاریخی pine = accent */
  root.style.setProperty('--color-pine', p.accent);
  root.style.setProperty('--color-pine-deep', p.accentDeep);
  root.style.setProperty('--color-pine-soft', p.accentSoft);
  root.style.setProperty('--color-pine-wash', p.accentWash);
  root.style.setProperty(
    '--shadow-glow-sm',
    `0 0 0 1px rgba(${p.accentRgb}, 0.12), 0 3px 12px rgba(${p.accentRgb}, 0.16)`,
  );
  root.style.setProperty(
    '--shadow-glow',
    `0 0 0 1px rgba(${p.accentRgb}, 0.12), 0 8px 22px rgba(${p.accentRgb}, 0.16), 0 14px 40px -12px rgba(${p.accentRgb}, 0.28)`,
  );
  applyFavicon(p.accent);
}

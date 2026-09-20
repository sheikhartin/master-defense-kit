/**
 * پالت‌های حرفه‌ای رابط: خنثی‌های مشترک (کاغذ کرم) + رنگ تأکید متغیر.
 * ochre (اهمیت) و clay (هشدار) در همه پالت‌ها ثابت می‌مانند.
 *
 * پالت‌ها فقط رنگ‌های رابط (دکمه، ناوبری، پیشرفت، هاله محیطی) را عوض می‌کنند.
 * لوگو (نشان سربرگ/پابرگ، فاوآیکون تب، آیکون‌های نصب) همیشه نشان ثابت
 * مشکی با سپر طلایی و میکروفون کرم است و عمداً با پالت تغییر نمی‌کند
 * (تصمیم D13 در docs/PLAN.md).
 */

import type { PaletteId } from '../types';

export interface PaletteDef {
  id: PaletteId;
  /** برچسب فارسی */
  label: string;
  /** برچسب انگلیسی کوتاه */
  en: string;
  /** رنگ تأکید اصلی رابط (دکمه‌های اصلی، ناوبری، پیشرفت؛ نه لوگو) */
  accent: string;
  accentDeep: string;
  accentSoft: string;
  accentWash: string;
  /** RGB برای هاله‌های ملایم رابط (مرورگر محیطی، حلقه تمرکز، نوار پیشرفت) */
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

/** اعمال توکن‌های پالت روی ریشه سند (فقط رنگ‌های رابط؛ لوگو ثابت است) */
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
  /* سایه‌های هاور در CSS خنثی و ثابت می‌مانند؛ لوگو و سایه‌ها با پالت عوض نمی‌شوند */
}

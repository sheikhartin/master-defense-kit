/**
 * Professional UI palettes: shared neutrals (cream paper) plus a variable accent color.
 * ochre (importance) and clay (warning) stay fixed in every palette.
 *
 * Palettes only change UI colors (buttons, navigation, progress, ambient tint).
 * The logo (header/footer mark, tab favicon, install icons) is always the fixed
 * black mark with a gold shield and cream microphone and deliberately does not
 * change with the palette (decision D13 in docs/PLAN.md).
 */

import type { PaletteId } from '../types';

export interface PaletteDef {
  id: PaletteId;
  /** Persian label */
  label: string;
  /** Short English label */
  en: string;
  /** Primary UI accent color (primary buttons, navigation, progress; not the logo) */
  accent: string;
  accentDeep: string;
  accentSoft: string;
  accentWash: string;
  /** RGB for soft UI glows (ambient blur, focus ring, progress bar) */
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

/** Apply palette tokens to the document root (UI colors only; the logo is fixed) */
export function applyPalette(id: PaletteId): void {
  const p = paletteOf(id);
  const root = document.documentElement;
  root.dataset.theme = p.id;
  root.style.setProperty('--color-accent', p.accent);
  root.style.setProperty('--color-accent-deep', p.accentDeep);
  root.style.setProperty('--color-accent-soft', p.accentSoft);
  root.style.setProperty('--color-accent-wash', p.accentWash);
  root.style.setProperty('--accent-rgb', p.accentRgb);
  /* Compatibility with the historic pine = accent tokens */
  root.style.setProperty('--color-pine', p.accent);
  root.style.setProperty('--color-pine-deep', p.accentDeep);
  root.style.setProperty('--color-pine-soft', p.accentSoft);
  root.style.setProperty('--color-pine-wash', p.accentWash);
  /* Hover shadows stay neutral and fixed in CSS; the logo and shadows never change with the palette */
}

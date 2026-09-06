/**
 * محاسبه زمان‌بندی جلسه از روی مدت‌های اسلایدها.
 * پنجره هر اسلاید همیشه به‌صورت تجمعی از شروع محاسبه می‌شود تا
 * هنگام افزودن اسلاید اختیاری «وراثت و رقابت»، همه زمان‌ها خودکار و
 * بدون تناقض جابه‌جا شوند. بدون اسلاید اختیاری، خروجی دقیقاً با
 * زمان‌بندی سناریوی نهایی یکی است (۱۹:۰۰ به‌علاوه ۱:۰۰ حاشیه امن).
 */

import { SAFETY_BUFFER, slides } from '../data/deck';
import type { DeckSlide } from '../types';
import { clockOf } from './persian';

export interface PlannedSlide extends DeckSlide {
  index: number;
  start: number;
  end: number;
}

/** فهرست اسلایدهای برنامه‌ریزی‌شده (اختیاری: گنجاندن اسلایدهای optional) */
export function planSlides(includeOptional = false): PlannedSlide[] {
  let cursor = 0;
  return slides
    .filter((s) => includeOptional || !s.optional)
    .map((s, index) => {
      const item: PlannedSlide = { ...s, index, start: cursor, end: cursor + s.duration };
      cursor += s.duration;
      return item;
    });
}

/** مدت کل گفتار به ثانیه (بدون حاشیه امن) */
export function totalTalk(includeOptional = false): number {
  const plan = planSlides(includeOptional);
  return plan.length ? plan[plan.length - 1].end : 0;
}

/** مدت کل جلسه شامل حاشیه امن */
export function totalSession(includeOptional = false): number {
  return totalTalk(includeOptional) + SAFETY_BUFFER;
}

/**
 * هدف تمرین: پایان ارائه بین ۱۹:۱۵ تا ۱۹:۳۰ (سناریوی نهایی).
 * بازه ثابت است؛ با اسلاید اختیاری، هدف «حداکثر بیست دقیقه» می‌شود.
 */
export function practiceWindow(): { from: number; to: number } {
  const base = 19 * 60;
  return { from: base + 15, to: base + 30 };
}

/** نمایش متنی هدف پایان (برای متن‌های ساده و چاپ) */
export function practiceTarget(): string {
  const w = practiceWindow();
  return `${clockOf(w.from)} تا ${clockOf(w.to)}`;
}

/** پنجره نمایشی اسلاید: «۰۹:۳۰ تا ۱۰:۱۵» */
export function slideWindow(item: PlannedSlide): string {
  return `${clockOf(item.start)} تا ${clockOf(item.end)}`;
}

/** موقعیت یک اسلاید در میان بخش‌ها (برای ناوبری بخش) */
export function chapterOfIndex(chapterSlideIndexes: number[], index: number): number {
  return chapterSlideIndexes.indexOf(index);
}

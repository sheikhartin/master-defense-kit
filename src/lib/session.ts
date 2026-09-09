/**
 * محاسبه زمان‌بندی جلسه از روی مدت‌های اسلایدها.
 * پنجره هر اسلاید همیشه به‌صورت تجمعی از شروع محاسبه می‌شود تا
 * هنگام افزودن اسلاید اختیاری «وراثت و رقابت»، همه زمان‌ها خودکار و
 * بدون تناقض جابه‌جا شوند. چیدمان فشرده (بدون اسلاید اختیاری) گفتاری
 * به مدت ۱۸:۳۰ دارد و چیدمان گسترده با افزودن ۴۵ ثانیه به ۱۹:۱۵
 * می‌رسد؛ در هر دو حالت ۱:۰۰ حاشیه امن به انتها افزوده می‌شود.
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
 * هدف تمرین: پایان ارائه ۱۵ تا ۳۰ ثانیه پس از پایان متن گفتارِ همان چیدمان
 * (فشرده: پایان گفتار ۱۸:۳۰ و بازه هدف ۱۸:۴۵ تا ۱۹:۰۰؛ گسترده: پایان گفتار
 * ۱۹:۱۵ و بازه هدف ۱۹:۳۰ تا ۱۹:۴۵).
 */
export function practiceWindow(includeOptional = false): { from: number; to: number } {
  const end = totalTalk(includeOptional);
  return { from: end + 15, to: end + 30 };
}

/** نمایش متنی هدف پایان (برای متن‌های ساده و چاپ) */
export function practiceTarget(includeOptional = false): string {
  const w = practiceWindow(includeOptional);
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

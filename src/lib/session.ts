/**
 * محاسبه زمان‌بندی جلسه از روی مدت‌های اسلایدها.
 * پنجره هر اسلاید همیشه به‌صورت تجمعی از شروع محاسبه می‌شود.
 * همه اسلایدهای بسته محتوایی در ارائه حضور دارند (اسلاید اختیاری وجود ندارد).
 * مدت گفتار و هدف پایان از meta تولیدشده (جمع durationSec فایل‌های اسلاید) خوانده می‌شود.
 */

import { SAFETY_BUFFER, slides, meta } from '../data/deck';
import type { DeckSlide } from '../types';
import { clockOf } from './persian';

export interface PlannedSlide extends DeckSlide {
  index: number;
  start: number;
  end: number;
}

/** فهرست اسلایدهای برنامه‌ریزی‌شده (همه اسلایدها، بدون فیلتر اختیاری) */
export function planSlides(): PlannedSlide[] {
  let cursor = 0;
  return slides.map((s, index) => {
    const item: PlannedSlide = { ...s, index, start: cursor, end: cursor + s.duration };
    cursor += s.duration;
    return item;
  });
}

/** مدت کل گفتار به ثانیه (بدون حاشیه امن) */
export function totalTalk(): number {
  return meta.talkTotalSec;
}

/** مدت کل جلسه شامل حاشیه امن */
export function totalSession(): number {
  return meta.sessionTotalSec;
}

/**
 * هدف تمرین: پایان ارائه ۱۵ تا ۳۰ ثانیه پس از پایان متن گفتار
 * (پیش‌فرض بسته BCOA: پایان گفتار ۱۹:۱۵ و بازه هدف ۱۹:۳۰ تا ۱۹:۴۵).
 */
export function practiceWindow(): { from: number; to: number } {
  return { from: meta.finishFromSec, to: meta.finishToSec };
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

/** حاشیه امن (ثانیه) از meta */
export { SAFETY_BUFFER };

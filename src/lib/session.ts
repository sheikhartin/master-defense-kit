/**
 * Compute the session timeline from the slide durations.
 * Every slide window is always computed cumulatively from the start.
 * All slides of the content pack are part of the talk (there are no optional slides).
 * Talk duration and finish target are read from the generated meta (sum of the durationSec fields).
 */

import { SAFETY_BUFFER, slides, meta } from '../data/deck';
import type { DeckSlide } from '../types';
import { clockOf } from './persian';

export interface PlannedSlide extends DeckSlide {
  index: number;
  start: number;
  end: number;
}

/** List of planned slides (all slides, no optional filtering) */
export function planSlides(): PlannedSlide[] {
  let cursor = 0;
  return slides.map((s, index) => {
    const item: PlannedSlide = { ...s, index, start: cursor, end: cursor + s.duration };
    cursor += s.duration;
    return item;
  });
}

/** Total talk duration in seconds (without the safety buffer) */
export function totalTalk(): number {
  return meta.talkTotalSec;
}

/** Total session duration including the safety buffer */
export function totalSession(): number {
  return meta.sessionTotalSec;
}

/**
 * Practice target: finish 15 to 30 seconds after the end of the speech
 * (default BCOA pack: talk ends 19:15 and the target range is 19:30 to 19:45).
 */
export function practiceWindow(): { from: number; to: number } {
  return { from: meta.finishFromSec, to: meta.finishToSec };
}

/** Text form of the finish target (for plain text and print) */
export function practiceTarget(): string {
  const w = practiceWindow();
  return `${clockOf(w.from)} تا ${clockOf(w.to)}`;
}

/** Display window of a slide */
export function slideWindow(item: PlannedSlide): string {
  return `${clockOf(item.start)} تا ${clockOf(item.end)}`;
}

/** Position of a slide among the chapters (for chapter navigation) */
export function chapterOfIndex(chapterSlideIndexes: number[], index: number): number {
  return chapterSlideIndexes.indexOf(index);
}

/** Safety buffer (seconds) from meta */
export { SAFETY_BUFFER };

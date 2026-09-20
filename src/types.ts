/**
 * Data types for the defense kit.
 * Content comes from the external content/ files and is compiled into
 * src/content.generated.ts at build time; this file only keeps the contracts.
 */

/** Official talk chapters (the eight-part list) */
export interface Chapter {
  /** Stable id */
  id: string;
  /** Chapter number: "01" to "08", or the start marker for opening slides */
  num: string;
  title: string;
  /** Short content description */
  summary: string;
  /** Indices of this chapter's slides in the slides array */
  slideRange: [number, number];
  /** Key goal of the chapter */
  goal?: string;
}

export interface SlideFormula {
  tex: string;
  /** Short label next to the equation (optional) */
  caption?: string;
}

export interface DeckSlide {
  /** Stable content id (used for localStorage keys) */
  id: string;
  /** Slide number in talk order (1-based, positional) */
  num: number;
  /** Persian title shown on the slide */
  title: string;
  /** Chapter id (the eight-part list) */
  chapterId: string;
  /** Standard duration in seconds (from durationSec in the slide file) */
  duration: number;
  /** English duration label for content authors (for example "1 min 40 sec") */
  estimatedTime?: string;
  /** Slide goal from the scenario */
  goal?: string;
  /** Suggested on-slide content: a short list */
  visual: string[];
  /** Display equations of the slide (KaTeX rendering, ASCII only) */
  tex: SlideFormula[];
  /** Full speech text (paragraphs from the scenario) */
  speech: string[];
  /** Key sentence to memorize */
  phrase?: string;
  /** Coach notes / delivery tips */
  notes: string[];
  /** Transition sentence into the next slide */
  transition?: string;
}

export interface QaItem {
  id: number;
  category: QaCategory;
  question: string;
  answer: string;
  /** Additional strategic note */
  tip?: string;
  /** Key sentence that must be said */
  keySentence?: string;
}

export type QaCategory =
  | 'آسان'
  | 'متوسط'
  | 'سخت'
  | 'دام‌دار'
  | 'روش'
  | 'پیچیدگی'
  | 'کاربردی'
  | 'آماری'
  | 'محدودیت';

export interface EquationParam {
  /** Math symbol (ASCII only, inside LaTeX) */
  sym: string;
  /** Persian parameter name */
  name: string;
  /** Readable description that avoids pronouncing the symbol */
  desc: string;
}

export interface Equation {
  id: string;
  /** Persian title of the relation */
  title: string;
  /** Short English title (shown next to the Persian title) */
  en: string;
  /** Full LaTeX expression (ASCII only) */
  tex: string;
  /** Relation inline or as a block */
  display: boolean;
  /** Source: thesis or paper version */
  ref: string;
  /** Persian conceptual explanation */
  meaning: string;
  /** Guidance on saying the relation in Persian without reading the symbols */
  verbal: string;
  /** Parameter breakdown */
  params: EquationParam[];
}

export interface ConceptCard {
  id: string;
  /** Main card label, precise and Persian */
  label: string;
  /** Persian subtitle */
  heading: string;
  /** Latin name (in its own place, left to right, never centered on top of the card) */
  en: string;
  tone: 'pine' | 'ochre' | 'clay';
  body: string[];
}

export interface FactRow {
  /** Persian label */
  label: string;
  /** Value or main text */
  value: string;
  kind: 'rel' | 'num' | 'bound';
}

export interface ChecklistGroup {
  id: string;
  title: string;
  items: string[];
}

export interface DoDont {
  bad: string;
  good: string;
}

/** Professional UI palettes */
export type PaletteId = 'green' | 'blue' | 'orange' | 'purple' | 'red';

/** Personal note with an importance flag and key lines */
export interface PersonalNote {
  text: string;
  important: boolean;
  extras: Array<{ id: string; text: string; important: boolean }>;
}

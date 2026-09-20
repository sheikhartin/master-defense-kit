/**
 * انواع داده بستار دفاع
 * محتوا از فایل‌های بیرونی content/ می‌آید و هنگام ساخت به
 * src/content.generated.ts تبدیل می‌شود؛ این فایل فقط قراردادها را نگه می‌دارد.
 */

/** بخش‌های رسمی ارائه (فهرست هشت‌بخشی) */
export interface Chapter {
  /** شناسه پایدار */
  id: string;
  /** شماره بخش: «۰۱» تا «۰۸» یا «شروع» برای اسلایدهای آغازین */
  num: string;
  title: string;
  /** توضیح کوتاه محتوایی */
  summary: string;
  /** ایندکس‌های اسلایدهای این بخش در آرایه slides */
  slideRange: [number, number];
  /** هدف کلیدی بخش */
  goal?: string;
}

export interface SlideFormula {
  tex: string;
  /** برچسب کوتاه فارسی کنار فرمول (اختیاری) */
  caption?: string;
}

export interface DeckSlide {
  /** شناسه پایدار محتوایی (برای کلیدهای localStorage) */
  id: string;
  /** شماره اسلاید در ترتیب ارائه (۱-پایه، موقعیتی) */
  num: number;
  /** عنوان فارسی روی اسلاید */
  title: string;
  /** شناسه بخش (فهرست هشت‌بخشی) */
  chapterId: string;
  /** مدت زمان استاندارد به ثانیه (از durationSec فایل اسلاید) */
  duration: number;
  /** برچسب انگلیسی مدت برای نویسندگان محتوا (مثلاً "1 min 40 sec") */
  estimatedTime?: string;
  /** هدف اسلاید از سناریو */
  goal?: string;
  /** محتوای پیشنهادی روی اسلاید: فهرست کوتاه */
  visual: string[];
  /** فرمول‌های نمایشی اسلاید (رندر کیتکس، فقط ASCII) */
  tex: SlideFormula[];
  /** متن گفتاری کامل (پاراگراف‌ها از سناریو) */
  speech: string[];
  /** جمله کلیدی برای حفظ */
  phrase?: string;
  /** یادداشت‌های مربی / نکات اجرایی */
  notes: string[];
  /** جمله انتقال به اسلاید بعد */
  transition?: string;
}

export interface QaItem {
  id: number;
  category: QaCategory;
  question: string;
  answer: string;
  /** نکته استراتژیک تکمیلی */
  tip?: string;
  /** جمله کلیدی که حتماً باید گفته شود */
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
  /** نماد ریاضی (فقط ASCII، داخل LaTeX) */
  sym: string;
  /** نام فارسی پارامتر */
  name: string;
  /** توضیح خوانا و بی‌نیاز از گفتن نماد */
  desc: string;
}

export interface Equation {
  id: string;
  /** عنوان فارسی رابطه */
  title: string;
  /** عنوان انگلیسی کوتاه (در کنار عنوان فارسی) */
  en: string;
  /** عبارت LaTeX کامل (فقط ASCII) */
  tex: string;
  /** رابطه داخل جمله یا بلوک */
  display: boolean;
  /** منبع: نسخه پایان‌نامه یا مقاله */
  ref: string;
  /** توضیح مفهومی فارسی */
  meaning: string;
  /** راهنمای گفتن رابطه به زبان فارسی، بدون روخوانی نمادها */
  verbal: string;
  /** تشریح پارامترها */
  params: EquationParam[];
}

export interface ConceptCard {
  id: string;
  /** برچسب اصلی کارت، دقیق و فارسی */
  label: string;
  /** عنوان فرعی فارسی */
  heading: string;
  /** نام لاتین (در محل درست خودش، چپ‌به‌راست، هرگز در بالای کارت وسط‌چین نمی‌شود) */
  en: string;
  tone: 'pine' | 'ochre' | 'clay';
  body: string[];
}

export interface FactRow {
  /** برچسب فارسی */
  label: string;
  /** ارزش یا متن اصلی */
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

/** پالت‌های حرفه‌ای رابط */
export type PaletteId = 'green' | 'blue' | 'orange' | 'purple' | 'red';

/** یادداشت شخصی با پرچم اهمیت و خطوط کلیدی */
export interface PersonalNote {
  text: string;
  important: boolean;
  extras: Array<{ id: string; text: string; important: boolean }>;
}

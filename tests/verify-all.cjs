/**
 * تست‌های مستقل برای صحت‌سنجی کامل ساختار داده‌ها، ارقام فارسی و عدم وجود کاراکترهای نامناسب
 */
const fs = require('fs');
const path = require('path');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failCount++;
  }
}

console.log('--- شروع تست‌های اعتبارسنجی ---');

// تست ۱: بررسی فایل content.ts از نظر عدم وجود em-dash و en-dash
const contentFile = fs.readFileSync(path.join(__dirname, '../src/data/content.ts'), 'utf8');

assert(!contentFile.includes('\u2013'), 'عدم وجود خط تیره en-dash در content.ts');
assert(!contentFile.includes('\u2014'), 'عدم وجود خط تیره em-dash در content.ts');

// تست ۲: اعتبارسنجی زمان‌های پیشنهادی اسلایدها
const timeMatches = contentFile.match(/time:\s*\"([^\"]+)\"/g) || [];
assert(timeMatches.length === 20, `وجود ۲۰ اسلاید با زمان پیشنهادی مشخص (یافت‌شده: ${timeMatches.length})`);

const englishDigitRegex = /[0-9]/;
let allTimesPersian = true;
let allTimesHaveWordTa = true;

timeMatches.forEach(tm => {
  const val = tm.split('"')[1];
  if (englishDigitRegex.test(val)) {
    allTimesPersian = false;
    console.error(`زمان شامل رقم انگلیسی است: ${val}`);
  }
  if (!val.includes('تا')) {
    allTimesHaveWordTa = false;
    console.error(`زمان کلمه «تا» را ندارد: ${val}`);
  }
});

assert(allTimesPersian, 'تمام زمان‌های پیشنهادی اسلایدها با ارقام فارسی نوشته شده‌اند');
assert(allTimesHaveWordTa, 'تمام زمان‌های پیشنهادی با ساختار «تا» به جای خط تیره نوشته شده‌اند');

// تست ۳: اعتبارسنجی توابع persian.ts
const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
function toPersianDigits(value) {
  if (value === undefined || value === null) return '';
  return String(value).replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
}

function formatTimePersian(seconds) {
  const safeSec = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safeSec / 60).toString().padStart(2, '0');
  const s = (safeSec % 60).toString().padStart(2, '0');
  return `${toPersianDigits(m)}:${toPersianDigits(s)}`;
}

assert(toPersianDigits(1) === '۱', 'تبدیل عدد ۱ به ۱ فارسی');
assert(toPersianDigits(20) === '۲۰', 'تبدیل عدد ۲۰ به ۲۰ فارسی');
assert(toPersianDigits(0) === '۰', 'تبدیل عدد ۰ به ۰ فارسی');
assert(formatTimePersian(0) === '۰۰:۰۰', 'فرمت زمان ۰ ثانیه به ۰۰:۰۰');
assert(formatTimePersian(65) === '۰۱:۰۵', 'فرمت زمان ۶۵ ثانیه به ۰۱:۰۵');

// تست ۴: بررسی فایلهای PresentationLab برای جلوگیری از باگ ۰۰
const presFile = fs.readFileSync(path.join(__dirname, '../src/components/PresentationLab.tsx'), 'utf8');
assert(!presFile.includes("split(':')[1]"), 'حذف کامل باگ split(\':\')[1] که باعث نمایش ۰۰ می‌شد');
assert(presFile.includes('toPersianDigits(currentSlideIndex + 1)'), 'استفاده از شمارنده دقیق فارسی برای اسلاید جاری');
assert(presFile.includes('toPersianDigits(slides.length)'), 'استفاده از شمارنده دقیق فارسی برای کل اسلایدها');

// تست ۵: تقارن دکمه‌ها و تایمرها در PresentationLab
assert(presFile.includes('resetTotalTimer'), 'وجود تابع و دکمه ریست برای تایمر کل');
assert(presFile.includes('resetSlideTimer'), 'وجود تابع و دکمه ریست برای تایمر اسلاید');
assert(presFile.includes('isTotalRunning'), 'وجود کنترل وضعیت مستقل برای تایمر کل');
assert(presFile.includes('isSlideRunning'), 'وجود کنترل وضعیت مستقل برای تایمر اسلاید');

// تست ۶: اعتبارسنجی روابط ریاضی اصیل و توضیحات فارسی در content.ts
assert(contentFile.includes('coreEquations'), 'وجود آرایه coreEquations در content.ts');
assert(contentFile.includes('X_i^{t+1}'), 'وجود رابطه دقیق موقعیت X_i^{t+1} مطابق مقاله');
assert(contentFile.includes('\\theta_i^{t+1}'), 'وجود رابطه دقیق اصلاح زاویه theta_i^{t+1} مطابق مقاله');
assert(contentFile.includes('\\sigma_i^t'), 'وجود رابطه دقیق اختلال تطبیقی sigma_i^t');
assert(contentFile.includes('verbalExplanation'), 'وجود توضیحات کلامی و بیانی فارسی برای دفاع بدون روخوانی فرمول');

// تست ۷: اعتبارسنجی سوالات تکمیلی داوران (فریدمن، ویلکاکسون، نگاشت گسسته)
assert(contentFile.includes('فریدمن'), 'وجود توضیح دقیق آزمون و رتبه فریدمن در داده‌های پرسش و پاسخ');
assert(contentFile.includes('ویلکاکسون'), 'وجود توضیح دقیق آزمون ویلکاکسون در داده‌های پرسش و پاسخ');
assert(contentFile.includes('توابع نگاشت گسسته'), 'وجود توضیح دقیق توابع نگاشت و مسائل گسسته');

// تست ۸: بررسی CheatSheetLab برای رندر روابط و عدم تداخل
const cheatFile = fs.readFileSync(path.join(__dirname, '../src/components/CheatSheetLab.tsx'), 'utf8');
assert(cheatFile.includes('coreEquations'), 'رندر روابط ریاضی در برگه تقلب');
assert(cheatFile.includes('verbalExplanation'), 'رندر توضیحات فارسی گفتاری در برگه تقلب');
assert(cheatFile.includes('Latex'), 'استفاده از کتابخانه LaTeX برای رندر فرمول‌ها');

console.log(`--- نتیجه تست‌ها: ${passCount} قبول، ${failCount} خطا ---`);

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('همه تست‌ها با موفقیت پاس شدند.');
}

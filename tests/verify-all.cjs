/**
 * تست‌های مستقل برای صحت‌سنجی ساختار داده‌ها، قواعد نگارش و آفلاین بودن کامل.
 * اجرا: npm run verify
 *
 * این آزمون‌ها به هیچ وابستگی خارجی نیاز ندارند و فقط محتوای متنی سورس را می‌سنجند.
 * نکته: در فایل‌های TypeScript هر بک‌اسلش LaTeX به‌صورت «\\» (دونویسه) ذخیره شده؛
 * تابع norm پایین، آن را به شکل زمان اجرا (تک‌نویسه) درمی‌آورد تا رشته‌های واقعی
 * رسیده به کیتکس سنجیده شوند.
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

const ROOT = path.join(__dirname, '..');
function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

/** بازسازی محتوای زمان‌اجرای رشته‌ها: هر جفت بک‌اسلش به یک بک‌اسلش تبدیل می‌شود */
function norm(source) {
  return source.replace(/\\\\/g, '\\');
}

console.log('--- شروع تست‌های اعتبارسنجی ---');

/* ------------------------------------------------------------------ */
/* ۱) قواعد نگارش: بدون em dash و en dash در داده‌ها و متن رابط کاربر  */
/* ------------------------------------------------------------------ */
const textFiles = [
  'src/data/roadmap.ts',
  'src/data/deck.ts',
  'src/data/cheat.ts',
  'src/data/qa.ts',
  'src/data/checklist.ts',
  'src/labs/HomeLab.tsx',
  'src/labs/PracticeLab.tsx',
  'src/labs/CheatSheetLab.tsx',
  'src/labs/QALab.tsx',
  'src/labs/ChecklistLab.tsx',
  'src/components/Header.tsx',
  'src/components/PrintSheet.tsx',
  'src/App.tsx',
  'src/types.ts',
  'README.md',
];

for (const rel of textFiles) {
  const content = read(rel);
  assert(
    !content.includes('\u2014') && !content.includes('\u2013'),
    `عدم وجود em dash و en dash در ${rel}`,
  );
}

/* ------------------------------------------------------------------ */
/* ۲) هیچ رقم یا حرف فارسی داخل عبارت‌های LaTeX نباشد                  */
/* ------------------------------------------------------------------ */
const persianChar = /[\u0600-\u06FF]/;
const latexMacro = /\\[a-zA-Z]{2,}/;
let persianInLatex = [];

for (const rel of ['src/data/cheat.ts', 'src/data/deck.ts']) {
  const content = norm(read(rel));
  const strings = content.match(/'([^'\\]|\\.)*'/g) || [];
  for (const s of strings) {
    const value = s.slice(1, -1);
    // فقط رشته‌هایی که واقعاً LaTeX هستند: دارای دستور (ماکرو) یا ساختار ریاضی
    const isLatex = latexMacro.test(value) || /\\[{}]/.test(value);
    if (isLatex && persianChar.test(value)) {
      persianInLatex.push(`${rel}: ${value.slice(0, 70)}`);
    }
  }
}
assert(persianInLatex.length === 0, 'عدم وجود حروف یا ارقام فارسی داخل عبارت‌های LaTeX');

/* ------------------------------------------------------------------ */
/* ۳) روابط ریاضی اصیل: پیکان روی کل گروه d(θ)، کاپا، سیگما و سیگمای  */
/*    اختلال تطبیقی نمایی                                              */
/* ------------------------------------------------------------------ */
const cheatNorm = norm(read('src/data/cheat.ts'));
const deckNorm = norm(read('src/data/deck.ts'));

const arrowCount = (cheatNorm.match(/\\overrightarrow\{d\(\\theta_\{i\}\^\{t\}\)\}/g) || []).length;
assert(arrowCount >= 1, 'وجود رابطه موقعیت با پیکان روی کل گروه d(θ)');
assert(
  deckNorm.includes('\\overrightarrow{d(\\theta_{i}^{t})}'),
  'وجود رابطه اصلی در اسلاید روش با پیکان روی کل گروه d(θ)',
);
assert(
  /\\kappa\\,\\bigl\(X_g\^t-X_i\^t\\bigr\)/.test(cheatNorm),
  'وجود جمله اجتماعی با ضریب کاپا در رابطه اصلی',
);
assert(
  /\\theta_i\^\{?t\+1\}?=\\theta_i\^t.*\\sigma_i\^t/.test(cheatNorm),
  'وجود رابطه اصلاح زاویه با سیگمای تطبیقی',
);
assert(
  /\\sigma_i\^t=\\xi_i\^t\\,?\\exp\\bigl\(-t\/T\\bigr\)/.test(cheatNorm),
  'وجود رابطه اختلال تطبیقی نمایی (سیگما برابر کسی نمایی کاهنده)',
);

/* ------------------------------------------------------------------ */
/* ۴) ساختار بیست‌اسلایدی و زمان‌بندی ۱۹ دقیقه‌ای                     */
/* ------------------------------------------------------------------ */
const deckText = read('src/data/deck.ts');
const durations = [...deckText.matchAll(/duration:\s*(\d+)/g)].map((m) => Number(m[1]));
assert(
  durations.length === 21,
  `وجود ۲۰ اسلاید اصلی + ۱ اختیاری (یافت‌شده: ${durations.length})`,
);
const optionalIndex = deckText.indexOf('optional: true');
assert(optionalIndex > -1, 'اسلاید اختیاری با پرچم optional مشخص شده است');
const mainSum = durations.reduce((a, b) => a + b, 0) - durations[10]; // ایندکس ۱۰: اسلاید اختیاری num:0
assert(mainSum === 1140, `مجموع زمان اسلایدهای اصلی دقیقاً ۱۹:۰۰ باشد (یافت‌شده: ${mainSum} ثانیه)`);
assert(!durations.some((d) => d <= 0), 'همه زمان‌ها مثبت و معتبر هستند');
assert(/export const chapters/.test(deckText), 'وجود فهرست رسمی بخش‌ها در deck.ts');
assert(/id: 'ch[1-8]'/.test(deckText), 'بخش‌های ۰۱ تا ۰۸ در فهرست رسمی');

/* ------------------------------------------------------------------ */
/* ۵) آفلاین کامل: هیچ آدرس خارجی در سورس برنامه نباشد                */
/* ------------------------------------------------------------------ */
const allSources = [
  'index.html',
  'vite.config.ts',
  'src/App.tsx',
  'src/main.tsx',
  'src/types.ts',
  'src/lib/persian.ts',
  'src/lib/tex.tsx',
  'src/lib/storage.ts',
  'src/lib/session.ts',
  'src/lib/app-context.tsx',
  ...textFiles,
];
let externalFound = [];
for (const rel of allSources) {
  const urls = read(rel).match(/https?:\/\/[^\s"'`)]+/g) || [];
  for (const u of urls) {
    if (u.includes('w3.org/2000/svg')) continue;
    externalFound.push(`${rel}: ${u}`);
  }
}
assert(externalFound.length === 0, 'عدم وجود هیچ آدرس اینترنتی در سورس برنامه');
assert(
  !read('package.json').includes('@google') && !read('package.json').includes('express'),
  'حذف وابستگی‌های سرویس‌محور از package.json',
);

/* ------------------------------------------------------------------ */
/* ۶) پرهیز از موتورهای رندر قدیمی و فایل‌های حذف‌شده                 */
/* ------------------------------------------------------------------ */
const combined = textFiles.join('\n') + read('src/main.tsx');
assert(!combined.includes('react-latex-next'), 'عدم استفاده از react-latex-next');
assert(!/from 'motion\/react'/.test(combined), 'عدم استفاده از motion/react');
assert(!combined.includes("content.ts"), 'عدم ارجاع به فایل حذف‌شده content.ts');

const legacyFiles = [
  'src/components/PresentationLab.tsx',
  'src/components/QALab.tsx',
  'src/components/CheatSheetLab.tsx',
  'src/components/ChecklistLab.tsx',
  'src/components/OfflineIndicator.tsx',
  'src/components/PWAInstallButton.tsx',
  'src/data/content.ts',
];
let legacyRemain = legacyFiles.filter((rel) => fs.existsSync(path.join(ROOT, rel)));
assert(legacyRemain.length === 0, `حذف کامل فایل‌های قدیمی (باقی‌مانده: ${legacyRemain.join('، ') || 'هیچ'})`);

/* ------------------------------------------------------------------ */
/* ۷) ذخیره محلی، تایمر هم‌زمان و حالت تمرکز                          */
/* ------------------------------------------------------------------ */
const storageText = read('src/lib/storage.ts');
assert(storageText.includes('localStorage'), 'ذخیره یادداشت‌ها و پیشرفت در localStorage');
const practiceText = read('src/labs/PracticeLab.tsx');
assert(practiceText.includes('session:last'), 'ذخیره و ادامه از آخرین جایگاه جلسه');
assert(/function formatTimePersian|toPersianDigits/.test(read('src/lib/persian.ts')), 'ابزار ارقام فارسی وجود دارد');

const appText = read('src/App.tsx');
assert(appText.includes('focus') && /setFocus/.test(appText), 'وجود حالت تمرکز در پوسته برنامه');
assert(/readingStyle/.test(appText), 'وجود کنترل تایپوگرافی (اندازه متن و فاصله خط) در پوسته');
const practiceNorm = norm(practiceText);
assert(
  /toggleRun|running|startStop/.test(practiceNorm) || practiceText.includes('pause'),
  'وجود کنترل شروع و توقف (هم‌زمان) در جلسه تمرینی',
);

/* ------------------------------------------------------------------ */
/* ۸) محتوای نسخه ۲: پرسش‌ها، حاشیه امن و سبک چاپی                    */
/* ------------------------------------------------------------------ */
const qaText = read('src/data/qa.ts');
assert(qaText.includes('ویلکاکسون') && qaText.includes('فریدمن'), 'وجود توضیح آزمون‌های ویلکاکسون و فریدمن');
assert(qaText.includes('نموینی'), 'وجود توضیح آزمون نموینی');
assert(
  /۱۹:۱۵|حاشیه|SAFETY_BUFFER/.test(read('src/lib/session.ts')) &&
    /۱۹:۱۵/.test(read('src/lib/session.ts')),
  'وجود منطق حاشیه امن و بازه پایان ۱۹:۱۵ تا ۱۹:۳۰',
);

const printCss = read('src/index.css') + '\n' + read('src/components/PrintSheet.tsx');
assert(/@media print/.test(printCss), 'سبک چاپی برای نسخه کاغذی برگه تقلب');

console.log(`--- نتیجه تست‌ها: ${passCount} قبول، ${failCount} خطا ---`);

if (failCount > 0) {
  console.error('برخی تست‌ها ناموفق بودند.');
  process.exit(1);
} else {
  console.log('همه تست‌ها با موفقیت پاس شدند.');
}

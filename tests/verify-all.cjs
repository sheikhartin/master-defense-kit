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

/* ------------------------------------------------------------------ */
/* ۹) پایداری بصری: هاور بدون جابه‌جایی، بدون چشمک بی‌پایان             */
/* ------------------------------------------------------------------ */
const cssText = read('src/index.css');
assert(!/translateY\(-/.test(cssText), 'هیچ هاور یا حالتی عنصر را به بالا هل نمی‌دهد (بدون لرزش)');
assert(!cssText.includes('pulse-soft') && !/animation:[^;]*infinite/.test(cssText), 'هیچ انیمیشن چشمک بی‌پایان وجود ندارد');
assert(/hover[\s\S]{0,120}box-shadow: var\(--shadow-glow/.test(cssText), 'هاور با درخشش آرام (گلو) بیان می‌شود نه جابه‌جایی');

/* ------------------------------------------------------------------ */
/* ۱۰) نشان برند یکپارچه: یک منبع حقیقت و همه آیکون‌ها                  */
/* ------------------------------------------------------------------ */
for (const rel of [
  'public/icon.svg',
  'public/favicon.ico',
  'public/apple-touch-icon.png',
  'public/pwa-192x192.png',
  'public/pwa-512x512.png',
  'public/pwa-maskable-512.png',
]) {
  assert(fs.existsSync(path.join(ROOT, rel)), `وجود فایل آیکون ${rel}`);
}
assert(read('public/icon.svg').includes('M 162 108'), 'فاوآیکون برداری از همان هندسه برند ساخته شده');
assert(read('src/components/Header.tsx').includes('BrandMark'), 'سربرگ از نشان مشترک برند استفاده می‌کند');
assert(read('src/App.tsx').includes('BrandMark'), 'پابرگ از نشان مشترک برند استفاده می‌کند');
assert(
  /<link rel="icon"[^>]*icon\.svg/.test(read('index.html')) && /favicon\.ico/.test(read('index.html')),
  'هر دو نسخه SVG و ICO فاوآیکون وصل شده‌اند',
);

/* یکپارچگی رنگ نوار مرورگر بین HTML و manifest */
const htmlTheme = (read('index.html').match(/name="theme-color" content="(#[0-9a-fA-F]{6})"/) || [])[1];
const manifestTheme = (read('vite.config.ts').match(/theme_color: '(#[0-9a-fA-F]{6})'/) || [])[1];
assert(!!htmlTheme && htmlTheme === manifestTheme, `theme-color یکسان در HTML و manifest (${htmlTheme})`);

/* ------------------------------------------------------------------ */
/* ۱۱) صفحه‌کلید دقیق و دسترس‌پذیر                                      */
/* ------------------------------------------------------------------ */
const keysText = read('src/lib/keys.ts');
assert(keysText.includes('e.code'), 'تطبیق کلیدها با e.code (مستقل از چیدمان فارسی/انگلیسی)');
const globalKb = read('src/lib/use-global-shortcuts.ts');
assert(globalKb.includes('overlaysOpen') && globalKb.includes('isEditableTarget'), 'سکوت میان‌برها پشت لایه باز و داخل ورودی متنی');
assert(globalKb.includes('shortcutsOn'), 'میان‌برهای تک‌کلیدی با رضایت کاربر (WCAG 2.1.4)');
const practiceKb = read('src/labs/PracticeLab.tsx');
assert(practiceKb.includes('digitFromCode'), 'پرش عددی به اسلاید با نگاشت دقیق ۱ تا ۲۰');
assert(practiceKb.includes('isInteractiveTarget'), 'احترام به فعال‌شدن بومی دکمه فوکوس‌شده با Space');
assert(read('src/lib/app-context.tsx').includes('pref:shortcuts'), 'ذخیره ترجیح میان‌برها در localStorage');

/* ------------------------------------------------------------------ */
/* ۱۲) یکپارچگی واحد زمان تایمر (بدون عدد غول‌پیکر)                     */
/* ------------------------------------------------------------------ */
const practiceNow = read('src/labs/PracticeLab.tsx');
assert(!practiceNow.includes('* 1000'), 'هیچ مسیر ناوبری زمان را در ۱۰۰۰ ضرب نمی‌کند (واحد ثانیه یکسان است)');
assert(practiceNow.includes('totalSec') && !practiceNow.includes('totalMs'), 'نام متغیر زمان، واحد ثانیه را دقیق بیان می‌کند');
assert(practiceNow.includes('(دقیقه:ثانیه)'), 'واحد نمایش زمان برای کاربر شفاف است');

/* ------------------------------------------------------------------ */
/* ۱۳) اعمال واقعی تنظیمات تایپوگرافی (اندازه و فاصله سطر)            */
/* ------------------------------------------------------------------ */
const ctxNow = read('src/lib/app-context.tsx');
assert(/lineHeight,/.test(ctxNow) && /--reading-lh/.test(ctxNow), 'readingStyle هم اندازه و هم فاصله سطر را اعمال می‌کند');
for (const rel of ['src/labs/PracticeLab.tsx', 'src/labs/QALab.tsx', 'src/labs/CheatSheetLab.tsx']) {
  assert(read(rel).includes('var(--reading-lh)'), `متن خواندنی ${rel} از فاصله سطر تنظیمی کاربر پیروی می‌کند`);
}
assert(/font-size: 1\.0625em/.test(read('src/index.css')), 'کلاس reading با em بزرگ/کوچک می‌شود نه rem ثابت');

/* ------------------------------------------------------------------ */
/* ۱۴) لایه‌بندی درست CSS: قواعد سراسری بر ابزارهای Tailwind غلبه نکنند */
/* ------------------------------------------------------------------ */
/*
  ریشه مشکل فاصله‌گذاری سراسری (مثل بی‌اثر شدن mb-2 روی «تشریح نمادهای رابطه»):
  در Tailwind v4 همه ابزارها داخل @layer utilities تولید می‌شوند و هر قاعده
  بدون لایه طبق استاندارد Cascade Layers بر قواعد لایه‌دار غلبه می‌کند.
  پس p { margin: 0 } سراسری باید داخل @layer base بماند.
*/
const cssNow = read('src/index.css');
{
  const baseIdx = cssNow.indexOf('@layer base');
  assert(baseIdx > -1, 'قواعد پایه (عنصری) داخل @layer base ثبت شده‌اند');
  const pMargin = cssNow.search(/\np \{\s*\n\s*margin: 0;/);
  const baseEnd = cssNow.indexOf('پایان @layer base');
  assert(
    pMargin > baseIdx && baseEnd > pMargin,
    'قاعده p { margin: 0 } داخل @layer base است تا mb-* و mt-* روی پاراگراف‌ها اثر کنند',
  );
  assert(cssNow.includes('@layer components'), 'کلاس‌های مؤلفه‌ای داخل @layer components ثبت شده‌اند');
}

/* ------------------------------------------------------------------ */
/* ۱۵) خروجی PDF: دامنه‌دار، کامل و در دسترس از سربرگ                  */
/* ------------------------------------------------------------------ */
const printSheetNow = read('src/components/PrintSheet.tsx');
for (const scope of ["'all'", "'roadmap'", "'deck'", "'cheat'", "'qa'", "'checklist'"]) {
  assert(read('src/lib/app-context.tsx').includes(scope), `دامنه چاپی ${scope} در PrintScope تعریف شده است`);
}
assert(
  printSheetNow.includes('qaMain') &&
    printSheetNow.includes('qaHard') &&
    printSheetNow.includes('checklistGroups') &&
    printSheetNow.includes('missionPoints') &&
    printSheetNow.includes('planSlides'),
  'نسخه چاپی همه بخش‌های وب‌سایت (نقشه راه، اسلایدها، برگه تقلب، پرسش‌ها، چک‌لیست) را پوشش می‌دهد',
);
assert(read('src/components/Header.tsx').includes('PDF_OPTIONS'), 'منوی دانلود PDF در سربرگ در دسترس است');
assert(
  read('src/lib/use-global-shortcuts.ts').includes("k.shift ? 'all'"),
  'میان‌بر Alt + Shift + P خروجی PDF کل وب‌سایت را باز می‌کند',
);
assert(/ps-checklist li::before/.test(cssNow), 'چک‌لیست چاپی با مربع خالی برای تیک‌زدن روی کاغذ');
assert(/break-inside: avoid/.test(cssNow), 'بلوک‌های چاپی وسط صفحه نمی‌شکنند (PDF تمیز)');

/* ------------------------------------------------------------------ */
/* ۱۶) مقاومت واکنش‌گرایی: هرگز بیرون‌زدگی افقی یا شکست چیدمان نداشته باشیم */
/* ------------------------------------------------------------------ */
/*
  ریشه خرابی برگه تقلب در موبایل: گرید جدول‌های پشتیبان بدون ترک ستونی
  صریح (grid بدون grid-cols) بود؛ در پهنای کم، ترکِ auto تک‌ستونه بر اساس
  min-content پهناترین محتوا (ردیف برچسب‌های اندازه اثر با overflow-x:auto
  و آیتم‌های shrink-0) بزرگ می‌شد و کل گرید ~۱۱۰۰ پیکسل عریض می‌گرفت.
  قواعد تثبیت‌شده:
  ۱. هر گرید ترک صریح بگیرد (grid-cols-1 برای تک‌ستونه پایه).
  ۲. آیتم‌های گریدِ میزبان جدول/اسکرولر min-w-0 بگیرند.
  ۳. جدول‌ها داخل قاب لغزان .table-wrap باشند.
  ۴. برچسب‌های ترکیبی طولانی با .chip-wrap روی چند خط بنشینند.
  ۵. اسکرولرهای افقی محتوا (برخلاف ناوبری) نوار مرئی .hbar داشته باشند.
*/
const cssResp = read('src/index.css');
assert(
  /\.table-wrap\s*\{[^}]*overflow-x:\s*auto/s.test(cssResp),
  'قاب لغزان .table-wrap با overflow-x: auto برای جدول‌ها تعریف شده است',
);
assert(/\.chip-wrap\s*\{[^}]*white-space:\s*normal/s.test(cssResp), 'گونه .chip-wrap برای نشستن برچسب‌ها روی چند خط');
assert(/\.hbar\s*\{[^}]*overflow-x:\s*auto/s.test(cssResp), 'اسکرولر .hbar با نوار مرئی برای ردیف‌های لغزان');

const cheatLabResp = read('src/labs/CheatSheetLab.tsx');
assert(
  cheatLabResp.includes('grid grid-cols-1 gap-5 lg:grid-cols-2'),
  'گرید جدول‌های پشتیبان ترک تک‌ستونه صریح دارد (بدون ترک auto انفجاری)',
);
assert(
  (cheatLabResp.match(/card min-w-0 p-6/g) || []).length >= 2,
  'کارت‌های جدول‌های پشتیبان min-w-0 دارند تا از ترک گرید بیرون نزنند',
);
assert(
  (cheatLabResp.match(/className="table-wrap"/g) || []).length === 2,
  'هر دو جدول (نرخ موفقیت و تحلیل حذف) داخل قاب لغزان .table-wrap هستند',
);
assert(cheatLabResp.includes('chip chip-pine chip-wrap'), 'برچسب‌های پارامترها با chip-wrap در صفحه باریک می‌شکنند');
assert(
  cheatLabResp.includes('hbar flex min-w-0 gap-2') && !cheatLabResp.includes('no-hbar'),
  'ردیف اندازه اثر از اسکرولر مرئی .hbar استفاده می‌کند، نه اسکرولر پنهان',
);

const practiceLabResp = read('src/labs/PracticeLab.tsx');
assert(
  practiceLabResp.includes('grid grid-cols-1 gap-px bg-line sm:grid-cols-3'),
  'گرید سه نمایشگر زمان ترک تک‌ستونه صریح دارد',
);
assert(
  practiceLabResp.includes('hbar') && !practiceLabResp.includes('no-hbar'),
  'نوار لغزان اسلایدها از .hbar مرئی استفاده می‌کند',
);

for (const [rel, snippet] of [
  ['src/labs/QALab.tsx', 'grid grid-cols-1 gap-4 lg:grid-cols-2'],
  ['src/labs/ChecklistLab.tsx', 'grid grid-cols-1 gap-5 lg:grid-cols-2'],
  ['src/labs/ChecklistLab.tsx', 'grid grid-cols-1 gap-4 md:grid-cols-2'],
]) {
  assert(read(rel).includes(snippet), `گرید ${rel} ترک تک‌ستونه صریح دارد (${snippet})`);
}

const headerResp = read('src/components/Header.tsx');
assert(
  (headerResp.match(/max-w-\[calc\(100vw-2rem\)\]/g) || []).length === 2,
  'هر دو منوی کشویی سربرگ (PDF و تنظیمات) به عرض دید محدود شده‌اند',
);
assert(
  /relative flex shrink-0 items-center gap-1/.test(headerResp),
  'لنگر منوهای سربرگ روی گروه کنترل‌هاست تا از لبه دید بیرون نزنند',
);

/* دفاع خط آخر: ناحیه محتوا و پابرگ هرگز قاب را افقاً نمی‌لغزانند */
assert(/main\s*\{\s*overflow-x:\s*clip;/s.test(cssResp), 'خط دفاع overflow-x: clip روی ناحیه محتوای اصلی');

console.log(`--- نتیجه تست‌ها: ${passCount} قبول، ${failCount} خطا ---`);

if (failCount > 0) {
  console.error('برخی تست‌ها ناموفق بودند.');
  process.exit(1);
} else {
  console.log('همه تست‌ها با موفقیت پاس شدند.');
}

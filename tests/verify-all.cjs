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
const crypto = require('crypto');
const { execFileSync } = require('child_process');

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

function walk(dir, pred, base = dir) {
  const out = [];
  for (const name of fs.readdirSync(dir).sort()) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) out.push(...walk(p, pred, base));
    else if (pred(name, p)) out.push(p);
  }
  return out;
}

console.log('--- شروع تست‌های اعتبارسنجی ---');

/* ------------------------------------------------------------------ */
/* ۱) قواعد نگارش: بدون em dash و en dash                               */
/* ------------------------------------------------------------------ */
const textFiles = [
  'src/content.generated.ts',
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

/* content/ هم باید بدون dash باشد */
const contentFiles = walk(path.join(ROOT, 'content'), () => true).map((p) =>
  path.relative(ROOT, p),
);
for (const rel of contentFiles) {
  const content = read(rel);
  assert(
    !content.includes('\u2014') && !content.includes('\u2013'),
    `عدم وجود em dash و en dash در ${rel}`,
  );
}

/* ------------------------------------------------------------------ */
/* ۲) هیچ رقم یا حرف فارسی داخل عبارت‌های LaTeX نباشد                  */
/* ------------------------------------------------------------------ */
const persianChar = /[\u0600-\u06FF]/
const latexMacro = /\\[a-zA-Z]{2,}/;
let persianInLatex = [];

for (const rel of ['src/content.generated.ts']) {
  const content = norm(read(rel));
  // Match TS double-quoted strings without full JSON unescape (LaTeX has many backslashes)
  const strings = content.match(/"(?:\\.|[^"\\])*"/g) || [];
  for (const s of strings) {
    const value = s.slice(1, -1);
    const isLatex = latexMacro.test(value) || /\\[{}]/.test(value) || /\\bigl|\\mathrm|\\begin\{/.test(value);
    if (isLatex && persianChar.test(value)) {
      persianInLatex.push(`${rel}: ${value.slice(0, 70)}`);
    }
  }
}
assert(persianInLatex.length === 0, 'عدم وجود حروف یا ارقام فارسی داخل عبارت‌های LaTeX');

/* ------------------------------------------------------------------ */
/* ۳) روابط ریاضی اصیل                                                  */
/* ------------------------------------------------------------------ */
const genNorm = norm(read('src/content.generated.ts'));

const arrowCount = (genNorm.match(/\\overrightarrow\{d\(\\theta_\{i\}\^\{t\}\)\}/g) || []).length;
assert(arrowCount >= 1, 'وجود رابطه موقعیت با پیکان روی کل گروه d(θ)');
assert(
  genNorm.includes('\\overrightarrow{d(\\theta_{i}^{t})}'),
  'وجود رابطه اصلی در اسلاید روش با پیکان روی کل گروه d(θ)',
);
assert(
  /\\kappa\\,\\bigl\(X_g\^t-X_i\^t\\bigr\)/.test(genNorm),
  'وجود جمله اجتماعی با ضریب کاپا در رابطه اصلی',
);
assert(
  /\\theta_i\^\{?t\+1\}?=\\theta_i\^t.*\\sigma_i\^t/.test(genNorm),
  'وجود رابطه اصلاح زاویه با سیگمای تطبیقی',
);
assert(
  /\\sigma_i\^t=\\xi_i\^t\\,?\\exp\\bigl\(-t\/T\\bigr\)/.test(genNorm),
  'وجود رابطه اختلال تطبیقی نمایی (سیگما برابر کسی نمایی کاهنده)',
);

/* ------------------------------------------------------------------ */
/* ۴) ساختار اسلایدها: همه اسلایدها، بدون optional، جمع مدت از content   */
/* ------------------------------------------------------------------ */
const genText = read('src/content.generated.ts');
const durations = [...genText.matchAll(/duration: (\d+)/g)].map((m) => Number(m[1]));
assert(durations.length >= 1, `وجود حداقل یک اسلاید (یافت‌شده: ${durations.length})`);
assert(!/optional:\s*true/.test(genText), 'هیچ اسلاید optional در خروجی تولیدشده نیست');
assert(!read('src/labs/PracticeLab.tsx').includes('optionalSlide'), 'PracticeLab دیگر مسیر اسلاید اختیاری ندارد');
assert(!read('src/components/ShortcutGuide.tsx').includes('اسلاید اختیاری'), 'راهنمای کلیدها دیگر O اختیاری ندارد');

const talkSum = durations.reduce((a, b) => a + b, 0);
const talkMeta = Number((genText.match(/talkTotalSec: (\d+)/) || [])[1]);
assert(talkSum === talkMeta, `جمع duration اسلایدها با talkTotalSec یکی است (${talkSum})`);
assert(talkSum === 1155, `مجموع زمان گفتار بسته BCOA برابر ۱۹:۱۵ است (یافت‌شده: ${talkSum} ثانیه)`);
assert(!durations.some((d) => d <= 0), 'همه زمان‌ها مثبت و معتبر هستند');

/* estimatedTime انگلیسی در هر فایل اسلاید */
const deckMd = walk(path.join(ROOT, 'content', 'deck'), (n) => n.endsWith('.md'));
assert(deckMd.length === durations.length, `تعداد فایل‌های deck با اسلایدهای تولیدشده یکی است (${deckMd.length})`);
for (const p of deckMd) {
  const t = fs.readFileSync(p, 'utf8');
  assert(/durationSec:\s*\d+/.test(t), `durationSec در ${path.basename(p)}`);
  assert(/estimatedTime:\s*".+"/.test(t), `estimatedTime انگلیسی در ${path.basename(p)}`);
}

assert(/export const chapters/.test(genText), 'وجود فهرست رسمی بخش‌ها در خروجی');
assert(/id: "ch[1-8]"/.test(genText) || /id: 'ch[1-8]'/.test(genText), 'بخش‌های ۰۱ تا ۰۸ در فهرست رسمی');

/* ------------------------------------------------------------------ */
/* ۴ب) تازگی content.generated نسبت به content/                         */
/* ------------------------------------------------------------------ */
function contentHash() {
  const h = crypto.createHash('sha256');
  const files = walk(path.join(ROOT, 'content'), () => true).sort();
  for (const f of files) {
    h.update(path.relative(path.join(ROOT, 'content'), f));
    h.update('\0');
    h.update(fs.readFileSync(f));
    h.update('\0');
  }
  return h.digest('hex').slice(0, 16);
}
const expectedHash = contentHash();
const embeddedHash = (genText.match(/CONTENT_HASH = "([a-f0-9]+)"/) || [])[1];
assert(embeddedHash === expectedHash, `hash محتوای تولیدشده تازه است (${embeddedHash})`);

/* ------------------------------------------------------------------ */
/* ۵) آفلاین کامل                                                       */
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
  'src/lib/audio.ts',
  'src/lib/palettes.ts',
  ...textFiles.filter((rel) => rel !== 'README.md' && rel !== 'src/content.generated.ts'),
];
let externalFound = [];
for (const rel of allSources) {
  if (!fs.existsSync(path.join(ROOT, rel))) continue;
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
assert(
  fs.existsSync(path.join(ROOT, 'wrangler.jsonc')) &&
    read('wrangler.jsonc').includes('"directory": "./dist"'),
  'پیکربندی استقرار Cloudflare (wrangler.jsonc) پوشه خروجی ./dist را معرفی می‌کند',
);

/* ------------------------------------------------------------------ */
/* ۶) پرهیز از موتورهای رندر قدیمی                                      */
/* ------------------------------------------------------------------ */
const combined = textFiles.join('\n') + read('src/main.tsx');
assert(!combined.includes('react-latex-next'), 'عدم استفاده از react-latex-next');
assert(!/from 'motion\/react'/.test(combined), 'عدم استفاده از motion/react');
assert(!combined.includes('content.ts'), 'عدم ارجاع به فایل حذف‌شده content.ts');

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
assert(
  /toggleRun|running|startStop/.test(practiceText) || practiceText.includes('pause'),
  'وجود کنترل شروع و توقف (هم‌زمان) در جلسه تمرینی',
);

/* ------------------------------------------------------------------ */
/* ۸) محتوا، حاشیه امن، هدف پایان، صدا، پالت                           */
/* ------------------------------------------------------------------ */
const qaText = read('src/content.generated.ts');
assert(qaText.includes('ویلکاکسون') && qaText.includes('فریدمن'), 'وجود توضیح آزمون‌های ویلکاکسون و فریدمن');
assert(qaText.includes('نموینی'), 'وجود توضیح آزمون نموینی');
const sessionNow = read('src/lib/session.ts');
assert(
  /SAFETY_BUFFER/.test(sessionNow) && /finishFromSec|practiceWindow/.test(sessionNow),
  'وجود منطق حاشیه امن و بازه هدف پایان از meta',
);
assert(genText.includes('finishFromSec') && genText.includes('finishToSec'), 'meta شامل بازه هدف پایان است');

const printCss = read('src/index.css') + '\n' + read('src/components/PrintSheet.tsx');
assert(/@media print/.test(printCss), 'سبک چاپی برای نسخه کاغذی برگه تقلب');

const audioText = read('src/lib/audio.ts');
assert(
  audioText.includes('CUE_THRESHOLDS') && audioText.includes('cueRemaining') && audioText.includes('playTestCue'),
  'موتور صدای مشترک با آستانه‌های ۱۰/۵/۰ و آزمایش صدا',
);
assert(practiceText.includes('cueRemaining') && practiceText.includes('playThresholdCue'), 'PracticeLab از موتور صدا در حلقه تایمر استفاده می‌کند');
assert(!/ناوبری سریع:/.test(practiceText), 'پیام آموزشی دائمی ناوبری سریع حذف شده است');
assert(practiceText.includes('hl-block'), 'هایلایت بلوکی پاراگراف در جلسه تمرینی');

const palettes = read('src/lib/palettes.ts');
for (const id of ['green', 'blue', 'orange', 'purple', 'red']) {
  assert(palettes.includes(`id: '${id}'`) || palettes.includes(`"${id}"`), `پالت ${id} تعریف شده است`);
  assert(read('src/index.css').includes(`[data-theme="${id}"]`), `بلاک CSS data-theme=${id}`);
}
assert(read('src/lib/app-context.tsx').includes('pref:palette'), 'ذخیره پالت در localStorage');
assert(read('src/components/Header.tsx').includes('PALETTES'), 'انتخاب‌گر پالت در تنظیمات');
assert(
  read('src/components/BrandMark.tsx').includes('APP_ICON.bg') &&
    !read('src/components/BrandMark.tsx').includes('--color-accent'),
  'لوگو داخل برنامه ثابت است و با پالت تغییر رنگ نمی‌کند (D13)',
);
assert(
  !read('src/lib/palettes.ts').includes('data-dynamic-favicon') &&
    !read('src/lib/palettes.ts').includes('applyFavicon'),
  'فاوآیکون پویای وابسته به پالت حذف شده است؛ لوگو در همه‌جا ثابت است',
);
assert(read('src/lib/brand.mjs').includes('function brandSvg') || read('src/lib/brand.mjs').includes('export function brandSvg'), 'brandSvg در brand.mjs برای سازنده آیکون موجود است');

assert(read('src/components/Header.tsx').includes('playTestCue'), 'دکمه آزمایش صدا در تنظیمات');

/* ------------------------------------------------------------------ */
/* ۹) پایداری بصری                                                      */
/* ------------------------------------------------------------------ */
const cssText = read('src/index.css');
assert(!/translateY\(-/.test(cssText), 'هیچ هاور یا حالتی عنصر را به بالا هل نمی‌دهد (بدون لرزش)');
assert(!cssText.includes('pulse-soft') && !/animation:[^;]*infinite/.test(cssText), 'هیچ انیمیشن چشمک بی‌پایان وجود ندارد');
assert(/hover[\s\S]{0,120}box-shadow: var\(--shadow-glow/.test(cssText), 'هاور با عمق ملایم و خنثی بیان می‌شود نه جابه‌جایی');
assert(/\.hl-block\s*\{/.test(cssText), 'کلاس hl-block برای هایلایت پاراگراف تعریف شده است');

/* مقیاس گوشه‌ها: کمی گرد، یکپارچه و در هیچ حالتی عوض نمی‌شوند */
assert(cssText.includes('--r-control: 8px'), 'مقیاس گوشه‌های کمی‌گرد (8/10/14/12) در ریشه تعریف شده است');
assert(/\.btn\s*\{[^}]*border-radius: var\(--r-control\)/s.test(cssText), 'دکمه‌ها از گوشه‌ی کمی‌گرد ثابت استفاده می‌کنند');
{
  let stateRadius = [];
  const stateRuleRe = /:(?:hover|active|focus(?:-visible)?)\s*\{([^}]*)\}/g;
  let sm;
  while ((sm = stateRuleRe.exec(cssText)) !== null) {
    if (sm[1].includes('border-radius')) stateRadius.push(sm[0].slice(0, 48).replace(/\s+/g, ' '));
  }
  assert(
    stateRadius.length === 0,
    `هیچ قاعده‌ی حالتی (hover/active/focus) radius عوض نمی‌کند (${stateRadius.join(' | ') || 'صفر مورد'})`,
  );
}

/* ------------------------------------------------------------------ */
/* ۱۰) نشان برند یکپارچه                                                */
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
const brandMjsNow = read('src/lib/brand.mjs');
assert(brandMjsNow.includes('APP_ICON'), 'پالت ثابت و سراسری آیکون نصب (APP_ICON) در brand.mjs تعریف شده است');
assert(brandMjsNow.includes('#c9a14b') && brandMjsNow.includes('#000000'), 'لوگو ثابت: سپر طلایی روی پس‌زمینه مشکی');
assert(
  read('public/icon.svg').includes('#c9a14b') && read('public/icon.svg').includes('#000000'),
  'آیکون سراسری (سپر طلایی + مشکی) در همه نسخه‌ها یکسان و مستقل از پالت است',
);
assert(read('scripts/build-brand.mjs').includes('APP_ICON'), 'سازنده آیکون از پالت ثابت APP_ICON استفاده می‌کند');
assert(read('src/components/Header.tsx').includes('BrandMark'), 'سربرگ از نشان مشترک برند استفاده می‌کند');
assert(read('src/App.tsx').includes('BrandMark'), 'پابرگ از نشان مشترک برند استفاده می‌کند');
assert(
  /<link rel="icon"[^>]*icon\.svg/.test(read('index.html')) && /favicon\.ico/.test(read('index.html')),
  'هر دو نسخه SVG و ICO فاوآیکون وصل شده‌اند',
);

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
assert(practiceKb.includes('digitFromCode'), 'پرش عددی به اسلاید با نگاشت دقیق بر پایه شماره در چیدمان فعال');
assert(practiceKb.includes('isInteractiveTarget'), 'احترام به فعال‌شدن بومی دکمه فوکوس‌شده با Space');
assert(read('src/lib/app-context.tsx').includes('pref:shortcuts'), 'ذخیره ترجیح میان‌برها در localStorage');
assert(!practiceKb.includes("KeyO"), 'میان‌بر O برای اسلاید اختیاری حذف شده است');

/* ------------------------------------------------------------------ */
/* ۱۲) یکپارچگی واحد زمان تایمر                                         */
/* ------------------------------------------------------------------ */
const practiceNow = read('src/labs/PracticeLab.tsx');
assert(!practiceNow.includes('* 1000'), 'هیچ مسیر ناوبری زمان را در ۱۰۰۰ ضرب نمی‌کند (واحد ثانیه یکسان است)');
assert(practiceNow.includes('totalSec') && !practiceNow.includes('totalMs'), 'نام متغیر زمان، واحد ثانیه را دقیق بیان می‌کند');
assert(practiceNow.includes('(ثانیه:دقیقه)'), 'واحد نمایش زمان برای کاربر شفاف است (ثانیه سمت راست ساعت است)');

/* ------------------------------------------------------------------ */
/* ۱۳) اعمال واقعی تنظیمات تایپوگرافی                                   */
/* ------------------------------------------------------------------ */
const ctxNow = read('src/lib/app-context.tsx');
assert(/lineHeight,/.test(ctxNow) && /--reading-lh/.test(ctxNow), 'readingStyle هم اندازه و هم فاصله سطر را اعمال می‌کند');
for (const rel of ['src/labs/PracticeLab.tsx', 'src/labs/QALab.tsx', 'src/labs/CheatSheetLab.tsx']) {
  assert(read(rel).includes('var(--reading-lh)'), `متن خواندنی ${rel} از فاصله سطر تنظیمی کاربر پیروی می‌کند`);
}
assert(/font-size: 1\.0625em/.test(read('src/index.css')), 'کلاس reading با em بزرگ/کوچک می‌شود نه rem ثابت');

/* ------------------------------------------------------------------ */
/* ۱۴) لایه‌بندی درست CSS                                               */
/* ------------------------------------------------------------------ */
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
/* ۱۵) خروجی PDF                                                        */
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
assert(!printSheetNow.includes('اسلایدهای اختیاری'), 'چاپ دیگر بخش اسلاید اختیاری ندارد');
assert(read('src/components/Header.tsx').includes('PDF_OPTIONS'), 'منوی دانلود PDF در سربرگ در دسترس است');
assert(
  read('src/lib/use-global-shortcuts.ts').includes("k.shift ? 'all'"),
  'میان‌بر Alt + Shift + P خروجی PDF کل وب‌سایت را باز می‌کند',
);
assert(/ps-checklist li::before/.test(cssNow), 'چک‌لیست چاپی با مربع خالی برای تیک‌زدن روی کاغذ');
assert(/break-inside: avoid/.test(cssNow), 'بلوک‌های چاپی وسط صفحه نمی‌شکنند (PDF تمیز)');

/* ------------------------------------------------------------------ */
/* ۱۶) مقاومت واکنش‌گرایی                                               */
/* ------------------------------------------------------------------ */
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
assert(
  headerResp.includes('tab-nav') && headerResp.includes('tab-pill'),
  'ناوبری تب‌ها با کلاس‌های tab-nav و tab-pill یکپارچه شده است',
);
assert(/\.tab-pill/.test(cssResp) && /\.lab-pane/.test(cssResp), 'استایل ناوبری تب و ورود نرم صفحه تعریف شده است');

assert(/main\s*\{\s*overflow-x:\s*clip;/s.test(cssResp), 'خط دفاع overflow-x: clip روی ناحیه محتوای اصلی');

assert(
  /\.table-wrap\s*\{[^}]*border:\s*1px solid var\(--color-line\)/s.test(cssResp),
  'قاب کامل جدول (شامل خط پایانی سطر آخر) توسط .table-wrap کشیده می‌شود',
);
assert(
  cssResp.includes('.table-wrap .mini-table > thead > tr > *') &&
    cssResp.includes('.table-wrap .mini-table tr > *:first-child') &&
    cssResp.includes('.table-wrap .mini-table tr > *:last-child'),
  'خطوط لبه بیرونی سلول‌ها داخل قاب برداشته شده‌اند تا قاب دوبله نشود',
);

/* ------------------------------------------------------------------ */
/* ۱۷) خط لوله محتوا و AGENTS.md                                        */
/* ------------------------------------------------------------------ */
assert(fs.existsSync(path.join(ROOT, 'scripts/compile-content.mjs')), 'اسکریپت compile-content موجود است');
assert(fs.existsSync(path.join(ROOT, 'content/meta.yaml')), 'content/meta.yaml موجود است');
assert(fs.existsSync(path.join(ROOT, 'content/README.md')), 'راهنمای content/README.md موجود است');
assert(read('package.json').includes('"content"'), 'اسکریپت npm run content تعریف شده است');
assert(read('AGENTS.md').includes('content/'), 'AGENTS.md ساختار content/ را مستند کرده است');
assert(read('AGENTS.md').includes('pref:palette'), 'AGENTS.md پالت رنگ را مستند کرده است');
assert(read('README.md').includes('content/'), 'README ساختار محتوا را توضیح می‌دهد');

console.log(`--- نتیجه تست‌ها: ${passCount} قبول، ${failCount} خطا ---`);

if (failCount > 0) {
  console.error('برخی تست‌ها ناموفق بودند.');
  process.exit(1);
} else {
  console.log('همه تست‌ها با موفقیت پاس شدند.');
}

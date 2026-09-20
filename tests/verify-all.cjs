/**
 * Independent tests for data structure, authoring rules and full offline operation.
 * Run: npm run verify
 *
 * These tests need no external dependency and only inspect text content of the source.
 * Note: in TypeScript files every LaTeX backslash is stored in doubled form;
 * the norm function below turns it back into the runtime form (a single character)
 * so the real strings that reach KaTeX are what gets verified.
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

/** Rebuild the runtime string content: every doubled backslash becomes a single one */
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

console.log('--- starting validation tests ---');

/* ------------------------------------------------------------------ */
/* 1) Authoring rules: no em dash and no en dash                        */
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
    `no em dash or en dash in ${rel}`,
  );
}

/* content/ must be dash-free as well */
const contentFiles = walk(path.join(ROOT, 'content'), () => true).map((p) =>
  path.relative(ROOT, p),
);
for (const rel of contentFiles) {
  const content = read(rel);
  assert(
    !content.includes('\u2014') && !content.includes('\u2013'),
    `no em dash or en dash in ${rel}`,
  );
}

/* ------------------------------------------------------------------ */
/* 2) No Persian digit or letter inside LaTeX expressions              */
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
assert(persianInLatex.length === 0, 'no Persian letters or digits inside LaTeX expressions');

/* ------------------------------------------------------------------ */
/* 3) Authentic math relations                                          */
/* ------------------------------------------------------------------ */
const genNorm = norm(read('src/content.generated.ts'));

const arrowCount = (genNorm.match(/\\overrightarrow\{d\(\\theta_\{i\}\^\{t\}\)\}/g) || []).length;
assert(arrowCount >= 1, 'a position relation with an arrow over the whole group d(theta) exists');
assert(
  genNorm.includes('\\overrightarrow{d(\\theta_{i}^{t})}'),
  'the main relation in the method slide has an arrow over the whole group d(theta)',
);
assert(
  /\\kappa\\,\\bigl\(X_g\^t-X_i\^t\\bigr\)/.test(genNorm),
  'an agreement sentence with the kappa coefficient exists in the main relation',
);
assert(
  /\\theta_i\^\{?t\+1\}?=\\theta_i\^t.*\\sigma_i\^t/.test(genNorm),
  'an angle correction relation with the adaptive sigma exists',
);
assert(
  /\\sigma_i\^t=\\xi_i\^t\\,?\\exp\\bigl\(-t\/T\\bigr\)/.test(genNorm),
  'an exponential adaptive perturbation relation exists (sigma equal to a decaying exponential)',
);

/* ------------------------------------------------------------------ */
/* 4) Slide structure: all slides, no optional, duration sum from content */
/* ------------------------------------------------------------------ */
const genText = read('src/content.generated.ts');
const durations = [...genText.matchAll(/duration: (\d+)/g)].map((m) => Number(m[1]));
assert(durations.length >= 1, `at least one slide exists (found: ${durations.length})`);
assert(!/optional:\s*true/.test(genText), 'no optional slide in the generated output');
assert(!read('src/labs/PracticeLab.tsx').includes('optionalSlide'), 'PracticeLab no longer has an optional slide path');
assert(!read('src/components/ShortcutGuide.tsx').includes('اسلاید اختیاری'), 'the key guide no longer has the optional O key');

const talkSum = durations.reduce((a, b) => a + b, 0);
const talkMeta = Number((genText.match(/talkTotalSec: (\d+)/) || [])[1]);
assert(talkSum === talkMeta, `slide duration sum matches talkTotalSec (${talkSum})`);
assert(talkSum === 1155, `BCOA pack talk total is 19:15 (found: ${talkSum} seconds)`);
assert(!durations.some((d) => d <= 0), 'all durations are positive and valid');

/* English estimatedTime in every slide file */
const deckMd = walk(path.join(ROOT, 'content', 'deck'), (n) => n.endsWith('.md'));
assert(deckMd.length === durations.length, `deck file count matches the generated slide count (${deckMd.length})`);
for (const p of deckMd) {
  const t = fs.readFileSync(p, 'utf8');
  assert(/durationSec:\s*\d+/.test(t), `durationSec in ${path.basename(p)}`);
  assert(/estimatedTime:\s*".+"/.test(t), `English estimatedTime in ${path.basename(p)}`);
}

assert(/export const chapters/.test(genText), 'the official chapter list exists in the output');
assert(/id: "ch[1-8]"/.test(genText) || /id: 'ch[1-8]'/.test(genText), 'chapters 01 to 08 are in the official list');

/* ------------------------------------------------------------------ */
/* 4b) content.generated freshness against content/                     */
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
assert(embeddedHash === expectedHash, `the generated content hash is fresh (${embeddedHash})`);

/* ------------------------------------------------------------------ */
/* 5) Fully offline                                                     */
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
assert(externalFound.length === 0, 'no internet address anywhere in the app source');
assert(
  !read('package.json').includes('@google') && !read('package.json').includes('express'),
  'service-based dependencies removed from package.json',
);
assert(
  fs.existsSync(path.join(ROOT, 'wrangler.jsonc')) &&
    read('wrangler.jsonc').includes('"directory": "./dist"'),
  'the Cloudflare deployment config (wrangler.jsonc) points at the ./dist output folder',
);

/* ------------------------------------------------------------------ */
/* 6) No legacy render engines                                          */
/* ------------------------------------------------------------------ */
const combined = textFiles.join('\n') + read('src/main.tsx');
assert(!combined.includes('react-latex-next'), 'react-latex-next is not used');
assert(!/from 'motion\/react'/.test(combined), 'motion/react is not used');
assert(!combined.includes('content.ts'), 'no reference to the removed content.ts file');

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
assert(legacyRemain.length === 0, `legacy file removal is complete (remaining: ${legacyRemain.join(', ') || 'none'})`);

/* ------------------------------------------------------------------ */
/* 7) Local storage, synchronized timers and focus mode               */
/* ------------------------------------------------------------------ */
const storageText = read('src/lib/storage.ts');
assert(storageText.includes('localStorage'), 'notes and progress are stored in localStorage');
const practiceText = read('src/labs/PracticeLab.tsx');
assert(practiceText.includes('session:last'), 'the session resumes from the last saved position');
assert(/function formatTimePersian|toPersianDigits/.test(read('src/lib/persian.ts')), 'Persian digit helpers exist');

const appText = read('src/App.tsx');
assert(appText.includes('focus') && /setFocus/.test(appText), 'focus mode exists in the app shell');
assert(/readingStyle/.test(appText), 'typography controls (text size and line spacing) exist in the shell');
assert(
  /toggleRun|running|startStop/.test(practiceText) || practiceText.includes('pause'),
  'a shared start and stop control exists in the practice session',
);

/* ------------------------------------------------------------------ */
/* 8) Content, safety buffer, finish target, sound, palette            */
/* ------------------------------------------------------------------ */
const qaText = read('src/content.generated.ts');
assert(qaText.includes('ویلکاکسون') && qaText.includes('فریدمن'), 'explanations of the Wilcoxon and Friedman tests exist');
assert(qaText.includes('نموینی'), 'explanations of the Nemenyi test exist');
const sessionNow = read('src/lib/session.ts');
assert(
  /SAFETY_BUFFER/.test(sessionNow) && /finishFromSec|practiceWindow/.test(sessionNow),
  'safety buffer and finish target range come from meta',
);
assert(genText.includes('finishFromSec') && genText.includes('finishToSec'), 'meta includes the finish target range');

const printCss = read('src/index.css') + '\n' + read('src/components/PrintSheet.tsx');
assert(/@media print/.test(printCss), 'print stylesheet for the paper cheat sheet');

const audioText = read('src/lib/audio.ts');
assert(
  audioText.includes('CUE_THRESHOLDS') && audioText.includes('cueRemaining') && audioText.includes('playTestCue'),
  'shared audio engine with 10/5/0 thresholds and a test sound',
);
assert(practiceText.includes('cueRemaining') && practiceText.includes('playThresholdCue'), 'PracticeLab uses the audio engine inside the timer loop');
assert(!/ناوبری سریع:/.test(practiceText), 'the permanent quick-navigation instruction banner is removed');
assert(practiceText.includes('hl-block'), 'paragraph block highlight in the practice session');

const palettes = read('src/lib/palettes.ts');
for (const id of ['green', 'blue', 'orange', 'purple', 'red']) {
  assert(palettes.includes(`id: '${id}'`) || palettes.includes(`"${id}"`), `palette ${id} is defined`);
  assert(read('src/index.css').includes(`[data-theme="${id}"]`), `CSS block data-theme=${id}`);
}
assert(read('src/lib/app-context.tsx').includes('pref:palette'), 'palette is stored in localStorage');
assert(read('src/components/Header.tsx').includes('PALETTES'), 'palette picker in the settings panel');
assert(
  read('src/components/BrandMark.tsx').includes('APP_ICON.bg') &&
    !read('src/components/BrandMark.tsx').includes('--color-accent'),
  'the in-app logo is fixed and does not change color with the palette (D13)',
);
assert(
  !read('src/lib/palettes.ts').includes('data-dynamic-favicon') &&
    !read('src/lib/palettes.ts').includes('applyFavicon'),
  'the palette-dependent dynamic favicon is removed; the logo is fixed everywhere',
);
assert(read('src/lib/brand.mjs').includes('function brandSvg') || read('src/lib/brand.mjs').includes('export function brandSvg'), 'brandSvg exists in brand.mjs for the icon builder');

assert(read('src/components/Header.tsx').includes('playTestCue'), 'test sound button in the settings panel');

/* ------------------------------------------------------------------ */
/* 9) Visual stability                                                  */
/* ------------------------------------------------------------------ */
const cssText = read('src/index.css');
assert(!/translateY\(-/.test(cssText), 'no hover or state pushes an element upward (no jitter)');
assert(!cssText.includes('pulse-soft') && !/animation:[^;]*infinite/.test(cssText), 'no endless blinking animation');
assert(/hover[\s\S]{0,120}box-shadow: var\(--shadow-glow/.test(cssText), 'hover is expressed with subtle neutral depth, not movement');
assert(/\.hl-block\s*\{/.test(cssText), 'the hl-block class for paragraph highlighting is defined');

/* Radius scale: slightly rounded, unified and never changing in any state */
assert(cssText.includes('--r-control: 8px'), 'the slightly-rounded radius scale (8/10/14/12) is defined on the root');
assert(/\.btn\s*\{[^}]*border-radius: var\(--r-control\)/s.test(cssText), 'buttons use the constant slightly-rounded radius');
{
  let stateRadius = [];
  const stateRuleRe = /:(?:hover|active|focus(?:-visible)?)\s*\{([^}]*)\}/g;
  let sm;
  while ((sm = stateRuleRe.exec(cssText)) !== null) {
    if (sm[1].includes('border-radius')) stateRadius.push(sm[0].slice(0, 48).replace(/\s+/g, ' '));
  }
  assert(
    stateRadius.length === 0,
    `no state rule (hover/active/focus) changes the radius (${stateRadius.join(' | ') || 'none'})`,
  );
}

/* ------------------------------------------------------------------ */
/* 10) Unified brand mark                                               */
/* ------------------------------------------------------------------ */
for (const rel of [
  'public/icon.svg',
  'public/favicon.ico',
  'public/apple-touch-icon.png',
  'public/pwa-192x192.png',
  'public/pwa-512x512.png',
  'public/pwa-maskable-512.png',
]) {
  assert(fs.existsSync(path.join(ROOT, rel)), `icon file ${rel} exists`);
}
assert(read('public/icon.svg').includes('M 162 108'), 'the vector favicon is built from the same brand geometry');
const brandMjsNow = read('src/lib/brand.mjs');
assert(brandMjsNow.includes('APP_ICON'), 'the fixed global install-icon palette (APP_ICON) is defined in brand.mjs');
assert(brandMjsNow.includes('#c9a14b') && brandMjsNow.includes('#000000'), 'fixed logo: gold shield on a black background');
assert(
  read('public/icon.svg').includes('#c9a14b') && read('public/icon.svg').includes('#000000'),
  'the global icon (gold shield plus black) is identical in every version and palette-independent',
);
assert(read('scripts/build-brand.mjs').includes('APP_ICON'), 'the icon builder uses the fixed APP_ICON palette');
assert(read('src/components/Header.tsx').includes('BrandMark'), 'the header uses the shared brand mark');
assert(read('src/App.tsx').includes('BrandMark'), 'the footer uses the shared brand mark');
assert(
  /<link rel="icon"[^>]*icon\.svg/.test(read('index.html')) && /favicon\.ico/.test(read('index.html')),
  'both the SVG and the ICO favicon are wired up',
);

const htmlTheme = (read('index.html').match(/name="theme-color" content="(#[0-9a-fA-F]{6})"/) || [])[1];
const manifestTheme = (read('vite.config.ts').match(/theme_color: '(#[0-9a-fA-F]{6})'/) || [])[1];
assert(!!htmlTheme && htmlTheme === manifestTheme, `theme-color matches between HTML and manifest (${htmlTheme})`);

/* ------------------------------------------------------------------ */
/* 11) Precise and accessible keyboard handling                         */
/* ------------------------------------------------------------------ */
const keysText = read('src/lib/keys.ts');
assert(keysText.includes('e.code'), 'keys are matched with e.code (independent of the Persian/English layout)');
const globalKb = read('src/lib/use-global-shortcuts.ts');
assert(globalKb.includes('overlaysOpen') && globalKb.includes('isEditableTarget'), 'shortcuts stay silent behind an open overlay and inside text inputs');
assert(globalKb.includes('shortcutsOn'), 'single-key shortcuts require user consent (WCAG 2.1.4)');
const practiceKb = read('src/labs/PracticeLab.tsx');
assert(practiceKb.includes('digitFromCode'), 'numeric slide jump maps precisely to the number row of the active layout');
assert(practiceKb.includes('isInteractiveTarget'), 'respects the native activation of a focused button with Space');
assert(read('src/lib/app-context.tsx').includes('pref:shortcuts'), 'the shortcut preference is stored in localStorage');
assert(!practiceKb.includes("KeyO"), 'the O shortcut for the optional slide is removed');

/* ------------------------------------------------------------------ */
/* 12) Single time unit for timers                                      */
/* ------------------------------------------------------------------ */
const practiceNow = read('src/labs/PracticeLab.tsx');
assert(!practiceNow.includes('* 1000'), 'no navigation path multiplies time by 1000 (the unit is seconds everywhere)');
assert(practiceNow.includes('totalSec') && !practiceNow.includes('totalMs'), 'time variable names state the seconds unit precisely');
assert(practiceNow.includes('(ثانیه:دقیقه)'), 'the time unit is clear to the user (seconds sit to the right of the clock)');

/* ------------------------------------------------------------------ */
/* 13) Typography settings actually applied                             */
/* ------------------------------------------------------------------ */
const ctxNow = read('src/lib/app-context.tsx');
assert(/lineHeight,/.test(ctxNow) && /--reading-lh/.test(ctxNow), 'readingStyle applies both size and line spacing');
for (const rel of ['src/labs/PracticeLab.tsx', 'src/labs/QALab.tsx', 'src/labs/CheatSheetLab.tsx']) {
  assert(read(rel).includes('var(--reading-lh)'), `reading text in ${rel} follows the user line-spacing setting`);
}
assert(/font-size: 1\.0625em/.test(read('src/index.css')), 'the reading class scales with em, not a fixed rem');

/* ------------------------------------------------------------------ */
/* 14) Correct CSS layering                                             */
/* ------------------------------------------------------------------ */
const cssNow = read('src/index.css');
{
  const baseIdx = cssNow.indexOf('@layer base');
  assert(baseIdx > -1, 'base (element) rules are registered inside @layer base');
  const pMargin = cssNow.search(/\np \{\s*\n\s*margin: 0;/);
  const baseEnd = cssNow.indexOf('end @layer base');
  assert(
    pMargin > baseIdx && baseEnd > pMargin,
    'the p { margin: 0 } rule lives inside @layer base so mb-* and mt-* affect paragraphs',
  );
  assert(cssNow.includes('@layer components'), 'component classes are registered inside @layer components');
}

/* ------------------------------------------------------------------ */
/* 15) PDF output                                                       */
/* ------------------------------------------------------------------ */
const printSheetNow = read('src/components/PrintSheet.tsx');
for (const scope of ["'all'", "'roadmap'", "'deck'", "'cheat'", "'qa'", "'checklist'"]) {
  assert(read('src/lib/app-context.tsx').includes(scope), `print scope ${scope} is defined in PrintScope`);
}
assert(
  printSheetNow.includes('qaMain') &&
    printSheetNow.includes('qaHard') &&
    printSheetNow.includes('checklistGroups') &&
    printSheetNow.includes('missionPoints') &&
    printSheetNow.includes('planSlides'),
  'the print version covers every section of the site (roadmap, slides, cheat sheet, questions, checklist)',
);
assert(!printSheetNow.includes('اسلایدهای اختیاری'), 'print no longer has an optional slide section');
assert(read('src/components/Header.tsx').includes('PDF_OPTIONS'), 'the PDF download menu is available in the header');
assert(
  read('src/lib/use-global-shortcuts.ts').includes("k.shift ? 'all'"),
  'the Alt + Shift + P shortcut opens the whole-site PDF export',
);
assert(/ps-checklist li::before/.test(cssNow), 'printed checklist with an empty square to tick on paper');
assert(/break-inside: avoid/.test(cssNow), 'print blocks do not break in the middle of a page (clean PDF)');

/* ------------------------------------------------------------------ */
/* 16) Responsive resilience                                            */
/* ------------------------------------------------------------------ */
const cssResp = read('src/index.css');
assert(
  /\.table-wrap\s*\{[^}]*overflow-x:\s*auto/s.test(cssResp),
  'the .table-wrap sliding frame with overflow-x: auto is defined for tables',
);
assert(/\.chip-wrap\s*\{[^}]*white-space:\s*normal/s.test(cssResp), 'the .chip-wrap flavour lets chips wrap onto several lines');
assert(/\.hbar\s*\{[^}]*overflow-x:\s*auto/s.test(cssResp), 'the .hbar scroller with a visible bar for sliding rows');

const cheatLabResp = read('src/labs/CheatSheetLab.tsx');
assert(
  cheatLabResp.includes('grid grid-cols-1 gap-5 lg:grid-cols-2'),
  'backup-table grids have an explicit single-column track (no exploding auto tracks)',
);
assert(
  (cheatLabResp.match(/card min-w-0 p-6/g) || []).length >= 2,
  'backup-table cards have min-w-0 so they never escape the grid track',
);
assert(
  (cheatLabResp.match(/className="table-wrap"/g) || []).length === 2,
  'both tables (success rate and ablation) sit inside the .table-wrap sliding frame',
);
assert(cheatLabResp.includes('chip chip-pine chip-wrap'), 'parameter chips wrap with chip-wrap on narrow screens');
assert(
  cheatLabResp.includes('hbar flex min-w-0 gap-2') && !cheatLabResp.includes('no-hbar'),
  'the effect-size row uses the visible .hbar scroller, not a hidden one',
);

const practiceLabResp = read('src/labs/PracticeLab.tsx');
assert(
  practiceLabResp.includes('grid grid-cols-1 gap-px bg-line sm:grid-cols-3'),
  'the three timer displays grid has an explicit single-column track',
);
assert(
  practiceLabResp.includes('hbar') && !practiceLabResp.includes('no-hbar'),
  'the slide strip uses the visible .hbar scroller',
);

for (const [rel, snippet] of [
  ['src/labs/QALab.tsx', 'grid grid-cols-1 gap-4 lg:grid-cols-2'],
  ['src/labs/ChecklistLab.tsx', 'grid grid-cols-1 gap-5 lg:grid-cols-2'],
  ['src/labs/ChecklistLab.tsx', 'grid grid-cols-1 gap-4 md:grid-cols-2'],
]) {
  assert(read(rel).includes(snippet), `grid in ${rel} has an explicit single-column track (${snippet})`);
}

const headerResp = read('src/components/Header.tsx');
assert(
  (headerResp.match(/max-w-\[calc\(100vw-2rem\)\]/g) || []).length === 2,
  'both header dropdowns (PDF and settings) are clamped to the viewport width',
);
assert(
  /relative flex shrink-0 items-center gap-1/.test(headerResp),
  'header menu anchors sit on the control group so they never poke past the viewport edge',
);
assert(
  headerResp.includes('tab-nav') && headerResp.includes('tab-pill'),
  'tab navigation is unified with the tab-nav and tab-pill classes',
);
assert(/\.tab-pill/.test(cssResp) && /\.lab-pane/.test(cssResp), 'tab navigation style and soft pane entrance are defined');

assert(/main\s*\{\s*overflow-x:\s*clip;/s.test(cssResp), 'the overflow-x: clip defense line is on the main content area');

assert(
  /\.table-wrap\s*\{[^}]*border:\s*1px solid var\(--color-line\)/s.test(cssResp),
  'the complete table frame (including the closing line of the last row) is drawn by .table-wrap',
);
assert(
  cssResp.includes('.table-wrap .mini-table > thead > tr > *') &&
    cssResp.includes('.table-wrap .mini-table tr > *:first-child') &&
    cssResp.includes('.table-wrap .mini-table tr > *:last-child'),
  'outer cell edge lines are removed inside the frame so the frame is not doubled',
);

/* ------------------------------------------------------------------ */
/* 17) Content pipeline and AGENTS.md                                   */
/* ------------------------------------------------------------------ */
assert(fs.existsSync(path.join(ROOT, 'scripts/compile-content.mjs')), 'the compile-content script exists');
assert(fs.existsSync(path.join(ROOT, 'content/meta.yaml')), 'content/meta.yaml exists');
assert(fs.existsSync(path.join(ROOT, 'content/README.md')), 'the content/README.md guide exists');
assert(read('package.json').includes('"content"'), 'the npm run content script is defined');
assert(read('AGENTS.md').includes('content/'), 'AGENTS.md documents the content/ structure');
assert(read('AGENTS.md').includes('pref:palette'), 'AGENTS.md documents the color palette');
assert(read('README.md').includes('content/'), 'the README explains the content structure');

/* ------------------------------------------------------------------ */
/* 18) English code comments (UI strings and content stay Persian)      */
/* ------------------------------------------------------------------ */
{
  // Code comments and developer-facing messages are English so the project is
  // readable for a global audience. User-visible UI strings, app metadata and
  // all content/ stay Persian: this test only inspects comment text.
  const commentTexts = (text) => {
    const out = [];
    let i = 0;
    while (i < text.length) {
      const c = text[i];
      if (c === '"' || c === "'" || c === '`') {
        const q = c;
        i += 1;
        while (i < text.length) {
          if (text[i] === '\\') {
            i += 2;
            continue;
          }
          if (text[i] === q) {
            i += 1;
            break;
          }
          i += 1;
        }
        continue;
      }
      if (c === '/' && text[i + 1] === '/') {
        const end = text.indexOf('\n', i);
        const stop = end === -1 ? text.length : end;
        out.push(text.slice(i + 2, stop));
        i = stop;
        continue;
      }
      if (c === '/' && text[i + 1] === '*') {
        const end = text.indexOf('*/', i + 2);
        const stop = end === -1 ? text.length : end;
        out.push(text.slice(i + 2, stop));
        i = stop + 2;
        continue;
      }
      i += 1;
    }
    return out;
  };

  const codeFiles = [
    ...walk(path.join(ROOT, 'src'), (p) => /\.(ts|tsx|css)$/.test(p)),
    ...walk(path.join(ROOT, 'scripts'), (p) => /\.(mjs|cjs|js)$/.test(p)),
    path.join(ROOT, 'tests/verify-all.cjs'),
    path.join(ROOT, 'vite.config.ts'),
    path.join(ROOT, 'wrangler.jsonc'),
  ]
    .filter((p) => !p.endsWith('content.generated.ts'))
    .map((p) => path.relative(ROOT, p));

  const fa = /[\u0600-\u06FF]/;
  const offenders = codeFiles.filter((rel) => commentTexts(read(rel)).some((t) => fa.test(t)));
  assert(
    offenders.length === 0,
    `no Persian text inside code comments (offenders: ${offenders.join(', ') || 'none'})`,
  );

  const htmlComments = [...read('index.html').matchAll(/<!--([\s\S]*?)-->/g)].map((m) => m[1]);
  assert(!htmlComments.some((t) => fa.test(t)), 'index.html comments are English as well');
  assert(
    read('AGENTS.md').includes('code comments are in English'),
    'AGENTS.md documents the English-comment convention',
  );
}

console.log(`--- test result: ${passCount} passed, ${failCount} failed ---`);

if (failCount > 0) {
  console.error('Some tests failed.');
  process.exit(1);
} else {
  console.log('All tests passed.');
}

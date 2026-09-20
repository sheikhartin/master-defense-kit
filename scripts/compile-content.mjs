/**
 * Compile human-authored content/ into a typed TypeScript module the app imports.
 * Zero runtime network: the generated file is bundled offline with the PWA.
 *
 * Run: node scripts/compile-content.mjs
 * Also hooked from predev / prebuild / verify.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT = path.join(ROOT, 'content');
const OUT = path.join(ROOT, 'src', 'content.generated.ts');

const PERSIAN = /[\u0600-\u06FF]/
const EM_EN = /[\u2013\u2014]/
const LATEX_MACRO = /\\[a-zA-Z]{2,}/;

/* -------------------------------------------------------------------------- */
/* Minimal YAML subset parser (JSON-quoted scalars, maps, lists) */
/* -------------------------------------------------------------------------- */

function parseYaml(text) {
 const lines = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').split('\n');
 let i = 0;

 function peek() {
 while (i < lines.length && (/^\s*$/.test(lines[i]) || /^\s*#/.test(lines[i]))) i++;
 return i < lines.length ? lines[i] : null;
 }

 function indentOf(line) {
 const m = line.match(/^ */);
 return m ? m[0].length : 0;
 }

 function parseValue(raw) {
 const t = raw.trim();
 if (t === 'null' || t === '~') return null;
 if (t === 'true') return true;
 if (t === 'false') return false;
 if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
 if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
 return JSON.parse(t.startsWith("'") ? '"' + t.slice(1, -1).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"' : t);
 }
 return t;
 }

 function parseBlock(minIndent) {
 const line = peek();
 if (!line) return null;
 const ind = indentOf(line);
 if (ind < minIndent) return null;

 if (/^\s*-\s/.test(line)) return parseList(minIndent);
 return parseMap(minIndent);
 }

 function parseMap(minIndent) {
 const obj = {};
 while (true) {
 const line = peek();
 if (!line) break;
 const ind = indentOf(line);
 if (ind < minIndent) break;
 if (/^\s*-\s/.test(line)) break;
 if (ind > minIndent && Object.keys(obj).length === 0) {
 // nested unexpectedly
 }
 if (ind !== minIndent && Object.keys(obj).length > 0) break;

 const trimmed = line.trim();
 const m = trimmed.match(/^([^:#]+):\s*(.*)$/);
 if (!m) throw new Error(`YAML map parse failed at line ${i + 1}: ${line}`);
 const key = m[1].trim();
 const rest = m[2];
 i++;
 if (rest === '') {
 const next = peek();
 if (!next) {
 obj[key] = null;
 } else {
 const ni = indentOf(next);
 if (ni > ind) obj[key] = parseBlock(ni);
 else obj[key] = null;
 }
 } else if (rest === '[]') {
 obj[key] = [];
 } else if (rest === '|' || rest === '>') {
 // literal block
 const chunks = [];
 while (true) {
 const n = peek();
 if (!n) break;
 const ni = indentOf(n);
 if (ni <= ind) break;
 chunks.push(n.slice(ind + 2));
 i++;
 }
 obj[key] = chunks.join('\n');
 } else {
 obj[key] = parseValue(rest);
 }
 }
 return obj;
 }

 function parseList(minIndent) {
 const arr = [];
 while (true) {
 const line = peek();
 if (!line) break;
 const ind = indentOf(line);
 if (ind < minIndent) break;
 if (!/^\s*-\s/.test(line)) break;
 if (ind !== minIndent && arr.length > 0) break;

 const trimmed = line.trim().replace(/^- /, '').replace(/^-/, '');
 i++;
 if (trimmed === '') {
 const next = peek();
 if (!next) {
 arr.push(null);
 } else {
 arr.push(parseBlock(indentOf(next)));
 }
 } else if (/^[^:]+:\s*/.test(trimmed) && !trimmed.startsWith('"') && !trimmed.startsWith("'")) {
 // inline first key of object list item - reparse as map starting with this line content
 // Push back conceptually: build object from "- key: val" then following indented keys
 const fake = ' '.repeat(ind + 2) + trimmed;
 // Parse first pair
 const m = trimmed.match(/^([^:#]+):\s*(.*)$/);
 if (!m) {
 arr.push(parseValue(trimmed));
 continue;
 }
 const obj = {};
 const key = m[1].trim();
 const rest = m[2];
 if (rest === '') {
 const next = peek();
 if (next && indentOf(next) > ind) obj[key] = parseBlock(indentOf(next));
 else obj[key] = null;
 } else {
 obj[key] = parseValue(rest);
 }
 // subsequent keys at ind+2
 while (true) {
 const n = peek();
 if (!n) break;
 const ni = indentOf(n);
 if (ni <= ind) break;
 if (/^\s*-\s/.test(n)) break;
 if (ni !== ind + 2) {
 // deeper belongs to previous value already consumed
 break;
 }
 const tm = n.trim().match(/^([^:#]+):\s*(.*)$/);
 if (!tm) break;
 i++;
 const k2 = tm[1].trim();
 const r2 = tm[2];
 if (r2 === '') {
 const next2 = peek();
 if (next2 && indentOf(next2) > ni) obj[k2] = parseBlock(indentOf(next2));
 else obj[k2] = null;
 } else if (r2 === '[]') obj[k2] = [];
 else obj[k2] = parseValue(r2);
 }
 arr.push(obj);
 } else {
 arr.push(parseValue(trimmed));
 }
 }
 return arr;
 }

 const doc = parseBlock(0);
 return doc;
}

function parseFrontMatter(md) {
 const text = md.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
 if (!text.startsWith('---\n')) throw new Error('Slide markdown must start with YAML front matter');
 const end = text.indexOf('\n---\n', 4);
 if (end < 0) throw new Error('Unclosed front matter');
 const yaml = text.slice(4, end);
 const body = text.slice(end + 5);
 return { data: parseYaml(yaml), body };
}

function sectionParagraphs(body, heading) {
 const re = new RegExp(`##\\s+${heading}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`, 'i');
 const m = body.match(re);
 if (!m) return [];
 return m[1]
 .split(/\n\s*\n/)
 .map((p) => p.trim())
 .filter((p) => p && p !== '_None._' && !p.startsWith('<!--'));
}

function sectionBullets(body, heading) {
 const re = new RegExp(`##\\s+${heading}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`, 'i');
 const m = body.match(re);
 if (!m) return [];
 return m[1]
 .split('\n')
 .map((l) => l.replace(/^\s*[-*]\s+/, '').trim())
 .filter((l) => l && l !== '_None._' && !l.startsWith('#'));
}

function read(rel) {
 return fs.readFileSync(path.join(CONTENT, rel), 'utf8');
}

function walkFiles(dir, pred) {
 const out = [];
 for (const name of fs.readdirSync(dir).sort()) {
 const p = path.join(dir, name);
 const st = fs.statSync(p);
 if (st.isDirectory()) out.push(...walkFiles(p, pred));
 else if (pred(name)) out.push(p);
 }
 return out;
}

function contentHash() {
 const h = crypto.createHash('sha256');
 const files = walkFiles(CONTENT, () => true).sort();
 for (const f of files) {
 h.update(path.relative(CONTENT, f));
 h.update('\0');
 h.update(fs.readFileSync(f));
 h.update('\0');
 }
 return h.digest('hex').slice(0, 16);
}

function assertNoEmEn(label, value) {
 const s = typeof value === 'string' ? value : JSON.stringify(value);
 if (EM_EN.test(s)) throw new Error(`em/en dash in ${label}`);
}

function assertAsciiLatex(label, tex) {
 if (typeof tex !== 'string') return;
 if (PERSIAN.test(tex)) throw new Error(`Persian inside LaTeX (${label}): ${tex.slice(0, 60)}`);
}

function tsString(s) {
 return JSON.stringify(s ?? '');
}

function tsValue(v, indent = 0) {
 const sp = ' '.repeat(indent);
 if (v === null || v === undefined) return 'null';
 if (typeof v === 'string') return tsString(v);
 if (typeof v === 'number' || typeof v === 'boolean') return String(v);
 if (Array.isArray(v)) {
 if (v.length === 0) return '[]';
 const parts = v.map((item) => sp + ' ' + tsValue(item, indent + 1));
 return '[\n' + parts.join(',\n') + ',\n' + sp + ']';
 }
 if (typeof v === 'object') {
 const keys = Object.keys(v);
 if (keys.length === 0) return '{}';
 const parts = keys.map((k) => {
 const key = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k) ? k : tsString(k);
 return sp + ' ' + key + ': ' + tsValue(v[k], indent + 1);
 });
 return '{\n' + parts.join(',\n') + ',\n' + sp + '}';
 }
 return tsString(String(v));
}

/* -------------------------------------------------------------------------- */
/* Load pack */
/* -------------------------------------------------------------------------- */

function loadPack() {
 const errors = [];
 const meta = parseYaml(read('meta.yaml'));
 const chaptersDoc = parseYaml(read('chapters.yaml'));
 const roadmap = parseYaml(read('roadmap/roadmap.yaml'));
 const checklistGroups = parseYaml(read('checklist/groups.yaml')).groups;
 const doDonts = parseYaml(read('checklist/do-dont.yaml')).doDonts;
 const qaMain = parseYaml(read('qa/main.yaml')).items;
 const qaHard = parseYaml(read('qa/hard.yaml')).items;
 const qaDrill = parseYaml(read('qa/drill.yaml')).items;
 const qaCategories = parseYaml(read('qa/categories.yaml')).categories;
 const coreEquations = parseYaml(read('cheat/equations.yaml')).equations;
 const conceptCards = parseYaml(read('cheat/concepts.yaml')).concepts;
 const keyFacts = parseYaml(read('cheat/facts.yaml')).facts;
 const tables = parseYaml(read('cheat/tables.yaml'));

 const deckDir = path.join(CONTENT, 'deck');
 const slideFiles = fs.readdirSync(deckDir).filter((f) => f.endsWith('.md')).sort();
 if (slideFiles.length === 0) errors.push('No slide markdown files in content/deck');

 const slides = [];
 for (const file of slideFiles) {
 const raw = fs.readFileSync(path.join(deckDir, file), 'utf8');
 const { data, body } = parseFrontMatter(raw);
 const speech = sectionParagraphs(body, 'Speech');
 const notes = sectionBullets(body, 'Coach notes');

 if (!data.id) errors.push(`${file}: missing id`);
 if (!data.title) errors.push(`${file}: missing title`);
 if (!data.chapterId) errors.push(`${file}: missing chapterId`);
 if (!Number.isFinite(data.durationSec) || data.durationSec <= 0) {
 errors.push(`${file}: durationSec must be a positive number (seconds)`);
 }
 if (!data.estimatedTime || typeof data.estimatedTime !== 'string') {
 errors.push(`${file}: estimatedTime (English duration label) is required`);
 }

 for (const t of data.tex || []) assertAsciiLatex(`${file} tex`, t.tex);
 assertNoEmEn(file, data);
 assertNoEmEn(file, speech);
 assertNoEmEn(file, notes);

 slides.push({
 id: String(data.id),
 num: Number(data.num),
 title: String(data.title),
 chapterId: String(data.chapterId),
 duration: Number(data.durationSec),
 estimatedTime: String(data.estimatedTime),
 goal: data.goal ? String(data.goal) : undefined,
 visual: Array.isArray(data.visual) ? data.visual.map(String) : [],
 tex: Array.isArray(data.tex)
 ? data.tex.map((t) => ({
 tex: String(t.tex),
 caption: t.caption ? String(t.caption) : undefined,
 }))
 : [],
 speech,
 phrase: data.phrase ? String(data.phrase) : undefined,
 notes,
 transition: data.transition ? String(data.transition) : undefined,
 });
 }

 // Stable order by filename already; renumber positionally
 slides.forEach((s, i) => {
 s.num = i + 1;
 });

 const talkTotalSec = slides.reduce((a, s) => a + s.duration, 0);
 const safetyBufferSec = Number(meta.safetyBufferSec) || 60;
 const finishFrom = talkTotalSec + Number(meta.finishTarget?.fromOffsetSec ?? 15);
 const finishTo = talkTotalSec + Number(meta.finishTarget?.toOffsetSec ?? 30);

 // Chapters with derived slide ranges (0-based indexes into slides)
 const intro = chaptersDoc.intro;
 const chapters = (chaptersDoc.chapters || []).map((ch) => {
 const idxs = slides.map((s, i) => (s.chapterId === ch.id ? i : -1)).filter((i) => i >= 0);
 const slideRange = idxs.length ? [idxs[0], idxs[idxs.length - 1]] : [0, 0];
 return {
 id: ch.id,
 num: ch.num,
 title: ch.title,
 summary: ch.summary,
 goal: ch.goal || undefined,
 slideRange,
 };
 });

 const introIndexes = slides.map((s, i) => (s.chapterId === intro.id ? i : -1)).filter((i) => i >= 0);
 const introGroup = {
 id: intro.id,
 num: intro.num,
 title: intro.title,
 slideRange: introIndexes.length
 ? /** @type {[number, number]} */ ([introIndexes[0], introIndexes[introIndexes.length - 1]])
 : /** @type {[number, number]} */ ([0, 0]),
 };

 for (const eq of coreEquations) {
 assertAsciiLatex(eq.id, eq.tex);
 for (const p of eq.params || []) assertAsciiLatex(eq.id + ':' + p.sym, p.sym);
 }

 // global dash check on pack strings
 const bag = { meta, roadmap, checklistGroups, doDonts, qaMain, qaHard, qaDrill, keyFacts, conceptCards };
 assertNoEmEn('content pack', bag);

 if (errors.length) {
 throw new Error('Content compile errors:\n- ' + errors.join('\n- '));
 }

 return {
 meta: {
 id: meta.id,
 title: meta.title,
 locale: meta.locale || 'fa',
 dir: meta.dir || 'rtl',
 persona: meta.persona || '',
 description: meta.description || '',
 safetyBufferSec,
 finishTarget: {
 fromOffsetSec: Number(meta.finishTarget?.fromOffsetSec ?? 15),
 toOffsetSec: Number(meta.finishTarget?.toOffsetSec ?? 30),
 },
 talkTotalSec,
 sessionTotalSec: talkTotalSec + safetyBufferSec,
 finishFromSec: finishFrom,
 finishToSec: finishTo,
 slideCount: slides.length,
 },
 introGroup,
 chapters,
 slides,
 roadmap,
 checklistGroups,
 doDonts,
 qaMain,
 qaHard,
 qaDrill,
 qaCategories,
 coreEquations,
 conceptCards,
 keyFacts,
 reliabilityRows: tables.reliabilityRows,
 ablationRows: tables.ablationRows,
 parameterRows: tables.parameterRows,
 effectSizeRows: tables.effectSizeRows,
 contentHash: contentHash(),
 };
}

function emit(pack) {
 const header = `/**
 * AUTO-GENERATED by scripts/compile-content.mjs - do not edit by hand.
 * Source of truth: content/
 * contentHash: ${pack.contentHash}
 * talkTotalSec: ${pack.meta.talkTotalSec} (${pack.meta.slideCount} slides)
 * Generated: ${new Date().toISOString()}
 */

import type {
 Chapter,
 ChecklistGroup,
 ConceptCard,
 DeckSlide,
 DoDont,
 Equation,
 FactRow,
 QaItem,
} from './types';

`;

 const body = `export const CONTENT_HASH = ${tsString(pack.contentHash)};

export const meta = ${tsValue(pack.meta)} as const;

export const SAFETY_BUFFER = meta.safetyBufferSec;

export const introGroup = ${tsValue(pack.introGroup)};

export const chapters: Chapter[] = ${tsValue(pack.chapters)};

export const slides: DeckSlide[] = ${tsValue(pack.slides)};

export const governingPrinciple = ${tsString(pack.roadmap.governingPrinciple)};
export const missionPoints: string[] = ${tsValue(pack.roadmap.missionPoints)};
export const memoryTakeaways: string[] = ${tsValue(pack.roadmap.memoryTakeaways)};
export const fiveNumbers: Array<{ n: string; label: string }> = ${tsValue(pack.roadmap.fiveNumbers)};
export const claimBoundaries: Array<{ q: string; a: string }> = ${tsValue(pack.roadmap.claimBoundaries)};
export const practiceMethods: Array<{ t: string; d: string }> = ${tsValue(pack.roadmap.practiceMethods)};
export const answerPattern = ${tsValue(pack.roadmap.answerPattern)};
export const outOfScopeSteps: string[] = ${tsValue(pack.roadmap.outOfScopeSteps)};
export const qaPresence = ${tsValue(pack.roadmap.qaPresence)};
export const successLine = ${tsString(pack.roadmap.successLine)};

export const checklistGroups: ChecklistGroup[] = ${tsValue(pack.checklistGroups)};
export const doDonts: DoDont[] = ${tsValue(pack.doDonts)};

export const qaMain: QaItem[] = ${tsValue(pack.qaMain)};
export const qaHard: QaItem[] = ${tsValue(pack.qaHard)};
export const qaDrill: Array<{ role: string; category: QaItem['category']; q: string; a: string }> = ${tsValue(pack.qaDrill)};
export const qaCategories: Array<QaItem['category']> = ${tsValue(pack.qaCategories)};

export const coreEquations: Equation[] = ${tsValue(pack.coreEquations)};
export const conceptCards: ConceptCard[] = ${tsValue(pack.conceptCards)};
export const keyFacts: FactRow[] = ${tsValue(pack.keyFacts)};
export const reliabilityRows: Array<{ problem: string; rate: string; note: string }> = ${tsValue(pack.reliabilityRows)};
export const ablationRows: Array<{ version: string; rank: string; note?: string }> = ${tsValue(pack.ablationRows)};
export const parameterRows: Array<{ sym: string; value: string; role: string }> = ${tsValue(pack.parameterRows)};
export const effectSizeRows: Array<{ rival: string; value: string; level: string }> = ${tsValue(pack.effectSizeRows)};
`;

 return header + body;
}

/* -------------------------------------------------------------------------- */

try {
 const pack = loadPack();
 const code = emit(pack);
 fs.mkdirSync(path.dirname(OUT), { recursive: true });
 fs.writeFileSync(OUT, code, 'utf8');
 console.log(
 `[content] compiled ${pack.meta.slideCount} slides · talk ${pack.meta.talkTotalSec}s · hash ${pack.contentHash} → src/content.generated.ts`,
 );
} catch (err) {
 console.error('[content] FAILED:', err instanceof Error ? err.message : err);
 process.exit(1);
}

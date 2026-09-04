/**
 * رسترکننده کوچک و کاملاً بدون وابستگی برای نشان برند.
 *
 * چرا دستی؟ این پروژه عمداً هیچ وابستگی بومی یا سرویس بیرونی ندارد و
 * اسکریپت ساخت آیکون هم باید مثل خود برنامه آفلاین کار کند. این ماژول
 * مسیرهای SVG را به چندخطی تبدیل می‌کند و با «فاصله علامت‌دار» و
 * پادخراستگی (anti-aliasing) یک‌پیکسلی رستر می‌زند؛ سپس PNG و ICO می‌سازد.
 *
 * همه محاسبات در دستگاه مختصات ۵۱۲×۵۱۲ نشان انجام می‌شود و فقط در آخرین
 * گام به پیکسل دستگاه نگاشت می‌شود، تا خروجی در هر اندازه‌ای دقیق باشد.
 */

/* ------------------------------------------------------------------ */
/* ۱) تجزیه مسیر SVG                                                   */
/* ------------------------------------------------------------------ */

const NUM = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi;

function numbers(chunk) {
  const out = [];
  let m;
  NUM.lastIndex = 0;
  while ((m = NUM.exec(chunk)) !== null) out.push(Number(m[0]));
  return out;
}

/**
 * تبدیل رشته مسیر به فهرست زیرمسیرها.
 * @param {string} d
 * @returns {{ points: Array<[number, number]>, closed: boolean }[]}
 */
export function parsePath(d) {
  const tokens = d.match(/[a-zA-Z]|[^a-zA-Z]+/g) ?? [];
  const subs = [];
  let cur = null;
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let cmd = '';

  const push = (nx, ny) => {
    if (!cur) {
      cur = { points: [[nx, ny]], closed: false };
      subs.push(cur);
    } else {
      cur.points.push([nx, ny]);
    }
    x = nx;
    y = ny;
  };
  const moveTo = (nx, ny) => {
    cur = { points: [[nx, ny]], closed: false };
    subs.push(cur);
    x = nx;
    y = ny;
    startX = nx;
    startY = ny;
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (/^[a-zA-Z]$/.test(t)) {
      cmd = t;
      continue;
    }
    const n = numbers(t);
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;

    if (C === 'M') {
      for (let k = 0; k + 1 < n.length; k += 2) {
        if (k === 0) moveTo(n[k] + ox, n[k + 1] + oy);
        else push(n[k] + ox, n[k + 1] + oy);
      }
      cmd = rel ? 'l' : 'L';
    } else if (C === 'L') {
      for (let k = 0; k + 1 < n.length; k += 2) push(n[k] + ox, n[k + 1] + oy);
    } else if (C === 'H') {
      for (const v of n) push(v + (rel ? x : 0), y);
    } else if (C === 'V') {
      for (const v of n) push(x, v + (rel ? y : 0));
    } else if (C === 'C') {
      for (let k = 0; k + 5 < n.length; k += 6) {
        const p1 = [n[k] + ox, n[k + 1] + oy];
        const p2 = [n[k + 2] + ox, n[k + 3] + oy];
        const p3 = [n[k + 4] + ox, n[k + 5] + oy];
        for (const p of cubic([x, y], p1, p2, p3)) cur.points.push(p);
        x = p3[0];
        y = p3[1];
      }
    } else if (C === 'Q') {
      for (let k = 0; k + 3 < n.length; k += 4) {
        const p1 = [n[k] + ox, n[k + 1] + oy];
        const p2 = [n[k + 2] + ox, n[k + 3] + oy];
        for (const p of quad([x, y], p1, p2)) cur.points.push(p);
        x = p2[0];
        y = p2[1];
      }
    } else if (C === 'A') {
      for (let k = 0; k + 6 < n.length; k += 7) {
        const p2 = [n[k + 5] + ox, n[k + 6] + oy];
        for (const p of arc([x, y], n[k], n[k + 1], n[k + 2], n[k + 3], n[k + 4], p2)) {
          cur.points.push(p);
        }
        x = p2[0];
        y = p2[1];
      }
    } else if (C === 'Z') {
      if (cur) {
        cur.closed = true;
        cur.points.push([startX, startY]);
      }
      x = startX;
      y = startY;
      cur = null;
    }
  }
  return subs.filter((s) => s.points.length > 1);
}

function cubic(p0, p1, p2, p3, steps = 20) {
  const out = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    out.push([
      u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
      u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1],
    ]);
  }
  return out;
}

function quad(p0, p1, p2, steps = 16) {
  const out = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    out.push([
      u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
      u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    ]);
  }
  return out;
}

/** تبدیل کمان SVG (پارامترهای انتهایی) به نقطه‌ها: پیاده‌سازی استاندارد W3C */
function arc(p0, rxIn, ryIn, rotDeg, largeArc, sweep, p1, steps = 24) {
  let rx = Math.abs(rxIn);
  let ry = Math.abs(ryIn);
  if (rx === 0 || ry === 0) return [p1.slice()];
  const phi = (rotDeg * Math.PI) / 180;
  const cosP = Math.cos(phi);
  const sinP = Math.sin(phi);
  const dx = (p0[0] - p1[0]) / 2;
  const dy = (p0[1] - p1[1]) / 2;
  const x1p = cosP * dx + sinP * dy;
  const y1p = -sinP * dx + cosP * dy;

  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    const s = Math.sqrt(lambda);
    rx *= s;
    ry *= s;
  }
  const sign = largeArc === sweep ? -1 : 1;
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const coef = sign * Math.sqrt(Math.max(0, num / den));
  const cxp = (coef * (rx * y1p)) / ry;
  const cyp = (coef * -(ry * x1p)) / rx;
  const cx = cosP * cxp - sinP * cyp + (p0[0] + p1[0]) / 2;
  const cy = sinP * cxp + cosP * cyp + (p0[1] + p1[1]) / 2;

  const ang = (ux, uy, vx, vy) => {
    const dot = ux * vx + uy * vy;
    const len = Math.hypot(ux, uy) * Math.hypot(vx, vy);
    let a = Math.acos(Math.max(-1, Math.min(1, dot / len)));
    if (ux * vy - uy * vx < 0) a = -a;
    return a;
  };
  const theta1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let delta = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  if (sweep && delta < 0) delta += 2 * Math.PI;

  const out = [];
  for (let i = 1; i <= steps; i++) {
    const th = theta1 + (delta * i) / steps;
    const xr = rx * Math.cos(th);
    const yr = ry * Math.sin(th);
    out.push([cosP * xr - sinP * yr + cx, sinP * xr + cosP * yr + cy]);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* ۲) شکل‌ها و فاصله علامت‌دار                                         */
/* ------------------------------------------------------------------ */

/** @typedef {{kind:'bg', color:string}} BgShape */
/** @typedef {{kind:'tile', size:number, radius:number, color:string}} TileShape */
/** @typedef {{kind:'stroke', subs:ReturnType<typeof parsePath>, width:number, color:string}} StrokeShape */
/** @typedef {{kind:'disc', cx:number, cy:number, r:number, color:string}} DiscShape */
/** @typedef {BgShape|TileShape|StrokeShape|DiscShape} Shape */

function distSegment(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const len2 = vx * vx + vy * vy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, (wx * vx + wy * vy) / len2));
  return Math.hypot(wx - t * vx, wy - t * vy);
}

function distSubs(px, py, subs) {
  let best = Infinity;
  for (const s of subs) {
    const pts = s.points;
    for (let i = 0; i < pts.length - 1; i++) {
      const d = distSegment(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
      if (d < best) best = d;
    }
  }
  return best;
}

function distRoundRect(px, py, size, radius) {
  const c = size / 2;
  const r = Math.min(radius, c);
  const qx = Math.abs(px - c) - (c - r);
  const qy = Math.abs(py - c) - (c - r);
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
}

/**
 * فاصله علامت‌دار به یک شکل (واحد: واحد نشان). مقدار منفی یعنی داخل شکل.
 * @param {Shape} shape
 */
function signedDistance(shape, x, y) {
  if (shape.kind === 'tile') return distRoundRect(x, y, shape.size, shape.radius);
  if (shape.kind === 'disc') return Math.hypot(x - shape.cx, y - shape.cy) - shape.r;
  return distSubs(x, y, shape.subs) - shape.width / 2;
}

/** پوشش یک نمونه (پیکسل دستگاه) برای یک شکل */
function coverage(shape, dx, dy, scale, off) {
  /* پس‌زمینه یکدست: کل بوم دستگاه را می‌پوشاند (برای آیکون maskable و iOS) */
  if (shape.kind === 'bg') return 1;
  const sx = (dx - off) / scale;
  const sy = (dy - off) / scale;
  const d = signedDistance(shape, sx, sy) * scale;
  const a = 0.5 - d;
  return a <= 0 ? 0 : a >= 1 ? 1 : a;
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

/**
 * رسترکردن فهرست شکل‌ها در اندازه مشخص.
 * @param {number} size
 * @param {Shape[]} shapes به ترتیب نقاشی (اولی زیر همه)
 * @param {{source?: number, scale?: number}} [opts] source اندازه دستگاه مختصات، scale ضریب کوچک‌کردن نشان
 * @returns {{width:number, height:number, data:Uint8Array}}
 */
export function rasterize(size, shapes, opts = {}) {
  const source = opts.source ?? 512;
  const scale = opts.scale ?? size / source;
  const off = (size - source * scale) / 2;
  const data = new Uint8Array(size * size * 4);
  const prepared = shapes.map((s) => ({ shape: s, rgb: hexToRgb(s.color) }));

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      let dr = 0;
      let dg = 0;
      let db = 0;
      let alpha = 0;

      for (const { shape, rgb } of prepared) {
        let a = coverage(shape, px, py, scale, off);
        if (a <= 0) continue;
        /* پیکسل‌های لبه با ۹ نمونه باز هم نرم‌تر می‌شوند */
        if (a < 1) {
          let sum = 0;
          for (let sy = 0; sy < 3; sy++) {
            for (let sx = 0; sx < 3; sx++) {
              sum += coverage(shape, x + (sx + 0.5) / 3, y + (sy + 0.5) / 3, scale, off);
            }
          }
          a = sum / 9;
          if (a <= 0) continue;
        }
        /* ترکیب «روی هم» با آلفای پیش‌ضرب‌شده */
        const inv = 1 - a;
        dr = rgb[0] * a + dr * inv;
        dg = rgb[1] * a + dg * inv;
        db = rgb[2] * a + db * inv;
        alpha = a + alpha * inv;
      }

      const i = (y * size + x) * 4;
      data[i] = Math.round(dr * 255);
      data[i + 1] = Math.round(dg * 255);
      data[i + 2] = Math.round(db * 255);
      data[i + 3] = Math.round(alpha * 255);
    }
  }
  return { width: size, height: size, data };
}

/* ------------------------------------------------------------------ */
/* ۳) کدگذاری PNG و ICO                                               */
/* ------------------------------------------------------------------ */

import { deflateSync } from 'node:zlib';

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, payload) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(payload.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), payload]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

/** @param {{width:number,height:number,data:Uint8Array}} img */
export function encodePNG(img) {
  const { width, height, data } = img;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // فیلتر None
    Buffer.from(data.buffer, data.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // ژرفای بیت
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** ساخت favicon.ico چنداندازه‌ای از روی PNGها (قالب PNG درون ICO، پشتیبانی ویندوز ویستا به بعد) */
export function encodeICO(pngs) {
  const count = pngs.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const entries = [];
  const bodies = [];
  let offset = 6 + 16 * count;
  pngs.forEach(({ size, png }) => {
    const e = Buffer.alloc(16);
    e[0] = size >= 256 ? 0 : size;
    e[1] = size >= 256 ? 0 : size;
    e[2] = 0;
    e[3] = 0;
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    bodies.push(png);
    offset += png.length;
  });
  return Buffer.concat([header, ...entries, ...bodies]);
}

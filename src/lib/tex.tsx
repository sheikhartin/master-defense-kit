/**
 * موتور رندر فرمول‌ها
 * ---------------------------------------------------------------
 * ۱. همه فرمول‌ها با کیتکس (محلی، آفلاین) پیش‌رندر و در حافظه کش می‌شوند؛
 *    بنابراین هنگام باز کردن برگه تقلب، فرمول‌ها بدون هیچ تأخیر محسوس و
 *    بدون جابه‌جایی چیدمان ظاهر می‌شوند.
 * ۲. هر ظرف فرمول چپ‌به‌راست (ltr) و ایزوله است تا در فضای راست‌به‌چپ
 *    فارسی هرگز دچار درهم‌ریختگی نشود.
 * ۳. همه فرمول‌ها فقط نویسه ASCII دارند؛ هیچ رقم یا حرف فارسی داخل
 *    عبارت LaTeX نوشته نمی‌شود (در tests/verify-all.cjs کنترل می‌شود).
 */

import { memo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const KATEX_OPTIONS: katex.KatexOptions = {
  throwOnError: false,
  strict: false,
  output: 'html',
  trust: false,
  maxSize: 12,
  maxExpand: 40,
};

const cache = new Map<string, string>();

/** رندر و کش یک عبارت؛ رشته HTML برمی‌گرداند */
export function renderTex(tex: string, display = false): string {
  const key = (display ? 'd:' : 'i:') + tex;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const html = katex.renderToString(tex, { ...KATEX_OPTIONS, displayMode: display });
  cache.set(key, html);
  return html;
}

/** پیش‌گرم‌کردن کش در لحظه آغاز برنامه تا باز شدن هر بخش بدون تأخیر باشد */
export function warmTex(items: Array<{ tex: string; display?: boolean }>): void {
  for (const item of items) renderTex(item.tex, item.display ?? false);
}

type TeXProps = {
  tex: string;
  display?: boolean;
  className?: string;
};

/**
 * مؤلفه امن فرمول: خروجی کیتکس به‌صورت HTML آماده تزریق می‌شود
 * و هرگز متنی به‌عنوان child رندر نمی‌گردد تا مشکلی در فضای RTL پیش نیاید.
 */
export const TeX = memo(function TeX({ tex, display = false, className = '' }: TeXProps) {
  const html = renderTex(tex, display);
  if (display) {
    return (
      <div className={`tex-frame ${className}`} dir="ltr">
        <span dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    );
  }
  return (
    <span className={`tex-standalone ${className}`} dir="ltr" dangerouslySetInnerHTML={{ __html: html }} />
  );
});

/** فرمول داخل جمله فارسی */
export function InlineTex({ tex }: { tex: string }) {
  return (
    <span className="tex-inline">
      <TeX tex={tex} />
    </span>
  );
}

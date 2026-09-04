/**
 * نسخه چاپی / PDF برگه تقلب.
 * این مؤلفه فقط هنگام چاپ در DOM سوار می‌شود و روی صفحه دیده نمی‌شود.
 */

import { chapters, SAFETY_BUFFER } from '../data/deck';
import {
  coreEquations,
  conceptCards,
  keyFacts,
  reliabilityRows,
  ablationRows,
  parameterRows,
} from '../data/cheat';
import { planSlides } from '../lib/session';
import { TeX } from '../lib/tex';
import { clockOf, toPersianDigits } from '../lib/persian';

export default function PrintSheet() {
  const plan = planSlides(false);
  const total = plan[plan.length - 1].end;

  return (
    <div className="print-root">
      <div className="print-sheet">
        <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '2px solid #1e5a49', paddingBottom: '3mm' }}>
          <div>
            <h2 style={{ margin: 0 }}>برگه تقلب جلسه دفاع، الگوریتم BCOA</h2>
            <p style={{ margin: '1mm 0 0', fontSize: '9px' }}>
              سناریوی نهایی نسخه ۲ · گفتار {clockOf(total)} + حاشیه امن {clockOf(SAFETY_BUFFER)}
            </p>
          </div>
          <p style={{ fontSize: '9px', textAlign: 'left' }}>
            شخصیت: آرام، دقیق، مسلط، قابل نقد
            <br />
            ادعا: رقابتی در مجموعه بررسی‌شده، نه برتری مطلق
          </p>
        </header>

        {/* ساختار جلسه */}
        <section>
          <h3>۱. ساختار جلسه</h3>
          <table>
            <thead>
              <tr>
                <th>بخش</th>
                <th>اسلایدها</th>
                <th>زمان کل</th>
                <th>محتوای اصلی</th>
              </tr>
            </thead>
            <tbody>
              {chapters.map((ch) => {
                const items = plan.filter((p) => p.chapterId === ch.id);
                const dur = items.reduce((s, p) => s + p.duration, 0);
                return (
                  <tr key={ch.id}>
                    <td>
                      {ch.num} {ch.title}
                    </td>
                    <td>
                      {toPersianDigits(items[0].num)} تا {toPersianDigits(items[items.length - 1].num)}
                    </td>
                    <td>{clockOf(dur)}</td>
                    <td>{ch.summary}</td>
                  </tr>
                );
              })}
              <tr>
                <td>شروع جلسه</td>
                <td>۱ تا ۲</td>
                <td>{clockOf(55)}</td>
                <td>عنوان و فهرست هشت‌بخشی</td>
              </tr>
              <tr>
                <td>حاشیه امن</td>
                <td>پایان</td>
                <td>{clockOf(SAFETY_BUFFER)}</td>
                <td>مکث، پرسش میان ارائه، اختلال فنی؛ هدف پایان ۱۹:۱۵ تا ۱۹:۳۰</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* روابط */}
        <section className="page-break">
          <h3>۲. روابط ریاضی (فقط ASCII؛ هنگام گفتن، معنا را بگو نه نمادها را)</h3>
          {coreEquations.map((eq, i) => (
            <div key={eq.id} style={{ margin: '2mm 0' }}>
              <p style={{ margin: 0, fontWeight: 700 }}>
                {toPersianDigits(i + 1)}. {eq.title} ({eq.ref})
              </p>
              <div className="ps-formula">
                <TeX tex={eq.tex} display />
              </div>
            </div>
          ))}
        </section>

        {/* سه مفهوم */}
        <section className="page-break">
          <h3>۳. سه مفهوم پرکاربرد روز دفاع</h3>
          {conceptCards.map((c) => (
            <div key={c.id} style={{ margin: '2mm 0' }}>
              <p style={{ margin: 0, fontWeight: 700 }}>{c.label}</p>
              {c.body.map((b) => (
                <p key={b} style={{ margin: '0.6mm 0' }}>{b}</p>
              ))}
            </div>
          ))}
        </section>

        {/* ارقام */}
        <section>
          <h3>۴. ارقام کلیدی و مرزهای ادعا</h3>
          <table>
            <tbody>
              {keyFacts.map((f) => (
                <tr key={f.label}>
                  <td style={{ width: '38%', fontWeight: 700 }}>{f.label}</td>
                  <td>{f.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* جدول‌ها */}
        <section>
          <h3>۵. نرخ موفقیت مهندسی، حذف مؤلفه‌ها و پارامترها</h3>
          <table>
            <thead>
              <tr>
                <th>مسئله</th>
                <th>نرخ موفقیت</th>
              </tr>
            </thead>
            <tbody>
              {reliabilityRows.map((r) => (
                <tr key={r.problem}>
                  <td>{r.problem}</td>
                  <td>{r.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <table>
            <thead>
              <tr>
                <th>نسخه</th>
                <th>میانگین رتبه</th>
              </tr>
            </thead>
            <tbody>
              {ablationRows.map((r) => (
                <tr key={r.version}>
                  <td>{r.version}</td>
                  <td>{r.rank}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ margin: '1mm 0' }}>
            <b>پارامترهای گزارش‌شده: </b>
            {parameterRows.map((p) => `مقدار ${p.value} برای ${p.role}`).join(' · ')}
          </p>
          <p style={{ margin: '1mm 0' }}>
            <b>پنج عدد: </b>۳۲ تابع · ۱۶ + ۱۶ · ۳۰ اجرا · ۱٫۰۹ رتبه فریدمن · ۴٫۶۲ بدون حرکت زاویه‌محور
          </p>
          <p style={{ margin: '1mm 0' }}>
            <b>ساختار پاسخ به داور: </b>ادعا، دلیل، شاهد. سؤال خارج از پایان‌نامه: محدوده را مشخص کن، آنچه می‌دانی را بگو، ادعای قطعی نساز.
          </p>
        </section>
      </div>
    </div>
  );
}

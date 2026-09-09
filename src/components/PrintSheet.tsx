/**
 * نسخه چاپی / PDF وب‌سایت.
 * این مؤلفه فقط هنگام چاپ در DOM سوار می‌شود و روی صفحه دیده نمی‌شود.
 *
 * دامنه خروجی با PrintScope مشخص می‌شود:
 *   'all'       کل وب‌سایت (همه بخش‌ها پشت سر هم با شکست صفحه تمیز)
 *   'roadmap'   نقشه راه دفاع
 *   'deck'      متن کامل نوزده اسلاید و اسلاید پشتیبان
 *   'cheat'     برگه تقلب و فرمول‌ها
 *   'qa'        بانک پرسش داور
 *   'checklist' چک‌لیست‌های روز دفاع
 */

import { chapters, SAFETY_BUFFER, slides } from '../data/deck';
import {
  coreEquations,
  conceptCards,
  keyFacts,
  reliabilityRows,
  ablationRows,
  parameterRows,
  effectSizeRows,
} from '../data/cheat';
import { qaMain, qaHard, qaDrill } from '../data/qa';
import { checklistGroups, doDonts } from '../data/checklist';
import {
  governingPrinciple,
  missionPoints,
  memoryTakeaways,
  fiveNumbers,
  claimBoundaries,
  practiceMethods,
  answerPattern,
  outOfScopeSteps,
  qaPresence,
  successLine,
} from '../data/roadmap';
import { planSlides, practiceTarget } from '../lib/session';
import { TeX } from '../lib/tex';
import { clockOf, toPersianDigits } from '../lib/persian';
import type { PrintScope } from '../lib/app-context';

const SCOPE_TITLES: Record<Exclude<PrintScope, 'all'>, string> = {
  roadmap: 'نقشه راه دفاع',
  deck: 'متن کامل ارائه، اسلاید به اسلاید',
  cheat: 'برگه تقلب و فرمول‌های کلیدی',
  qa: 'بانک پرسش داور و پاسخ‌های پیشنهادی',
  checklist: 'چک‌لیست‌های روز دفاع',
};

export default function PrintSheet({ scope = 'cheat' }: { scope?: PrintScope }) {
  const wants = (s: Exclude<PrintScope, 'all'>) => scope === 'all' || scope === s;
  const subtitle =
    scope === 'all' ? 'نسخه کامل همه بخش‌های وب‌سایت' : SCOPE_TITLES[scope as Exclude<PrintScope, 'all'>];

  return (
    <div className="print-root">
      <div className="print-sheet">
        <header className="ps-header">
          <div>
            <h2>بستار دفاع ارشد BCOA · {subtitle}</h2>
            <p className="ps-sub">
              سناریوی نهایی · گفتار {clockOf(planSlides(false).at(-1)?.end ?? 0)} + حاشیه امن{' '}
              {clockOf(SAFETY_BUFFER)} · هدف پایان {practiceTarget()}
            </p>
          </div>
          <p className="ps-side">
            شخصیت: آرام، دقیق، مسلط، قابل نقد
            <br />
            ادعا: رقابتی در مجموعه بررسی‌شده، نه برتری مطلق
          </p>
        </header>

        {wants('roadmap') && <RoadmapPrint />}
        {wants('deck') && <DeckPrint pageBreak={scope === 'all'} />}
        {wants('cheat') && <CheatPrint pageBreak={scope === 'all'} />}
        {wants('qa') && <QaPrint pageBreak={scope === 'all'} />}
        {wants('checklist') && <ChecklistPrint pageBreak={scope === 'all'} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* نقشه راه دفاع                                                       */
/* ------------------------------------------------------------------ */

function RoadmapPrint() {
  const plan = planSlides(false);

  return (
    <>
      <section className="ps-block">
        <h3>نقشه راه دفاع · اصل حاکم</h3>
        <p className="ps-lead">{governingPrinciple}</p>

        <h4>پنج گزاره‌ای که داور باید در پایان ارائه بتواند بگوید</h4>
        <ol className="ps-list">
          {missionPoints.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ol>

        <h4>چهار چیزی که باید در ذهن داور بماند</h4>
        <ul className="ps-list">
          {memoryTakeaways.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>

        <h4>پنج عدد کلیدی</h4>
        <table>
          <tbody>
            <tr>
              {fiveNumbers.map((f) => (
                <td key={f.label} style={{ textAlign: 'center' }}>
                  <b>{f.n}</b>
                  <br />
                  {f.label}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>

      <section className="ps-block">
        <h3>ساختار جلسه</h3>
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
            <tr>
              <td>شروع جلسه</td>
              <td>۱ تا ۲</td>
              <td>{clockOf(55)}</td>
              <td>عنوان و فهرست هشت‌بخشی</td>
            </tr>
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
              <td>حاشیه امن</td>
              <td>پایان</td>
              <td>{clockOf(SAFETY_BUFFER)}</td>
              <td>مکث، پرسش میان ارائه، اختلال فنی؛ هدف پایان {practiceTarget()}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="ps-block">
        <h3>مرزهای ادعا و آداب پاسخ</h3>

        <h4>پنج مرز ادعا</h4>
        <table>
          <tbody>
            {claimBoundaries.map((c) => (
              <tr key={c.q}>
                <td style={{ width: '38%', fontWeight: 700 }}>{c.q}</td>
                <td>{c.a}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h4>{answerPattern.title}</h4>
        <p>{answerPattern.example}</p>

        <h4>چهار گام پاسخ به پرسش خارج از پایان‌نامه</h4>
        <ul className="ps-list">
          {outOfScopeSteps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>

        <h4>حضور در جلسه پرسش و پاسخ</h4>
        <p>{qaPresence.pattern}</p>
        <p>{qaPresence.speed}</p>
        <p>{qaPresence.person}</p>

        <h4>پنج راهکار تمرین روزهای پیش از دفاع</h4>
        <ul className="ps-list">
          {practiceMethods.map((p) => (
            <li key={p.t}>
              <b>{p.t}: </b>
              {p.d}
            </li>
          ))}
        </ul>

        <p className="ps-lead">{successLine}</p>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* متن کامل ارائه (نوزده اسلاید + اسلاید پشتیبان)                        */
/* ------------------------------------------------------------------ */

function DeckPrint({ pageBreak }: { pageBreak: boolean }) {
  const plan = planSlides(false);
  const optional = slides.filter((s) => s.optional);
  const chapterOf = (id: string) => chapters.find((c) => c.id === id);

  return (
    <>
      <section className={`ps-block ${pageBreak ? 'page-break' : ''}`}>
        <h3>متن کامل ارائه، اسلاید به اسلاید</h3>
        <p className="ps-sub">
          هر اسلاید شامل پنجره زمانی، هدف، محتوای دیداری، متن گفتار و نکات اجرایی است. متن را حفظ نکن؛
          داستان را حفظ کن.
        </p>
      </section>

      {plan.map((s) => (
        <section key={s.num} className="ps-block ps-slide">
          <h4 className="ps-slide-title">
            اسلاید {toPersianDigits(s.num)} · {s.title}
            <span className="ps-slide-meta">
              {chapterOf(s.chapterId) ? `بخش ${chapterOf(s.chapterId)!.num}` : 'شروع جلسه'} · پنجره{' '}
              {clockOf(s.start)} تا {clockOf(s.end)} · مدت {clockOf(s.duration)}
            </span>
          </h4>
          {s.goal && (
            <p>
              <b>هدف: </b>
              {s.goal}
            </p>
          )}
          {s.visual.length > 0 && (
            <>
              <p className="ps-label">روی اسلاید</p>
              <ul className="ps-list">
                {s.visual.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
            </>
          )}
          {s.tex.length > 0 && (
            <>
              <p className="ps-label">فرمول‌ها</p>
              {s.tex.map((f) => (
                <div key={f.tex} className="ps-formula">
                  <TeX tex={f.tex} display />
                  {f.caption && <p className="ps-caption">{f.caption}</p>}
                </div>
              ))}
            </>
          )}
          <p className="ps-label">متن گفتار</p>
          {s.speech.map((p) => (
            <p key={p} className="ps-speech">
              {p}
            </p>
          ))}
          {s.phrase && (
            <p>
              <b>جمله کلیدی: </b>
              {s.phrase}
            </p>
          )}
          {s.notes.length > 0 && (
            <>
              <p className="ps-label">نکات اجرایی</p>
              <ul className="ps-list">
                {s.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </>
          )}
          {s.transition && (
            <p>
              <b>انتقال: </b>
              {s.transition}
            </p>
          )}
        </section>
      ))}

      {optional.length > 0 && (
        <section className="ps-block">
          <h3>اسلایدهای اختیاری و پشتیبان</h3>
          {optional.map((s) => (
            <div key={s.title} className="ps-slide">
              <h4 className="ps-slide-title">
                {s.title}
                {s.backupRef && <span className="ps-slide-meta">{s.backupRef}</span>}
              </h4>
              {s.goal && (
                <p>
                  <b>هدف: </b>
                  {s.goal}
                </p>
              )}
              {s.speech.map((p) => (
                <p key={p} className="ps-speech">
                  {p}
                </p>
              ))}
            </div>
          ))}
        </section>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* برگه تقلب                                                           */
/* ------------------------------------------------------------------ */

function CheatPrint({ pageBreak }: { pageBreak: boolean }) {
  return (
    <>
      <section className={`ps-block ${pageBreak ? 'page-break' : ''}`}>
        <h3>روابط ریاضی (فقط ASCII؛ هنگام گفتن، معنا را بگو نه نمادها را)</h3>
        {coreEquations.map((eq, i) => (
          <div key={eq.id} className="ps-eq">
            <p className="ps-eq-title">
              {toPersianDigits(i + 1)}. {eq.title} ({eq.ref})
            </p>
            <div className="ps-formula">
              <TeX tex={eq.tex} display />
            </div>
            <p>
              <b>معنی: </b>
              {eq.meaning}
            </p>
            <p>
              <b>چطور بگوییم: </b>
              {eq.verbal}
            </p>
            {eq.params.length > 0 && (
              <table>
                <tbody>
                  {eq.params.map((p, j) => (
                    <tr key={j}>
                      <td className="ps-sym">
                        <TeX tex={p.sym} />
                      </td>
                      <td style={{ width: '22%', fontWeight: 700 }}>{p.name}</td>
                      <td>{p.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </section>

      <section className="ps-block">
        <h3>مفاهیم پرکاربرد روز دفاع</h3>
        {conceptCards.map((c) => (
          <div key={c.id} style={{ margin: '2mm 0' }}>
            <p style={{ margin: 0, fontWeight: 700 }}>
              {c.label} · {c.heading}
            </p>
            <ul className="ps-list">
              {c.body.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="ps-block">
        <h3>ارقام کلیدی و مرزهای ادعا</h3>
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

      <section className="ps-block">
        <h3>جدول‌های پشتیبان</h3>
        <h4>نرخ موفقیت هفت مسئله (۳۰ اجرا)</h4>
        <table>
          <thead>
            <tr>
              <th>مسئله</th>
              <th>نرخ موفقیت</th>
              <th>معادل اجرا</th>
            </tr>
          </thead>
          <tbody>
            {reliabilityRows.map((r) => (
              <tr key={r.problem}>
                <td>{r.problem}</td>
                <td>{r.rate}</td>
                <td>{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h4>تحلیل حذف مؤلفه‌ها</h4>
        <table>
          <thead>
            <tr>
              <th>نسخه</th>
              <th>میانگین رتبه</th>
              <th>توضیح</th>
            </tr>
          </thead>
          <tbody>
            {ablationRows.map((r) => (
              <tr key={r.version}>
                <td>{r.version}</td>
                <td>{r.rank}</td>
                <td>{r.note ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h4>اندازه اثر وارا و دلینی در برابر رقبا</h4>
        <table>
          <thead>
            <tr>
              <th>رقیب</th>
              <th>مقدار</th>
              <th>سطح</th>
            </tr>
          </thead>
          <tbody>
            {effectSizeRows.map((r) => (
              <tr key={r.rival}>
                <td className="ps-sym">{r.rival}</td>
                <td>{r.value}</td>
                <td>{r.level}</td>
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
          <b>ساختار پاسخ به داور: </b>ادعا، دلیل، شاهد. سؤال خارج از پایان‌نامه: محدوده را مشخص کن، آنچه
          می‌دانی را بگو، ادعای قطعی نساز.
        </p>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* بانک پرسش داور                                                      */
/* ------------------------------------------------------------------ */

function QaPrint({ pageBreak }: { pageBreak: boolean }) {
  const all = [...qaMain, ...qaHard];
  return (
    <>
      <section className={`ps-block ${pageBreak ? 'page-break' : ''}`}>
        <h3>بانک پرسش داور و پاسخ‌های پیشنهادی</h3>
        {all.map((q) => (
          <div key={q.id} className="ps-qa">
            <p className="ps-qa-q">
              <span className="ps-chip">{q.category}</span> {q.question}
            </p>
            <p className="ps-qa-a">{q.answer}</p>
            {q.keySentence && (
              <p>
                <b>جمله کلیدی: </b>
                {q.keySentence}
              </p>
            )}
            {q.tip && (
              <p>
                <b>نکته: </b>
                {q.tip}
              </p>
            )}
          </div>
        ))}
      </section>

      <section className="ps-block">
        <h3>شبیه‌سازی جلسه پرسش و پاسخ</h3>
        {qaDrill.map((d, i) => (
          <div key={i} className="ps-qa">
            <p className="ps-qa-q">
              <span className="ps-chip">{d.role}</span> {d.q}
            </p>
            <p className="ps-qa-a">{d.a}</p>
          </div>
        ))}
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* چک‌لیست روز دفاع                                                     */
/* ------------------------------------------------------------------ */

function ChecklistPrint({ pageBreak }: { pageBreak: boolean }) {
  return (
    <>
      <section className={`ps-block ${pageBreak ? 'page-break' : ''}`}>
        <h3>چک‌لیست‌های روز دفاع</h3>
        {checklistGroups.map((g) => (
          <div key={g.id} style={{ margin: '2mm 0' }}>
            <h4>{g.title}</h4>
            <ul className="ps-checklist">
              {g.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="ps-block">
        <h3>نگو / بگو</h3>
        <table>
          <thead>
            <tr>
              <th>نگو</th>
              <th>بگو</th>
            </tr>
          </thead>
          <tbody>
            {doDonts.map((d) => (
              <tr key={d.bad}>
                <td>{d.bad}</td>
                <td>{d.good}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

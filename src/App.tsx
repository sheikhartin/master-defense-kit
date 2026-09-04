/**
 * پوسته برنامه: سرویس‌دهنده بافت، سربرگ، ناوبری پنج‌بخشی،
 * حالت تمرکز، چاپ برگه تقلب و اعمال مقیاس خواندن سراسری.
 */

import { useEffect, type ComponentType } from 'react';
import { Eye } from 'lucide-react';
import { AppProvider, readingStyle, useApp } from './lib/app-context';
import Header from './components/Header';
import HomeLab from './labs/HomeLab';
import PracticeLab from './labs/PracticeLab';
import CheatSheetLab from './labs/CheatSheetLab';
import QALab from './labs/QALab';
import ChecklistLab from './labs/ChecklistLab';
import PrintSheet from './components/PrintSheet';
import { warmTex } from './lib/tex';
import { coreEquations } from './data/cheat';
import { slides } from './data/deck';

/** پیش‌گرم‌کردن کش فرمول‌ها در آغاز برنامه: باز شدن برگه تقلب بدون تأخیر */
function warmFormulaCache() {
  const list: Array<{ tex: string; display?: boolean }> = [];
  for (const eq of coreEquations) {
    list.push({ tex: eq.tex, display: eq.display });
    for (const p of eq.params) list.push({ tex: p.sym });
  }
  for (const s of slides) for (const f of s.tex) list.push({ tex: f.tex, display: true });
  warmTex(list);
}

function Shell() {
  const app = useApp();

  /* چاپ */
  useEffect(() => {
    if (!app.printOpen) return;
    document.body.classList.add('printing');
    const finish = () => {
      document.body.classList.remove('printing');
      app.closePrint();
    };
    window.addEventListener('afterprint', finish);
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
    return () => {
      window.removeEventListener('afterprint', finish);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.printOpen]);

  const labs: Record<string, ComponentType> = {
    home: HomeLab,
    practice: PracticeLab,
    cheat: CheatSheetLab,
    qa: QALab,
    checklist: ChecklistLab,
  };
  const Lab = labs[app.tab] ?? HomeLab;

  return (
    <>
      <div className="app-shell flex min-h-screen flex-col">
        <Header />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-12 pt-6 md:px-6 md:pb-16 md:pt-8">
          <div key={app.tab} style={readingStyle(app.textScale, app.lineHeight)}>
            <Lab />
          </div>
        </main>
      </div>

      {/* خروج از حالت تمرکز */}
      {app.focus && (
        <button
          type="button"
          className="focus-exit btn btn-ghost btn-sm"
          onClick={() => app.setFocus(false)}
          title="خروج از حالت تمرکز (کلید F)"
        >
          <Eye className="h-4 w-4" />
          خروج از حالت تمرکز
        </button>
      )}

      {/* محتوای چاپی (روی صفحه پنهان است) */}
      {app.printOpen && <PrintSheet />}
    </>
  );
}

export default function App() {
  useEffect(() => {
    warmFormulaCache();
  }, []);

  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}

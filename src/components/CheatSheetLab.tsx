import React from 'react';
import { FileText, Sigma, Hash, ShieldAlert, Sparkles, BookOpen, CheckCircle2, HelpCircle } from 'lucide-react';
import { keyFacts, coreEquations } from '../data/content';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

export default function CheatSheetLab() {
  const getIcon = (type: string) => {
    switch (type) {
      case 'رابطه': return <Sigma className="w-5 h-5 text-indigo-600" />;
      case 'عدد': return <Hash className="w-5 h-5 text-emerald-600" />;
      case 'مرز ادعا': return <ShieldAlert className="w-5 h-5 text-amber-600" />;
      default: return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* هدر صفحه */}
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-[0_4px_25px_rgb(0,0,0,0.03)] border border-slate-100 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 font-bold rounded-full text-sm mb-4 border border-indigo-100">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>خلاصه فشرده شب دفاع</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-3 tracking-tight">برگه تقلب و فرمول‌های کلیدی BCOA</h2>
          <p className="text-slate-600 font-medium text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            روابط ریاضی اصیل، نحوه تشریح مفهومی به زبان فارسی، و ارقام کلیدی که بدون استرس باید بر آن‌ها مسلط باشید.
          </p>
        </div>
      </div>

      {/* بخش اختصاصی و ویژه: روابط ریاضی اصیل و نحوه توضیح فارسی به داوران */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/20">
            <Sigma className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-800">روابط ریاضی اصیل BCOA و نحوه بیان بیانی</h3>
            <p className="text-slate-500 text-sm font-medium mt-0.5">مطابق مقاله اصلی منتشرشده — همراه با راهنمای گفتار شفاهی بدون روخوانی نمادها</p>
          </div>
        </div>

        <div className="space-y-6">
          {coreEquations.map((eq, idx) => (
            <div 
              key={eq.id} 
              className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-[0_6px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_10px_40px_rgb(0,0,0,0.06)] transition-all duration-300 relative overflow-hidden"
            >
              {/* نشانگر ردیف */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-black text-sm flex items-center justify-center border border-indigo-100">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-xl font-extrabold text-slate-800">{eq.title}</h4>
                    <span className="text-xs font-semibold text-slate-400 font-mono" dir="ltr">{eq.englishTitle}</span>
                  </div>
                </div>
                <span className="px-3 py-1 bg-slate-50 text-slate-600 text-xs font-bold rounded-lg border border-slate-200/60">
                  فرمول استاندارد مقاله
                </span>
              </div>

              {/* نمایش فرمول به صورت بزرگ و ریاضی در کادر مدرن */}
              <div className="p-5 md:p-6 bg-slate-900 text-white rounded-2xl mb-6 shadow-inner flex items-center justify-center overflow-x-auto text-lg md:text-2xl font-mono text-center">
                <Latex>{`$$${eq.formula}$$`}</Latex>
              </div>

              {/* کادر طلایی: نحوه توضیح به زبان فارسی برای داوران */}
              <div className="mb-6 p-5 md:p-6 bg-gradient-to-br from-indigo-50/90 via-blue-50/50 to-white rounded-2xl border border-indigo-200/70 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1.5 h-full bg-indigo-600"></div>
                <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-base mb-2">
                  <BookOpen className="w-5 h-5 text-indigo-600 shrink-0" />
                  <span>چگونه این رابطه را در جلسه دفاع به زبان فارسی توضیح دهیم؟ (بدون روخوانی فرمول)</span>
                </div>
                <p className="text-slate-800 font-medium text-base md:text-lg leading-relaxed text-right">
                  {eq.verbalExplanation}
                </p>
                <div className="mt-3 pt-3 border-t border-indigo-100/70 text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>توصیه اساتید: همیشه بر مفهوم فیزیکی و چرایی حرکت تأکید کنید، نه خواندن تک‌تک حروف انگلیسی.</span>
                </div>
              </div>

              {/* جدول تشریح تک‌تک پارامترها */}
              <div>
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">تشریح پارامترهای رابطه</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {eq.parameters.map((param, pIdx) => (
                    <div key={pIdx} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono font-bold text-indigo-700 text-sm bg-white px-2 py-0.5 rounded border border-slate-200/60 shadow-2xs" dir="ltr">
                          <Latex>{`$${param.symbol}$`}</Latex>
                        </span>
                        <span className="text-xs font-extrabold text-slate-700">{param.name}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed text-right">{param.description}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* بخش مفاهیم کلیدی و پاسخ سریع به سوالات داوران */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_rgb(0,0,0,0.03)] space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-600/20">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-800">سه مفهوم پرکاربرد در روز دفاع (فریدمن، ویلکاکسون، نگاشت گسسته)</h3>
            <p className="text-slate-500 text-sm font-medium mt-0.5">تسلط ۳۰ ثانیه‌ای برای پاسخ مقتدرانه به داوران</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* فریدمن */}
          <div className="p-5 bg-slate-50/90 rounded-2xl border border-slate-200/70 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-lg">رتبه فریدمن (۱.۰۹)</span>
                <span className="text-xs font-mono text-slate-400">Friedman Test</span>
              </div>
              <h4 className="font-extrabold text-slate-800 text-base mb-2">چرا رتبه فریدمن و نه میانگین خام؟</h4>
              <p className="text-sm text-slate-600 leading-relaxed text-right">
                چون توابع محک مقیاس‌های بسیار نامتجانسی دارند (از ۰.۰۰۱ تا ۱۰۰۰۰) و جمع زدن مقادیر خام، نتایج را به نفع توابع با مقیاس بزرگ منحرف می‌کند. رتبه‌بندی در هر تابع و میانگین‌گیری از رتبه‌ها، ارزیابی عادلانه و استانداردی ایجاد می‌کند. ۱.۰۹ یعنی تقریباً در تمام ۳۲ تابع رتبه ۱ کسب شده است.
              </p>
            </div>
          </div>

          {/* ویلکاکسون */}
          <div className="p-5 bg-slate-50/90 rounded-2xl border border-slate-200/70 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg">آزمون ویلکاکسون</span>
                <span className="text-xs font-mono text-slate-400">Wilcoxon Test</span>
              </div>
              <h4 className="font-extrabold text-slate-800 text-base mb-2">اثبات معناداری آماری</h4>
              <p className="text-sm text-slate-600 leading-relaxed text-right">
                آزمون ناپارامتری زوجی با سطح اطمینان ۹۵٪ (<Latex>{'$p\\text{-value} < ۰.۰۵$'}</Latex>). نشان می‌دهد برتری BCOA نسبت به تک‌تک ۹ الگوریتم رقیب تصادفی نبوده و با فرضیه صفر رد شده است؛ یعنی قطعیت علمی برتری عملکرد الگوریتم اثبات شده است.
              </p>
            </div>
          </div>

          {/* توابع نگاشت گسسته */}
          <div className="p-5 bg-slate-50/90 rounded-2xl border border-slate-200/70 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg">مسائل گسسته و دودویی</span>
                <span className="text-xs font-mono text-slate-400">Transfer Functions</span>
              </div>
              <h4 className="font-extrabold text-slate-800 text-base mb-2">نحوه حل مسائل باینری با هسته پیوسته</h4>
              <p className="text-sm text-slate-600 leading-relaxed text-right">
                با استفاده از توابع انتقالی S-شکل (مانند سیگموئید) یا V-شکل برای تبدیل بردار پیوسته به احتمال [۰, ۱] و اعمال آستانه ۰ یا ۱، به همراه مکانیزم‌های بازسازی (Repair) برای قیود مسئله؛ ضمناً نسخه کاملاً گسسته جزو برنامه‌های آتی پژوهش است.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* داستان در یک خط */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_rgb(0,0,0,0.03)]">
        <h3 className="text-xl font-extrabold text-slate-800 mb-6 border-b border-slate-100 pb-3">داستان در یک خط</h3>
        <div className="flex flex-wrap gap-2 md:gap-3 text-base md:text-lg font-bold text-slate-700 bg-slate-50/70 p-5 rounded-2xl justify-center items-center border border-slate-200/60">
          <span className="bg-indigo-100/70 text-indigo-800 px-3.5 py-1.5 rounded-xl">مسئله</span> <span className="text-slate-400 font-bold">←</span>
          <span className="bg-indigo-100/70 text-indigo-800 px-3.5 py-1.5 rounded-xl">شکاف</span> <span className="text-slate-400 font-bold">←</span>
          <span className="bg-rose-100/70 text-rose-800 px-3.5 py-1.5 rounded-xl">BCOA</span> <span className="text-slate-400 font-bold">←</span>
          <span className="bg-indigo-100/70 text-indigo-800 px-3.5 py-1.5 rounded-xl">ریاضیات</span> <span className="text-slate-400 font-bold">←</span>
          <span className="bg-indigo-100/70 text-indigo-800 px-3.5 py-1.5 rounded-xl">آزمایش</span> <span className="text-slate-400 font-bold">←</span>
          <span className="bg-indigo-100/70 text-indigo-800 px-3.5 py-1.5 rounded-xl">شواهد</span> <span className="text-slate-400 font-bold">←</span>
          <span className="bg-amber-100/70 text-amber-800 px-3.5 py-1.5 rounded-xl">محدودیت</span> <span className="text-slate-400 font-bold">←</span>
          <span className="bg-emerald-100/70 text-emerald-800 px-3.5 py-1.5 rounded-xl">نتیجه</span>
        </div>
      </div>

      {/* حقایق و اعداد کلیدی حفظی */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_rgb(0,0,0,0.03)]">
        <h3 className="text-xl font-extrabold text-slate-800 mb-6 border-b border-slate-100 pb-3">ارقام و مرزهای ادعا (حقایق سریع)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {keyFacts.map((fact, idx) => (
            <div key={idx} className="flex gap-4 p-5 bg-slate-50/80 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all duration-200">
              <div className="shrink-0 bg-white p-3 rounded-xl border border-slate-200/70 flex items-center justify-center h-fit shadow-2xs">
                {getIcon(fact.type)}
              </div>
              <div className="flex flex-col justify-center">
                <h4 className="text-xs font-bold text-slate-500 mb-1 tracking-wide">{fact.label}</h4>
                <div className="text-base md:text-lg font-extrabold text-slate-800 leading-relaxed text-right">
                  <Latex>{fact.value}</Latex>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* پیام روحیه‌ای و شخصیت دفاع */}
      <div className="p-8 bg-slate-900 text-white rounded-3xl text-center space-y-3 relative overflow-hidden shadow-xl shadow-slate-900/10">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/15 to-purple-500/15 pointer-events-none"></div>
        <h3 className="text-base font-bold text-indigo-300 relative z-10">شخصیت شما در روز دفاع</h3>
        <p className="text-2xl md:text-3xl font-black tracking-wider relative z-10">آرام. دقیق. مسلط. قابل نقد.</p>
      </div>
    </div>
  );
}


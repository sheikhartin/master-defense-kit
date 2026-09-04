import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, ChevronLeft, Clock, Timer, Eye, MessageSquare, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { slides } from '../data/content';
import { motion, AnimatePresence } from 'motion/react';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';
import { formatTimePersian, toPersianDigits } from '../utils/persian';

export default function PresentationLab() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  
  // تایمر اختصاصی اسلاید جاری (تایمر اصلی و مورد تأکید کاربر)
  const [isSlideRunning, setIsSlideRunning] = useState(false);
  const [slideSeconds, setSlideSeconds] = useState(0);

  // تایمر کل ارائه (به‌صورت زمینه و بدون اشغال فضا)
  const [isTotalRunning, setIsTotalRunning] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(0);

  const slide = slides[currentSlideIndex];

  // تایمر اسلاید جاری
  useEffect(() => {
    let interval: number;
    if (isSlideRunning) {
      interval = window.setInterval(() => {
        setSlideSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => window.clearInterval(interval);
  }, [isSlideRunning]);

  // تایمر کل ارائه
  useEffect(() => {
    let interval: number;
    if (isTotalRunning) {
      interval = window.setInterval(() => {
        setTotalSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => window.clearInterval(interval);
  }, [isTotalRunning]);

  // ریست تایمر اسلاید جاری
  const resetSlideTimer = () => {
    setSlideSeconds(0);
  };

  // ریست تایمر کل ارائه
  const resetTotalTimer = () => {
    setTotalSeconds(0);
    setIsTotalRunning(false);
  };

  // سوئیچ پلی/پاز تایمر اسلاید
  const toggleSlideTimer = () => {
    setIsSlideRunning((prev) => !prev);
    // در صورت استارت اسلاید، تایمر کل نیز در پس‌زمینه فعال می‌شود
    if (!isSlideRunning && !isTotalRunning) {
      setIsTotalRunning(true);
    }
  };

  // تعویض اسلاید با ریست خودکار زمان اسلاید
  const goToSlide = useCallback((idx: number) => {
    if (idx >= 0 && idx < slides.length) {
      setCurrentSlideIndex(idx);
      setSlideSeconds(0);
    }
  }, []);

  const nextSlide = useCallback(() => {
    if (currentSlideIndex < slides.length - 1) {
      goToSlide(currentSlideIndex + 1);
    }
  }, [currentSlideIndex, goToSlide]);

  const prevSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      goToSlide(currentSlideIndex - 1);
    }
  }, [currentSlideIndex, goToSlide]);

  // میانبرهای صفحه‌کلید برای کنترل روان حین تمرین
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // اگر کاربر داخل فیلد متنی تایپ نمی‌کند
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;

      if (e.code === 'Space') {
        e.preventDefault();
        toggleSlideTimer();
      } else if (e.code === 'ArrowLeft') {
        // در چیدمان فارسی راست‌به‌چپ، کلید چپ اسلاید بعدی است
        e.preventDefault();
        nextSlide();
      } else if (e.code === 'ArrowRight') {
        // در چیدمان فارسی راست‌به‌چپ، کلید راست اسلاید قبلی است
        e.preventDefault();
        prevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, isSlideRunning, isTotalRunning]);

  // بررسی عبور از زمان پیشنهادی اسلاید
  const isOverTime = slide.duration ? slideSeconds > slide.duration : false;

  return (
    <div className="flex flex-col gap-6">
      
      {/* نوار کنترل شناور باریک، مینیمال و بدون اشغال فضای اضافی */}
      <div className="sticky top-[68px] z-30 bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-[0_4px_25px_rgb(0,0,0,0.04)] rounded-2xl px-4 py-2.5 transition-all">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* سمت راست (RTL): ناوبری سریع اسلایدها */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevSlide}
              disabled={currentSlideIndex === 0}
              className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 disabled:pointer-events-none transition-all"
              title="اسلاید قبلی (کلید جهت‌نمای راست)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="px-3.5 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200/70 font-bold text-slate-700 text-sm select-none flex items-center gap-1.5">
              <span className="text-slate-500 text-xs">اسلاید</span>
              <span className="text-indigo-700 font-extrabold text-base">{toPersianDigits(currentSlideIndex + 1)}</span>
              <span className="text-slate-400 font-normal text-xs">از</span>
              <span className="text-slate-600 font-bold text-sm">{toPersianDigits(slides.length)}</span>
            </div>

            <button
              onClick={nextSlide}
              disabled={currentSlideIndex === slides.length - 1}
              className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 disabled:pointer-events-none transition-all"
              title="اسلاید بعدی (کلید جهت‌نمای چپ)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* مرکز: تایمر اسلاید جاری (تک تایمر برجسته، دقیق و مینیمال) */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-3 px-4 py-1.5 rounded-xl border transition-all ${
              isOverTime 
                ? 'bg-rose-50/80 border-rose-200 text-rose-800' 
                : isSlideRunning
                ? 'bg-indigo-50/90 border-indigo-200 text-indigo-900 shadow-sm'
                : 'bg-slate-50/90 border-slate-200 text-slate-700'
            }`}>
              <Timer className={`w-4 h-4 ${isOverTime ? 'text-rose-600 animate-pulse' : 'text-indigo-600'}`} />
              
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-slate-500 hidden sm:inline">زمان اسلاید:</span>
                <span className="text-xl md:text-2xl font-black font-mono tracking-wider tabular-nums">
                  {formatTimePersian(slideSeconds)}
                </span>
              </div>

              {slide.duration && (
                <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                  isOverTime ? 'bg-rose-100 text-rose-700' : 'bg-slate-200/70 text-slate-600'
                }`}>
                  سقف: {toPersianDigits(slide.duration)} ثانیه
                </span>
              )}
            </div>

            {/* دکمه‌های کنترل تایمر اسلاید */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleSlideTimer}
                title={isSlideRunning ? "توقف موقت زمان اسلاید (Space)" : "شروع زمان اسلاید (Space)"}
                className={`p-2 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center ${
                  isSlideRunning
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                }`}
              >
                {isSlideRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                onClick={resetSlideTimer}
                title="صفر کردن زمان این اسلاید"
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-xs"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* سمت چپ (RTL): نشانگر مینیاتوری زمان کل (بدون اشغال فضای اضافی) */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>کل ارائه:</span>
              <span className="font-mono text-slate-800 font-bold">{formatTimePersian(totalSeconds)}</span>
            </div>
            
            <button
              onClick={resetTotalTimer}
              title="صفر کردن زمان کل ارائه"
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* محتوای اسلاید انتخاب شده */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, filter: 'blur(3px)', y: 10 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          exit={{ opacity: 0, filter: 'blur(3px)', y: -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* ستون اصلی محتوای اسلاید */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_4px_25px_rgb(0,0,0,0.03)] border border-slate-200/80 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

              <div className="relative z-10">
                {/* بخش و زمان پیشنهادی */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 text-indigo-700 text-xs md:text-sm font-bold rounded-xl mb-4 border border-indigo-100">
                  <span>{slide.section}</span>
                  <span className="text-indigo-300">|</span>
                  <span>زمان پیشنهادی اسلاید: {slide.time}</span>
                </div>

                {/* عنوان اسلاید */}
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-5 leading-tight">
                  <Latex>{slide.title}</Latex>
                </h2>
                
                {/* هدف اسلاید */}
                {slide.goal && (
                  <div className="mb-6 p-4 md:p-5 bg-gradient-to-r from-amber-50 to-amber-50/20 border border-amber-200/60 rounded-2xl text-amber-900 shadow-2xs relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-400"></div>
                    <strong className="block text-xs font-bold text-amber-700 mb-1">هدف محوری این اسلاید</strong> 
                    <span className="font-medium text-amber-900 text-base md:text-lg leading-relaxed">
                      <Latex>{slide.goal}</Latex>
                    </span>
                  </div>
                )}

                <div className="space-y-6">
                  {/* پیشنهاد بصری اسلاید */}
                  <div>
                    <h3 className="flex items-center gap-2 text-base md:text-lg font-bold text-slate-800 mb-3">
                      <div className="p-1.5 bg-sky-100 text-sky-700 rounded-lg">
                        <Eye className="w-4 h-4" />
                      </div>
                      پیشنهاد بصری (طراحی روی اسلاید)
                    </h3>
                    <div className="p-5 md:p-6 bg-slate-50/90 rounded-2xl text-slate-700 whitespace-pre-line leading-relaxed border border-slate-200/70 text-base">
                      <Latex>{slide.visual}</Latex>
                    </div>
                  </div>

                  {/* متن گفتاری شفاهی */}
                  <div>
                    <h3 className="flex items-center gap-2 text-base md:text-lg font-bold text-slate-800 mb-3">
                      <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      متن گفتاری (کلمات پیشنهادی برای ارائه)
                    </h3>
                    <div className="p-5 md:p-6 bg-gradient-to-br from-indigo-50/70 to-blue-50/40 border border-indigo-100 rounded-2xl text-slate-800 whitespace-pre-line leading-relaxed text-base md:text-lg">
                      <Latex>{slide.speech}</Latex>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ستون کناری: نکات کلیدی، خطوط قرمز و نقشه راه اسلایدها */}
          <div className="space-y-6">
            {/* یادداشت محرمانه و خطوط قرمز */}
            <div className="bg-white p-6 rounded-3xl shadow-[0_4px_25px_rgb(0,0,0,0.03)] border border-slate-200/80 relative overflow-hidden">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4 relative z-10">
                <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                </div>
                یادداشت‌های محرمانه و خطوط قرمز
              </h3>
              {slide.notes ? (
                <div className="p-4 bg-rose-50/70 text-rose-900 rounded-2xl text-sm leading-relaxed whitespace-pre-line border border-rose-200/60 relative z-10 font-medium">
                  <Latex>{slide.notes}</Latex>
                </div>
              ) : (
                <div className="text-slate-400 text-sm font-medium italic relative z-10 px-1">
                  نکته حساسی برای این اسلاید ثبت نشده است.
                </div>
              )}
            </div>

            {/* دسترسی سریع به اسلایدها (Outline) */}
            <div className="bg-white p-6 rounded-3xl shadow-[0_4px_25px_rgb(0,0,0,0.03)] border border-slate-200/80 hidden lg:block">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">نقشه راه ۲۰ اسلاید</h3>
              <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
                {slides.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => goToSlide(idx)}
                    className={`w-full text-right px-3 py-2 rounded-xl text-xs md:text-sm transition-all duration-150 flex items-center ${
                      idx === currentSlideIndex 
                        ? 'bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-600/25' 
                        : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-indigo-600'
                    }`}
                  >
                    <span className={`inline-block min-w-[24px] text-right font-bold ml-1.5 ${
                      idx === currentSlideIndex ? 'text-indigo-200' : 'text-slate-400'
                    }`}>
                      {toPersianDigits(idx + 1)}.
                    </span> 
                    <span className="truncate">{s.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

        </motion.div>
      </AnimatePresence>
    </div>
  );
}

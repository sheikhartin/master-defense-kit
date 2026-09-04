import React, { useState } from 'react';
import { HelpCircle, ChevronDown, CheckCircle, AlertTriangle } from 'lucide-react';
import { qas } from '../data/content';
import { motion, AnimatePresence } from 'motion/react';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

export default function QALab() {
  const [openId, setOpenId] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>('همه');

  const categories = ['همه', ...Array.from(new Set(qas.map(q => q.difficulty)))];

  const filteredQas = filter === 'همه' ? qas : qas.filter(q => q.difficulty === filter);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-3">شبیه‌ساز پرسش‌های داوران</h2>
        <p className="text-slate-500 font-medium mb-8">در این بخش، سؤالات احتمالی داوران دسته‌بندی شده‌اند. ابتدا سعی کنید خودتان پاسخ دهید، سپس پاسخ پیشنهادی را بررسی کنید.</p>
        
        <div className="flex flex-wrap gap-3">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border ${
                filter === cat 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredQas.map((qa) => (
          <div 
            key={qa.id} 
            className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
          >
            <button
              onClick={() => setOpenId(openId === qa.id ? null : qa.id)}
              className="w-full text-right p-6 flex items-start justify-between gap-4 hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                  openId === qa.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
                } transition-colors`}>
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div className={`font-bold leading-relaxed text-lg transition-colors ${openId === qa.id ? 'text-indigo-900' : 'text-slate-800'}`}>
                  <Latex>{qa.question}</Latex>
                </div>
              </div>
              <ChevronDown 
                className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ease-in-out ${
                  openId === qa.id ? 'rotate-180 text-indigo-500' : ''
                }`} 
              />
            </button>

            <AnimatePresence>
              {openId === qa.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-0 border-t border-slate-50 bg-slate-50/30">
                    <div className="mt-5 p-5 bg-gradient-to-br from-indigo-50/80 to-blue-50/50 border border-indigo-100/60 rounded-2xl shadow-sm">
                      <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-800 mb-3">
                        <CheckCircle className="w-4 h-4" />
                        پاسخ پیشنهادی
                      </h4>
                      <div className="text-slate-800 text-lg leading-relaxed">
                        <Latex>{qa.answer}</Latex>
                      </div>
                    </div>

                    {qa.notes && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-amber-50/30 border border-amber-200/50 rounded-2xl shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-1 h-full bg-amber-400"></div>
                        <h4 className="flex items-center gap-2 text-sm font-bold text-amber-800 mb-2">
                          <AlertTriangle className="w-4 h-4" />
                          نکته راهبردی
                        </h4>
                        <div className="text-amber-900 font-medium leading-relaxed">
                          <Latex>{qa.notes}</Latex>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { CheckSquare, XCircle, CheckCircle2, Check } from 'lucide-react';
import { checklists, dosAndDonts } from '../data/content';

export default function ChecklistLab() {
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bcoa_checked_items');
      if (saved) return JSON.parse(saved);
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('bcoa_checked_items', JSON.stringify(checkedItems));
  }, [checkedItems]);

  const toggleCheck = (id: number) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-6 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
              <CheckSquare className="w-6 h-6" />
            </div>
            چک‌لیست‌های اجرایی
          </h2>
          
          <div className="space-y-6">
            {checklists.map((category, idx) => (
              <div key={idx} className="bg-gradient-to-br from-slate-50 to-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-5 text-lg">{category.title}</h3>
                <ul className="space-y-4">
                  {category.items.map(item => {
                    const isChecked = !!checkedItems[item.id];
                    return (
                      <li 
                        key={item.id} 
                        className="flex items-start gap-4 cursor-pointer group"
                        onClick={() => toggleCheck(item.id)}
                      >
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all shadow-sm ${
                          isChecked ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-slate-300 group-hover:border-indigo-400'
                        }`}>
                          <Check className={`w-4 h-4 text-white transition-opacity ${isChecked ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
                        </div>
                        <span className={`font-medium leading-relaxed transition-colors select-none ${isChecked ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                          {item.text}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-3">نبایدها و جایگزین‌ها</h2>
          <p className="text-slate-500 font-medium mb-8">به جای جملات مطلق و خطرناک، از جایگزین‌های دقیق و کنترل‌شده استفاده کنید.</p>
          
          <div className="space-y-5">
            {dosAndDonts.map((item, idx) => (
              <div key={idx} className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="bg-rose-50/80 p-5 border-b border-rose-100/60 flex gap-4">
                  <XCircle className="w-6 h-6 text-rose-500 shrink-0 mt-1" />
                  <div>
                    <span className="text-xs font-bold text-rose-600 uppercase mb-1 block tracking-wider">ممنوع</span>
                    <p className="text-rose-900 line-through decoration-rose-300/80 text-lg">{item.dont}</p>
                  </div>
                </div>
                <div className="bg-emerald-50/80 p-5 flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-1" />
                  <div>
                    <span className="text-xs font-bold text-emerald-600 uppercase mb-1 block tracking-wider">جایگزین ایمن</span>
                    <p className="text-emerald-900 font-bold text-lg leading-relaxed">{item.do}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

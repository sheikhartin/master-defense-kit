import React from 'react';
import { LayoutDashboard, GraduationCap, ListChecks, HelpCircle } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  const navItems = [
    { id: 'presentation', label: 'آزمایشگاه ارائه', icon: LayoutDashboard },
    { id: 'qa', label: 'شبیه‌ساز داور', icon: HelpCircle },
    { id: 'checklist', label: 'چک‌لیست‌ها و ترفندها', icon: ListChecks },
    { id: 'cheatSheet', label: 'برگه تقلب', icon: GraduationCap },
  ];

  return (
    <header className="bg-[#FDFBF7]/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between py-4">
          <div className="flex items-center gap-4 mb-4 md:mb-0 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shadow-sm border border-indigo-100">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">آمادگی دفاع ارشد BCOA</h1>
                <p className="text-sm text-slate-500 font-medium">پلتفرم تمرین سناریوی جلسه دفاع</p>
              </div>
            </div>
            <div className="md:hidden">
              <PWAInstallButton />
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <nav className="flex gap-1 bg-slate-100/80 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto hide-scrollbar border border-slate-200 shadow-inner">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                      isActive 
                        ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
            <div className="hidden md:block">
              <PWAInstallButton />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

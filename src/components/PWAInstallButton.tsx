import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition"
      >
        <Download className="w-4 h-4" />
        نصب اپلیکیشن
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          <Download className="w-4 h-4" />
          نصب (iOS)
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir="rtl">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold text-slate-900 mb-4">نصب در آیفون / آیپد</h3>
              <p className="text-sm text-slate-600 leading-relaxed space-y-2">
                <span className="block">۱. روی دکمه <strong>Share</strong> در نوار پایین سافاری ضربه بزنید.</span>
                <span className="block">۲. به پایین اسکرول کنید و <strong>Add to Home Screen</strong> را انتخاب کنید.</span>
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-lg bg-slate-100 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-200 transition"
              >
                بستن
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

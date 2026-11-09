'use client';

import React from 'react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  isRtl: boolean;
}

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  isRtl,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-[999998] bg-black/40 backdrop-blur-xs" 
        onClick={onClose} 
      />

      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        style={{ top: '88px', right: '16px' }}
        className={`fixed z-[999999] w-80 sm:w-96 p-5 rounded-3xl shadow-2xl border space-y-4 animate-in fade-in zoom-in-95 duration-150 ${
          isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-black/80' : 'bg-white border-sky-100 text-slate-900 shadow-2xl'
        }`}
      >
        <div className="flex items-center justify-between border-b pb-3 border-slate-700/20">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📱</span>
            <h3 className="font-black text-base sm:text-lg">
              {isRtl ? 'تثبيت تطبيق iMedia' : 'Install iMedia App'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-rose-500 font-bold text-lg cursor-pointer px-1.5"
          >
            ✕
          </button>
        </div>

        {/* تم تكبير حجم نص الوصف بنسبة 20% */}
        <p className="text-sm sm:text-base font-semibold leading-relaxed opacity-90">
          {isRtl
            ? 'للاستخدام السريع وبدون إنترنت، اتبع الخطوات التالية:'
            : 'For quick offline use, follow the steps below:'}
        </p>

        <div className="rounded-2xl overflow-hidden border border-sky-500/30 shadow-md bg-black/5 flex justify-center p-2">
          <img
            src="/images/phone.png"
            alt="Installation Guide"
            className="w-full h-auto max-h-48 object-contain rounded-xl"
            onError={(e) => {
              // إخفاء الصورة في حال حدث أي خطأ بالمسار لتجنب ظهور الأيقونة التالفة
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* تم تكبير حجم الخطوط بنسبة 25% وضبط محاذاة الأرقام لتتطابق مع النصوص بشكل مستوٍ ومنتظم */}
        <div className="space-y-3.5 font-bold">
          <div className="flex items-start gap-3 opacity-95">
            <span className="text-sky-500 font-black text-sm sm:text-base flex-shrink-0 leading-tight">1.</span>
            <span className="text-sm sm:text-base leading-snug">
              {isRtl ? 'اضغط على خيارات المتصفح (النقاط الثلاث أعلى الشاشة).' : 'Tap browser options (three dots at the top).'}
            </span>
          </div>
          <div className="flex items-start gap-3 opacity-95">
            <span className="text-sky-500 font-black text-sm sm:text-base flex-shrink-0 leading-tight">2.</span>
            <span className="text-sm sm:text-base leading-snug">
              {isRtl ? 'اختر خيار التثبيت Install.' : 'Select Install.'}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-sky-600/30 cursor-pointer transition-all"
        >
          {isRtl ? 'حسناً، فهمت' : 'Got it'}
        </button>
      </div>
    </>
  );
};
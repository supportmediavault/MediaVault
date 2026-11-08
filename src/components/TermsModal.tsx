'use client';

import React, { useRef, useEffect } from 'react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: string;
  isDarkMode?: boolean;
}

export const TermsModal: React.FC<TermsModalProps> = ({ 
  isOpen, 
  onClose, 
  lang = 'en', 
  isDarkMode = false 
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isRtl = lang === 'ar';

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '50px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        width: '92%',
        maxWidth: '550px',
      }}
      className="animate-in fade-in slide-in-from-bottom-5 duration-200"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div 
        ref={modalRef}
        className={`w-full rounded-3xl p-5 shadow-2xl border transition-all ${
          isDarkMode 
            ? 'bg-slate-900/95 border-slate-700 text-slate-100 shadow-black/90 backdrop-blur-xl' 
            : 'bg-white/95 border-sky-200 text-slate-900 shadow-sky-900/20 backdrop-blur-xl'
        }`}
      >
        <div className="flex justify-between items-center pb-3 border-b border-slate-500/15">
          {/* تم إزالة الـ font-black وجعله عادياً */}
          <h3 className="text-sm font-medium text-sky-600 dark:text-sky-400 flex items-center gap-2">
            <span className="text-base">📜</span> 
            <span>{isRtl ? 'شروط الاستخدام والخصوصية' : 'Terms & Privacy'}</span>
          </h3>
          <button 
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-slate-500/10 hover:bg-rose-500/20 hover:text-rose-500 flex items-center justify-center text-slate-400 font-bold text-xs transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="py-3 max-h-[40vh] overflow-y-auto space-y-3 text-xs leading-relaxed custom-scrollbar">
          <div className={`p-3.5 rounded-2xl border space-y-1.5 ${isDarkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200/80'}`}>
            <h4 className="font-bold text-sky-600 dark:text-sky-400 text-xs">
              {isRtl ? '1. سياسة الخصوصية (Privacy First)' : '1. Privacy Policy'}
            </h4>
            <p className="opacity-90 leading-relaxed text-[11px]">
              {isRtl 
                ? 'نحن نؤمن بأن خصوصية بياناتك حق أساسي. جميع عمليات تحويل ومعالجة الملفات تتم محلياً بالكامل داخل متصفحك باستخدام تقنيات الـ WebAssembly دون رفع أي ملفات لخارج جهازك.'
                : 'All file conversions take place locally inside your browser using WebAssembly. Files are never uploaded or stored externally.'}
            </p>
          </div>

          <div className={`p-3.5 rounded-2xl border space-y-1.5 ${isDarkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200/80'}`}>
            <h4 className="font-bold text-sky-600 dark:text-sky-400 text-xs">
              {isRtl ? '2. إخلاء المسؤولية وشروط الاستخدام' : '2. Terms of Use & Disclaimer'}
            </h4>
            <p className="opacity-90 leading-relaxed text-[11px]">
              {isRtl 
                ? 'الخدمة مُقدمة "كما هي" دون أي ضمانات صريح أو ضمنية. المستخدم يتحمل المسؤولية القانونية الكاملة عن الحقوق الفكرية للملفات المُعالجَة.'
                : 'Service provided "as is" without warranties. Users assume full legal responsibility for processed files.'}
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-500/15 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-black text-xs transition-all shadow-md shadow-sky-500/25 cursor-pointer"
          >
            {isRtl ? 'فهمت وموافق' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
};
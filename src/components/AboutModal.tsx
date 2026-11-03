'use client';

import React, { useRef, useEffect } from 'react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: string;
  isDarkMode?: boolean;
}

export const AboutModal: React.FC<AboutModalProps> = ({ 
  isOpen, 
  onClose, 
  lang = 'en', 
  isDarkMode = false 
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isRtl = lang === 'ar';

  return (
    <div 
      ref={modalRef}
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '24px',
        width: '400px',
        maxWidth: '92vw',
        zIndex: 99999,
      }}
      className={`rounded-2xl p-5 shadow-2xl border transition-all ${
        isDarkMode 
          ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-black' 
          : 'bg-white border-sky-300 text-slate-900 shadow-2xl'
      }`}
    >
      <div className="flex justify-between items-center pb-3 border-b border-slate-500/20">
        <h3 className="text-[13px] font-medium text-sky-600 dark:text-sky-400 flex items-center gap-2">
          <span className="text-base">ℹ️</span> {isRtl ? 'من نحن' : 'About Us'}
        </h3>
        <button 
          onClick={onClose}
          className="w-6 h-6 rounded-full bg-slate-500/10 hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center text-slate-400 font-bold text-xs transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>

      <div className="py-3 space-y-3 text-xs leading-relaxed">
        <div className={`p-3.5 rounded-xl border space-y-2 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <h4 className="font-semibold text-sky-600 dark:text-sky-400 text-xs">
            {isRtl ? 'عن منصة iMedia' : 'About iMedia'}
          </h4>
          <p className="opacity-90 leading-relaxed">
            {isRtl 
              ? 'نحن منصة متكاملة لتحويل ومعالجة الوسائط مباشرة عبر متصفحك. هدفنا توفير وسيلة سريعة وآمنة لتحويل ملفات الصور، الصوت، والفيديو مع ضمان الخصوصية الكاملة لمعالجة الملفات على جهازك الشخصي.'
              : 'iMedia is your ultimate browser-based media conversion engine, designed to provide a fast, secure, and seamless way to convert files directly on your device with absolute privacy.'}
          </p>
        </div>

        <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <p className="opacity-80 text-[11px] leading-relaxed">
            {isRtl
              ? 'الخدمة متاحة للاستخدام المباشر مع التركيز التام على أمان وسرية بياناتك.'
              : 'The service is available for direct use with a strict focus on your data security and confidentiality.'}
          </p>
        </div>
      </div>
    </div>
  );
};
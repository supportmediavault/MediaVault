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
        width: '440px',
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
          <span className="text-base">📜</span> {isRtl ? 'شروط الاستخدام والخصوصية' : 'Terms & Privacy'}
        </h3>
        <button 
          onClick={onClose}
          className="w-6 h-6 rounded-full bg-slate-500/10 hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center text-slate-400 font-bold text-xs transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>

      <div className="py-3 max-h-85 overflow-y-auto space-y-3 text-xs leading-relaxed">
        <div className={`p-3.5 rounded-xl border space-y-1.5 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <h4 className="font-semibold text-sky-600 dark:text-sky-400 text-xs">
            {isRtl ? '1. سياسة الخصوصية (Privacy Policy)' : '1. Privacy Policy'}
          </h4>
          <p className="opacity-90 leading-relaxed text-[11px]">
            {isRtl 
              ? 'نحن نؤمن بأن خصوصية بياناتك حق أساسي. جميع عمليات تحويل ومعالجة الملفات (صور، صوت، فيديو) تتم محلياً بالكامل داخل متصفحك باستخدام تقنيات الـ WebAssembly. لا يتم رفع أو تخزين أي من ملفاتك الشخصية على أي خوادم خارجية مطلقاً.'
              : 'We believe your data privacy is fundamental. All file conversions (images, audio, video) take place locally inside your browser using WebAssembly. Your files are never uploaded or stored on any external servers.'}
          </p>
        </div>

        <div className={`p-3.5 rounded-xl border space-y-1.5 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <h4 className="font-semibold text-sky-600 dark:text-sky-400 text-xs">
            {isRtl ? '2. شروط الاستخدام وإخلاء المسؤولية' : '2. Terms of Use & Disclaimer'}
          </h4>
          <p className="opacity-90 leading-relaxed text-[11px]">
            {isRtl 
              ? 'أنت وحدك المسؤول مسؤولية كاملة عن الملفات التي تقوم بتحويلها أو معالجتها عبر المنصة. تضمن المنصة تقديم الخدمة "كما هي" دون أي ضمانات مطلقة، ولا تتحمل أي مسؤولية قانونية عن سوء استخدام المحتوى أو حقوق الملكية الفكرية للملفات الخاصة بالمستخدمين.'
              : 'You are solely responsible for the files you process through this platform. The service is provided "as is" without warranties of any kind, and we assume no legal liability for misuse or copyright compliance of user-processed files.'}
          </p>
        </div>

        <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <p className="opacity-75 text-[10px] leading-relaxed">
            {isRtl
              ? 'نحتفظ بالحق في تعديل، تحديث، أو إيقاف الخدمة (أو أي جزء منها) في أي وقت دون إشعار مسبق لتطوير الأداء.'
              : 'We reserve the right to modify, update, or discontinue the service at any time to improve performance.'}
          </p>
        </div>
      </div>
    </div>
  );
};
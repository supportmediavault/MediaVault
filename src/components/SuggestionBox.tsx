'use client';

import React, { useState, useEffect, useRef } from 'react';
import emailjs from '@emailjs/browser';

interface SuggestionBoxProps {
  isDarkMode?: boolean;
  isRtl?: boolean;
  t: any;
}

export const SuggestionBox: React.FC<SuggestionBoxProps> = ({
  isDarkMode = false,
  isRtl = false,
  t,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
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
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);

    const SERVICE_ID = 'service_p9ul7kn'; 
    const TEMPLATE_ID = 'template_lbyqphq'; 
    const PUBLIC_KEY = 'zLzMWtYkM-2C2GzLf';     

    const templateParams = {
      email: 'idea-sender@imedia.app',
      message: `[فكرة / اقتراح جديد من المستخدم]:\n\n${text}`,
    };

    emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
      .then((response) => {
        setIsSubmitting(false);
        setSubmitted(true);
        setText('');
        setTimeout(() => {
          setSubmitted(false);
          setIsOpen(false);
        }, 3000);
      })
      .catch((error) => {
        setIsSubmitting(false);
        alert(isRtl ? 'حدث خطأ أثناء إرسال الاقتراح، يرجى المحاولة مرة أخرى.' : 'Failed to send suggestion, please try again.');
      });
  };

  return (
    <div 
      ref={boxRef} 
      style={{ 
        position: 'fixed', 
        bottom: '160px', 
        left: '16px', 
        zIndex: 99999 
      }} 
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          style={{ width: 'auto' }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl shadow-lg border transition-all hover:scale-105 cursor-pointer backdrop-blur-xl whitespace-nowrap ${
            isDarkMode
              ? 'bg-slate-900/90 border-slate-700 text-sky-400 hover:bg-slate-800 shadow-sky-950/40'
              : 'bg-white/95 border-sky-200 text-sky-600 hover:bg-sky-50 shadow-sky-200/40'
          }`}
        >
          <span className="text-sm animate-bounce">💡</span>
          <span className="text-[11px] font-bold">{t.ideaBtn || 'Have an idea?'}</span>
        </button>
      ) : (
        <div
          style={{ width: '280px', maxWidth: '85vw' }}
          className={`p-4 rounded-2xl shadow-2xl border transition-all animate-in fade-in zoom-in-95 font-sans ${
            isDarkMode
              ? 'bg-[#0f172a] border-slate-700 text-white shadow-black/95' 
              : 'bg-white border-sky-200 text-slate-900 shadow-2xl'
          }`}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-500/20">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">💡</span>
              <h4 className={`text-xs font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {t.ideaHeader || 'Feedback & Ideas'}
              </h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-6 h-6 rounded-full bg-slate-500/10 hover:bg-red-500 hover:text-white flex items-center justify-center text-slate-500 dark:text-slate-400 font-black text-[10px] transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          <p className={`text-[11px] font-semibold mb-3 leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            {t.ideaDesc || 'Share your thoughts or request a new format!'}
          </p>

          {submitted ? (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 text-center text-[11px] font-bold">
              🎉 {t.ideaSuccess || 'Thank you! Idea received'}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2.5">
              <textarea
                rows={2}
                required
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t.ideaPlaceholder || 'Type your suggestion...'}
                className={`w-full p-2.5 rounded-xl text-[11px] font-medium border focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none shadow-inner ${
                  isDarkMode 
                    ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-400' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-xl text-[11px] shadow-md shadow-sky-500/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <span>🚀</span>
                <span>{isSubmitting ? t.sendingBtn || 'Sending...' : t.ideaSubmit || 'Submit Idea'}</span>
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
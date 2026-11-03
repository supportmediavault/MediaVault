'use client';

import React, { useState, useRef, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import { baseTranslations } from '../core/i18n/translator';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: string;
  isDarkMode?: boolean;
}

export const SupportModal: React.FC<SupportModalProps> = ({ 
  isOpen, 
  onClose, 
  lang = 'en', 
  isDarkMode = false 
}) => {
  const [activeTab, setActiveTab] = useState<'faq' | 'contact'>('faq');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const t = baseTranslations[lang] || baseTranslations.en;
  const isRtl = lang === 'ar';

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) return;

    setIsSubmitting(true);

    const SERVICE_ID = 'service_p9ul7kn'; 
    const TEMPLATE_ID = 'template_lbyqphq'; 
    const PUBLIC_KEY = 'zLzMWtYkM-2C2GzLf';     

    const templateParams = {
      name: name || 'Visitor',
      email: email,
      message: message,
    };

    emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
      .then((response) => {
        setIsSubmitting(false);
        setIsSent(true);
        setName('');
        setEmail('');
        setMessage('');
        setTimeout(() => {
          setIsSent(false);
        }, 5000);
      })
      .catch((error) => {
        setIsSubmitting(false);
        alert(isRtl ? 'حدث خطأ أثناء الإرسال، يرجى المحاولة مرة أخرى.' : 'Failed to send message, please try again.');
      });
  };

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
      <div className="flex justify-end items-center pb-2">
        <button 
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-slate-500/10 hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center text-slate-400 font-bold text-sm transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>

      <div className="flex gap-2 mb-4 p-1.5 rounded-xl bg-slate-500/10 text-sm font-bold">
        <button
          onClick={() => setActiveTab('faq')}
          className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'faq' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {t.faqTab || 'FAQ'}
        </button>
        <button
          onClick={() => setActiveTab('contact')}
          className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'contact' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {t.contactTab || 'Contact Us'}
        </button>
      </div>

      <div className="py-1 max-h-85 overflow-y-auto space-y-3 text-sm leading-relaxed">
        {activeTab === 'faq' && (
          <div className="space-y-2.5">
            <div className={`p-3.5 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <h4 className="font-bold text-sky-400 mb-1 text-xs">🔒 {t.privacyTitle}</h4>
              <p className="opacity-90 text-xs leading-relaxed">{t.privacyDesc}</p>
            </div>
            <div className={`p-3.5 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <h4 className="font-bold text-sky-400 mb-1 text-xs">⚡ {t.compressionTitle}</h4>
              <p className="opacity-90 text-xs leading-relaxed">{t.compressionDesc}</p>
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className={`p-4 rounded-xl border space-y-3.5 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <div className="space-y-1">
              <h4 className="font-bold text-xs text-sky-400">
                {t.sendDirectMsg}
              </h4>
              <p className="opacity-90 text-xs">
                {t.contactSubtitle}
              </p>
            </div>

            {isSent ? (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-center font-bold text-xs">
                🎉 {t.msgSuccess}
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {t.yourName}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isRtl ? 'اكتب اسمك...' : 'Enter your name'}
                    className={`w-full p-3 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      isDarkMode ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {t.yourEmail}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={`w-full p-3 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      isDarkMode ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {t.yourMessage}
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={isRtl ? 'اكتب تفاصيل رسالتك أو استفسارك هنا...' : 'Type your message here...'}
                    className={`w-full p-3 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none ${
                      isDarkMode ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <span>📨</span>
                  <span>{isSubmitting ? t.sendingBtn : t.sendBtn}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
'use client';

import { useState, useEffect } from 'react';

interface CookieBannerProps {
  isDarkMode: boolean;
  isRtl: boolean;
  t: any;
}

export function CookieBanner({ isDarkMode, isRtl, t }: CookieBannerProps) {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('imedia_cookie_consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('imedia_cookie_consent', 'accepted');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  const bannerTitle = t.cookieTitle || 'We Respect Your Privacy';
  const bannerDesc = t.cookieDesc || 'We use cookies strictly to track visitor traffic and improve system performance.';
  const bannerBtn = t.cookieBtn || 'Got it, thanks!';

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '84px',
        right: '24px',
        width: '320px',
        maxWidth: '90vw',
        zIndex: 9998,
      }}
      className={`p-3.5 rounded-2xl border shadow-2xl backdrop-blur-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
        isDarkMode 
          ? 'bg-slate-900/95 border-slate-700/80 text-slate-100 shadow-black/80' 
          : 'bg-white/95 border-sky-200 text-slate-900 shadow-sky-500/15'
      }`}
    >
      <div className="flex flex-col gap-2.5">
        <div className="flex items-start gap-2.5">
          <span className="text-lg p-1.5 rounded-xl bg-sky-500/10 flex-shrink-0">
            🍪
          </span>
          <div className="space-y-0.5">
            <h4 className="font-extrabold text-xs text-sky-500">
              {bannerTitle}
            </h4>
            <p className={`text-[11px] leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {bannerDesc}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end pt-1">
          <button
            onClick={handleAccept}
            className="w-full py-1.5 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-[11px] font-bold transition-all shadow-md shadow-sky-500/20 active:scale-95 cursor-pointer"
          >
            {bannerBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
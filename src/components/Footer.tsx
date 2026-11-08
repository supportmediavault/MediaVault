'use client';

import React, { useState, useEffect } from 'react';

interface FooterProps {
  isDarkMode: boolean;
  isRtl: boolean;
  userRating: number;
  setUserRating: (val: number) => void;
  ratingSubmitted: boolean;
  setRatingSubmitted: (val: boolean) => void;
  totalVotes: number;
  setTotalVotes: React.Dispatch<React.SetStateAction<number>>;
  onOpenSupport: () => void;
  onOpenAbout: () => void;
  onOpenTerms: () => void;
  t: any;
}

export const Footer: React.FC<FooterProps> = ({
  isDarkMode,
  isRtl,
  userRating,
  setUserRating,
  ratingSubmitted,
  setRatingSubmitted,
  totalVotes,
  setTotalVotes,
  onOpenSupport,
  onOpenAbout,
  onOpenTerms,
  t,
}) => {
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [showThankYou, setShowThankYou] = useState(false);

  useEffect(() => {
    const savedRating = localStorage.getItem('imedia_user_rating');
    if (savedRating) {
      const parsed = parseInt(savedRating, 10);
      setUserRating(parsed);
      setRatingSubmitted(true);
    }
  }, [setUserRating, setRatingSubmitted]);

  const handleRate = async (star: number) => {
    if (ratingSubmitted) return;

    setUserRating(star);
    setRatingSubmitted(true);
    setTotalVotes((prev) => prev + 1);
    
    localStorage.setItem('imedia_user_rating', star.toString());

    try {
      await fetch('/api/rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: star }),
      });
    } catch (err) {
      console.error('Failed to submit rating:', err);
    }

    setShowThankYou(true);
    setTimeout(() => {
      setShowThankYou(false);
    }, 3000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100vw',
        zIndex: 40,
        boxSizing: 'border-box',
      }}
      className={`border-t py-2.5 px-6 backdrop-blur-xl flex flex-row items-center justify-between gap-4 text-xs transition-colors shadow-2xl relative ${
        isDarkMode 
          ? 'bg-slate-950/90 border-slate-800 text-slate-100 font-semibold' 
          : 'bg-white/90 border-sky-100 text-slate-900 font-bold'
      }`}
    >
      {/* القسم الأول: التقييم (على اليسار) */}
      <div className="flex items-center gap-2 flex-shrink-0 z-10">
        <span className={isDarkMode ? 'text-slate-100 font-bold text-[11px]' : 'text-slate-900 font-black text-[11px]'}>
          {ratingSubmitted ? (isRtl ? 'شكراً لتقييمك!' : 'Thank you!') : (t.ratingTitle || 'Rate:')}
        </span>
        
        <div 
          className="flex items-center gap-0.5 cursor-pointer"
          onMouseLeave={() => setHoverRating(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const isActive = star <= (hoverRating || userRating);
            return (
              <span
                key={star}
                onMouseEnter={() => !ratingSubmitted && setHoverRating(star)}
                onClick={() => handleRate(star)}
                style={{
                  fontSize: '14px',
                  color: isActive ? '#fbbf24' : (isDarkMode ? '#94a3b8' : '#64748b'),
                  cursor: ratingSubmitted ? 'default' : 'pointer',
                }}
              >
                ★
              </span>
            );
          })}
        </div>
      </div>

      {/* القسم الثاني: حقوق النشر (في المنتصف تماماً) */}
      <div className="hidden md:flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2 pointer-events-none" dir="ltr">
        <span className={`font-black text-[11px] ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
          iMedia
        </span>
        <span className={`text-[11px] ${isDarkMode ? 'text-slate-300 font-semibold' : 'text-slate-800 font-bold'}`}>
          © 2026 - Privacy First
        </span>
      </div>

      {/* القسم الثالث: الروابط والأزرار (على اليمين) */}
      <div className="flex items-center gap-3 flex-wrap justify-end flex-shrink-0 z-10">
        <button
          onClick={onOpenTerms}
          className={`transition-colors font-bold text-[11px] cursor-pointer underline underline-offset-4 ${
            isDarkMode ? 'text-slate-200 hover:text-sky-400' : 'text-slate-900 hover:text-sky-600'
          }`}
        >
          {t.termsFooter || 'Terms'}
        </button>

        <button
          onClick={onOpenAbout}
          className={`transition-colors font-bold text-[11px] cursor-pointer underline underline-offset-4 ${
            isDarkMode ? 'text-slate-200 hover:text-sky-400' : 'text-slate-900 hover:text-sky-600'
          }`}
        >
          {t.aboutFooter || 'About'}
        </button>

        <button
          onClick={onOpenSupport}
          className={`transition-colors font-bold text-[11px] cursor-pointer underline underline-offset-4 ${
            isDarkMode ? 'text-slate-200 hover:text-sky-400' : 'text-slate-900 hover:text-sky-600'
          }`}
        >
          {t.contactFooter || 'Support'}
        </button>

        <a
          href="https://ko-fi.com/mediavaultdono"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md hover:scale-105 transition-all text-[11px]"
        >
          <span>☕</span>
          <span>{t.donate || 'Donate'}</span>
        </a>

        <button
          onClick={scrollToTop}
          title={isRtl ? 'العودة للأعلى' : 'Scroll to top'}
          className={`p-1 rounded-xl border transition-all hover:scale-110 cursor-pointer shadow-sm flex items-center justify-center ${
            isDarkMode
              ? 'bg-slate-900 border-slate-700 text-sky-400 hover:bg-slate-800'
              : 'bg-white border-sky-200 text-sky-600 hover:bg-sky-50'
          }`}
        >
          <span className="text-[10px] font-black">▲</span>
        </button>
      </div>
    </footer>
  );
};
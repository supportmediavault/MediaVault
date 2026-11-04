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

    // إرسال التقييم إلى الـ API
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
        width: '100%',
        zIndex: 40,
      }}
      className={`border-t py-3 px-6 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs transition-colors shadow-2xl ${
        isDarkMode 
          ? 'bg-slate-950/90 border-slate-800 text-slate-100 font-semibold' 
          : 'bg-white/90 border-sky-100 text-slate-900 font-bold'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={isDarkMode ? 'text-slate-100 font-bold' : 'text-slate-900 font-black'}>
          {ratingSubmitted ? (isRtl ? 'شكراً لتقييمك!' : 'Thank you for rating!') : (t.ratingTitle || 'Rate overall quality:')}
        </span>
        
        <div 
          className="flex items-center gap-1 cursor-pointer"
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
                  fontSize: '16px',
                  color: isActive ? '#fbbf24' : (isDarkMode ? '#94a3b8' : '#64748b'),
                  cursor: ratingSubmitted ? 'default' : 'pointer',
                  transition: 'color 0.15s ease'
                }}
                title={ratingSubmitted ? (isRtl ? 'لقد قمت بالتقييم مسبقاً' : 'Already rated') : ''}
              >
                ★
              </span>
            );
          })}
        </div>

        {showThankYou && (
          <span className="text-[11px] text-emerald-500 font-bold">
            {isRtl ? 'شكراً لك!' : 'Thank you!'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2" dir="ltr">
        <span className={`font-black ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
          iMedia
        </span>
        <span className={isDarkMode ? 'text-slate-300 font-semibold' : 'text-slate-800 font-bold'}>
          © 2026 - Privacy First
        </span>
      </div>

      <div className="flex items-center gap-3 flex-wrap justify-center">
        <button
          onClick={onOpenTerms}
          className={`transition-colors font-bold cursor-pointer underline underline-offset-4 ${
            isDarkMode ? 'text-slate-200 hover:text-sky-400' : 'text-slate-900 hover:text-sky-600'
          }`}
        >
          {t.termsFooter || 'Terms & Privacy'}
        </button>

        <button
          onClick={onOpenAbout}
          className={`transition-colors font-bold cursor-pointer underline underline-offset-4 ${
            isDarkMode ? 'text-slate-200 hover:text-sky-400' : 'text-slate-900 hover:text-sky-600'
          }`}
        >
          {t.aboutFooter || 'About Us'}
        </button>

        <button
          onClick={onOpenSupport}
          className={`transition-colors font-bold cursor-pointer underline underline-offset-4 ${
            isDarkMode ? 'text-slate-200 hover:text-sky-400' : 'text-slate-900 hover:text-sky-600'
          }`}
        >
          {t.contactFooter || 'Contact Us & FAQ'}
        </button>

        <a
          href="https://ko-fi.com/imediadono"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md hover:scale-105 transition-all text-xs"
        >
          <span>☕</span>
          <span>{t.donate || 'Donate'}</span>
        </a>

        <button
          onClick={scrollToTop}
          title={isRtl ? 'العودة للأعلى' : 'Scroll to top'}
          className={`p-1.5 rounded-xl border transition-all hover:scale-110 cursor-pointer shadow-sm flex items-center justify-center ${
            isDarkMode
              ? 'bg-slate-900 border-slate-700 text-sky-400 hover:bg-slate-800'
              : 'bg-white border-sky-200 text-sky-600 hover:bg-sky-50'
          }`}
        >
          <span className="text-xs font-black">▲</span>
        </button>
      </div>
    </footer>
  );
};
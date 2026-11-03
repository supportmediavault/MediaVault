'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LANGUAGES } from '../core/i18n/translator';

interface HeaderProps {
  lang: string;
  setLang: (lang: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  t: any;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  setLang,
  isDarkMode,
  setIsDarkMode,
  t,
}) => {
  const isRtl = lang === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<string | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentLangObj = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  const toggleDropdown = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: `${rect.bottom + 8}px`,
        right: `${window.innerWidth - rect.right}px`,
        zIndex: 99999,
      });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '80px',
        zIndex: 9999,
      }}
      className={`border-b backdrop-blur-xl flex items-center transition-colors shadow-sm ${
        isDarkMode 
          ? 'bg-slate-950/80 border-slate-800/80 text-white' 
          : 'bg-white/80 border-sky-100/60 text-slate-900'
      }`}
    >
      <div className="w-full px-6 flex items-center justify-between">
        
        <div 
          onClick={() => window.location.reload()}
          className="flex items-center gap-3.5 group cursor-pointer"
          title="Reload application"
        >
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 text-xl font-bold transition-transform group-hover:scale-105">
            <span className="absolute inset-0 rounded-2xl bg-white/20 animate-pulse"></span>
            🛡️
          </div>
          <div className="flex flex-col">
            <span className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              i<span className="text-sky-500">Media</span>
            </span>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase opacity-80">
              {t.privacySub || '100% Client-Side Privacy'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3" dir="ltr">
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={toggleDropdown}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs border transition-all shadow-sm backdrop-blur-md cursor-pointer font-black ${
                isDarkMode
                  ? 'border-slate-700 bg-slate-900/80 text-white hover:bg-slate-800'
                  : 'border-sky-200 bg-white/90 text-slate-950 hover:bg-white'
              }`}
            >
              <span className="text-sm">🌐</span>
              <span className="tracking-wide">{currentLangObj.name}</span>
              <span className="text-[10px] opacity-70">▼</span>
            </button>

            {isOpen && (
              <div 
                ref={dropdownRef}
                className={`w-44 rounded-2xl shadow-2xl border backdrop-blur-2xl overflow-hidden py-1.5 max-h-80 overflow-y-auto ${
                  isDarkMode ? 'bg-slate-950/95 border-slate-800 text-white' : 'bg-white/95 border-sky-100 text-slate-900'
                }`}
                style={dropdownStyle}
              >
                {LANGUAGES.map((l) => {
                  const isSelected = lang === l.code;
                  const isHovered = hoveredIndex === l.code;

                  return (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code);
                        setIsOpen(false);
                      }}
                      onMouseEnter={() => setHoveredIndex(l.code)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      style={{
                        backgroundColor: isSelected 
                          ? '#0ea5e9' 
                          : isHovered 
                            ? (isDarkMode ? '#1e293b' : '#e0f2fe') 
                            : 'transparent',
                        color: isSelected 
                          ? '#ffffff' 
                          : isHovered 
                            ? (isDarkMode ? '#ffffff' : '#0f172a') 
                            : (isDarkMode ? '#e2e8f0' : '#1e293b'),
                        paddingLeft: isHovered ? '20px' : '16px',
                        transition: 'all 0.15s ease-in-out',
                      }}
                      className={`w-full text-left px-4 py-3 text-xs font-bold flex items-center justify-center cursor-pointer`}
                    >
                      <span>{l.name}</span>
                      {isSelected && <span>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2.5 rounded-xl border transition-all hover:scale-105 cursor-pointer shadow-sm backdrop-blur-md ${
              isDarkMode
                ? 'border-slate-700/80 bg-slate-900/60 text-amber-400 hover:bg-slate-800'
                : 'border-sky-200/60 bg-white/60 text-slate-700 hover:bg-white'
            }`}
            aria-label="Toggle Theme"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>

      </div>
    </header>
  );
};
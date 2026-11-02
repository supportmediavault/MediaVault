import React, { useState, useEffect } from 'react';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaName: string;
  mediaType: 'image' | 'audio' | 'video';
  isDarkMode: boolean;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  mediaUrl,
  mediaName,
  mediaType,
  isDarkMode,
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  // إدارة حركة السحب مع منع التمرير الخلفي للشاشة أثناء اللمس
  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!isDragging) return;
      setPosition({
        x: clientX - dragStart.x,
        y: clientY - dragStart.y,
      });
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      if (e.touches.length > 0) {
        // منع السلوك الافتراضي (مثل Scroll Down/Up للشاشة) أثناء سحب الصندوق
        e.preventDefault();
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragStart]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-sm pointer-events-none">
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
        }}
        onMouseDown={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('a') || target.closest('audio') || target.closest('video')) {
            return;
          }
          setIsDragging(true);
          setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }}
        onTouchStart={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('a') || target.closest('audio') || target.closest('video')) {
            return;
          }
          if (e.touches.length > 0) {
            setIsDragging(true);
            setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
          }
        }}
        className={`pointer-events-auto shadow-2xl flex flex-col w-[75vw] max-w-[260px] rounded-xl p-2.5 cursor-grab active:cursor-grabbing select-none border transition-shadow touch-none ${
          isDarkMode 
            ? 'bg-slate-900/95 border-slate-700 text-slate-100' 
            : 'bg-white/95 border-slate-200 text-slate-800'
        }`}
      >
        {/* شريط العنوان */}
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-500/20">
          <h3 className="text-[10px] font-bold truncate max-w-[75%]" title={mediaName}>
            👁️ {mediaName}
          </h3>
          <button
            onClick={onClose}
            className="w-5 h-5 rounded-full flex items-center justify-center bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer text-[10px] font-bold shrink-0"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* حاوية المحتوى */}
        <div className="flex items-center justify-center bg-slate-950/90 rounded-lg p-1 overflow-hidden h-[110px]">
          {mediaType === 'image' && (
            <img 
              src={mediaUrl} 
              alt={mediaName} 
              className="object-contain max-h-[100px] w-auto rounded" 
            />
          )}
          {mediaType === 'audio' && (
            <div className="w-full flex flex-col items-center justify-center space-y-1 py-1">
              <span className="text-base animate-pulse">🎵</span>
              <audio src={mediaUrl} controls className="w-full max-w-[190px] h-7 scale-90" />
            </div>
          )}
          {mediaType === 'video' && (
            <video 
              src={mediaUrl} 
              controls 
              className="max-h-[100px] w-full object-contain rounded" 
            />
          )}
        </div>

        {/* أزرار التحكم السفلى */}
        <div className="flex items-center justify-between pt-2 mt-1.5">
          <a
            href={mediaUrl}
            download={mediaName}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[10px] font-bold transition-colors shadow-xs flex items-center gap-1"
          >
            📥 Download
          </a>
          <button
            onClick={onClose}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
              isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
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
    <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm pointer-events-none">
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
        }}
        onMouseDown={(e) => {
          const target = e.target as HTMLElement;
          if (
            target.closest('button') ||
            target.closest('a') ||
            target.closest('audio') ||
            target.closest('video')
          ) {
            return;
          }
          setIsDragging(true);
          setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
          });
        }}
        onTouchStart={(e) => {
          const target = e.target as HTMLElement;
          if (
            target.closest('button') ||
            target.closest('a') ||
            target.closest('audio') ||
            target.closest('video')
          ) {
            return;
          }
          if (e.touches.length > 0) {
            setIsDragging(true);
            setDragStart({
              x: e.touches[0].clientX - position.x,
              y: e.touches[0].clientY - position.y,
            });
          }
        }}
        className={`pointer-events-auto shadow-2xl flex flex-col w-[85%] max-w-[260px] rounded-2xl p-3 cursor-grab active:cursor-grabbing select-none transition-shadow touch-none ${
          isDarkMode
            ? 'bg-slate-900 border border-slate-700 text-slate-100'
            : 'bg-white border border-slate-200 text-slate-800'
        }`}
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/25">
          <h3
            className="text-xs font-bold truncate max-w-[80%]"
            title={mediaName}
          >
            👁️ {mediaName}
          </h3>

          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full flex items-center justify-center bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer text-xs font-bold"
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex items-center justify-center bg-slate-950 rounded-xl p-2 overflow-hidden min-h-[110px] max-h-[30vh]">
          {mediaType === 'image' && (
            <img
              src={mediaUrl}
              alt={mediaName}
              className="object-contain rounded-lg shadow-md max-h-[110px]"
            />
          )}
          {mediaType === 'audio' && (
            <div className="w-full flex flex-col items-center space-y-2 py-2">
              <span className="text-xl animate-pulse">🎵</span>
              <audio src={mediaUrl} controls className="w-full" />
            </div>
          )}
          {mediaType === 'video' && (
            <video
              src={mediaUrl}
              controls
              className="w-full rounded-lg shadow-md max-h-[110px]"
            />
          )}
        </div>

        <div className="flex items-center justify-between pt-3 mt-auto">
          <a
            href={mediaUrl}
            download={mediaName}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
          >
            📥 Download
          </a>

          <button
            onClick={onClose}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

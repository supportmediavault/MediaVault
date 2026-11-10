'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QueueItem } from '@/src/core/queueManager';
import { FileOptionsModal } from '@/src/components/FileOptionsModal';

interface FileItemCardProps {
  item: QueueItem;
  isDarkMode: boolean;
  isRtl: boolean;
  onStartSingle: (id: string) => void;
  onPauseSingle: (id: string) => void;
  onRemove: (id: string) => void;
  onResetItem?: (id: string) => void;
  onUpdateFormat: (id: string, format: string) => void;
  onUpdateName: (id: string, name: string) => void;
  onUpdateOptions?: (id: string, options: any) => void;
  onPreview: (url: string, name: string, type: string) => void;
  onOpenOptions: () => void;
  onExtractAudio: () => void;
  extractedAudioUrl?: string | null;
  formatFileSize: (bytes: number) => string;
  hasMultipleFiles: boolean;
}

export const FileItemCard: React.FC<FileItemCardProps> = ({
  item,
  isDarkMode,
  isRtl,
  onStartSingle,
  onPauseSingle,
  onRemove,
  onResetItem,
  onUpdateFormat,
  onUpdateName,
  onUpdateOptions,
  onPreview,
  onOpenOptions,
  onExtractAudio,
  extractedAudioUrl,
  formatFileSize,
  hasMultipleFiles
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(item.customName);
  
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'video' | 'audio' | 'image'>('video');
  const [searchQuery, setSearchQuery] = useState('');
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, right: 0 });

  const gearButtonRef = useRef<HTMLButtonElement>(null);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [optionsCoords, setOptionsCoords] = useState({ top: 0, right: 0, left: 0, openUpward: false });

  const handleToggleDropdown = () => {
    if (!isFormatDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownCoords({
        top: rect.bottom + window.scrollY + 8,
        right: window.innerWidth - rect.right - window.scrollX,
      });
    }
    setIsFormatDropdownOpen(!isFormatDropdownOpen);
  };

  // المنطق الذكي: فحص المساحة السفلية، وإذا لم تكفِ يتم فتح الصندوق نحو الأعلى تماماً
  const handleToggleOptions = () => {
    if (!isOptionsOpen && gearButtonRef.current) {
      const rect = gearButtonRef.current.getBoundingClientRect();
      const modalEstimatedHeight = 500; // الارتفاع التقريبي لصندوق الخيارات
      const spaceBelow = window.innerHeight - rect.bottom;
      
      const openUpward = spaceBelow < modalEstimatedHeight && rect.top > modalEstimatedHeight;

      setOptionsCoords({
        top: openUpward ? rect.top + window.scrollY - 8 : rect.bottom + window.scrollY + 8,
        right: window.innerWidth - rect.right - window.scrollX,
        left: rect.left + window.scrollX,
        openUpward
      });
    }
    setIsOptionsOpen(!isOptionsOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsFormatDropdownOpen(false);
      }
    };
    if (isFormatDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFormatDropdownOpen]);

  const handleSaveName = () => {
    if (newName.trim()) {
      onUpdateName(item.id, newName.trim());
    }
    setIsEditingName(false);
  };

  const fileTypeCategory = item.file.type.startsWith('image/')
    ? 'image'
    : item.file.type.startsWith('audio/')
    ? 'audio'
    : 'video';

  const getDynamicEstimatedSize = () => {
    let multiplier = 0.80;
    const comp = item.options?.compressionLevel;
    const res = item.options?.resolution;
    const crf = item.options?.crf;

    if (crf !== undefined && crf !== null) {
      multiplier = Math.max(0.05, Math.min(1.2, 1 - (crf / 60)));
    } else if (comp === 'high') {
      multiplier = 0.55;
    } else if (comp === 'low') {
      multiplier = 0.92;
    }

    if (res === '480') multiplier *= 0.5;
    else if (res === '720') multiplier *= 0.7;
    else if (res === '1080') multiplier *= 0.9;
    else if (res === '2k') multiplier *= 1.2;
    else if (res === '4k') multiplier *= 1.4;

    return item.file.size * Math.max(0.05, Math.min(0.98, multiplier));
  };

  const categories = {
    video: ['MP4', 'WEBM', 'MOV', 'AVI', 'MKV', 'FLV', 'WMV', '3GP', 'MPEG', 'TS', 'M4V', 'OGG'],
    audio: ['MP3', 'WAV', 'OGG', 'AAC', 'M4A', 'FLAC'],
    image: ['WEBP', 'PNG', 'JPEG', 'JPG', 'AVIF', 'GIF', 'BMP', 'ICO']
  };

  const getFilteredFormats = () => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const all = [...categories.video, ...categories.audio, ...categories.image];
      return all.filter(f => f.toLowerCase().includes(q));
    }
    return categories[activeCategory];
  };

  const hasTrimActive = Boolean(item.options?.trimStart || item.options?.trimEnd);

  return (
    <div
      className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col gap-3 relative overflow-hidden ${
        isDarkMode
          ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-lg'
          : 'bg-white border-slate-200 text-slate-800 shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
              isDarkMode ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-100 text-sky-600'
            }`}
          >
            {fileTypeCategory === 'image' ? '🖼️' : fileTypeCategory === 'audio' ? '🎵' : '🎬'}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-1.5 w-full">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold border w-full ${
                      isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="px-2.5 py-1 bg-sky-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    ✓
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    onDoubleClick={() => setIsEditingName(true)}
                    className="text-xs font-bold truncate cursor-pointer hover:text-sky-500 transition-colors"
                    title={isRtl ? 'انقر مرتين لتغيير الاسم' : 'Double click to rename'}
                  >
                    {item.customName}.{item.targetFormat}
                  </span>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-[10px] text-slate-400 hover:text-sky-500 cursor-pointer"
                  >
                    ✏️
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <span>{formatFileSize(item.file.size)}</span>
              <span>→</span>
              {item.status === 'completed' && item.actualSize !== undefined ? (
                <span className="text-emerald-500 font-bold">
                  {formatFileSize(item.actualSize)}
                </span>
              ) : (
                <span className="text-sky-500 font-medium">
                  Est: {formatFileSize(getDynamicEstimatedSize())}
                </span>
              )}
              {hasTrimActive && (
                <span className="text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px]">
                  ✂️ Trimmed
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {onResetItem && (
            <button
              onClick={() => onResetItem(item.id)}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-sky-400 hover:bg-slate-700 hover:text-sky-300' 
                  : 'bg-slate-100 border-slate-200 text-sky-600 hover:bg-slate-200'
              }`}
              title={isRtl ? 'إعادة تعيين الملف للحالة الأصلية' : 'Reset'}
            >
              🔄
            </button>
          )}

          <button
            onClick={() => onRemove(item.id)}
            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
            title={isRtl ? 'حذف' : 'Remove'}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-start pt-2 border-t border-slate-700/10">
        
        <div className="relative inline-block text-left">
          <button
            ref={buttonRef}
            type="button"
            onClick={handleToggleDropdown}
            className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700 text-sky-400 hover:bg-slate-700' 
                : 'bg-slate-100 border-slate-200 text-sky-700 hover:bg-slate-200'
            }`}
          >
            <span className="uppercase">{item.targetFormat}</span>
            <span className={`text-[10px] transition-transform duration-200 ${isFormatDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {isFormatDropdownOpen && typeof window !== 'undefined' && createPortal(
            <div 
              ref={dropdownRef}
              style={{ top: `${dropdownCoords.top}px`, right: `${dropdownCoords.right}px` }}
              className={`fixed w-[320px] rounded-2xl shadow-2xl border z-[999999] overflow-hidden backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 ${
                isDarkMode 
                  ? 'bg-slate-950/95 border-slate-700 text-white shadow-black/90' 
                  : 'bg-white/95 border-slate-200 text-slate-800 shadow-2xl'
              }`}
            >
              <div className="p-2.5 border-b border-slate-700/20">
                <input
                  type="text"
                  placeholder={isRtl ? 'بحث عن صيغة...' : 'Search format...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-xl text-xs font-medium border focus:outline-none ${
                    isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  autoFocus
                />
              </div>

              <div className="flex" style={{ height: '210px' }}>
                <div className={`w-[110px] flex-shrink-0 border-r flex flex-col p-1.5 gap-1 ${
                  isDarkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-100 bg-slate-50'
                }`}>
                  {(['video', 'audio', 'image'] as const).map((cat) => {
                    const isActive = activeCategory === cat && !searchQuery;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => { setActiveCategory(cat); setSearchQuery(''); }}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                          isActive
                            ? 'bg-sky-500 text-white shadow-sm'
                            : isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                      >
                        <span className="capitalize">{cat}</span>
                        <span className="text-[10px]">›</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex-1 p-2.5 overflow-y-auto">
                  <div className="grid grid-cols-3 gap-1.5">
                    {getFilteredFormats().map((fmt) => {
                      const isSelected = item.targetFormat.toLowerCase() === fmt.toLowerCase();
                      return (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => {
                            onUpdateFormat(item.id, fmt.toLowerCase());
                            setIsFormatDropdownOpen(false);
                          }}
                          className={`py-1.5 px-1 rounded-lg text-[11px] font-black uppercase transition-all cursor-pointer text-center truncate ${
                            isSelected
                              ? 'bg-sky-600 text-white shadow-sm scale-105'
                              : isDarkMode
                              ? 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                              : 'bg-slate-100 text-slate-700 hover:bg-sky-50 hover:text-sky-600 border border-slate-200'
                          }`}
                        >
                          {fmt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>

        {fileTypeCategory === 'video' && (
          <button
            onClick={onExtractAudio}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-sky-400 hover:bg-slate-700'
                : 'bg-slate-100 border-slate-200 text-sky-600 hover:bg-slate-200'
            }`}
            title={isRtl ? 'استخراج الصوت فقط' : 'Extract Audio'}
          >
            <span>🎧</span>
            <span>{isRtl ? 'استخراج الصوت' : 'Extract'}</span>
          </button>
        )}

        {extractedAudioUrl && (
          <a
            href={extractedAudioUrl}
            download={`${item.customName}_audio.mp3`}
            style={{ backgroundColor: '#059669', color: '#ffffff' }}
            className="px-3 py-1.5 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity"
            title="Download Extracted Audio"
          >
            <span>🎵</span>
            <span className="flex items-center gap-1" style={{ color: '#ffffff' }}>
              {isRtl ? 'تحميل الصوت' : 'Audio'}
              <span>📥</span>
            </span>
          </a>
        )}

        {item.status === 'completed' && item.downloadUrl && (
          <>
            <button
              onClick={() => onPreview(item.downloadUrl!, item.customName, fileTypeCategory)}
              className="px-2.5 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <span>▶</span>
              <span>{isRtl ? 'معاينة' : 'Preview'}</span>
            </button>

            <a
              href={item.downloadUrl}
              download={`${item.customName}.${item.targetFormat}`}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1"
            >
              <span>📥</span>
              <span>{isRtl ? 'تحميل كامل' : 'Download'}</span>
            </a>

            {hasTrimActive && (
              <a
              href={item.downloadUrl}
              download={`${item.customName}_trimmed.${item.targetFormat}`}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs shadow-lg flex items-center gap-1.5 border-2 border-amber-500 transition-transform hover:scale-105 animate-pulse"
              title={isRtl ? 'تحميل الفيديو المقصوص المؤكد فقط' : 'Download confirmed trimmed video only'}
            >
                <span>✂️</span>
                <span>{isRtl ? 'تحميل المقصوص ✂️' : 'Trimmed Download'}</span>
              </a>
            )}
          </>
        )}

        {item.status === 'idle' && (
          <button
            onClick={() => onStartSingle(item.id)}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            {isRtl ? 'ابدأ' : 'Start'}
          </button>
        )}

        {item.status === 'converting' && (
          <button
            onClick={() => onPauseSingle(item.id)}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            {isRtl ? 'إيقاف مؤقت' : 'Pause'}
          </button>
        )}

        {item.status === 'paused' && (
          <button
            onClick={() => onStartSingle(item.id)}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            {isRtl ? 'استئناف' : 'Resume'}
          </button>
        )}

        {/* زر الترس مع ميزة الفتح الذكي نحو الأعلى إذا لزم الأمر */}
        <div className="relative inline-block text-left">
          <button
            ref={gearButtonRef}
            onClick={handleToggleOptions}
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
              isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
            }`}
            title={isRtl ? 'إعدادات متقدمة' : 'Options'}
          >
            ⚙️
          </button>

          {isOptionsOpen && typeof window !== 'undefined' && createPortal(
            <div 
              style={{ 
                ...(optionsCoords.openUpward 
                  ? { bottom: `${window.innerHeight - optionsCoords.top + 8}px` } 
                  : { top: `${optionsCoords.top}px` }
                ),
                maxHeight: '75vh',
                ...(isRtl ? { left: `${optionsCoords.left}px` } : { right: `${optionsCoords.right}px` })
              }}
              className="fixed z-[999999] flex flex-col rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="relative flex flex-col overflow-y-auto max-h-[75vh]">
                <FileOptionsModal
                  isOpen={isOptionsOpen}
                  onClose={() => setIsOptionsOpen(false)}
                  item={item}
                  onSave={(opts, applyAll) => {
                    if (onUpdateOptions) onUpdateOptions(item.id, opts);
                    setIsOptionsOpen(false);
                  }}
                  isDarkMode={isDarkMode}
                  isRtl={isRtl}
                  hasMultipleFiles={hasMultipleFiles}
                />
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>

      {(item.status === 'converting' || item.status === 'paused') && (
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-bold">
            <span className={item.status === 'paused' ? 'text-amber-500' : 'text-sky-500'}>
              {item.status === 'paused' ? (isRtl ? 'متوقف مؤقتاً' : 'Paused') : `${item.progress}%`}
            </span>
            <span className="text-slate-400">
              {item.status === 'paused' ? '' : (isRtl ? 'جاري المعالجة والقص...' : 'Processing & Triming...')}
            </span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <div
              className={`h-full transition-all duration-300 ${
                item.status === 'paused' ? 'bg-amber-500' : 'bg-sky-500'
              }`}
              style={{ width: `${item.progress}%` }}
            />
          </div>
        </div>
      )}

      {item.status === 'completed' && (
        <div className="text-[11px] text-emerald-500 font-bold flex items-center gap-1.5">
          <span>✨</span>
          <span>{isRtl ? 'اكتملت المعالجة والقص بنجاح' : 'Processed and Trimmed Successfully'}</span>
        </div>
      )}

      {item.status === 'error' && (
        <div className="text-[11px] text-rose-500 font-bold flex items-center gap-1.5">
          <span>❌</span>
          <span>{item.errorMessage || (isRtl ? 'فشلت عملية التحويل' : 'Conversion Failed')}</span>
        </div>
      )}
    </div>
  );
};
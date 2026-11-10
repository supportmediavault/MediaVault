'use client';

import React, { useState } from 'react';
import { baseTranslations } from '@/src/core/i18n/translator';

interface FileOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    customName: string;
    file: File;
    options?: {
      videoCodec?: string;
      resolution?: string;
      crf?: number;
      quality?: number;
      audioCodec?: string;
      audioBitrate?: string;
      trimStart?: string;
      trimEnd?: string;
    };
  };
  onSave: (options: any, applyToAll: boolean) => void;
  isDarkMode: boolean;
  isRtl: boolean;
  hasMultipleFiles: boolean;
  currentLang?: string;
}

export const FileOptionsModal: React.FC<FileOptionsModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
  isDarkMode,
  isRtl,
  hasMultipleFiles,
  currentLang = 'en'
}) => {
  const activeLang = baseTranslations[currentLang] ? currentLang : 'en';
  const t = (key: string) => {
    return baseTranslations[activeLang]?.[key] || baseTranslations['en']?.[key] || key;
  };

  const fileName = (item?.file?.name || item?.customName || '').toLowerCase();
  const fileType = (item?.file?.type || '').toLowerCase();

  const isImage = fileType.startsWith('image/') || /\.(webp|png|jpeg|jpg|avif|gif|bmp|ico|svg|tiff)$/i.test(fileName);
  const isVideo = fileType.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv|flv|3gp|m4v|ts|ogv)$/i.test(fileName);
  const isAudio = (!isVideo && !isImage) && (fileType.startsWith('audio/') || /\.(mp3|wav|ogg|aac|m4a|flac|wma|opus)$/i.test(fileName));

  // جميع الـ Hooks هنا بتعريف ثابت ومنتظم بدون أي شروط قبلها
  const [videoCodec, setVideoCodec] = useState(item?.options?.videoCodec || 'libx264');
  const [crf, setCrf] = useState<number>(item?.options?.crf !== undefined ? item.options.crf : 23);
  
  const [imageQuality, setImageQuality] = useState<number>(
    item?.options?.quality !== undefined ? Math.round(item.options.quality * 100) : 85
  );

  const initialRes = item?.options?.resolution || 'no change';
  const standardResolutions = ['no change', '320x240', '640x480', '854x480', '960x720', '1280x720', '1440x1080', '1920x1080', '2560x1440', '3840x2160'];
  const isCustomRes = initialRes.includes('x') && !standardResolutions.some(res => initialRes.includes(res));

  const [resolution, setResolution] = useState(isCustomRes ? 'custom' : initialRes);
  const [customWidth, setCustomWidth] = useState(isCustomRes ? initialRes.split('x')[0] || '1920' : '1920');
  const [customHeight, setCustomHeight] = useState(isCustomRes ? initialRes.split('x')[1] || '1080' : '1080');

  const [audioCodec, setAudioCodec] = useState(item?.options?.audioCodec || 'aac');
  const [audioBitrate, setAudioBitrate] = useState(item?.options?.audioBitrate || '128');
  
  const parseToSeconds = (val?: string) => {
    if (!val) return 0;
    const clean = val.trim();
    if (/^\d+$/.test(clean)) return parseInt(clean, 10);
    const parts = clean.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  };

  const [startSec, setStartSec] = useState<number>(parseToSeconds(item?.options?.trimStart));
  const [endSec, setEndSec] = useState<number>(parseToSeconds(item?.options?.trimEnd) || 60);
  const [maxDuration, setMaxDuration] = useState<number>(Math.max(100, endSec + 30));

  const [trimStart, setTrimStart] = useState(item?.options?.trimStart || '');
  const [trimEnd, setTrimEnd] = useState(item?.options?.trimEnd || '');
  
  const [showTrimConfirmation, setShowTrimConfirmation] = useState(false);
  const [applyToAll, setApplyToAll] = useState(false);

  if (!isOpen) return null; // الشرط أصبح هنا بعد تعريف كل الـ Hooks تماماً

  const formatSecondsToHMS = (sec: number) => {
    const hrs = Math.floor(sec / 3600).toString().padStart(2, '0');
    const mins = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${s}`;
  };

  const handleStartSliderChange = (val: number) => {
    const newStart = Math.min(val, endSec - 1 < 0 ? 0 : endSec - 1);
    setStartSec(newStart);
    setTrimStart(formatSecondsToHMS(newStart));
  };

  const handleEndSliderChange = (val: number) => {
    const newEnd = Math.max(val, startSec + 1);
    setEndSec(newEnd);
    setTrimEnd(formatSecondsToHMS(newEnd));
  };

  const formatTimeInput = (val: string) => {
    const clean = val.trim();
    if (!clean) return '';
    if (/^\d+$/.test(clean)) {
      const sec = parseInt(clean, 10);
      return formatSecondsToHMS(sec);
    }
    return clean;
  };

  const handleApplyTrimCheck = () => {
    if (trimStart.trim() || trimEnd.trim()) {
      setShowTrimConfirmation(true);
      setTimeout(() => setShowTrimConfirmation(false), 3000);
    }
  };

  const handleSave = () => {
    let finalResolution = resolution;
    if (resolution === 'custom') {
      finalResolution = `${customWidth.trim() || '1920'}x${customHeight.trim() || '1080'}`;
    }

    onSave({
      videoCodec: isVideo ? videoCodec : undefined,
      crf: isVideo ? Number(crf) : undefined,
      quality: isImage ? imageQuality / 100 : undefined,
      resolution: (isVideo || isImage) ? finalResolution : undefined,
      audioCodec: (isVideo || isAudio) ? audioCodec : undefined,
      audioBitrate: (isVideo || isAudio) ? audioBitrate : undefined,
      trimStart: isVideo ? formatTimeInput(trimStart) : undefined,
      trimEnd: isVideo ? formatTimeInput(trimEnd) : undefined
    }, applyToAll);
    onClose();
  };

  const inputThemeClass = isDarkMode 
    ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-sky-500' 
    : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500';

  return (
    <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-[92vw] sm:max-w-md max-h-[80vh] flex flex-col rounded-3xl shadow-2xl border transition-all overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 ${
          isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100 shadow-black' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        <div className={`flex items-center justify-between px-4 py-3 border-b flex-shrink-0 ${isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-100'}`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-sky-400 font-bold text-sm">⚙️</span>
            <h3 className="font-black text-xs truncate">
              {t('targetFormat') || 'Options'} <span className="text-sky-400 text-[10px] font-normal truncate">({item.customName})</span>
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs font-bold">
          {isImage && (
            <div className={`p-3.5 rounded-2xl border space-y-3 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-xs font-black text-sky-400 flex items-center gap-1">
                <span>🖼️</span>
                <span>{t('tabs')?.image || 'Image Settings'}</span>
              </div>
              <div className={`space-y-2 p-3 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 text-xs">{t('compression') || 'Image Quality'}: {imageQuality}%</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={imageQuality}
                    onChange={(e) => setImageQuality(Math.min(100, Math.max(1, Number(e.target.value))))}
                    className={`w-14 px-1.5 py-0.5 rounded text-xs text-center font-bold border ${inputThemeClass}`}
                  />
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={imageQuality}
                  onChange={(e) => setImageQuality(Number(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
              </div>
            </div>
          )}

          {isVideo && (
            <div className={`p-3.5 rounded-2xl border space-y-3 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-xs font-black text-sky-400 flex items-center gap-1">
                <span>📹</span>
                <span>{t('tabs')?.video || 'Video Settings'}</span>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-[11px]">{t('videoCodec') || 'Video Codec'}</label>
                <select
                  value={videoCodec}
                  onChange={(e) => setVideoCodec(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border font-bold cursor-pointer text-xs ${inputThemeClass}`}
                >
                  <option value="libx264">H.264 (x264)</option>
                  <option value="libx265">H.265 / HEVC (x265)</option>
                  <option value="copy">Copy (no re-encoding / Fast)</option>
                </select>
              </div>

              <div className={`space-y-2 p-3 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 text-xs">Constant Quality (CRF): {crf}</label>
                  <input
                    type="number"
                    min="0"
                    max="51"
                    value={crf}
                    onChange={(e) => setCrf(Number(e.target.value))}
                    className={`w-14 px-1.5 py-0.5 rounded text-xs text-center font-bold border ${inputThemeClass}`}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="51"
                  value={crf}
                  onChange={(e) => setCrf(Number(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-[11px]">Video Resolution</label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border font-bold cursor-pointer text-xs ${inputThemeClass}`}
                >
                  <option value="no change">no change (Keep current)</option>
                  <option value="1280x720">1280x720 (720p HD)</option>
                  <option value="1920x1080">1920x1080 (1080p Full HD)</option>
                  <option value="3840x2160">3840x2160 (4K UHD)</option>
                </select>
              </div>
            </div>
          )}

          {(isVideo || isAudio) && (
            <div className={`p-3.5 rounded-2xl border space-y-3 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-xs font-black text-sky-400 flex items-center gap-1">
                <span>🎵</span>
                <span>{t('tabs')?.audio || 'Audio Settings'}</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px]">Audio Codec</label>
                  <select
                    value={audioCodec}
                    onChange={(e) => setAudioCodec(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border font-bold cursor-pointer text-xs ${inputThemeClass}`}
                  >
                    <option value="copy">Copy (no re-encoding)</option>
                    <option value="none">None (remove audio)</option>
                    <option value="aac">AAC</option>
                    <option value="libmp3lame">MP3</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px]">Audio Bitrate (kbit/s)</label>
                  <input
                    type="text"
                    value={audioBitrate}
                    onChange={(e) => setAudioBitrate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border font-bold text-xs ${inputThemeClass}`}
                  />
                </div>
              </div>
            </div>
          )}

          {isVideo && (
            <div className={`p-3.5 rounded-2xl border space-y-3 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                  <span>✂️</span>
                  <span>{activeLang === 'ar' ? 'القص البصري التفاعلي' : 'Interactive Visual Trimmer'}</span>
                </div>
                {(trimStart || trimEnd) && (
                  <button
                    type="button"
                    onClick={handleApplyTrimCheck}
                    className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30"
                  >
                    Confirm ✓
                  </button>
                )}
              </div>

              {showTrimConfirmation && (
                <div className="p-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold text-center">
                  Trim times applied successfully!
                </div>
              )}

              <div className={`p-2.5 rounded-xl border space-y-2.5 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                  <span>Start: <strong className="text-amber-400">{trimStart || formatSecondsToHMS(startSec)}</strong></span>
                  <span>End: <strong className="text-amber-400">{trimEnd || formatSecondsToHMS(endSec)}</strong></span>
                </div>

                <div className="space-y-1.5 pt-0.5">
                  <input
                    type="range"
                    min={0}
                    max={maxDuration}
                    value={startSec}
                    onChange={(e) => handleStartSliderChange(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <input
                    type="range"
                    min={0}
                    max={maxDuration}
                    value={endSec}
                    onChange={(e) => handleEndSliderChange(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px]">Start Time</label>
                  <input
                    type="text"
                    placeholder="00:00:01"
                    value={trimStart}
                    onChange={(e) => {
                      setTrimStart(e.target.value);
                      const sec = parseToSeconds(e.target.value);
                      if (sec > 0) setStartSec(sec);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl border font-bold text-xs ${inputThemeClass}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px]">End Time</label>
                  <input
                    type="text"
                    placeholder="00:00:05"
                    value={trimEnd}
                    onChange={(e) => {
                      setTrimEnd(e.target.value);
                      const sec = parseToSeconds(e.target.value);
                      if (sec > 0) setEndSec(sec);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl border font-bold text-xs ${inputThemeClass}`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`p-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0 ${isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-100'}`}>
          {hasMultipleFiles ? (
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
              <input
                type="checkbox"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
                className="w-4 h-4 rounded accent-sky-500 cursor-pointer"
              />
              <span>Apply to all files</span>
            </label>
          ) : <div />}

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl border font-bold text-xs cursor-pointer ${
                isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-black text-xs shadow-lg shadow-sky-500/30 cursor-pointer"
            >
              Apply Options
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
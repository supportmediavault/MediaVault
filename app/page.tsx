'use client';

import React, { useState, useEffect } from 'react';
import { queueManager, QueueItem } from '@/src/core/queueManager';
import { convertImage } from '@/src/core/converters/imageConverter';
import { convertAudio } from '@/src/core/converters/audioConverter';
import { convertVideo } from '@/src/core/converters/videoConverter';
import { baseTranslations, LANGUAGES } from '@/src/core/i18n/translator';

import { Header } from '@/src/components/Header';
import { Footer } from '@/src/components/Footer';
import { SupportModal } from '@/src/components/SupportModal';
import { AboutModal } from '@/src/components/AboutModal';
import { TermsModal } from '@/src/components/TermsModal';
import { SuggestionBox } from '@/src/components/SuggestionBox';
import { CookieBanner } from '@/src/components/CookieBanner';
import { WasmChecker } from '@/src/components/WasmChecker';
import { PreviewModal } from '@/src/components/PreviewModal';

type TabType = 'image' | 'audio' | 'video';

export default function IMediaApp() {
  const [lang, setLang] = useState<string>('en');
  const isRtl = lang === 'ar';
  
  const t = baseTranslations[lang] || baseTranslations.en;

  const [activeTab, setActiveTab] = useState<TabType>('image');
  const [fileList, setFileList] = useState<QueueItem[]>([]);
  const [isGlobalPaused, setIsGlobalPaused] = useState<boolean>(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState<string>('');

  const [targetFormat, setTargetFormat] = useState<string>('webp');
  const [videoResolution, setVideoResolution] = useState<string>('original');
  const [videoPreset, setVideoPreset] = useState<string>('custom');
  const [compressionLevel, setCompressionLevel] = useState<string>('medium');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const [sessionStats, setSessionStats] = useState({ convertedCount: 0, totalBytesProcessed: 0 });
  const [previewItem, setPreviewItem] = useState<{ url: string; name: string; type: TabType } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isSupportOpen, setIsSupportOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isTermsOpen, setIsTermsOpen] = useState<boolean>(false);
  const [typeError, setTypeError] = useState<string | null>(null);

  const [userRating, setUserRating] = useState<number>(0);
  const [ratingSubmitted, setRatingSubmitted] = useState<boolean>(false);
  const [totalVotes, setTotalVotes] = useState<number>(42);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    document.title = t.mainHeading || 'iMedia - Local Media Converter';
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', t.mainDesc || 'Fast, secure local media conversion.');
  }, [lang, t]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.error('Service Worker registration failed: ', err);
        });
      });
    }
  }, []);

  useEffect(() => {
    const savedFormat = localStorage.getItem(`imedia_pref_format_${activeTab}`);
    const savedComp = localStorage.getItem('imedia_pref_compression');
    if (savedFormat) setTargetFormat(savedFormat);
    if (savedComp) setCompressionLevel(savedComp);
  }, [activeTab]);

  const handleFormatChange = (fmt: string) => {
    setTargetFormat(fmt);
    localStorage.setItem(`imedia_pref_format_${activeTab}`, fmt);
  };

  const handleCompressionChange = (comp: string) => {
    setCompressionLevel(comp);
    localStorage.setItem('imedia_pref_compression', comp);
  };

  const handlePresetChange = (preset: string) => {
    setVideoPreset(preset);
    if (preset === 'discord') {
      setVideoResolution('480');
      setCompressionLevel('high');
    } else if (preset === 'whatsapp') {
      setVideoResolution('480');
      setCompressionLevel('medium');
    } else if (preset === 'youtube') {
      setVideoResolution('1080');
      setCompressionLevel('low');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    queueManager.setConverters(convertVideo, convertAudio, convertImage);
    const unsubscribe = queueManager.subscribe((items, globalPaused) => {
      const prevCompleted = fileList.filter(i => i.status === 'completed').length;
      const newCompleted = items.filter(i => i.status === 'completed').length;
      if (newCompleted > prevCompleted) {
        showToast(isRtl ? '✨ تم اكتمال تحويل ملف بنجاح!' : '✨ File conversion completed successfully!');
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('iMedia', { body: isRtl ? 'تم الانتهاء من معالجة ملف بنجاح' : 'A file has been successfully converted!' });
        }
      }

      setFileList([...items]);
      setIsGlobalPaused(globalPaused);
      const active = items.some(i => i.status === 'converting');
      setIsProcessing(active);

      const completed = items.filter(i => i.status === 'completed');
      const totalBytes = completed.reduce((acc, curr) => acc + (curr.file?.size || 0), 0);
      setSessionStats({
        convertedCount: completed.length,
        totalBytesProcessed: totalBytes
      });
    });
    return () => {
      unsubscribe();
    };
  }, [fileList, isRtl]);

  useEffect(() => {
    const defaultFormat = activeTab === 'image' ? 'webp' : activeTab === 'audio' ? 'mp3' : 'mp4';
    const saved = localStorage.getItem(`imedia_pref_format_${activeTab}`);
    setTargetFormat(saved || defaultFormat);
    setTypeError(null);
  }, [activeTab]);

  const validateAndAddFiles = (files: FileList | File[]) => {
    setTypeError(null);
    const validFiles: File[] = [];

    Array.from(files).forEach((f) => {
      const isImg = f.type.startsWith('image/');
      const isAud = f.type.startsWith('audio/');
      const isVid = f.type.startsWith('video/');

      if (activeTab === 'image' && !isImg) return;
      if (activeTab === 'audio' && !isAud) return;
      if (activeTab === 'video' && !isVid) return;

      validFiles.push(f);
    });

    if (validFiles.length === 0 && files.length > 0) {
      setTypeError(t.invalidFileType || 'Invalid file type selected');
      return;
    }

    queueManager.addFiles(validFiles);
  };

  const startConversion = () => {
    const quality = compressionLevel === 'high' ? 0.70 : compressionLevel === 'low' ? 0.95 : 0.85;
    const crf = compressionLevel === 'high' ? 28 : compressionLevel === 'low' ? 18 : 23;
    const options = { resolution: videoResolution, crf, quality };

    queueManager.start(activeTab, targetFormat, options);
  };

  const filteredFileList = fileList.filter((item) => {
    if (item.status === 'cancelled') return false;

    const isImg = item.file.type.startsWith('image/');
    const isAud = item.file.type.startsWith('audio/');
    const isVid = item.file.type.startsWith('video/');

    if (activeTab === 'image') return isImg;
    if (activeTab === 'audio') return isAud;
    if (activeTab === 'video') return isVid;
    return true;
  });

  const handleDownloadAllSeparately = async () => {
    const completedItems = filteredFileList.filter(item => item.status === 'completed' && item.downloadUrl);
    
    for (let i = 0; i < completedItems.length; i++) {
      const item = completedItems[i];
      const a = document.createElement('a');
      a.href = item.downloadUrl!;
      a.download = `${item.customName || 'converted'}.${targetFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (i < completedItems.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  };

  const handleDownloadAsZip = () => {
    queueManager.downloadAllAsZip(targetFormat);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const calculateEstimatedSize = (originalSize: number) => {
    let multiplier = 0.85;
    if (compressionLevel === 'high') multiplier = 0.40;
    if (compressionLevel === 'low') multiplier = 0.95;
    if (videoResolution === '480') multiplier *= 0.5;
    if (videoResolution === '720') multiplier *= 0.7;
    if (videoResolution === '2k') multiplier *= 1.1;
    if (videoResolution === '4k') multiplier *= 1.5;
    const est = originalSize * multiplier;
    return formatFileSize(est);
  };

  const hasActiveConverting = filteredFileList.some(i => i.status === 'converting');
  const hasPaused = filteredFileList.some(i => i.status === 'paused');
  const completedCount = filteredFileList.filter((item) => item.status === 'completed').length;
  const hasLargeFile = filteredFileList.some(i => i.file.size > 1024 * 1024 * 1024);

  const getFormatDescription = () => {
    const formatMap = t.formatDescriptions || baseTranslations.en.formatDescriptions;
    return formatMap[targetFormat] || 'High performance media conversion format.';
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`min-h-screen transition-colors duration-300 flex flex-col justify-between font-sans relative overflow-x-hidden ${
        isDarkMode
          ? 'bg-[#090d16] text-slate-100'
          : 'bg-gradient-to-br from-slate-50 via-sky-50/30 to-slate-100 text-slate-800'
      }`}
    >
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-sky-600 text-white px-5 py-2.5 rounded-2xl shadow-2xl text-xs font-bold animate-bounce">
          {toastMessage}
        </div>
      )}

      <Header
        lang={lang}
        setLang={setLang}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        t={t}
      />

      <main className="max-w-6xl mx-auto px-4 pt-32 pb-36 w-full flex-grow space-y-8">
        
        <WasmChecker isDarkMode={isDarkMode} isRtl={isRtl} />

        <div className="text-center space-y-3">
          <h1 className={`text-2xl md:text-3xl font-black tracking-tight leading-tight bg-gradient-to-r ${
            isDarkMode 
              ? 'from-sky-300 via-blue-400 to-indigo-300 drop-shadow-[0_4px_16px_rgba(56,189,248,0.35)]' 
              : 'from-slate-900 via-sky-900 to-blue-800 drop-shadow-[0_3px_12px_rgba(15,23,42,0.18)]'
          } bg-clip-text text-transparent py-1`}>
            {t.mainHeading}
          </h1>
          <p className={`text-xs md:text-sm max-w-xl mx-auto leading-relaxed font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {t.mainDesc}
          </p>

          <div className={`inline-flex items-center gap-4 px-4 py-2 rounded-2xl border text-xs font-bold mt-2 shadow-sm ${
            isDarkMode ? 'bg-slate-900/80 border-slate-700 text-slate-300' : 'bg-white/80 border-sky-100 text-slate-700'
          }`}>
            <span>📊 {isRtl ? 'إحصائيات الجلسة:' : 'Session Stats:'}</span>
            <span className="text-sky-500">{sessionStats.convertedCount} {isRtl ? 'ملفات محولة' : 'Converted'}</span>
            <span className="text-slate-400">|</span>
            <span className="text-emerald-500">{formatFileSize(sessionStats.totalBytesProcessed)} {isRtl ? 'معالجة محلية' : 'Processed'}</span>
          </div>
        </div>

        <div
          className={`rounded-3xl p-5 md:p-8 shadow-2xl backdrop-blur-xl relative space-y-5 border ${
            isDarkMode
              ? 'bg-slate-900/90 border-slate-700 text-slate-100 shadow-sky-950/20'
              : 'bg-white/95 border-sky-100 text-slate-800 shadow-sky-100/50'
          }`}
        >
          <div className={`grid grid-cols-3 p-1.5 rounded-2xl border ${isDarkMode ? 'bg-slate-950/65 border-slate-700' : 'bg-slate-100/90 border-slate-200'}`}>
            {[
              { id: 'image', label: t.tabs?.image || 'Images', icon: '🖼️' },
              { id: 'audio', label: t.tabs?.audio || 'Audio', icon: '🎵' },
              { id: 'video', label: t.tabs?.video || 'Video', icon: '🎬' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`group relative py-3 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2.5 transition-all duration-300 ease-out cursor-pointer ${
                    isActive
                      ? 'bg-sky-500 text-white shadow-xl shadow-sky-500/40 scale-[1.04] font-black z-10'
                      : isDarkMode 
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800/90 hover:-translate-y-1.5 hover:scale-[1.08] hover:shadow-xl hover:shadow-black/50 hover:z-20' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white hover:-translate-y-1.5 hover:scale-[1.08] hover:shadow-xl hover:shadow-sky-500/15 hover:z-20'
                  }`}
                >
                  <span className="transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6">
                    {tab.icon}
                  </span>
                  <span className="tracking-wide">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {typeError && (
            <div className="bg-rose-500/15 border border-rose-500/30 text-rose-500 p-3 rounded-xl text-xs font-bold text-center">
              {typeError}
            </div>
          )}

          {hasLargeFile && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 p-3.5 rounded-2xl text-xs flex items-center gap-3">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-bold">{t.largeFileWarningTitle || 'Large file detected'}</p>
                <p className="opacity-90">{t.largeFileWarningDesc || 'Heavy video conversions consume active memory.'}</p>
              </div>
            </div>
          )}

          <div
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.files?.length) validateAndAddFiles(e.dataTransfer.files);
            }}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.multiple = true;
              input.onchange = (e: any) => {
                if (e.target.files?.length) validateAndAddFiles(e.target.files);
              };
              input.click();
            }}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2.5 group ${
              isDarkMode
                ? 'border-slate-700 hover:border-sky-500 bg-slate-950/40 hover:bg-slate-950/70'
                : 'border-sky-200 hover:border-sky-400 bg-sky-50/40 hover:bg-sky-50/80'
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-sm ${isDarkMode ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-sky-100 text-sky-600'}`}>
              📁
            </div>
            <div className="space-y-1">
              <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{t.dropzoneTitle}</p>
              <p className="text-xs text-slate-400">{t.dropzoneSubtitle}</p>
            </div>
          </div>

          <div className={`p-3 rounded-2xl border text-[11px] leading-relaxed flex items-center gap-2.5 ${
            isDarkMode ? 'bg-amber-950/10 border-amber-900/30 text-amber-300/90' : 'bg-amber-50/70 border-amber-200/60 text-amber-900'
          }`}>
            <span className="text-sm">ℹ️</span>
            <span>{t.qualityNoteDesc || 'Note: Increasing resolution beyond the original source does not create new pixels or improve native quality.'}</span>
          </div>

          {filteredFileList.length > 0 && (
            <div className={`space-y-3 p-3.5 rounded-2xl border ${isDarkMode ? 'bg-slate-950/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
                <span>{t.selectedFiles} ({filteredFileList.length}):</span>
                <div className="flex items-center gap-3">
                  {hasActiveConverting && (
                    <button
                      onClick={() => queueManager.pauseAll()}
                      className="text-amber-500 hover:underline cursor-pointer font-bold"
                    >
                      ⏸ Pause All
                    </button>
                  )}
                  {!hasActiveConverting && hasPaused && (
                    <button
                      onClick={() => queueManager.resumeAll(activeTab, targetFormat, { quality: compressionLevel === 'high' ? 0.70 : compressionLevel === 'low' ? 0.95 : 0.85 })}
                      className="text-sky-500 hover:underline cursor-pointer font-bold"
                    >
                      ▶ Resume All
                    </button>
                  )}
                  <button onClick={() => {
                    filteredFileList.forEach(item => queueManager.removeFile(item.id));
                  }} className="text-rose-500 hover:underline cursor-pointer">
                    {t.clearList}
                  </button>
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {filteredFileList.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-semibold ${
                      isDarkMode ? 'bg-slate-900/60 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate w-full sm:max-w-xs">
                      <span className="text-sm cursor-default select-none">
                        {item.status === 'completed' ? '✅' : item.status === 'converting' ? '🟢' : item.status === 'paused' ? '🟠' : '⏳'}
                      </span>
                      <div className="truncate w-full space-y-0.5">
                        {editingId === item.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={tempName}
                              onChange={(e) => setTempName(e.target.value)}
                              className={`px-2 py-0.5 rounded text-xs border font-bold w-full ${isDarkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-sky-400 text-slate-900'}`}
                              autoFocus
                            />
                            <button
                              onClick={() => {
                                if (tempName.trim()) queueManager.updateFileName(item.id, tempName.trim());
                                setEditingId(null);
                              }}
                              className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold"
                            >
                              ✓
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 truncate">
                            <p className="truncate font-bold" title={item.customName}>
                              {item.customName}.{targetFormat}
                            </p>
                            {item.status !== 'completed' && item.status !== 'converting' && (
                              <button
                                onClick={() => {
                                  setEditingId(item.id);
                                  setTempName(item.customName);
                                }}
                                className="text-slate-400 hover:text-sky-500 text-xs cursor-pointer flex-shrink-0"
                                title="Edit filename"
                              >
                                ✏️
                              </button>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-[10px] text-slate-400">
                          <span>Original: {formatFileSize(item.file.size)}</span>
                          <span className="text-sky-500 font-bold">Est. Size: {calculateEstimatedSize(item.file.size)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-center">
                      {item.status === 'converting' && (
                        <span className="text-sky-400 font-bold">{item.progress}%</span>
                      )}
                      {item.status === 'paused' && (
                        <span className="text-amber-500 font-bold">Paused ({item.progress}%)</span>
                      )}
                      {item.status === 'completed' && item.downloadUrl && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setPreviewItem({ url: item.downloadUrl!, name: `${item.customName}.${targetFormat}`, type: activeTab })}
                            className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                            title="Preview Converted File"
                          >
                            👁️ {isRtl ? 'معاينة' : 'Preview'}
                          </button>

                          <a
                            href={item.downloadUrl}
                            download={`${item.customName}.${targetFormat}`}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold shadow-sm transition-colors"
                          >
                            {t.download}
                          </a>
                        </div>
                      )}
                      {item.status === 'error' && (
                        <span className="text-rose-500 font-bold">Error</span>
                      )}

                      {(item.status === 'idle' || item.status === 'paused') && (
                        <button
                          onClick={() => {
                            const quality = compressionLevel === 'high' ? 0.70 : compressionLevel === 'low' ? 0.95 : 0.85;
                            const crf = compressionLevel === 'high' ? 28 : compressionLevel === 'low' ? 18 : 23;
                            queueManager.startSingleFile(item.id, activeTab, targetFormat, { resolution: videoResolution, crf, quality });
                          }}
                          className="text-sky-500 hover:text-sky-600 text-xs font-bold px-1.5 transition-colors cursor-pointer"
                          title="Start this file only"
                        >
                          ▶
                        </button>
                      )}

                      {item.status === 'converting' && (
                        <button
                          onClick={() => queueManager.pauseFile(item.id)}
                          className="text-amber-500 hover:text-amber-600 text-xs font-bold px-1.5 transition-colors cursor-pointer"
                          title="Pause"
                        >
                          ⏸
                        </button>
                      )}

                      {item.status !== 'completed' && (
                        <button
                          onClick={() => queueManager.removeFile(item.id)}
                          className="text-slate-400 hover:text-rose-500 text-sm font-bold px-1 transition-colors cursor-pointer"
                          title="Cancel"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {completedCount > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-2">
                  <button
                    onClick={handleDownloadAsZip}
                    className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    📦 {isRtl ? `تحميل الكل كمجلد (ZIP) (${completedCount})` : `Download All as Folder (ZIP) (${completedCount})`}
                  </button>
                  <button
                    onClick={handleDownloadAllSeparately}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    📥 {isRtl ? `تحميل الكل بشكل منفصل (${completedCount})` : `Download All Separately (${completedCount})`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* خيارات التحكم مع فقاعة التنبيه التفاعلية عند اختيار الـ Preset */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950/40 border-slate-700' : 'bg-slate-50/80 border-slate-200'}`}>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-400">{t.targetFormat || 'Target Format'}</label>
              <select
                value={targetFormat}
                onChange={(e) => handleFormatChange(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer hover:bg-sky-500/10 focus:outline-none ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                {activeTab === 'image' && (
                  <>
                    <option value="webp">WEBP (Modern & Fast)</option>
                    <option value="png">PNG (Lossless)</option>
                    <option value="jpeg">JPEG (Standard Photo)</option>
                    <option value="jpg">JPG</option>
                    <option value="avif">AVIF (Ultra Compressed)</option>
                    <option value="gif">GIF (Animated)</option>
                    <option value="bmp">BMP (Bitmap Image)</option>
                    <option value="ico">ICO (Favicon & Icon)</option>
                  </>
                )}
                {activeTab === 'audio' && (
                  <>
                    <option value="mp3">MP3 (Universal Audio)</option>
                    <option value="wav">WAV (Lossless Studio)</option>
                    <option value="ogg">OGG (Open Web Audio)</option>
                    <option value="aac">AAC (Advanced Audio)</option>
                    <option value="m4a">M4A (Apple Audio)</option>
                    <option value="flac">FLAC (High Fidelity Lossless)</option>
                  </>
                )}
                {activeTab === 'video' && (
                  <>
                    <option value="mp4">MP4 (Universal Video)</option>
                    <option value="webm">WEBM (Web Optimized)</option>
                    <option value="mov">MOV (Apple QuickTime)</option>
                    <option value="avi">AVI (Classic Windows)</option>
                    <option value="mkv">MKV (Matroska High Quality)</option>
                    <option value="flv">Flash Video</option>
                    <option value="3gp">3GP (Mobile Format)</option>
                    <option value="m4v">M4V (iTunes Video)</option>
                    <option value="ts">TS (MPEG Transport Stream)</option>
                  </>
                )}
              </select>
            </div>

            {activeTab === 'video' ? (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-400">{t.videoPreset || 'Platform Preset'}</label>
                  <select
                    value={videoPreset}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer hover:bg-sky-500/10 focus:outline-none ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="custom">{t.presetCustom || 'Custom Settings'}</option>
                    <option value="discord">🎮 {t.presetDiscord || 'Discord (< 8MB)'}</option>
                    <option value="whatsapp">💬 {t.presetWhatsapp || 'WhatsApp'}</option>
                    <option value="youtube">▶️ {t.presetYoutube || 'YouTube (1080p)'}</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1 relative">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-400">{t.videoResolution || 'Video Resolution'}</label>
                    {videoPreset !== 'custom' && (
                      <span className="absolute -top-7 right-0 z-10 bg-sky-600 text-white text-[10px] px-2.5 py-1 rounded-xl shadow-lg animate-pulse font-bold whitespace-nowrap">
                        {isRtl ? '💡 يمكنك التعديل بحرية دون تجاوز الحجم!' : '💡 Adjustable! Watch file size.'}
                      </span>
                    )}
                  </div>
                  <select
                    value={videoResolution}
                    onChange={(e) => {
                      setVideoResolution(e.target.value);
                      setVideoPreset('custom');
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer hover:bg-sky-500/10 focus:outline-none ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="original">Original (Keep Source)</option>
                    <option value="4k">4K (Ultra HD - 2160p)</option>
                    <option value="2k">2K (QHD - 1440p)</option>
                    <option value="1080">Full HD (1080p)</option>
                    <option value="720">HD (720p)</option>
                    <option value="480">SD (480p)</option>
                  </select>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400">{t.compression || 'Compression Level'}</label>
                <select
                  value={compressionLevel}
                  onChange={(e) => handleCompressionChange(e.target.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer hover:bg-sky-500/10 focus:outline-none ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="low">{t.compLow}</option>
                  <option value="medium">{t.compMedium}</option>
                  <option value="high">{t.compHigh}</option>
                </select>
              </div>
            )}
          </div>

          <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed font-medium flex items-center gap-3 ${
            isDarkMode ? 'bg-sky-950/20 border-sky-900/40 text-sky-300' : 'bg-sky-50/70 border-sky-100 text-sky-800'
          }`}>
            <span className="text-base">💡</span>
            <div>
              <span className="font-bold uppercase tracking-wider mr-1">{targetFormat}:</span>
              <span>{getFormatDescription()}</span>
            </div>
          </div>

          <button
            onClick={startConversion}
            disabled={filteredFileList.length === 0 || isProcessing}
            className="w-full py-3.5 px-6 rounded-2xl font-black text-sm transition-all shadow-xl flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>{isProcessing ? t.converting : `${t.convertBtn} (${filteredFileList.length})`}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
          {(t.features || baseTranslations.en.features).map((feat: any, idx: number) => {
            const icons = [
              '/images/offline.png',
              '/images/highperformance.png',
              '/images/safe.png',
              '/images/download.png'
            ];
            const imageClasses = ['scale-[1.4]', 'scale-[1.4]', 'scale-80', 'scale-80'];

            return (
              <div 
                key={idx} 
                className={`relative group p-6 rounded-[2.55rem] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(56,189,248,0.12)] flex flex-col justify-between ${
                  isDarkMode 
                    ? 'bg-slate-900/90 border border-sky-400/25 shadow-[0_4px_25px_rgba(56,189,248,0.06)] text-slate-100 backdrop-blur-xl' 
                    : 'bg-gradient-to-b from-[#EBF3FC]/90 to-[#E1EEFB]/90 border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-slate-800 backdrop-blur-md'
                }`}
              >
                <div className="flex items-center gap-3 mb-4 w-full h-16">
                  <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                    <img 
                      src={icons[idx]} 
                      alt={feat.title}
                      className={`w-full h-full object-contain ${imageClasses[idx]} drop-shadow-[0_8px_20px_rgba(56,189,248,0.35)] transition-transform duration-300`}
                    />
                  </div>

                  <div className="flex-1 text-left flex items-center">
                    <span className={`text-[11px] md:text-xs font-bold tracking-wider uppercase leading-tight ${
                      isDarkMode ? 'text-sky-400' : 'text-sky-700'
                    }`}>
                      {feat.badge}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col flex-grow justify-start">
                  <div className="h-[3.2rem] flex items-center mb-3">
                    <h3 className="font-bold text-[15px] md:text-[16px] tracking-tight leading-snug">
                      {feat.title}
                    </h3>
                  </div>
                  
                  <p className={`text-xs md:text-sm leading-relaxed ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </main>

      <SuggestionBox isDarkMode={isDarkMode} isRtl={isRtl} t={t} />

      <CookieBanner isDarkMode={isDarkMode} isRtl={isRtl} t={t} />

      <Footer
        isDarkMode={isDarkMode}
        isRtl={isRtl}
        userRating={userRating}
        setUserRating={setUserRating}
        ratingSubmitted={ratingSubmitted}
        setRatingSubmitted={setRatingSubmitted}
        totalVotes={totalVotes}
        setTotalVotes={setTotalVotes}
        onOpenSupport={() => setIsSupportOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenTerms={() => setIsTermsOpen(true)}
        t={t}
      />

      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} lang={lang} isDarkMode={isDarkMode} />
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} lang={lang} isDarkMode={isDarkMode} />
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} lang={lang} isDarkMode={isDarkMode} />

      {previewItem && (
        <PreviewModal
          isOpen={!!previewItem}
          onClose={() => setPreviewItem(null)}
          mediaUrl={previewItem.url}
          mediaName={previewItem.name}
          mediaType={previewItem.type}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { queueManager, QueueItem } from '@/src/core/queueManager';
import { convertImage } from '@/src/core/converters/imageConverter';
import { convertAudio } from '@/src/core/converters/audioConverter';
import { convertVideo } from '@/src/core/converters/videoConverter';
import { extractAudioFromVideo } from '@/src/core/converters/audioExtractor';
import { baseTranslations } from '@/src/core/i18n/translator';

import { Header } from '@/src/components/Header';
import { Footer } from '@/src/components/Footer';
import { SupportModal } from '@/src/components/SupportModal';
import { AboutModal } from '@/src/components/AboutModal';
import { TermsModal } from '@/src/components/TermsModal';
import { SuggestionBox } from '@/src/components/SuggestionBox';
import { CookieBanner } from '@/src/components/CookieBanner';
import { WasmChecker } from '@/src/components/WasmChecker';
import { PreviewModal } from '@/src/components/PreviewModal';
import { FileItemCard } from '@/src/components/FileItemCard';
import { FileOptionsModal } from '@/src/components/FileOptionsModal';

type TabType = 'image' | 'audio' | 'video';

export default function IMediaApp() {
  const [lang, setLang] = useState<string>('en');
  const isRtl = lang === 'ar';
  
  const t = baseTranslations[lang] || baseTranslations.en;

  const [activeTab, setActiveTab] = useState<TabType>('image');
  const [fileList, setFileList] = useState<QueueItem[]>([]);
  const [isGlobalPaused, setIsGlobalPaused] = useState<boolean>(false);
  
  const [extractedAudioUrls, setExtractedAudioUrls] = useState<{ [id: string]: string }>({});

  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isZipLoading, setIsZipLoading] = useState<boolean>(false);

  // حالة الصيغة العامة المطبقة على الكل (Global Format Apply)
  const [globalFormat, setGlobalFormat] = useState<string>('webp');

  const [sessionStats, setSessionStats] = useState({ convertedCount: 0, totalBytesProcessed: 0 });
  const [previewItem, setPreviewItem] = useState<{ url: string; name: string; type: TabType } | null>(null);
  const [activeOptionsItem, setActiveOptionsItem] = useState<QueueItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isSupportOpen, setIsSupportOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isTermsOpen, setIsTermsOpen] = useState<boolean>(false);
  const [typeError, setTypeError] = useState<string | null>(null);

  const [userRating, setUserRating] = useState<number>(0);
  const [ratingSubmitted, setRatingSubmitted] = useState<boolean>(false);
  const [totalVotes, setTotalVotes] = useState<number>(42);

  // حالة تقسيم الصفحات (Pagination) لعرض 20 عنصر فقط في الشاشة لضمان عدم بطء الواجهة
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleResetItem = (id: string) => {
    queueManager.resetFile(id); 
    setExtractedAudioUrls(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    showToast(isRtl ? '🔄 تمت إعادة تعيين الملف والإعدادات بنجاح' : '🔄 File and options reset successfully');
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

  const validateAndAddFiles = (files: FileList | File[]) => {
    setTypeError(null);
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const firstFile = fileArray[0];
    let detectedTab: TabType = 'video';
    
    if (firstFile.type.startsWith('image/') || /\.(webp|png|jpeg|jpg|avif|gif|bmp|ico)$/i.test(firstFile.name)) {
      detectedTab = 'image';
    } else if (firstFile.type.startsWith('audio/') || /\.(mp3|wav|ogg|aac|m4a|flac)$/i.test(firstFile.name)) {
      detectedTab = 'audio';
    } else if (firstFile.type.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv|flv|3gp|m4v|ts)$/i.test(firstFile.name)) {
      detectedTab = 'video';
    }

    setActiveTab(detectedTab);
    const defaultFmt = detectedTab === 'image' ? 'webp' : detectedTab === 'audio' ? 'mp3' : 'mp4';
    queueManager.addFiles(fileArray, detectedTab, defaultFmt);
  };

  const startConversion = () => {
    queueManager.start(activeTab);
  };

  // دالة تطبيق الصيغة على جميع الملفات دفعة واحدة (Apply to All)
  const handleApplyGlobalFormat = (newFormat: string) => {
    setGlobalFormat(newFormat);
    filteredFileList.forEach(item => {
      queueManager.updateFileFormat(item.id, newFormat);
    });
    showToast(isRtl ? `✨ تم تطبيق الصيغة (${newFormat.toUpperCase()}) على جميع الملفات (${filteredFileList.length})` : `✨ Applied format (${newFormat.toUpperCase()}) to all ${filteredFileList.length} files`);
  };

  const filteredFileList = fileList.filter((item) => {
    if (item.status === 'cancelled') return false;

    const fileType = item.file.type;
    const isImg = fileType.startsWith('image/') || /\.(webp|png|jpeg|jpg|avif|gif|bmp|ico)$/i.test(item.file.name);
    const isAud = fileType.startsWith('audio/') || /\.(mp3|wav|ogg|aac|m4a|flac)$/i.test(item.file.name);
    const isVid = fileType.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv|flv|3gp|m4v|ts)$/i.test(item.file.name);

    if (activeTab === 'image') return isImg;
    if (activeTab === 'audio') return isAud;
    if (activeTab === 'video') return isVid;
    return true;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, fileList.length]);

  const totalPages = Math.ceil(filteredFileList.length / itemsPerPage);
  const paginatedFileList = filteredFileList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDownloadAllSeparately = async () => {
    const completedItems = filteredFileList.filter(item => item.status === 'completed' && item.downloadUrl);
    
    for (let i = 0; i < completedItems.length; i++) {
      const item = completedItems[i];
      const a = document.createElement('a');
      a.href = item.downloadUrl!;
      a.download = `${item.customName || 'converted'}.${item.targetFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (i < completedItems.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  };

  const handleDownloadAsZip = async () => {
    try {
      setIsZipLoading(true);
      showToast(isRtl ? '📦 جاري تجهيز وضغط الملفات في مجلد ZIP...' : '📦 Preparing ZIP archive for files...');
      await queueManager.downloadAllAsZip();
    } catch (e) {
      showToast(isRtl ? '❌ حدث خطأ أثناء إنشاء ملف الـ ZIP' : '❌ Failed to create ZIP archive');
    } finally {
      setIsZipLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const hasActiveConverting = filteredFileList.some(i => i.status === 'converting');
  const hasPaused = filteredFileList.some(i => i.status === 'paused');
  const completedItemsList = filteredFileList.filter((item) => item.status === 'completed');
  const completedCount = completedItemsList.length;
  
  const totalCompletedBytes = completedItemsList.reduce((acc, curr) => acc + (curr.file?.size || 0), 0);
  const totalFormattedSize = formatFileSize(totalCompletedBytes);

  const hasLargeFile = filteredFileList.some(i => i.file.size > 1024 * 1024 * 1024);

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
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[999999] bg-sky-600 text-white px-5 py-2.5 rounded-2xl shadow-2xl text-xs font-bold animate-bounce">
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

      <main className="max-w-6xl mx-auto px-4 pt-32 pb-24 w-full flex-grow flex flex-col gap-8">
        
        <WasmChecker isDarkMode={isDarkMode} isRtl={isRtl} />

        <div className="text-center space-y-3 flex-shrink-0">
          <h1 className={`text-2xl md:text-3xl font-black tracking-tight leading-tight bg-gradient-to-r ${
            isDarkMode 
              ? 'from-sky-300 via-blue-400 to-indigo-300 drop-shadow-[0_4px_16px_rgba(56,189,248,0.35)]' 
              : 'from-slate-900 via-sky-900 to-blue-800 drop-shadow-[0_3px_12px_rgba(15,23,42,0.18)]'
          } bg-clip-text text-transparent py-1`}>
            {t.mainHeading}
          </h1>
          
          <p className={`text-sm md:text-[17.5px] max-w-2xl mx-auto leading-relaxed font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
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
          className={`rounded-3xl p-5 md:p-8 shadow-2xl backdrop-blur-xl space-y-5 border flex-shrink-0 ${
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

          {filteredFileList.length > 0 && (
            <div className="space-y-4 pt-2">
              
              {/* شريط التحكم العام (Global Batch Toolbar) لتطبيق الصيغة على الكل دفعة واحدة */}
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
                isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-sky-50/80 border-sky-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-sm">⚡</span>
                  <span className="text-xs font-black">
                    {isRtl ? `تطبيق الصيغة على الكل (${filteredFileList.length} ملف):` : `Apply Format to All (${filteredFileList.length} files):`}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={globalFormat}
                    onChange={(e) => handleApplyGlobalFormat(e.target.value)}
                    className={`px-3 py-2 rounded-xl border text-xs font-black cursor-pointer ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {activeTab === 'image' && (
                      <>
                        <option value="webp">WEBP</option>
                        <option value="png">PNG</option>
                        <option value="jpeg">JPEG</option>
                        <option value="jpg">JPG</option>
                        <option value="avif">AVIF</option>
                        <option value="gif">GIF</option>
                        <option value="bmp">BMP</option>
                        <option value="ico">ICO</option>
                      </>
                    )}
                    {activeTab === 'audio' && (
                      <>
                        <option value="mp3">MP3</option>
                        <option value="wav">WAV</option>
                        <option value="ogg">OGG</option>
                        <option value="aac">AAC</option>
                        <option value="m4a">M4A</option>
                        <option value="flac">FLAC</option>
                      </>
                    )}
                    {activeTab === 'video' && (
                      <>
                        <option value="mp4">MP4</option>
                        <option value="webm">WEBM</option>
                        <option value="mov">MOV</option>
                        <option value="avi">AVI</option>
                        <option value="mkv">MKV</option>
                      </>
                    )}
                  </select>

                  <button
                    onClick={() => handleApplyGlobalFormat(globalFormat)}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
                  >
                    {isRtl ? 'تطبيق على الكل' : 'Apply to All'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-400">{t.selectedFiles} ({filteredFileList.length}):</span>
                <div className="flex items-center gap-3 text-xs font-bold">
                  {hasActiveConverting && (
                    <button
                      onClick={() => queueManager.pauseAll()}
                      className="text-amber-500 hover:underline cursor-pointer"
                    >
                      ⏸ Pause All
                    </button>
                  )}
                  {!hasActiveConverting && hasPaused && (
                    <button
                      onClick={() => queueManager.resumeAll(activeTab)}
                      className="text-sky-500 hover:underline cursor-pointer"
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

              <div className="space-y-3">
                {paginatedFileList.map((item) => (
                  <FileItemCard
                    key={item.id}
                    item={item}
                    isDarkMode={isDarkMode}
                    isRtl={isRtl}
                    onStartSingle={(id) => queueManager.startSingleFile(id, activeTab)}
                    onPauseSingle={(id) => queueManager.pauseFile(id)}
                    onRemove={(id) => queueManager.removeFile(id)}
                    onResetItem={handleResetItem}
                    onUpdateFormat={(id, fmt) => queueManager.updateFileFormat(id, fmt)}
                    onUpdateName={(id, name) => queueManager.updateFileName(id, name)}
                    onPreview={(url, name, type) => setPreviewItem({ url, name, type: type as any })}
                    onOpenOptions={() => setActiveOptionsItem(item)}
                    extractedAudioUrl={extractedAudioUrls[item.id] || null}
                    onExtractAudio={async () => {
                      try {
                        showToast(isRtl ? '🎧 جاري استخراج الصوت...' : '🎧 Extracting audio...');
                        const audioBlob = await extractAudioFromVideo(item.file);
                        const url = URL.createObjectURL(audioBlob);
                        
                        setExtractedAudioUrls(prev => ({ ...prev, [item.id]: url }));
                        showToast(isRtl ? '✨ تم استخراج الصوت بنجاح!' : '✨ Audio extracted successfully!');
                      } catch (e) {
                        showToast(isRtl ? '❌ فشل استخراج الصوت' : '❌ Audio extraction failed');
                      }
                    }}
                    formatFileSize={formatFileSize}
                    hasMultipleFiles={filteredFileList.length > 1}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 px-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 disabled:opacity-40 cursor-pointer"
                  >
                    {isRtl ? 'السابق' : 'Previous'}
                  </button>
                  <span className="text-xs font-bold text-slate-500">
                    {isRtl
                      ? `صفحة ${currentPage} من أصل ${totalPages}`
                      : `Page ${currentPage} of ${totalPages}`}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 disabled:opacity-40 cursor-pointer"
                  >
                    {isRtl ? 'التالي' : 'Next'}
                  </button>
                </div>
              )}

              {completedCount > 0 && (
                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={handleDownloadAsZip}
                    disabled={isZipLoading}
                    className={`flex-1 min-w-[260px] py-3.5 px-4 rounded-2xl text-xs font-black transition-all shadow-lg flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 ${
                      isDarkMode
                        ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-950/50'
                        : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-500/30'
                    }`}
                  >
                    <span className="text-lg">🗂️</span>
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-white font-black">
                        {isZipLoading 
                          ? (isRtl ? '⏳ جاري ضغط الملفات...' : '⏳ Packaging ZIP...') 
                          : (isRtl ? `تحميل الكل كمجلد ZIP (${completedCount})` : `Download All as Folder (ZIP) (${completedCount})`)}
                      </span>
                      <span className="text-[10px] text-sky-100 font-bold opacity-90">
                        {isRtl ? `الحجم الكلي التقريبي: ${totalFormattedSize}` : `Est. Total Size: ${totalFormattedSize}`}
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={handleDownloadAllSeparately}
                    className={`flex-1 min-w-[260px] py-3.5 px-4 rounded-2xl text-xs font-black transition-all shadow-lg flex items-center justify-center gap-3 cursor-pointer ${
                      isDarkMode
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30'
                    }`}
                  >
                    <span className="text-lg">📥</span>
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-white font-black">
                        {isRtl ? `تحميل الكل منفصل (${completedCount})` : `Download All Separately (${completedCount})`}
                      </span>
                      <span className="text-[10px] text-emerald-100 font-bold opacity-90">
                        {isRtl ? `العدد الإجمالي: ${completedCount} ملف` : `Total Count: ${completedCount} files`}
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={startConversion}
            disabled={filteredFileList.length === 0 || isProcessing}
            className="w-full py-3.5 px-6 rounded-2xl font-black text-sm transition-all shadow-xl flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>{isProcessing ? t.converting : `${t.convertBtn} (${filteredFileList.length})`}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-shrink-0">
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
                className={`relative group p-6 rounded-[2.55rem] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between ${
                  isDarkMode 
                    ? 'bg-slate-900/90 border border-sky-400/25 shadow-lg text-slate-100 backdrop-blur-xl' 
                    : 'bg-gradient-to-b from-[#EBF3FC]/90 to-[#E1EEFB]/90 border border-white/90 shadow-md text-slate-800 backdrop-blur-md'
                }`}
              >
                <div className="flex items-center gap-3 mb-4 w-full h-16">
                  <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                    <img 
                      src={icons[idx]} 
                      alt={feat.title}
                      className={`w-full h-full object-contain ${imageClasses[idx]} drop-shadow-md transition-transform duration-300`}
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

      {activeOptionsItem && (
        <FileOptionsModal
          isOpen={!!activeOptionsItem}
          onClose={() => setActiveOptionsItem(null)}
          item={activeOptionsItem}
          onSave={(opts, applyAll) => {
            queueManager.updateFileOptions(activeOptionsItem.id, opts, applyAll);
            setActiveOptionsItem(null);
          }}
          isDarkMode={isDarkMode}
          isRtl={isRtl}
          hasMultipleFiles={filteredFileList.length > 1}
        />
      )}
    </div>
  );
}
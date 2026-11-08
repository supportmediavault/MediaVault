'use client';

import React, { useState, useRef } from 'react';

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
}

export const FileOptionsModal: React.FC<FileOptionsModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
  isDarkMode,
  isRtl,
  hasMultipleFiles
}) => {
  const isImage = item.file.type.startsWith('image/') || /\.(webp|png|jpeg|jpg|avif|gif|bmp|ico)$/i.test(item.file.name);
  const isVideo = item.file.type.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv|flv|3gp|m4v|ts)$/i.test(item.file.name);
  const isAudio = item.file.type.startsWith('audio/') || /\.(mp3|wav|ogg|aac|m4a|flac)$/i.test(item.file.name);

  // إعدادات الفيديو
  const [videoCodec, setVideoCodec] = useState(item.options?.videoCodec || 'libx264');
  const [crf, setCrf] = useState<number>(item.options?.crf !== undefined ? item.options.crf : 23);
  
  // إعدادات الصورة
  const [imageQuality, setImageQuality] = useState<number>(
    item.options?.quality !== undefined ? Math.round(item.options.quality * 100) : 85
  );

  // إعدادات الدقة والأبعاد المشتركة
  const initialRes = item.options?.resolution || 'no change';
  const standardResolutions = ['no change', '320x240', '640x480', '854x480', '960x720', '1280x720', '1440x1080', '1920x1080', '2560x1440', '3840x2160'];
  const isCustomRes = initialRes.includes('x') && !standardResolutions.some(res => initialRes.includes(res));

  const [resolution, setResolution] = useState(isCustomRes ? 'custom' : initialRes);
  const [customWidth, setCustomWidth] = useState(isCustomRes ? initialRes.split('x')[0] || '1920' : '1920');
  const [customHeight, setCustomHeight] = useState(isCustomRes ? initialRes.split('x')[1] || '1080' : '1080');

  // إعدادات الصوت والقص
  const [audioCodec, setAudioCodec] = useState(item.options?.audioCodec || 'aac');
  const [audioBitrate, setAudioBitrate] = useState(item.options?.audioBitrate || '128');
  const [trimStart, setTrimStart] = useState(item.options?.trimStart || '');
  const [trimEnd, setTrimEnd] = useState(item.options?.trimEnd || '');
  const [applyToAll, setApplyToAll] = useState(false);

  // حالات السحب والإفلات الصندوقية المطابقة تماماً
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  if (!isOpen) return null;

  const getCrfQualityLabel = (val: number) => {
    if (val === 0) return 'Lossless';
    if (val <= 19) return 'High quality';
    if (val <= 27) return 'Normal quality';
    if (val <= 45) return 'Low quality';
    return 'Worst quality';
  };

  const getImageQualityLabel = (val: number) => {
    if (val >= 90) return 'High quality';
    if (val >= 70) return 'Normal quality';
    if (val >= 40) return 'Low quality';
    return 'Worst quality';
  };

  const currentQuality = isVideo ? getCrfQualityLabel(crf) : getImageQualityLabel(imageQuality);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    dragRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;

    setPosition({
      x: dragRef.current.initialX + dx,
      y: dragRef.current.initialY + dy
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    let finalResolution = resolution;
    if (resolution === 'custom') {
      finalResolution = `${customWidth.trim() || '1920'}x${customHeight.trim() || '1080'}`;
    }

    onSave({
      videoCodec,
      crf: Number(crf),
      quality: imageQuality / 100,
      resolution: finalResolution,
      audioCodec,
      audioBitrate,
      trimStart,
      trimEnd
    }, applyToAll);
    onClose();
  };

  const inputThemeClass = isDarkMode 
    ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-sky-500' 
    : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500';

  return (
    <div 
      className="fixed inset-0 z-[999999] pointer-events-none flex items-center justify-center p-3 sm:p-4 overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
    >
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        style={{ 
          transform: `translate(${position.x}px, ${position.y}px)`,
          width: window.innerWidth < 640 ? '80vw' : '36rem'
        }}
        className={`pointer-events-auto max-h-[75vh] sm:max-h-[85vh] overflow-y-auto p-2.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-2xl border space-y-2.5 sm:space-y-4 relative select-none z-[1000000] transition-shadow duration-200 ${
          isDragging ? 'shadow-sky-500/20 ring-2 ring-sky-500/50 cursor-grabbing' : ''
        } ${
          // خلفية صلبة ومعتمة 100% بدون أي شفافية أو رؤية لما خلف الصندوق
          isDarkMode 
            ? 'bg-slate-950 border-slate-700 text-slate-100 shadow-black' 
            : 'bg-white border-slate-200 text-slate-800 shadow-2xl'
        }`}
      >
        {/* شريط العنوان العلوي (مقبض السحب) */}
        <div 
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          className={`flex items-center justify-between border-b pb-1.5 sm:pb-2.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-colors cursor-move ${
            isDarkMode ? 'border-slate-800 bg-slate-900 hover:bg-slate-800' : 'border-slate-200 bg-slate-100 hover:bg-slate-200'
          }`}
          title="اسحب من هنا لتغيير مكان الصندوق"
        >
          <div className="flex items-center gap-1.5 pointer-events-none">
            <span className="text-sky-400 font-bold text-xs sm:text-base">⠿</span>
            <h3 className="font-black text-[11px] sm:text-sm">
              ⚙️ Options <span className="text-sky-400 text-[9px] sm:text-xs font-normal">({item.customName})</span>
            </h3>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }} 
            className="text-slate-400 hover:text-rose-500 font-bold text-xs sm:text-base cursor-pointer px-1.5"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2 sm:space-y-4 text-[10px] sm:text-xs font-bold px-0.5 sm:px-1">
          {/* قسم إعدادات الصور (Image Settings) */}
          {isImage && (
            <div className={`p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border space-y-2 sm:space-y-3 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-[10px] sm:text-xs font-black text-sky-400">
                <span>🖼️ Image Settings</span>
              </div>

              {/* التحكم في الجودة */}
              <div className={`space-y-1.5 sm:space-y-2 p-2 sm:p-3 rounded-lg sm:rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 text-[10px] sm:text-[11px]">Image Quality: {imageQuality}%</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={imageQuality}
                    onChange={(e) => setImageQuality(Math.min(100, Math.max(1, Number(e.target.value))))}
                    className={`w-12 sm:w-14 px-1.5 py-0.5 rounded text-[10px] sm:text-xs text-center font-bold border ${inputThemeClass}`}
                  />
                </div>

                <input
                  type="range"
                  min="1"
                  max="100"
                  value={imageQuality}
                  onChange={(e) => setImageQuality(Number(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer h-1 bg-slate-700 rounded-lg"
                />

                <div className="flex flex-wrap gap-1 pt-0.5">
                  {[
                    { label: 'High quality', val: 95 },
                    { label: 'Normal quality', val: 80 },
                    { label: 'Low quality', val: 50 },
                    { label: 'Worst quality', val: 20 },
                  ].map((btn) => {
                    const isActive = currentQuality === btn.label;
                    return (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => setImageQuality(btn.val)}
                        className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[9px] sm:text-[10px] font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-sky-500 text-white shadow-[0_0_10px_rgba(56,189,248,0.6)] scale-105 border border-sky-300'
                            : isDarkMode
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {btn.label}
                      </button>
                    );
                  })}
                </div>

                <p className="text-[9px] sm:text-[10px] text-slate-400 leading-relaxed font-normal pt-1">
                  Adjust output image quality percentage (1-100%). Higher values retain more details while lower values reduce file size significantly.
                </p>
              </div>

              {/* قائمة الدقة والأبعاد */}
              <div className="space-y-1">
                <label className="text-slate-400 text-[10px] sm:text-[11px]">Resolution</label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border font-bold cursor-pointer text-[10px] sm:text-xs ${inputThemeClass}`}
                >
                  <option value="no change" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>no change (Keep current)</option>
                  <option value="640x480" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>640x480 (SD)</option>
                  <option value="1280x720" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>1280x720 (HD 720p)</option>
                  <option value="1920x1080" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>1920x1080 (Full HD 1080p)</option>
                  <option value="2560x1440" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>2560x1440 (2K WQHD)</option>
                  <option value="3840x2160" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>3840x2160 (4K UHD)</option>
                  <option value="custom" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Custom resolution...</option>
                </select>

                {resolution === 'custom' && (
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <div>
                      <label className="text-[9px] sm:text-[10px] text-slate-400">Width (العرض)</label>
                      <input
                        type="number"
                        value={customWidth}
                        onChange={(e) => setCustomWidth(e.target.value)}
                        placeholder="1920"
                        className={`w-full px-2 py-1 rounded-lg border text-[10px] sm:text-xs font-bold ${inputThemeClass}`}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] sm:text-[10px] text-slate-400">Height (الارتفاع)</label>
                      <input
                        type="number"
                        value={customHeight}
                        onChange={(e) => setCustomHeight(e.target.value)}
                        placeholder="1080"
                        className={`w-full px-2 py-1 rounded-lg border text-[10px] sm:text-xs font-bold ${inputThemeClass}`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* قسم إعدادات الفيديو (Video Settings) */}
          {isVideo && (
            <div className={`p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border space-y-2 sm:space-y-3 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-[10px] sm:text-xs font-black text-sky-400">
                <span>📹 Video Settings</span>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-[10px] sm:text-[11px]">Video Codec</label>
                <select
                  value={videoCodec}
                  onChange={(e) => setVideoCodec(e.target.value)}
                  className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border font-bold cursor-pointer text-[10px] sm:text-xs ${inputThemeClass}`}
                >
                  <option value="libx264" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>H.264 (x264)</option>
                  <option value="libx265" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>H.265 / HEVC (x265)</option>
                  <option value="copy" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Copy (no re-encoding)</option>
                  <option value="xvid" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Xvid</option>
                </select>
              </div>

              <div className={`space-y-1.5 sm:space-y-2 p-2 sm:p-3 rounded-lg sm:rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 text-[10px] sm:text-[11px]">Constant Quality (CRF): {crf}</label>
                  <input
                    type="number"
                    min="0"
                    max="51"
                    value={crf}
                    onChange={(e) => setCrf(Number(e.target.value))}
                    className={`w-12 sm:w-14 px-1.5 py-0.5 rounded text-[10px] sm:text-xs text-center font-bold border ${inputThemeClass}`}
                  />
                </div>

                <input
                  type="range"
                  min="0"
                  max="51"
                  value={crf}
                  onChange={(e) => setCrf(Number(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer h-1 bg-slate-700 rounded-lg"
                />

                <div className="flex flex-wrap gap-1 pt-0.5">
                  {[
                    { label: 'Lossless', val: 0 },
                    { label: 'High quality', val: 18 },
                    { label: 'Normal quality', val: 23 },
                    { label: 'Low quality', val: 32 },
                    { label: 'Worst quality', val: 48 },
                  ].map((btn) => {
                    const isActive = currentQuality === btn.label;
                    return (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => setCrf(btn.val)}
                        className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[9px] sm:text-[10px] font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-sky-500 text-white shadow-[0_0_10px_rgba(56,189,248,0.6)] scale-105 border border-sky-300'
                            : isDarkMode
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {btn.label}
                      </button>
                    );
                  })}
                </div>

                <p className="text-[9px] sm:text-[10px] text-slate-400 leading-relaxed font-normal pt-1">
                  The Constant Rate Factor (CRF) sets the quality of the video. The range of the CRF scale is 0–51, where 0 is lossless, 23 is default, and 51 is worst quality possible.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-[10px] sm:text-[11px]">Resolution</label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border font-bold cursor-pointer text-[10px] sm:text-xs ${inputThemeClass}`}
                >
                  <option value="no change" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>no change (Keep current)</option>
                  <option value="320x240" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>320x240 (240p)</option>
                  <option value="640x480" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>640x480 (480p)</option>
                  <option value="854x480" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>854x480 (480p Wide)</option>
                  <option value="960x720" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>960x720 (720p 4:3)</option>
                  <option value="1280x720" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>1280x720 (720p HD)</option>
                  <option value="1440x1080" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>1440x1080 (1080p 4:3)</option>
                  <option value="1920x1080" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>1920x1080 (1080p Full HD)</option>
                  <option value="2560x1440" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>2560x1440 (1440p 2K WQHD)</option>
                  <option value="3840x2160" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>3840x2160 (4K UHD)</option>
                  <option value="custom" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Custom resolution...</option>
                </select>

                {resolution === 'custom' && (
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <div>
                      <label className="text-[9px] sm:text-[10px] text-slate-400">Width (العرض)</label>
                      <input
                        type="number"
                        value={customWidth}
                        onChange={(e) => setCustomWidth(e.target.value)}
                        placeholder="1920"
                        className={`w-full px-2 py-1 rounded-lg border text-[10px] sm:text-xs font-bold ${inputThemeClass}`}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] sm:text-[10px] text-slate-400">Height (الارتفاع)</label>
                      <input
                        type="number"
                        value={customHeight}
                        onChange={(e) => setCustomHeight(e.target.value)}
                        placeholder="1080"
                        className={`w-full px-2 py-1 rounded-lg border text-[10px] sm:text-xs font-bold ${inputThemeClass}`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* قسم إعدادات الصوت (Audio Settings) */}
          {(isVideo || isAudio) && (
            <div className={`p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border space-y-2 sm:space-y-3 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-[10px] sm:text-xs font-black text-sky-400">
                <span>🎵 Audio Settings</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] sm:text-[11px]">Audio Codec</label>
                  <select
                    value={audioCodec}
                    onChange={(e) => setAudioCodec(e.target.value)}
                    className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border font-bold cursor-pointer text-[10px] sm:text-xs ${inputThemeClass}`}
                  >
                    <option value="copy" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Copy (no re-encoding)</option>
                    <option value="none" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>None (remove audio)</option>
                    <option value="aac" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>AAC</option>
                    <option value="HE-AAC v1" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>HE-AAC v1</option>
                    <option value="HE-AAC v2" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>HE-AAC v2</option>
                    <option value="libmp3lame" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>MP3</option>
                    <option value="opus" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Opus</option>
                    <option value="vorbis" className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Vorbis</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] sm:text-[11px]">Audio Bitrate (kbit/s)</label>
                  <input
                    type="text"
                    value={audioBitrate}
                    onChange={(e) => setAudioBitrate(e.target.value)}
                    className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border font-bold text-[10px] sm:text-xs ${inputThemeClass}`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* قسم القص للفيديو (Trim Video) */}
          {isVideo && (
            <div className={`p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border space-y-2 sm:space-y-3 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-[10px] sm:text-xs font-black text-sky-400">
                <span>✂️ Trim Video</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] sm:text-[11px]">Trim Start</label>
                  <input
                    type="text"
                    placeholder="00:00:00"
                    value={trimStart}
                    onChange={(e) => setTrimStart(e.target.value)}
                    className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border font-bold text-[10px] sm:text-xs ${inputThemeClass}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] sm:text-[11px]">Trim End</label>
                  <input
                    type="text"
                    placeholder="00:00:00"
                    value={trimEnd}
                    onChange={(e) => setTrimEnd(e.target.value)}
                    className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border font-bold text-[10px] sm:text-xs ${inputThemeClass}`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* أزرار الحفظ والإلغاء وتطبيق على الكل */}
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 sm:pt-3 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          {hasMultipleFiles ? (
            <label className="flex items-center gap-1.5 cursor-pointer text-[10px] sm:text-xs font-bold text-slate-300">
              <input
                type="checkbox"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-sky-500 cursor-pointer"
              />
              <span>Apply to all files</span>
            </label>
          ) : <div />}

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className={`flex-1 sm:flex-none px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border font-bold text-[10px] sm:text-xs cursor-pointer transition-colors ${
                isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-none px-4 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-black text-[10px] sm:text-xs shadow-lg shadow-sky-500/30 cursor-pointer"
            >
              Apply Options
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
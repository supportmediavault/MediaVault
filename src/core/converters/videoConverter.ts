import { ffmpegManager } from './ffmpegManager';
import { fetchFile } from '@ffmpeg/util';

export interface VideoOptions {
  resolution?: string;
  crf?: number;
  videoCodec?: string;
  audioCodec?: string;
  audioBitrate?: string;
  trimStart?: string;
  trimEnd?: string;
  watermarkFile?: File | null;
}

async function trackConversion(type: string, count: number, status: string) {
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, count, status }),
    });
  } catch (e) {
    // نتجاهل الخطأ بصمت
  }
}

export async function convertVideo(
  file: File,
  targetFormat: string,
  options: VideoOptions,
  onProgress: (progress: number) => void,
  signal?: AbortSignal
): Promise<{ blob: Blob; lastTime: number }> {
  try {
    if (signal?.aborted) {
      trackConversion('video', 1, 'failed');
      throw new Error('Cancelled');
    }

    onProgress(5);
    const ffmpeg = await ffmpegManager.load((p) => {
      if (p < 100) onProgress(Math.max(5, Math.round(p * 0.15)));
    });

    if (signal?.aborted) throw new Error('Cancelled');
    onProgress(20);

    const inputExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const inputFileName = `input_${Date.now()}.${inputExt}`;
    
    const cleanTargetFormat = (targetFormat || 'mp4').trim().toLowerCase();
    const outputFileName = `output_${Date.now()}.${cleanTargetFormat}`;

    await ffmpeg.writeFile(inputFileName, await fetchFile(file));
    onProgress(35);

    if (signal?.aborted) throw new Error('Cancelled');

    const ffmpegArgs: string[] = [];

    if (options.trimStart && options.trimStart.trim() !== '') {
      ffmpegArgs.push('-ss', options.trimStart.trim());
    }

    ffmpegArgs.push('-i', inputFileName);

    if (options.trimEnd && options.trimEnd.trim() !== '') {
      ffmpegArgs.push('-to', options.trimEnd.trim());
    }

    let scaleFilter = '';
    if (options.resolution && options.resolution !== 'original' && options.resolution !== 'auto' && options.resolution !== 'no change') {
      if (options.resolution.includes('720')) scaleFilter = 'scale=-2:720';
      else if (options.resolution.includes('1080')) scaleFilter = 'scale=-2:1080';
      else if (options.resolution.includes('1440')) scaleFilter = 'scale=-2:1440';
      else if (options.resolution.includes('2160')) scaleFilter = 'scale=-2:2160';
      else if (options.resolution.includes('480')) scaleFilter = 'scale=-2:480';
    }

    if (scaleFilter) {
      ffmpegArgs.push('-vf', scaleFilter);
    }

    const targetCrf = options.crf !== undefined ? options.crf : 26;

    // استخدام '-preset', 'ultrafast' (أو 'superfast') لرفع سرعة التحويل أضعافاً مضاعفة داخل المتصفح
    ffmpegArgs.push(
      '-c:v', 'libx264',
      '-preset', 'ultrafast', 
      '-crf', String(targetCrf),
      '-c:a', 'aac',
      '-b:a', '96k'
    );

    ffmpegArgs.push('-threads', '0');
    ffmpegArgs.push(outputFileName);

    // تتبع التقدم وإرسال النسبة للتحديث الفوري
    const progressHandler = ({ progress }: { progress: number }) => {
      const normalizedProgress = Math.max(0, Math.min(1, progress));
      const p = Math.round(normalizedProgress * 55);
      onProgress(Math.min(90, 35 + p));
    };

    ffmpeg.on('progress', progressHandler);

    // التحقق من طلب الإلغاء قبل التنفيذ
    if (signal?.aborted) throw new Error('Cancelled');

    await ffmpeg.exec(ffmpegArgs);

    // إزالة مستمع التقدم لتسريب الذاكرة
    ffmpeg.off('progress', progressHandler);

    if (signal?.aborted) throw new Error('Cancelled');
    onProgress(95);

    const data = await ffmpeg.readFile(outputFileName);
    
    let mimeType = 'video/mp4';
    if (cleanTargetFormat === 'webm') mimeType = 'video/webm';
    else if (cleanTargetFormat === 'mov') mimeType = 'video/quicktime';
    else if (cleanTargetFormat === 'avi') mimeType = 'video/x-msvideo';
    else if (cleanTargetFormat === 'mkv') mimeType = 'video/x-matroska';

    const blob = new Blob([data], { type: mimeType });

    try {
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);
    } catch (e) {
      // تجاهل أخطاء الحذف المؤقت الصامتة
    }

    onProgress(100);
    trackConversion('video', 1, 'success');
    return { blob, lastTime: 0 };

  } catch (error: any) {
    trackConversion('video', 1, 'failed');
    throw error;
  }
}
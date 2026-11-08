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

    // الترتيب الصحيح للقص بعد -i لضمان دقة الإطارات ومنع تلف الـ Preview
    ffmpegArgs.push('-i', inputFileName);

    if (options.trimStart && options.trimStart.trim() !== '') {
      ffmpegArgs.push('-ss', options.trimStart.trim());
    }

    if (options.trimEnd && options.trimEnd.trim() !== '') {
      ffmpegArgs.push('-to', options.trimEnd.trim());
    }

    // أوامر المزامنة ومنع الإطارات التالفة والقفزات الخاطئة في المعاينة
    ffmpegArgs.push('-async', '1', '-fps_mode', 'cfr', '-avoid_negative_ts', 'make_zero');

    let scaleFilter = '';
    if (options.resolution && options.resolution !== 'original' && options.resolution !== 'auto' && options.resolution !== 'no change') {
      if (options.resolution.includes('720')) scaleFilter = 'scale=-2:720';
      else if (options.resolution.includes('1080')) scaleFilter = 'scale=-2:1080';
      else if (options.resolution.includes('1440')) scaleFilter = 'scale=-2:1440';
      else if (options.resolution.includes('2160')) scaleFilter = 'scale=-2:2160';
      else if (options.resolution.includes('480')) scaleFilter = 'scale=-2:480';
      else if (options.resolution.includes('x')) {
        const [w, h] = options.resolution.split('x');
        scaleFilter = `scale=${w}:${h}`;
      }
    }

    if (scaleFilter) {
      ffmpegArgs.push('-vf', scaleFilter);
    }

    let targetCrf = options.crf !== undefined ? options.crf : 23;
    if (targetCrf === 0) {
      targetCrf = 1; // حماية ضد التضخم الجنوني
    }

    const selectedVideoCodec = options.videoCodec || 'libx264';

    if (selectedVideoCodec === 'copy') {
      ffmpegArgs.push('-c:v', 'copy', '-c:a', 'copy');
    } else {
      ffmpegArgs.push(
        '-c:v', selectedVideoCodec,
        '-preset', 'ultrafast', 
        '-crf', String(targetCrf),
        '-c:a', options.audioCodec && options.audioCodec !== 'copy' ? options.audioCodec : 'aac',
        '-b:a', options.audioBitrate ? `${options.audioBitrate}k` : '128k'
      );
    }

    ffmpegArgs.push('-threads', '0');
    // إضافة ترويسة سريعة لضمان عمل المعاينة والتجوال بسلاسة تامة على جميع المشغلات
    ffmpegArgs.push('-movflags', '+faststart');
    ffmpegArgs.push(outputFileName);

    const progressHandler = ({ progress }: { progress: number }) => {
      const normalizedProgress = Math.max(0, Math.min(1, progress));
      const p = Math.round(normalizedProgress * 55);
      onProgress(Math.min(90, 35 + p));
    };

    ffmpeg.on('progress', progressHandler);

    if (signal?.aborted) throw new Error('Cancelled');

    await ffmpeg.exec(ffmpegArgs);

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
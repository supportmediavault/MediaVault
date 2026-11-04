import { ffmpegManager } from './ffmpegManager';
import { fetchFile } from '@ffmpeg/util';

export interface VideoOptions {
  resolution: string;
  crf: number;
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

    // 1. تحميل محرك FFmpeg (يتم سحبه من الكاش المحلي إذا سبق تحميله، أو تحميله بصمت)
    onProgress(5);
    const ffmpeg = await ffmpegManager.load((p) => {
      // تقدم التحميل الأولي للمكتبة إن لم تكن مخزنة
      if (p < 100) onProgress(Math.max(5, Math.round(p * 0.2)));
    });

    if (signal?.aborted) throw new Error('Cancelled');
    onProgress(25);

    const inputFileName = 'input_' + Date.now() + '.' + file.name.split('.').pop();
    const outputFileName = 'output_' + Date.now() + '.' + targetFormat;

    // 2. كتابة ملف الفيديو الأصلي إلى ذاكرة FFmpeg الوهمية
    await ffmpeg.writeFile(inputFileName, await fetchFile(file));
    onProgress(40);

    if (signal?.aborted) throw new Error('Cancelled');

    // إعداد معاملات التحويل والدقة
    const ffmpegArgs: string[] = ['-i', inputFileName];

    // تحديد الدقة (Resolution) بناءً على خيارات المستخدم
    if (options.resolution === '480') {
      ffmpegArgs.push('-vf', 'scale=-2:480');
    } else if (options.resolution === '720') {
      ffmpegArgs.push('-vf', 'scale=-2:720');
    } else if (options.resolution === '1080') {
      ffmpegArgs.push('-vf', 'scale=-2:1080');
    } else if (options.resolution === '2k') {
      ffmpegArgs.push('-vf', 'scale=-2:1440');
    } else if (options.resolution === '4k') {
      ffmpegArgs.push('-vf', 'scale=-2:2160');
    }

    // الحفاظ على مسار الصوت وضبط الجودة والترميز السريع
    ffmpegArgs.push('-c:v', 'libx264', '-crf', String(options.crf || 23), '-c:a', 'aac', '-b:a', '128k');
    ffmpegArgs.push(outputFileName);

    // تتبع التقدم الحقيقي أثناء المعالجة
    ffmpeg.on('progress', ({ progress }) => {
      const p = Math.round(progress * 50); // النسبة من 40% إلى 90%
      onProgress(Math.min(90, 40 + p));
    });

    // تنفيذ عملية التحويل الصاروخية
    await ffmpeg.exec(ffmpegArgs);

    if (signal?.aborted) throw new Error('Cancelled');
    onProgress(95);

    // 3. قراءة الملف الناتج من الذاكرة وتحويله إلى Blob
    const data = await ffmpeg.readFile(outputFileName);
    const mimeType = targetFormat === 'mp4' ? 'video/mp4' : targetFormat === 'webm' ? 'video/webm' : 'video/mp4';
    const blob = new Blob([data], { type: mimeType });

    // تنظيف الملفات من ذاكرة الـ FFmpeg المؤقتة لمنع استهلاك الذاكرة
    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);

    onProgress(100);
    trackConversion('video', 1, 'success');
    return { blob, lastTime: 0 };

  } catch (error: any) {
    trackConversion('video', 1, 'failed');
    throw error;
  }
}
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

    onProgress(5);
    const ffmpeg = await ffmpegManager.load((p) => {
      if (p < 100) onProgress(Math.max(5, Math.round(p * 0.15)));
    });

    if (signal?.aborted) throw new Error('Cancelled');
    onProgress(20);

    const inputExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const inputFileName = `input_${Date.now()}.${inputExt}`;
    const outputFileName = `output_${Date.now()}.${targetFormat.toLowerCase()}`;

    // كتابة الملف للذاكرة الوهمية
    await ffmpeg.writeFile(inputFileName, await fetchFile(file));
    onProgress(35);

    if (signal?.aborted) throw new Error('Cancelled');

    const ffmpegArgs: string[] = ['-i', inputFileName];

    // ضبط الدقة إن وجدت
    if (options.resolution && options.resolution !== 'original' && options.resolution !== 'auto') {
      let scaleFilter = 'scale=-2:720';
      if (options.resolution === '480') scaleFilter = 'scale=-2:480';
      else if (options.resolution === '720') scaleFilter = 'scale=-2:720';
      else if (options.resolution === '1080') scaleFilter = 'scale=-2:1080';
      else if (options.resolution === '2k') scaleFilter = 'scale=-2:1440';
      else if (options.resolution === '4k') scaleFilter = 'scale=-2:2160';

      ffmpegArgs.push('-vf', scaleFilter);
    }

    // إعدادات التشفير الحقيقي مع تحسين استغلال المعالج
    ffmpegArgs.push(
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', String(options.crf || 23),
      '-c:a', 'aac',
      '-b:a', '128k',
      '-threads', '0'
    );

    ffmpegArgs.push(outputFileName);

    // تتبع التقدم بدقة
    ffmpeg.on('progress', ({ progress }) => {
      // progress تكون عادة بين 0 و 1
      const normalizedProgress = Math.max(0, Math.min(1, progress));
      const p = Math.round(normalizedProgress * 55); // النسبة من 35% إلى 90%
      onProgress(Math.min(90, 35 + p));
    });

    await ffmpeg.exec(ffmpegArgs);

    if (signal?.aborted) throw new Error('Cancelled');
    onProgress(95);

    const data = await ffmpeg.readFile(outputFileName);
    const mimeType = targetFormat === 'mp4' ? 'video/mp4' : targetFormat === 'webm' ? 'video/webm' : 'video/mp4';
    const blob = new Blob([data], { type: mimeType });

    // تنظيف الذاكرة لمنع تسريب الذاكرة (Memory Leaks) للملفات الكبيرة
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
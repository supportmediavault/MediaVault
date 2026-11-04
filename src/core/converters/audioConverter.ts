import { ffmpegManager } from './ffmpegManager';
import { fetchFile } from '@ffmpeg/util';

// دالة مساعدة لتسجيل النشاط
async function trackConversion(type: string, count: number, status: string) {
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, count, status }),
    });
  } catch (e) {
    // نتجاهل الخطأ بصمت لتجنب تعطيل تجربة المستخدم
  }
}

export async function convertAudio(
  file: File,
  targetFormat: string,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal
): Promise<Blob> {
  try {
    if (signal?.aborted) {
      trackConversion('audio', 1, 'failed');
      throw new Error('Paused');
    }

    if (onProgress) onProgress(10);

    // 1. تحميل محرك FFmpeg (يتم استرجاع الفيديو والصوت بكفاءة عالية عبر نفس المحرك)
    const ffmpeg = await ffmpegManager.load((p) => {
      if (p < 100 && onProgress) {
        onProgress(Math.max(10, Math.round(p * 0.3)));
      }
    });

    if (signal?.aborted) throw new Error('Paused');
    if (onProgress) onProgress(35);

    const inputFileName = 'input_audio_' + Date.now() + '.' + file.name.split('.').pop();
    const cleanTargetFormat = targetFormat.toLowerCase();
    const outputFileName = 'output_audio_' + Date.now() + '.' + cleanTargetFormat;

    // 2. كتابة ملف الصوت الأصلي إلى ذاكرة FFmpeg الوهمية
    await ffmpeg.writeFile(inputFileName, await fetchFile(file));
    if (signal?.aborted) throw new Error('Paused');
    if (onProgress) onProgress(50);

    // تجهيز معاملات التحويل الصوتية
    const ffmpegArgs: string[] = ['-i', inputFileName];

    // تحديدترميز الصوت المناسب حسب الصيغة المطلوبة
    if (cleanTargetFormat === 'mp3') {
      ffmpegArgs.push('-c:a', 'libmp3lame', '-b:a', '192k');
    } else if (cleanTargetFormat === 'aac' || cleanTargetFormat === 'm4a') {
      ffmpegArgs.push('-c:a', 'aac', '-b:a', '192k');
    } else if (cleanTargetFormat === 'ogg') {
      ffmpegArgs.push('-c:a', 'libvorbis', '-q:a', '4');
    } else if (cleanTargetFormat === 'flac') {
      ffmpegArgs.push('-c:a', 'flac');
    } else {
      // صيغة افتراضية آمنة
      ffmpegArgs.push('-c:a', 'aac', '-b:a', '192k');
    }

    ffmpegArgs.push(outputFileName);

    // تتبع التقدم أثناء معالجة الملف الصوتي
    ffmpeg.on('progress', ({ progress }) => {
      if (onProgress) {
        const p = Math.round(progress * 40); // النسبة من 50% إلى 90%
        onProgress(Math.min(90, 50 + p));
      }
    });

    // 3. تنفيذ عملية التحويل
    await ffmpeg.exec(ffmpegArgs);

    if (signal?.aborted) throw new Error('Paused');
    if (onProgress) onProgress(95);

    // 4. استخراج النتيجة على شكل Blob وتحديد الـ MIME Type السليم
    const data = await ffmpeg.readFile(outputFileName);
    
    const mimeMap: Record<string, string> = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      aac: 'audio/aac',
      m4a: 'audio/mp4',
      flac: 'audio/flac',
    };

    const targetMime = mimeMap[cleanTargetFormat] || 'audio/mpeg';
    const blob = new Blob([data], { type: targetMime });

    // تنظيف الذاكرة المؤقتة للمحرك
    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);

    if (onProgress) onProgress(100);
    trackConversion('audio', 1, 'success');
    return blob;

  } catch (error: any) {
    trackConversion('audio', 1, 'failed');
    throw error;
  }
}
import { convertVideo, VideoOptions } from './videoConverter';
import { convertAudio } from './audioConverter';
import { convertImage, ImageFormat } from './imageConverter';

export interface CompressionOptions {
  level?: 'low' | 'medium' | 'high';
  targetFormat?: string;
  resolution?: string; // للفيديو
  crf?: number; // قيمة الـ CRF الفعلية من الـ Slider
}

/**
 * حساب الحجم المتوقع بشكل حقيقي وواقعي بناءً على CRF والدقة والنوع
 */
export function estimateCompressedSize(originalSize: number, mediaType: 'image' | 'audio' | 'video', options: CompressionOptions): number {
  let ratio = 0.60; // النسبة الافتراضية

  if (mediaType === 'image') {
    if (options.level === 'high') ratio = 0.35;
    else if (options.level === 'medium') ratio = 0.60;
    else ratio = 0.85;

    if (options.targetFormat === 'webp' || options.targetFormat === 'avif') ratio *= 0.8;
  } else if (mediaType === 'audio') {
    if (options.level === 'high') ratio = 0.40;
    else if (options.level === 'medium') ratio = 0.65;
    else ratio = 0.85;
  } else if (mediaType === 'video') {
    // حساب دقيق ومضبوط يعتمد على الـ CRF لمنع أي تضارب في النسبة أو ظهور أرقام غير منطقية
    const crf = options.crf !== undefined ? options.crf : 23;
    
    // معادلة منضبطة تضمن أن الحجم المتوقع منطقي ومتناسب مع معدل الضغط
    ratio = Math.max(0.15, Math.min(1.0, 1.1 - (crf / 51) * 0.85));

    // تعديل النسبة بناءً على دقة الـ Resolution المختارة
    if (options.resolution && options.resolution !== 'original' && options.resolution !== 'no change') {
      const resStr = options.resolution.toLowerCase();
      if (resStr.includes('2160') || resStr.includes('4k')) {
        ratio *= 1.2; 
      } else if (resStr.includes('1440') || resStr.includes('2k')) {
        ratio *= 1.05;
      } else if (resStr.includes('1080')) {
        ratio *= 0.9;
      } else if (resStr.includes('720')) {
        ratio *= 0.7;
      } else if (resStr.includes('480')) {
        ratio *= 0.5;
      }
    }
  }

  const estimated = Math.round(originalSize * ratio);
  return Math.max(1024, estimated); // ضمان ألا يقل الحجم عن 1 كيلوبايت
}

/**
 * محرك الضغط الموحد لجميع أنواع الميديا
 */
export async function compressMediaFile(
  file: File,
  mediaType: 'image' | 'audio' | 'video',
  options: CompressionOptions,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal
): Promise<Blob> {
  if (mediaType === 'image') {
    const quality = options.level === 'high' ? 0.60 : options.level === 'medium' ? 0.75 : 0.90;
    const format = (options.targetFormat || 'webp') as ImageFormat;
    return await convertImage(file, format, quality);
  }

  if (mediaType === 'audio') {
    const format = options.targetFormat || 'mp3';
    return await convertAudio(file, format, onProgress, signal);
  }

  if (mediaType === 'video') {
    const crf = options.crf !== undefined ? options.crf : (options.level === 'high' ? 30 : options.level === 'medium' ? 25 : 20);
    const format = options.targetFormat || 'mp4';
    const videoOpts: VideoOptions = {
      resolution: options.resolution || 'original',
      crf: crf
    };
    const result = await convertVideo(file, format, videoOpts, onProgress || (() => {}), signal);
    return result.blob;
  }

  throw new Error('نوع الميديا غير مدعوم');
}
import { ffmpegManager } from './ffmpegManager';
import { fetchFile } from '@ffmpeg/util';

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

    const ffmpeg = await ffmpegManager.load((p) => {
      if (p < 100 && onProgress) {
        onProgress(Math.max(10, Math.round(p * 0.3)));
      }
    });

    if (signal?.aborted) throw new Error('Paused');
    if (onProgress) onProgress(35);

    const inputFileName = `input_audio_${Date.now()}.${file.name.split('.').pop()}`;
    const cleanTargetFormat = targetFormat.toLowerCase();
    const outputFileName = `output_audio_${Date.now()}.${cleanTargetFormat}`;

    await ffmpeg.writeFile(inputFileName, await fetchFile(file));
    if (signal?.aborted) throw new Error('Paused');
    if (onProgress) onProgress(50);

    const ffmpegArgs: string[] = ['-i', inputFileName];

    if (cleanTargetFormat === 'mp3') {
      ffmpegArgs.push('-c:a', 'libmp3lame', '-b:a', '192k');
    } else if (cleanTargetFormat === 'aac' || cleanTargetFormat === 'm4a') {
      ffmpegArgs.push('-c:a', 'aac', '-b:a', '192k');
    } else if (cleanTargetFormat === 'ogg') {
      ffmpegArgs.push('-c:a', 'libvorbis', '-q:a', '4');
    } else if (cleanTargetFormat === 'flac') {
      ffmpegArgs.push('-c:a', 'flac');
    } else {
      ffmpegArgs.push('-c:a', 'aac', '-b:a', '128k');
    }

    ffmpegArgs.push(outputFileName);

    ffmpeg.on('progress', ({ progress }) => {
      if (onProgress) {
        const p = Math.round(progress * 40);
        onProgress(Math.min(90, 50 + p));
      }
    });

    await ffmpeg.exec(ffmpegArgs);

    if (signal?.aborted) throw new Error('Paused');
    if (onProgress) onProgress(95);

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
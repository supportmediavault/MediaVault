import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

class FFmpegManager {
  private ffmpeg: FFmpeg | null = null;
  private loaded: boolean = false;
  private loadPromise: Promise<void> | null = null;

  public async load(onProgress?: (progress: number) => void): Promise<FFmpeg> {
    if (this.loaded && this.ffmpeg) return this.ffmpeg;
    if (this.loadPromise) {
      await this.loadPromise;
      if (this.ffmpeg) return this.ffmpeg;
    }

    this.loadPromise = (async () => {
      this.ffmpeg = new FFmpeg();

      // تتبع تقدم التحميل الخفي في الخلفية (لأول زيارة فقط)
      if (onProgress) {
        this.ffmpeg.on('progress', ({ progress }) => {
          onProgress(Math.round(progress * 100));
        });
      }

      // جلب ملفات الـ WASM من شبكة التوزيع (CDN) بشكل آمن وموثوق
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      this.loaded = true;
    })();

    await this.loadPromise;
    if (!this.ffmpeg) throw new Error('Failed to load FFmpeg');
    return this.ffmpeg;
  }

  public isLoaded(): boolean {
    return this.loaded;
  }
}

export const ffmpegManager = new FFmpegManager();
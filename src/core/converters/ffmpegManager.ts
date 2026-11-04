import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

class FFmpegManager {
  private ffmpeg: FFmpeg | null = null;
  private loaded: boolean = false;
  private loadingPromise: Promise<FFmpeg> | null = null;

  async load(onProgress?: (progress: number) => void): Promise<FFmpeg> {
    if (this.loaded && this.ffmpeg) {
      return this.ffmpeg;
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = (async () => {
      try {
        if (!this.ffmpeg) {
          this.ffmpeg = new FFmpeg();
        }

        // تتبع تقدم تحميل مكتبة الـ WASM لأول مرة
        this.ffmpeg.on('log', ({ message }) => {
          // يمكن التقاط الرسائل للتصحيح إذا لزم الأمر
        });

        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        
        await this.ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });

        this.loaded = true;
        return this.ffmpeg;
      } catch (error) {
        this.loadingPromise = null;
        throw error;
      }
    })();

    return this.loadingPromise;
  }
}

export const ffmpegManager = new FFmpegManager();
export type FileStatus = 'idle' | 'converting' | 'completed' | 'error' | 'cancelled' | 'paused';

export interface QueueItem {
  id: string;
  file: File;
  customName: string;
  targetFormat: string;
  isRemoveBg?: boolean; // الميزة الجديدة
  options: {
    resolution: string;
    compressionLevel: string;
    quality: number;
    videoCodec?: string;
    audioCodec?: string;
    audioBitrate?: string;
    crf?: number;
    trimStart?: string;
    trimEnd?: string;
  };
  progress: number;
  status: FileStatus;
  downloadUrl?: string;
  blob?: Blob;
  actualSize?: number;
  errorMessage?: string;
  lastTime?: number;
  existingChunks?: Blob[];
  abortController?: AbortController;
}

export type QueueListener = (items: QueueItem[], isGlobalPaused: boolean) => void;

export class ConversionQueueManager {
  private items: QueueItem[] = [];
  private listeners: QueueListener[] = [];
  private concurrencyLimit: number = 100;
  private isRunning: boolean = false;
  private activeWorkers: number = 0;
  private globalPaused: boolean = false;
  
  private convertVideoFn?: any;
  private convertAudioFn?: any;
  private convertImageFn?: any;
  private removeBgFn?: any; // إضافة دالة إزالة الخلفية

  constructor(concurrency: number = 100) {
    this.concurrencyLimit = concurrency;
  }

  public setConverters(videoFn: any, audioFn: any, imageFn: any, removeBgFn?: any) {
    this.convertVideoFn = videoFn;
    this.convertAudioFn = audioFn;
    this.convertImageFn = imageFn;
    this.removeBgFn = removeBgFn;
  }

  public subscribe(listener: QueueListener) {
    this.listeners.push(listener);
    listener(this.items, this.globalPaused);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public notify() {
    this.listeners.forEach(l => l([...this.items], this.globalPaused));
  }

  private revokeItemUrl(item?: QueueItem) {
    if (item && item.downloadUrl) {
      URL.revokeObjectURL(item.downloadUrl);
    }
  }

  public addFiles(files: File[], defaultTabType: string = 'video', defaultFormat: string = 'mp4', isRemoveBg: boolean = false) {
    const newItems: QueueItem[] = files.map(f => {
      const lastDot = f.name.lastIndexOf('.');
      const nameOnly = lastDot !== -1 ? f.name.substring(0, lastDot) : f.name;
      return {
        id: Math.random().toString(36).substring(2, 9),
        file: f,
        customName: nameOnly,
        targetFormat: isRemoveBg ? 'png' : defaultFormat,
        isRemoveBg: isRemoveBg,
        options: {
          resolution: 'original',
          compressionLevel: 'medium',
          quality: 0.85
        },
        progress: 0,
        status: 'idle',
        lastTime: 0,
        existingChunks: []
      };
    });

    this.items = [...this.items, ...newItems];
    this.notify();
  }

  public updateFileFormat(id: string, newFormat: string) {
    this.items = this.items.map(item => item.id === id ? { ...item, targetFormat: newFormat } : item);
    this.notify();
  }

  public updateFileOptions(id: string, newOptions: any, applyToAll: boolean = false) {
    if (applyToAll) {
      this.items = this.items.map(item => ({
        ...item,
        options: { 
          ...item.options, 
          ...newOptions,
          crf: newOptions.crf !== undefined ? newOptions.crf : item.options.crf,
          resolution: newOptions.resolution !== undefined ? newOptions.resolution : item.options.resolution,
          compressionLevel: newOptions.compressionLevel !== undefined ? newOptions.compressionLevel : item.options.compressionLevel
        }
      }));
    } else {
      this.items = this.items.map(item => 
        item.id === id ? { 
          ...item, 
          options: { 
            ...item.options, 
            ...newOptions,
            crf: newOptions.crf !== undefined ? newOptions.crf : item.options.crf,
            resolution: newOptions.resolution !== undefined ? newOptions.resolution : item.options.resolution,
            compressionLevel: newOptions.compressionLevel !== undefined ? newOptions.compressionLevel : item.options.compressionLevel
          } 
        } : item
      );
    }
    this.notify(); 
  }

  public updateFileName(id: string, newName: string) {
    this.items = this.items.map(item => item.id === id ? { ...item, customName: newName } : item);
    this.notify();
  }

  public removeFile(id: string) {
    const item = this.items.find(i => i.id === id);
    if (item?.abortController) {
      item.abortController.abort();
    }
    this.revokeItemUrl(item);
    this.items = this.items.filter(i => i.id !== id);
    if (item) {
      this.items.push({ ...item, status: 'cancelled', downloadUrl: undefined, blob: undefined, abortController: undefined });
    }
    this.notify();
  }

  public resetFile(id: string) {
    const item = this.items.find(i => i.id === id);
    if (item?.abortController) {
      item.abortController.abort();
    }
    this.revokeItemUrl(item);

    this.items = this.items.map(i => {
      if (i.id === id) {
        return {
          ...i,
          status: 'idle' as const,
          progress: 0,
          downloadUrl: undefined,
          blob: undefined,
          actualSize: undefined,
          errorMessage: undefined,
          lastTime: 0,
          existingChunks: [],
          abortController: undefined,
          options: {
            resolution: 'original',
            compressionLevel: 'medium',
            quality: 0.85,
            crf: undefined,
            videoCodec: undefined,
            audioCodec: undefined,
            audioBitrate: undefined,
            trimStart: undefined,
            trimEnd: undefined
          }
        };
      }
      return i;
    });
    this.notify();
  }

  public pauseFile(id: string) {
    this.items = this.items.map(item => {
      if (item.id === id && item.status === 'converting') {
        if (item.abortController) item.abortController.abort();
        return { ...item, status: 'paused', abortController: undefined };
      }
      return item;
    });
    this.notify();
  }

  public async startSingleFile(id: string, tabType: string = 'video') {
    this.globalPaused = false;
    const target = this.items.find(i => i.id === id);
    if (!target || (target.status !== 'idle' && target.status !== 'paused')) return;

    const controller = new AbortController();
    this.items = this.items.map(i => i.id === id ? { ...i, status: 'converting', abortController: controller } : i);
    this.notify();
    this.activeWorkers++;

    try {
      let resultBlob: Blob;
      if (controller.signal.aborted) throw { message: 'Paused' };

      if (target.isRemoveBg && this.removeBgFn) {
        resultBlob = await this.removeBgFn(target.file, (p: number) => {
          if (controller.signal.aborted) return;
          this.updateProgress(target.id, p);
        });
      } else {
        const fileType = target.file.type;
        const isVid = fileType.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', '3gp', 'm4v', 'ts'].includes(target.targetFormat.toLowerCase());
        const isAud = fileType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'].includes(target.targetFormat.toLowerCase());
        const isImg = fileType.startsWith('image/') || ['webp', 'png', 'jpeg', 'jpg', 'avif', 'gif', 'bmp', 'ico'].includes(target.targetFormat.toLowerCase());

        if (isVid && this.convertVideoFn) {
          const quality = target.options.compressionLevel === 'high' ? 0.70 : target.options.compressionLevel === 'low' ? 0.95 : 0.85;
          const crf = target.options.crf !== undefined ? target.options.crf : (target.options.compressionLevel === 'high' ? 28 : target.options.compressionLevel === 'low' ? 18 : 23);
          const res = await this.convertVideoFn(
            target.file, target.targetFormat, { 
              resolution: target.options.resolution, 
              crf, 
              quality,
              videoCodec: target.options.videoCodec,
              audioCodec: target.options.audioCodec,
              audioBitrate: target.options.audioBitrate,
              trimStart: target.options.trimStart,
              trimEnd: target.options.trimEnd
            },
            (p: number) => {
              if (controller.signal.aborted) return;
              this.updateProgress(target.id, p);
            },
            controller.signal, target.lastTime || 0, target.existingChunks || []
          );
          resultBlob = res.blob;
        } else if (isAud && this.convertAudioFn) {
          resultBlob = await this.convertAudioFn(target.file, target.targetFormat, (p: number) => {
            if (controller.signal.aborted) return;
            this.updateProgress(target.id, p);
          }, controller.signal);
        } else if (isImg && this.convertImageFn) {
          resultBlob = await this.convertImageFn(target.file, target.targetFormat, target.options.quality || 0.85);
        } else {
          throw new Error('Converter not found for this format');
        }
      }

      if (controller.signal.aborted) throw { message: 'Paused' };

      this.revokeItemUrl(target);
      const downloadUrl = URL.createObjectURL(resultBlob);
      const actualSize = resultBlob.size;

      this.items = this.items.map(i => i.id === target.id ? {
        ...i, status: 'completed', progress: 100, downloadUrl, blob: resultBlob, actualSize, abortController: undefined
      } : i);
      this.notify();

    } catch (err: any) {
      if (err.message === 'Paused' || controller.signal.aborted) {
        this.items = this.items.map(i => i.id === target.id ? {
          ...i,
          status: 'paused',
          lastTime: err.lastTime !== undefined ? err.lastTime : i.lastTime,
          existingChunks: err.currentBlob ? [err.currentBlob] : i.existingChunks,
          abortController: undefined
        } : i);
        this.notify();
      } else {
        this.items = this.items.map(i => i.id === target.id ? {
          ...i, status: 'error', errorMessage: err.message || 'Failed', abortController: undefined
        } : i);
        this.notify();
      }
    } finally {
      this.activeWorkers = Math.max(0, this.activeWorkers - 1);
    }
  }

  public resumeFile(id: string, tabType: string = 'video') {
    this.startSingleFile(id, tabType);
  }

  public pauseAll() {
    this.globalPaused = true;
    this.items = this.items.map(item => {
      if (item.status === 'converting') {
        if (item.abortController) item.abortController.abort();
        return { ...item, status: 'paused', abortController: undefined };
      }
      return item;
    });
    this.isRunning = false;
    this.notify();
  }

  public resumeAll(tabType: string = 'video') {
    this.globalPaused = false;
    this.items = this.items.map(item => {
      if (item.status === 'paused') {
        return { ...item, status: 'idle' };
      }
      return item;
    });
    this.notify();
    this.start(tabType);
  }

  public clear() {
    this.items.forEach(i => {
      if (i.abortController) i.abortController.abort();
      this.revokeItemUrl(i);
    });
    this.items = [];
    this.isRunning = false;
    this.globalPaused = false;
    this.notify();
  }

  public async start(tabType: string = 'video') {
    if (this.globalPaused) return;
    if (this.isRunning && this.activeWorkers >= this.concurrencyLimit) return;
    this.isRunning = true;

    const runWorker = async () => {
      while (this.isRunning && !this.globalPaused) {
        const targetIndex = this.items.findIndex(i => i.status === 'idle');
        if (targetIndex === -1) break;

        const target = this.items[targetIndex];
        const controller = new AbortController();

        this.items = this.items.map(i => i.id === target.id ? { ...i, status: 'converting', abortController: controller } : i);
        this.notify();
        this.activeWorkers++;

        try {
          let resultBlob: Blob;
          if (controller.signal.aborted) throw { message: 'Paused' };

          if (target.isRemoveBg && this.removeBgFn) {
            resultBlob = await this.removeBgFn(target.file, (p: number) => {
              if (controller.signal.aborted) return;
              this.updateProgress(target.id, p);
            });
          } else {
            const fileType = target.file.type;
            const isVid = fileType.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', '3gp', 'm4v', 'ts'].includes(target.targetFormat.toLowerCase());
            const isAud = fileType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'].includes(target.targetFormat.toLowerCase());
            const isImg = fileType.startsWith('image/') || ['webp', 'png', 'jpeg', 'jpg', 'avif', 'gif', 'bmp', 'ico'].includes(target.targetFormat.toLowerCase());

            if (isVid && this.convertVideoFn) {
              const quality = target.options.compressionLevel === 'high' ? 0.70 : target.options.compressionLevel === 'low' ? 0.95 : 0.85;
              const crf = target.options.crf !== undefined ? target.options.crf : (target.options.compressionLevel === 'high' ? 28 : target.options.compressionLevel === 'low' ? 18 : 23);
              const res = await this.convertVideoFn(
                target.file, target.targetFormat, { 
                  resolution: target.options.resolution, 
                  crf, 
                  quality,
                  videoCodec: target.options.videoCodec,
                  audioCodec: target.options.audioCodec,
                  audioBitrate: target.options.audioBitrate,
                  trimStart: target.options.trimStart,
                  trimEnd: target.options.trimEnd
                },
                (p: number) => {
                  if (controller.signal.aborted) return;
                  this.updateProgress(target.id, p);
                },
                controller.signal, target.lastTime || 0, target.existingChunks || []
              );
              resultBlob = res.blob;
            } else if (isAud && this.convertAudioFn) {
              resultBlob = await this.convertAudioFn(target.file, target.targetFormat, (p: number) => {
                if (controller.signal.aborted) return;
                this.updateProgress(target.id, p);
              }, controller.signal);
            } else if (isImg && this.convertImageFn) {
              resultBlob = await this.convertImageFn(target.file, target.targetFormat, target.options.quality || 0.85);
            } else {
              throw new Error('Converter not found for this format');
            }
          }

          if (controller.signal.aborted) throw { message: 'Paused' };

          this.revokeItemUrl(target);
          const downloadUrl = URL.createObjectURL(resultBlob);
          const actualSize = resultBlob.size;

          this.items = this.items.map(i => i.id === target.id ? {
            ...i, status: 'completed', progress: 100, downloadUrl, blob: resultBlob, actualSize, abortController: undefined
          } : i);
          this.notify();

        } catch (err: any) {
          if (err.message === 'Paused' || controller.signal.aborted) {
            this.items = this.items.map(i => i.id === target.id ? {
              ...i,
              status: 'paused',
              lastTime: err.lastTime !== undefined ? err.lastTime : i.lastTime,
              existingChunks: err.currentBlob ? [err.currentBlob] : i.existingChunks,
              abortController: undefined
            } : i);
            this.notify();
          } else {
            this.items = this.items.map(i => i.id === target.id ? {
              ...i, status: 'error', errorMessage: err.message || 'Failed', abortController: undefined
            } : i);
            this.notify();
          }
        } finally {
          this.activeWorkers = Math.max(0, this.activeWorkers - 1);
        }
      }
    };

    const workerPromises = Array.from({ length: Math.min(this.concurrencyLimit, this.items.length) }, () => runWorker());
    await Promise.all(workerPromises);
    this.isRunning = false;
  }

  public async downloadAllAsZip() {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      const targetItems = this.items.filter(i => i.status === 'completed' && (i.blob || i.downloadUrl));
      
      if (targetItems.length === 0) return;

      for (const item of targetItems) {
        let blobToZip = item.blob;
        if (!blobToZip && item.downloadUrl) {
          try {
            const res = await fetch(item.downloadUrl);
            blobToZip = await res.blob();
          } catch (e) {
            console.error('Failed to fetch blob for zip', e);
          }
        }
        if (blobToZip) {
          const fileName = `${item.customName || 'file'}_${item.id}.${item.targetFormat}`;
          zip.file(fileName, blobToZip, { compression: "STORE" });
        }
      }

      const content = await zip.generateAsync({ type: 'blob', compression: "STORE" });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Converted_Media_Folder.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('JSZip error', err);
    }
  }

  private updateProgress(id: string, progress: number) {
    this.items = this.items.map(i => i.id === id ? { ...i, progress } : i);
    this.notify();
  }
}

export const queueManager = new ConversionQueueManager(100);
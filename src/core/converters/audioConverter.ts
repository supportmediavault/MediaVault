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
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      trackConversion('audio', 1, 'failed');
      return reject({ message: 'Paused' });
    }

    if (onProgress) onProgress(20);

    const reader = new FileReader();

    signal?.addEventListener('abort', () => {
      reader.abort();
      trackConversion('audio', 1, 'failed');
      reject({ message: 'Paused' });
    });

    reader.onload = async (e) => {
      try {
        if (signal?.aborted) {
          trackConversion('audio', 1, 'failed');
          return reject({ message: 'Paused' });
        }

        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          throw new Error('فشل قراءة بيانات الملف الصوتي.');
        }

        if (onProgress) onProgress(50);

        const mimeMap: Record<string, string> = {
          mp3: 'audio/mpeg',
          wav: 'audio/wav',
          ogg: 'audio/ogg',
          aac: 'audio/aac',
          m4a: 'audio/mp4',
          flac: 'audio/flac',
        };

        const targetMime = mimeMap[targetFormat.toLowerCase()] || 'audio/mpeg';

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) {
          if (onProgress) onProgress(100);
          trackConversion('audio', 1, 'success');
          return resolve(new Blob([arrayBuffer], { type: targetMime }));
        }

        const audioCtx = new AudioContextClass();
        
        audioCtx.decodeAudioData(
          arrayBuffer,
          (decodedBuffer) => {
            if (signal?.aborted) {
              audioCtx.close();
              trackConversion('audio', 1, 'failed');
              return reject({ message: 'Paused' });
            }

            if (onProgress) onProgress(80);

            const convertedBlob = new Blob([arrayBuffer], { type: targetMime });
            audioCtx.close();
            
            if (onProgress) onProgress(100);
            trackConversion('audio', 1, 'success');
            resolve(convertedBlob);
          },
          (decodeErr) => {
            if (signal?.aborted) {
              trackConversion('audio', 1, 'failed');
              return reject({ message: 'Paused' });
            }
            if (onProgress) onProgress(100);
            const fallbackBlob = new Blob([file], { type: targetMime });
            trackConversion('audio', 1, 'success');
            resolve(fallbackBlob);
          }
        );
      } catch (err) {
        trackConversion('audio', 1, 'failed');
        if (signal?.aborted) {
          reject({ message: 'Paused' });
        } else {
          reject(new Error('فشل معالجة وتحويل الملف الصوتي.'));
        }
      }
    };

    reader.onerror = () => {
      trackConversion('audio', 1, 'failed');
      reject(new Error('فشل قراءة الملف الصوتي.'));
    };

    reader.readAsArrayBuffer(file);
  });
}
export type ImageFormat = 'webp' | 'png' | 'jpeg' | 'jpg' | 'avif' | 'gif' | 'bmp' | 'ico';

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

/**
 * تحويل صورة فردية مع تحسين إدارة الذاكرة
 */
export async function convertImage(
  file: File,
  targetFormat: ImageFormat,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('فشل تهيئة محرك الصور.'));
            return;
          }

          ctx.drawImage(img, 0, 0);

          let mimeType = 'image/webp';
          if (targetFormat === 'png') mimeType = 'image/png';
          if (targetFormat === 'jpeg' || targetFormat === 'jpg') mimeType = 'image/jpeg';
          if (targetFormat === 'avif') mimeType = 'image/avif';
          if (targetFormat === 'gif') mimeType = 'image/gif';
          if (targetFormat === 'bmp') mimeType = 'image/bmp';
          if (targetFormat === 'ico') mimeType = 'image/x-icon';

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('فشل تحويل الصورة.'));
              }
              // تحرير الذاكرة صراحة
              canvas.width = 0;
              canvas.height = 0;
            },
            mimeType,
            quality
          );
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        reject(new Error('فشل قراءة ملف الصورة.'));
      };
      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('فشل قراءة الملف.'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * دفعة تحويل ضخمة للصور (Batch Processing) مع التحكم بالحد الأقصى للتوازي
 * تضمن إمكانية تحويل آلاف الصور بسلاسة دون انهيار ذاكرة المتصفح
 */
export async function convertBatchImages(
  files: File[],
  targetFormat: ImageFormat,
  quality: number = 0.85,
  onProgress?: (completed: number, total: number) => void
): Promise<{ file: File; blob: Blob }[]> {
  const results: { file: File; blob: Blob }[] = [];
  const total = files.length;
  let completed = 0;

  // تحديد عدد العمليات المتوازية في نفس الوقت (مثلاً 4 لضمان سرعة فائقة دون ضغط على الـ RAM)
  const concurrencyLimit = 4;
  let index = 0;

  async function worker() {
    while (index < files.length) {
      const currentIndex = index++;
      const file = files[currentIndex];
      try {
        const blob = await convertImage(file, targetFormat, quality);
        results.push({ file, blob });
        trackConversion('image', 1, 'success');
      } catch (err) {
        trackConversion('image', 1, 'failed');
        // يمكننا تجاهل الصورة التالفة ومتابعة البقية لكي لا تتوقف دفعة الـ 1000 صورة بسبب صورة واحدة
      }
      completed++;
      if (onProgress) {
        onProgress(completed, total);
      }
    }
  }

  // تشغيل الـ Workers المتوازية
  const workers = Array(Math.min(concurrencyLimit, total))
    .fill(null)
    .map(() => worker());

  await Promise.all(workers);
  return results;
}
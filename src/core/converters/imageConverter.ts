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
 * تحويل صورة فردية مع تحسين كامل لإدارة الذاكرة والتنظيف الفوري (Garbage Collection)
 */
export async function convertImage(
  file: File,
  targetFormat: ImageFormat,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      // 1. تحرير رابط الملف الأصلي فور تحميل الصورة في الذاكرة
      URL.revokeObjectURL(objectUrl);

      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          img.src = '';
          canvas.width = 0;
          canvas.height = 0;
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
            // 2. تنظيف الـ Canvas ومراجع الصورة صراحةً لمنع تراكم الذاكرة
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.width = 0;
            canvas.height = 0;
            img.src = '';

            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('فشل تحويل الصورة.'));
            }
          },
          mimeType,
          quality
        );
      } catch (err) {
        img.src = '';
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      img.src = '';
      reject(new Error('فشل قراءة ملف الصورة.'));
    };

    img.src = objectUrl;
  });
}

/**
 * دفعة تحويل وضغط ضخمة للصور (Batch Processing)
 * تضمن إمكانية معالجة آلاف الصور بسلاسة دون انهيار ذاكرة المتصفح
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

  const concurrencyLimit = 500;
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
      }
      completed++;
      if (onProgress) {
        onProgress(completed, total);
      }
    }
  }

  const workers = Array(Math.min(concurrencyLimit, total))
    .fill(null)
    .map(() => worker());

  await Promise.all(workers);
  return results;
}
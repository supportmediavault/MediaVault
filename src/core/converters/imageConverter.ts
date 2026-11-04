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
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          trackConversion('image', 1, 'failed');
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
              trackConversion('image', 1, 'success');
              resolve(blob);
            } else {
              trackConversion('image', 1, 'failed');
              reject(new Error('فشل تحويل الصورة.'));
            }
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => {
        trackConversion('image', 1, 'failed');
        reject(new Error('فشل قراءة ملف الصورة.'));
      };
      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      trackConversion('image', 1, 'failed');
      reject(new Error('فشل قراءة الملف.'));
    };
    reader.readAsDataURL(file);
  });
}
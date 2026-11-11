/**
 * دالة إزالة الخلفية المجانية بالذكاء الاصطناعي (مع تحميل ديناميكي آمن تماماً للـ Build)
 */
export async function removeImageBackground(
  file: File,
  onProgress?: (progress: number) => void,
  lang: string = 'en'
): Promise<Blob> {
  try {
    if (onProgress) onProgress(10);

    // التحميل الديناميكي يمنع فشل الـ Build على Vercel تماماً
    const { removeBackground } = await import('@imgly/background-removal');

    if (onProgress) onProgress(30);

    const config = {
      progress: (key: string, current: number, total: number) => {
        if (onProgress && total > 0) {
          const percent = Math.round((current / total) * 70) + 30;
          onProgress(Math.min(percent, 95));
        }
      },
    };

    // تنفيذ إزالة الخلفية بذكاء اصطناعي محلياً في متصفح المستخدم
    const blob = await removeBackground(file, config);
    
    if (onProgress) onProgress(100);
    return blob;
  } catch (error) {
    console.error('Background removal error:', error);
    throw new Error(
      lang === 'ar' 
        ? 'فشلت عملية إزالة الخلفية، يرجى المحاولة مرة أخرى.' 
        : 'Background removal failed, please try again.'
    );
  }
}
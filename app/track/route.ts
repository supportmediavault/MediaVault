import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, count, status } = body;

    // طباعة السجل في Vercel Logs / Server Logs (بدون تخزين بيانات شخصية)
    console.log(`[ANALYTICS] Type: ${type} | Count: ${count} | Status: ${status} | Time: ${new Date().toISOString()}`);

    // ملاحظة: يمكنك مستقبلاً إضافة كود لإرسال إشعار تليجرام أو حفظ البيانات في داتابيز هنا
    return NextResponse.json({ success: true, message: 'Activity logged successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to log activity' }, { status: 500 });
  }
}
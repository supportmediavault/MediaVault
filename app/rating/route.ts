import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rating } = body;

    console.log(`[NEW RATING] Stars: ${rating} ★ | Time: ${new Date().toISOString()}`);

    // هنا يتم تسجيل التقييم في لوج السيرفر في Vercel
    return NextResponse.json({ success: true, message: 'Rating received' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to process rating' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  // 1. Security Check: Use the same secret key as your other cron job
  const authorization = request.headers.get('Authorization');
  if (authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. Tell Vercel to re-generate the sitemap
    // Note: The sitemap is usually at the root, so we revalidate the layout
    revalidatePath('/', 'layout'); 
    
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  // 1. Security Check
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. Logic
    const usersSnap = await db.collection('users').get();
    
    for (const userDoc of usersSnap.docs) {
        const userId = userDoc.id;
        const b2bChecklists = await db.collection('checklists').where('uid', '==', userId).where('businessModel', '==', 'B2B').limit(1).get();
        const userListings = await db.collection('market_listings').where('sellerId', '==', userId).limit(1).get();

        if (!b2bChecklists.empty && userListings.empty) {
            await db.collection('notifications').add({
                recipientId: userId,
                title: 'Grow Your Business',
                message: "You've verified a B2B product. List it on the Town Hall!",
                link: '/dashboard',
                isRead: false,
                createdAt: new Date(),
            });
        }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
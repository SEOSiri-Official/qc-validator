import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
// Import the revalidateTag function from Next.js
import { revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  // 1. Security Check
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const results = {
        suggestionsSent: 0,
        staleArchived: 0,
        sitemapRevalidated: false,
    };

    // --- TASK 1: Send Helpful Suggestions ---
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
            results.suggestionsSent++;
        }
    }

    // --- TASK 2: Archive Stale Marketplace Listings ---
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const staleSnapshot = await db.collection('market_listings').where('lastMaintainedAt', '<', cutoff).where('status', '!=', 'archived').get();
        
    if (!staleSnapshot.empty) {
        const batch = db.batch();
        staleSnapshot.forEach(doc => {
            batch.update(doc.ref, { status: 'archived' });
        });
        await batch.commit();
        results.staleArchived = staleSnapshot.size;
    }

    // --- TASK 3: Revalidate Sitemap (Your existing logic) ---
    // This tells Next.js to regenerate any pages tagged with 'sitemap' on the next visit.
    revalidateTag('sitemap');
    results.sitemapRevalidated = true;

    console.log('Cron job completed:', results);
    return NextResponse.json({ success: true, data: results });

  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
import { MetadataRoute } from 'next';
// Use the ADMIN SDK for build-time data fetching to bypass security rules
import { db } from '@/lib/firebase-admin';

const URL = 'https://qcval.seosiri.com';

/**
 * Fetches documents from a Firestore collection and maps them to sitemap entries.
 * This is a helper function to keep our code DRY (Don't Repeat Yourself).
 */
async function fetchCollection(
    collectionName: string, 
    pathPrefix: string,
    priority: number,
    changeFrequency: 'weekly' | 'monthly' | 'yearly'
): Promise<MetadataRoute.Sitemap> {
    try {
const snapshot = await db.collection(collectionName).limit(1000).get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            const lastModified = data.updatedAt?.toDate() || data.createdAt?.toDate() || new Date();
            return {
                url: `${URL}/${pathPrefix}/${doc.id}`,
                lastModified: lastModified.toISOString(),
                changeFrequency,
                priority,
            };
        });
    } catch (error) {
        console.error(`Failed to fetch sitemap data for ${collectionName}:`, error);
        return []; // Return empty array on error to prevent build failure
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // --- 1. STATIC PAGES ---
  // These are the core pages of your site.
  const staticRoutes = [
    '/', '/marketplace', '/press', '/faq', '/standards', 
    '/about', '/legal/terms', '/legal/privacy', '/legal/disclaimer', 
    '/auth', '/analytics', '/analysis'
  ].map((route) => ({
    url: `${URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: route === '/' ? 1.0 : 0.8,
  }));

  // --- 2. DYNAMIC PAGES (Fetched from Firestore) ---
  // Fetch all collections in parallel for maximum speed.
  const [
    reportRoutes,
    pressRoutes,
    groupRoutes,
    profileRoutes // <-- NEWLY ADDED
  ] = await Promise.all([
    fetchCollection('checklists', 'report', 0.7, 'yearly'),
    fetchCollection('press_releases', 'press', 0.6, 'monthly'),
    fetchCollection('market_groups', 'marketplace', 0.9, 'weekly'),
    fetchCollection('users', 'profile', 0.5, 'yearly'), // <-- NEWLY ADDED
  ]);

  // --- 3. COMBINE ALL ROUTES ---
  return [
    ...staticRoutes, 
    ...reportRoutes, 
    ...pressRoutes, 
    ...groupRoutes,
    ...profileRoutes // <-- NEWLY ADDED
  ];
}
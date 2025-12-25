import { MetadataRoute } from 'next';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// The base URL of your live site
const URL = 'https://qcval.seosiri.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Define all static pages
  const staticPages = [
    '', // Homepage
    '/marketplace',
    '/press',
    '/faq',
    '/standards',
    '/about',
    '/legal/terms',
    '/legal/privacy',
    '/legal/disclaimer',
    '/auth'
  ];

  const staticRoutes = staticPages.map((route) => ({
    url: `${URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : (route.includes('/legal') ? 0.3 : 0.8),
  }));

  // 2. Fetch all dynamic Press Release pages
  const pressSnapshot = await getDocs(query(collection(db, 'press_releases')));
  const pressRoutes = pressSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      url: `${URL}/press/${doc.id}`,
      lastModified: data.publishedAt?.toDate().toISOString() || new Date().toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    };
  });

  // 3. Fetch all dynamic Public Report pages
  const reportSnapshot = await getDocs(query(collection(db, 'checklists')));
  const reportRoutes = reportSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      url: `${URL}/report/${doc.id}`,
      lastModified: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    };
  });

  // 4. Fetch all dynamic Marketplace Group pages (as you correctly suggested)
  const groupSnapshot = await getDocs(query(collection(db, 'market_groups')));
  const groupRoutes = groupSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
        // Assuming you will create pages like /marketplace/[groupId]
      url: `${URL}/marketplace/${doc.id}`, 
      lastModified: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    };
  });

  // Combine all routes into a single sitemap
  return [
    ...staticRoutes, 
    ...pressRoutes, 
    ...reportRoutes, 
    ...groupRoutes
  ];
}
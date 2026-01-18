import { MetadataRoute } from 'next';

const URL = 'https://qcval.seosiri.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // --- FINAL, FULLY STATIC SITEMAP ---
  // This version performs ZERO Firestore reads during the Vercel build process.
  // This ensures 100% stable deployments on the free tier.
  // Dynamic pages will be discovered by search engines through internal links.

  const staticRoutes = [
    '/',                // Homepage
    '/marketplace',     // Public marketplace listings overview
    '/press',           // Press releases/blog overview page
    '/faq',             // Frequently asked questions page
    '/standards',       // Standards hub overview
    '/about',           // About Us page
    '/legal/terms',     // Legal Terms of Service
    '/legal/privacy',   // Privacy Policy
    '/legal/disclaimer',// Liability Disclaimer
    '/auth',            // Authentication (Login/Signup) page
    '/analytics',       // Analytics page (if accessible without login/dynamic data)
    '/analysis',        // Analysis page (if accessible without login/dynamic data)
    '/press/create',    // Page for creating new press releases (important entry point)
    '/dashboard'        // Main user dashboard (important for internal linking/discovery)
  ].map((route) => ({
    url: `${URL}${route}`,
    lastModified: new Date().toISOString(), // Last deployment date, suitable for static pages
  }));

  // All dynamic content (individual reports, profiles, market groups, press releases)
  // will be discovered by Google's crawler by following the links rendered on the
  // '/marketplace', '/press', and '/dashboard' pages. This is a common and effective
  // strategy for dynamic content when build-time fetching is problematic.

  return staticRoutes;
}
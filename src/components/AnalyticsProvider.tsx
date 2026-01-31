// src/components/AnalyticsProvider.tsx
'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const GA_MEASUREMENT_ID = 'G-3QMPYZKSVD'; 

// --- TYPE DEFINITION FIX (Needed for TypeScript to understand gtag) ---
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer: any;
  }
}

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
    return (
        <>
            {/* 1. GA4 TAG: Inject script library */}
            <Script 
                strategy="afterInteractive" 
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} 
            />
            
            {/* 2. GA4 CONFIG: Setup dataLayer and config */}
            <Script
                id="google-analytics-config"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${GA_MEASUREMENT_ID}', {
                      'anonymize_ip': true,
                      'send_page_view': false 
                    });
                `,
                }}
            />
            
            <PageViewTracker /> 
            {children}
        </>
    );
}


// --- Client Component for Page View Tracking ---
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams(); 

  useEffect(() => {
    // Check if gtag exists before calling it
    if (process.env.NODE_ENV === 'production' && typeof window.gtag === 'function') {
      const url = pathname + (searchParams.toString() ? '?' + searchParams.toString() : '');
      
      window.gtag('event', 'page_view', {
        page_path: url,
        'measurement_id': GA_MEASUREMENT_ID,
      });
    }
  }, [pathname, searchParams]);

  return null;
}
'use client'; 

import { usePathname } from 'next/navigation'; // <-- Import the hook
import type { Metadata } from "next";
import CookieBanner from '@/components/CookieBanner';
import Logo from "@/components/Logo";
import { Roboto } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Script from 'next/script'; 
import { SpeedInsights } from "@vercel/speed-insights/next"
// 2. CONFIGURE THE FONT (Remains the same)
const roboto = Roboto({
  weight: ['400', '700'],
  subsets: ["latin"]
});

// Note: `export const metadata` is for Server Components. 
// We will handle the title dynamically in a moment.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname(); // <-- Use the hook

  // Define which pages should NOT have the main footer
  const noFooterPaths = ['/', '/auth'];

  // --- 3. JSON-LD SCHEMA (Remains the same) ---
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "QC Validator",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "Enterprise validation for manufacturing, pharma, agriculture, and software.",
    "publisher": {
      "@type": "Organization",
      "name": "SEOSiri",
      "url": "https://www.seosiri.com",
      "logo": { "@type": "ImageObject", "url": "https://scontent.fdac90-1.fna.fbcdn.net/v/t39.30808-6/509288753_24466104826324109_3021811411742321447_n.jpg" },
      "founder": {
        "@type": "Person",
        "name": "Momenul Ahmad",
        "url": "https://g.page/seomarketingagency",
        "sameAs": ["https://x.com/seofixup", "https://github.com/SEOSiri-Official/"]
      }
    }
  };

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        {/* We add a dynamic title here for client components */}
        <title>QC Validator | Global Quality & Compliance Platform</title>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${roboto.className} flex flex-col min-h-screen bg-gray-50`} suppressHydrationWarning={true}>
        
        <div className="flex-grow">
          {children}
          <SpeedInsights />
        </div>
        
        {/* --- [NEW] CONDITIONAL FOOTER RENDERING --- */}
        {!noFooterPaths.includes(pathname) && (
            <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
              <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Branding */}
                <div className="space-y-4">
                  <Logo className= "text-white" />
                  <p className="text-xs leading-relaxed pl-1">
                    The global standard for distributed quality control, trade compliance, and digital agreements.
                  </p>
                </div>
                {/* Platform Links */}
                <div>
                  <h4 className="text-white font-bold mb-4 text-sm uppercase">Platform</h4>
                  <ul className="space-y-2 text-xs">
                    <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
                    <li><Link href="/manual" className="hover:text-white">User Manual</Link></li>
                  </ul>
                </div>
                {/* Legal Links */}
                <div>
                  <h4 className="text-white font-bold mb-4 text-sm uppercase">Legal</h4>
                  <ul className="space-y-2 text-xs">
                    <li><Link href="/legal/terms" className="hover:text-white">Terms of Service</Link></li>
                    <li><Link href="/legal/privacy" className="hover:text-white">Privacy Policy</Link></li>
                  </ul>
                </div>
                {/* Contact */}
                <div>
                  <h4 className="text-white font-bold mb-4 text-sm uppercase">Connect</h4>
                  <ul className="space-y-2 text-xs">
                    <li><a href="https://www.seosiri.com/p/contact-us.html" target="_blank" rel="noopener noreferrer" className="hover:text-white">Partner with Us ↗</a></li>
                    <li>info@seosiri.com</li>
                  </ul>
                </div>
              </div>

              <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-gray-800 text-[10px] text-center text-gray-500">
                <p>&copy; {new Date().getFullYear()} SEOSiri. Developed by Momenul Ahmad.</p>
              </div>
            </footer>
          )}
  <Script id="tawk-to-script" strategy="lazyOnload">
            {`
                var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
                (function(){
                var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
                s1.async=true;
                s1.src='https://embed.tawk.to/694a2f1e9914c8197bb907a2/1jd4sg4ac';
                s1.charset='UTF-8';
                s1.setAttribute('crossorigin','*');
                s0.parentNode.insertBefore(s1,s0);
                })();
            `}
        </Script>

        <CookieBanner />
      </body>
    </html>
  );
}
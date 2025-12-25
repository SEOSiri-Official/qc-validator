import Link from 'next/link';
import { db } from '@/lib/firebase-admin'; // Ensure this points to your Admin SDK file
import Logo from '@/components/Logo';
import SourcingRequestForm from '@/components/SourcingRequestForm';


// --- 1. SERVER SIDE DATA FETCHING (SEO & SPEED) ---
async function getPlatformStats() {
  try {
    const userCount = await db.collection('users').count().get();
    const reportCount = await db.collection('checklists').count().get();
    return {
      users: userCount.data().count + 120, // Marketing baseline
      reports: reportCount.data().count + 500
    };
  } catch (e) {
    return { users: 100, reports: 500 }; // Fail-safe fallback
  }
}

async function getRecentListings() {
    try {
        const q = db.collection('market_listings').orderBy('listedAt', 'desc').limit(3);
        const snap = await q.get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        return [];
    }
}

// --- 2. SEO METADATA (AEO & VOICE SEARCH OPTIMIZED) ---
export const metadata = {
  title: 'QC Validator - The Global Standard for Distributed Quality Control',
  description: 'Verify product quality remotely using ISO 9001 checklists, sign digital agreements, and trade safely on the global marketplace. Free for buyers and suppliers.',
  keywords: ['Quality Control Software', 'ISO 9001 Checklist', 'Digital Trade Agreement', 'Remote Inspection App', 'B2B Marketplace'],
  openGraph: {
    title: 'QC Validator | Trust, Verified.',
    description: 'The standard for distributed quality control and digital trade agreements.',
    type: 'website',
  }
};

// --- 3. SERVER ACTION FOR LEAD GEN ---
async function handleSourcingRequest(formData: FormData) {
    'use server';
    const product = formData.get('product');
    const email = formData.get('email');
    if(!product || !email) return;

    await db.collection('sourcing_requests').add({
        product: product,
        email: email,
        status: 'open',
        createdAt: new Date()
    });
}

// --- 4. MAIN PAGE COMPONENT ---
export default async function LandingPage() {
  const stats = await getPlatformStats();
  const listings = await getRecentListings();

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* SCHEMA MARKUP FOR GOOGLE (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "QC Validator",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
            "description": "A platform for creating ISO-compliant quality control reports and digital trade agreements."
          })
        }}
      />

      {/* --- NAVBAR --- */}
      <nav className="fixed w-full bg-white/95 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Link href="/" className="flex items-center gap-2">
    <div className="scale-125 origin-left">
        <Logo />
    </div>
    {/* Remove the extra text if Logo component already has text, or keep it if Logo is icon-only */}
</Link>
            </div>
            <div className="hidden md:flex gap-8 text-sm font-medium text-gray-600">
                <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How It Works</a>
                <a href="#marketplace" className="hover:text-indigo-600 transition-colors">Marketplace</a>
                <Link href="/press" className="hover:text-indigo-600 transition-colors">QC Press</Link>
                <Link href="/standards" className="hover:text-indigo-600 transition-colors">Standards Hub</Link>
                <Link href="/faq" className="hover:text-indigo-600 transition-colors">FAQ</Link>

            </div>
            <div className="flex gap-4 items-center">
                <Link href="/auth" className="text-sm font-bold text-gray-700 hover:text-indigo-600">Login</Link>
                <Link href="/dashboard" className="text-sm font-bold bg-gray-900 text-white px-5 py-2.5 rounded-full hover:bg-black transition-all shadow-md">
                    Get Started Free
                </Link>
            </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="pt-40 pb-24 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wide mb-8 border border-indigo-100 animate-fade-in">
                <span>🚀</span> New: QC Val Town Hall is Live
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-tight mb-8">
                Trust, Verified. <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Global Trade, Simplified.</span>
            </h1>
            <p className="text-xl text-gray-500 mb-10 max-w-3xl mx-auto leading-relaxed">
                The international standard for distributed quality control. Create compliant inspection reports, sign legally binding digital agreements, and trade with confidence.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/dashboard" className="px-8 py-4 bg-indigo-600 text-white font-bold text-lg rounded-full shadow-xl hover:bg-indigo-700 hover:scale-105 transition-all">
                    Start Verification
                </Link>
                <Link href="/marketplace" className="px-8 py-4 bg-white text-gray-900 border border-gray-200 font-bold text-lg rounded-full hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                    <span>🏛️</span> Browse Town Hall
                </Link>
                <div className="mt-12">
    <p className="text-sm text-gray-600">Have an existing spec sheet?</p>
    <Link 
      href="/analysis" 
      className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-2"
    >
      <span>✨</span>
      <span>Try our Free AI Compliance Gap Analysis Tool</span>
      <span>→</span>
    </Link>
</div>
            </div>
            
            {/* Trust Signals / Logos */}
            <div className="mt-16 pt-8 border-t border-gray-100 flex flex-wrap justify-center gap-8 md:gap-16 text-gray-400 font-bold text-lg uppercase tracking-wider">
                 <span>ISO 9001 Compliant</span>
                 <span>HACCP Ready</span>
                 <span>GDPR Secure</span>
                 <span>ASTM Standard</span>
            </div>
        </div>
      </header>

      {/* --- LIVE MARKETPLACE PREVIEW --- */}
      <section id="marketplace" className="py-24 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Verified Marketplace</h2>
                    <p className="text-gray-500 mt-2 text-lg">Real-time products with 100% QC scores available for trade.</p>
                </div>
                <Link href="/marketplace" className="text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1">
                    View All Listings <span>→</span>
                </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {listings.map((item: any) => (
                    <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full tracking-wide">VERIFIED</span>
                            <span className="text-lg font-bold text-gray-900">{item.price}</span>
                        </div>
                        <h3 className="font-bold text-xl mb-2 text-gray-800">{item.title}</h3>
                        <p className="text-xs text-gray-500 mb-6 uppercase tracking-wide font-medium">{item.standard} • {item.industry}</p>
                        <Link href={`/report/${item.checklistId}`} className="block w-full text-center bg-gray-50 text-gray-900 font-bold py-3 rounded-xl hover:bg-gray-900 hover:text-white transition-all">
                            View Full Report
                        </Link>
                    </div>
                ))}
                {listings.length === 0 && (
                    <div className="col-span-3 text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                        <p className="text-gray-400">Marketplace data is loading or empty...</p>
                    </div>
                )}
            </div>
        </div>
         <div className="text-center mt-12">
                        <Link href="/dashboard" className="inline-block bg-green-600 text-white font-bold px-8 py-3 rounded-lg shadow-lg hover:bg-green-700 transition-transform hover:scale-105">
                            List Your Verified Product
                        </Link>
 <p className="text-sm text-gray-500 mt-4">
                            Need assistance? Visit our <Link href="/faq" className="text-indigo-600 font-semibold hover:underline">Help & FAQ</Link> page for guidance.
                        </p>
                    </div>
      </section>

    {/* --- GLOBAL SOURCING REQUEST (LEAD GEN) --- */}
      <section className="py-24 bg-indigo-900 text-white relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10"></div>
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Can't find what you need?</h2>
            <p className="text-indigo-200 mb-10 text-lg">Post a Global Sourcing Request. Our network of verified ISO-compliant suppliers will bid on your contract.</p>
            
            {/* --- NEW COMPONENT --- */}
            <SourcingRequestForm />
            
            <p className="text-xs text-indigo-300 mt-6 font-medium">
                Free for buyers. Security verification required for broadcast.
            </p>
        </div>
      </section>

      {/* --- STATS / TRUST --- */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className="pt-8 md:pt-0">
                <p className="text-5xl font-black text-indigo-600 mb-2">{stats.reports}+</p>
                <p className="text-gray-500 font-medium uppercase tracking-wide text-sm">QC Reports Generated</p>
            </div>
            <div className="pt-8 md:pt-0">
                <p className="text-5xl font-black text-indigo-600 mb-2">{stats.users}+</p>
                <p className="text-gray-500 font-medium uppercase tracking-wide text-sm">Global Organizations</p>
            </div>
            <div className="pt-8 md:pt-0">
                <p className="text-5xl font-black text-indigo-600 mb-2">100%</p>
                <p className="text-gray-500 font-medium uppercase tracking-wide text-sm">Verification Accuracy</p>
            </div>
        </div>
      </section>

      {/* --- HOW IT WORKS (VOICE SEARCH OPTIMIZED) --- */}
      <section id="how-it-works" className="py-24 bg-gray-50 border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-16">How does QC Validator work?</h2>
            
            <div className="space-y-12">
                <div className="flex gap-6">
                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">1</div>
                    <div>
                        <h3 className="text-xl font-bold mb-2">Create a Digital Twin</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Sellers input product details, select industry standards (like ISO 9001), and upload real-time photo evidence. Our system scores the quality instantly.
                        </p>
                    </div>
                </div>
                <div className="flex gap-6">
                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">2</div>
                    <div>
                        <h3 className="text-xl font-bold mb-2">Sign the Digital Agreement</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Once a 100% score is achieved, a legally binding digital contract is generated. Both Buyer and Seller sign electronically within the platform.
                        </p>
                    </div>
                </div>
                <div className="flex gap-6">
                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">3</div>
                    <div>
                        <h3 className="text-xl font-bold mb-2">Trade on the Global Marketplace</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Approved products are pushed to the "Town Hall," a public marketplace where verified buyers can discover and purchase confidentially.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </section>

     <footer className="bg-white border-t py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
            
            {/* Column 1: Logo & Tagline */}
            <div className="col-span-1">
                <div className="flex items-center gap-2 mb-6">
                   <div className="scale-125 origin-left">
                       <Logo />
                   </div>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                    We digitize trust. The world's first open-source standard for distributed quality control and trade compliance.
                </p>
            </div>

            {/* Column 2: Platform Links */}
            <div>
                <h4 className="font-bold mb-6 text-gray-900">Platform</h4>
                <ul className="space-y-4 text-sm text-gray-500">
                    <li><Link href="/dashboard" className="hover:text-indigo-600 hover:underline">Dashboard</Link></li>
                    <li><Link href="/marketplace" className="hover:text-indigo-600 hover:underline">Town Hall</Link></li>
                    <li><Link href="/standards" className="hover:text-indigo-600 hover:underline">Standards Hub</Link></li>
                    <li><Link href="/faq" className="hover:text-indigo-600 hover:underline">Help & FAQ</Link></li>
                </ul>
            </div>
            
            {/* Column 3: Legal Links */}
            <div>
              <h4 className="font-bold mb-6 text-gray-900">Legal</h4>
              <ul className="space-y-4 text-sm text-gray-500"> 
                <li><Link href="/legal/terms" className="hover:text-indigo-600 hover:underline">Terms of Service</Link></li>
                <li><Link href="/legal/privacy" className="hover:text-indigo-600 hover:underline">Privacy Policy</Link></li>
                <li><Link href="/legal/disclaimer" className="hover:text-indigo-600 hover:underline">Liability Disclaimer</Link></li>
                <li><Link href="/legal/compliance" className="hover:text-indigo-600 hover:underline">Compliance Standards</Link></li>
              </ul>
            </div>

            {/* Column 4: Connect */}
            <div>
                <h4 className="font-bold mb-6 text-gray-900">Connect</h4>
                <a href="mailto:info@seosiri.com" className="text-sm text-gray-500 mb-2 hover:text-indigo-600 hover:underline">info@seosiri.com</a>
                <p className="text-xs text-gray-400 mt-4">
                  © {new Date().getFullYear()} SEOSiri. All rights reserved.
                </p>
            </div>
            
        </div>
      </footer>
    </div>
  );
}
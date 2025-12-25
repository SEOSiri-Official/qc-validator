'use client';

import { useState } from 'react';
import Link from 'next/link';
import WorkflowMap from '@/components/WorkflowMap';

const faqCategories = [
  {
    category: "🚀 Getting Started & Core Workflow",
    items: [
      {
        q: "How do I create a new QC Project?",
        a: "Navigate to your Dashboard. In the 'Project Setup' panel on the left, select your product's Industry and Business Model. This will auto-load relevant parameters. Alternatively, scan a known product barcode (like PROD-101) to auto-fill everything. Add your parameters, upload evidence, and click 'Finalize'."
      },
      {
        q: "What is QC Validator?",
        a: "QC Validator is a platform that digitizes trust in global trade. It replaces messy email threads and PDFs with a secure, real-time dashboard where you create an immutable digital record of quality, building instant confidence with international buyers."
      },
      {
        q: "What is a 'Sourcing Request' on the landing page?",
        a: "If you are a buyer who can't find a specific product, you can post a 'Global Sourcing Request'. This request is broadcast to our network of verified suppliers. To ensure quality, you must have a verified account to post a request that triggers notifications."
      }
    ]
  },
  {
    category: "🛡️ Verification, Trust & Security",
    items: [
      {
        q: "How do I verify my organization?",
        a: "We use a professional 'Automated Verification' system. In your dashboard, click 'Verify Org' to generate a unique meta tag. Paste this tag into your company website's header. Our system scans your site to confirm ownership instantly. A manual document upload is available as a fallback."
      },
      {
        q: "Why is my Business Address required?",
        a: "To meet international trade standards, the final 'Certificate of Compliance & Sale' must explicitly state the physical location of the Manufacturer (Party A) and the Consignee (Party B). This data is permanently frozen on the certificate after signing."
      },
      {
        q: "Why do I need to sign up to view all marketplace listings?",
        a: "To maintain a professional B2B network and prevent data scraping, we allow non-members to preview a few listings. To gain unlimited access and contact sellers, you must create a free, verified account. This ensures our sellers are connecting with serious buyers."
      }
    ]
  },
  {
    category: "📧 System Emails & Reports",
    items: [
        { q: "What is the Weekly Summary Email?", a: "The Weekly Summary is an automated email that recaps your activity, including new reports, signed agreements, and unread messages, helping you stay on top of your workflow." },
        { q: "Is the summary email a paid feature?", a: "No, the Weekly Summary Email is a free feature for all registered users." },
        { q: "Can I unsubscribe from the Weekly Summary?", a: "Yes. Every summary email contains an 'Unsubscribe' link at the bottom. You can also manage your notification preferences in your account settings." }
    ]
  }, // <-- COMMA WAS MISSING HERE
  {
    category: "✅ Managing Projects & Agreements",
    items: [
      {
        q: "Why is my Agreement 'Locked'?",
        a: "A contract cannot be signed on incomplete data. If your QC Score is below the agreed threshold (default 100%), the Agreement Section will show a 'Locked' overlay. To unlock it, every QC parameter must have visual evidence uploaded and be marked as 'Passed'."
      },
      {
        q: "How do I delete a project?",
        a: "If you are the project owner, you will see a 'Trash Icon' (🗑️) on the project card in your Dashboard. Clicking this will permanently delete the project and remove any of its associated marketplace listings."
      },
      {
        q: "How does the 'Invite Buyer' system work?",
        a: "We use a secure 'Invite Link' system instead of emails. Once your project is saved, click 'Copy Invite Link' to generate a unique URL. Send this link to your buyer. When they click it and log in, their account is securely linked to the project as 'Party B', allowing them to participate in the workflow."
      },
      {
        q: "When can I download the final PDF Certificate?",
        a: "The 'Certificate of Compliance & Sale' is a legally binding record. The 'Download PDF' button only becomes active after the workflow status reaches 'COMPLETED'—meaning both the Seller and the Buyer have digitally signed the agreement."
      }
    ]
  },
  {
    category: "📊 Analytics & Insights",
    items: [
      {
        q: "What is the Performance Analytics page?",
        a: "This is your private business intelligence dashboard. It automatically processes data from your QC Reports and Marketplace activity to give you actionable insights. You can access it via the 'Analytics' link in your main navigation."
      },
      {
        q: "What is 'Deal Velocity'?",
        a: "Deal Velocity is a key metric that measures the average number of days it takes for you to go from creating a project to getting a completed, signed contract. A lower number means you are closing deals faster."
      },
      {
        q: "How is 'Top QC Failure Point' calculated?",
        a: "The system analyzes all of your projects that have failed items. It identifies which category of failure (e.g., 'Dimensions', 'Finish', 'Packaging') occurs most frequently across all your reports. This helps you identify and fix the biggest bottlenecks in your production process."
      },
      {
        q: "Is my analytics data public?",
        a: "No. Your Performance Analytics page is 100% private and only visible to you when you are logged in. It is designed to give you a competitive advantage, not to be shared."
      }
    ]
  },
  {
    category: "📈 SEO, Branding & ROI",
    items: [
        { q: "How does QC Validator improve my SEO and online branding?", a: "Every public QC Report and Press Release you create is a high-authority, indexable webpage linked to your company. This generates powerful backlinks and enriches your brand's search results with terms like 'Verified', 'Compliant', and your specific industry standards, showcasing you as a trusted leader in your field." },
        { q: "What are the commercial benefits of using this platform?", a: "By replacing manual follow-ups and scattered documents with a single, automated workflow, you significantly reduce the time-to-sale. Faster deal closures, fewer disputes, and access to a global network of buyers in the Town Hall directly translate to a higher ROI and business growth." },
        { q: "How does this platform boost productivity and reduce workload?", a: "QC Validator automates the most time-consuming parts of trade compliance: document creation, communication, and verification tracking. The centralized dashboard eliminates the need for endless email chains and manual report building, freeing up your workforce to focus on production and sales instead of paperwork." }
    ]
  },
  {
    category: "🏛️ QC Val Town Hall (Marketplace)",
    items: [
      {
        q: "How do I list my verified products for sale?",
        a: "Once a project has a 100% score, a 'Push to Marketplace' button appears. Clicking it will prompt you for a price and contact email. You can then publish the product to an industry-specific Group in the Town Hall."
      },
      {
        q: "How do I edit or remove a listing from the Marketplace?",
        a: "Go to your Dashboard. In the 'My Town Hall Listings' section, you can click the 'X' button to instantly remove a listing. Currently, editing requires removing and re-listing the product."
      },
      {
        q: "What are 'Town Hall' Groups?",
        a: "Instead of a chaotic open market, we use organized Trade Groups (e.g., 'Pharmaceutical Exchange', 'Textile Sourcing'). You can join existing groups or create your own when you list a product. This ensures your items are seen by relevant buyers."
      },
      {
        q: "Why was my listing hidden ('Unlisted')?",
        a: "To ensure the marketplace remains current, listings that haven't been updated in 90 days are automatically hidden. You can instantly restore them by clicking the 'Refresh Listing' button on the project card in your dashboard."
      }
    ]
  },
  {
    category: "✨ Rewards & Growth",
    items: [
        { q: "How does the referral program work?", a: "Every registered user gets a unique referral link from their dashboard. Share this link with your colleagues and network. When a new user signs up using your link, both of you will earn a 'Community Contributor' badge on your profiles." },
        { q: "Where can I find my referral link?", a: "Your unique link is always available in the 'Referral Program' section on your main dashboard. Simply click to copy it." },
        { q: "What are the rewards for referring?", a: "Currently, successful referrals award both parties a special badge. We are exploring additional rewards like feature credits for our top referrers in the future!" }
    ]
  }, // <-- COMMA WAS MISSING HERE
  {
    category: "💬 Communication & Notifications",
    items: [
      {
        q: "How do notifications work?",
        a: "We use an in-app system to avoid email spam. The 'Bell Icon' (🔔) in your navbar is your central hub. It will show a red badge for new chat messages, signature requests, and important system alerts. Always check the bell when you log in."
      },
      {
        q: "Is the internal chat secure?",
        a: "Yes. The chat creates a direct, private channel linked to a specific project ID. Messages are stored securely and are only accessible to the assigned Seller and Buyer."
      },
      {
        q: "How do I start a video inspection call?",
        a: "Clicking 'Live Vision' on a project card instantly opens a new Google Meet room. The link is saved to the project, ensuring both parties can join the same session for remote inspections or negotiations."
      }
    ]
  }
];

{/* --- REFERRAL PROGRAM SECTION --- */}
<div className="py-8">
  <h3 className="text-2xl font-bold text-gray-800 mb-4">Referral Program</h3>
  <div className="space-y-6">
    <div>
      <h4 className="font-semibold">How does the referral program work?</h4>
      <p className="mt-2 text-gray-600">
        Every registered user gets a unique referral link. Share this link with your colleagues and network. When a new user signs up using your link, both you and the new user will receive a "Community Contributor" badge as a thank you!
      </p>
    </div>
    <div>
      <h4 className="font-semibold">Where can I find my referral link?</h4>
      <p className="mt-2 text-gray-600">
        You can find your unique referral link in the "Referral Program" section on your main dashboard. Simply click to copy it.
      </p>
    </div>
    <div>
      <h4 className="font-semibold">What are the rewards for referring someone?</h4>
      <p className="mt-2 text-gray-600">
        Currently, successful referrals award both you and the person you referred a special "Community Contributor" badge on your profiles. We are exploring additional rewards for our top referrers in the future!
      </p>
    </div>
  </div>
</div>

{/* --- WEEKLY SUMMARY EMAIL SECTION --- */}
<div className="py-8 border-t">
  <h3 className="text-2xl font-bold text-gray-800 mb-4">Weekly Summary Email</h3>
  <div className="space-y-6">
    <div>
      <h4 className="font-semibold">What is the Weekly Summary Email?</h4>
      <p className="mt-2 text-gray-600">
        The Weekly Summary is an automated email sent to active users that recaps their activity on the QC Validator platform. It includes metrics like how many reports you've created, how many agreements have been signed, and new messages you've received.
      </p>
    </div>
    <div>
      <h4 className="font-semibold">Is the summary email a paid feature?</h4>
      <p className="mt-2 text-gray-600">
        No, the Weekly Summary Email is a free feature for all registered users to help you stay on top of your quality control workflow.
      </p>
    </div>
    <div>
      <h4 className="font-semibold">Can I unsubscribe from the Weekly Summary?</h4>
      <p className="mt-2 text-gray-600">
        Yes. Every summary email contains an "Unsubscribe" link at the bottom. Clicking it will remove you from the weekly mailing list. You can manage your notification preferences in your (future) account settings page.
      </p>
    </div>
  </div>
</div>


// --- SEO: AUTOMATED JSON-LD SCHEMA ---
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqCategories.flatMap(cat => 
    cat.items.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a
      }
    }))
  )
};

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleAccordion = (index: string) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const filteredCategories = faqCategories.map(cat => ({
    ...cat,
    items: cat.items.filter(item => 
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Inject Schema for Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HEADER HERO */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
             <Link href="/dashboard" className="flex items-center gap-2 group">
                <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold group-hover:scale-105 transition-transform">QC</div>
                <h1 className="text-xl font-bold text-gray-900">Validator <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded ml-1 border border-indigo-100">Knowledge Hub</span></h1>
            </Link>
            <div className="flex gap-4">
                <Link href="/marketplace" className="text-sm font-medium text-gray-600 hover:text-indigo-600">Town Hall</Link>
                <Link href="/dashboard" className="text-sm font-bold text-white bg-indigo-600 px-4 py-2 rounded hover:bg-indigo-700 transition-colors">
                    Go to Dashboard
                </Link>
            </div>
        </nav>
      </div>

      <div className="bg-indigo-900 text-white py-20 px-4 text-center relative overflow-hidden">
         {/* Background Decoration */}
         <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute right-10 top-10 w-64 h-64 bg-indigo-400 rounded-full blur-3xl"></div>
            <div className="absolute left-10 bottom-10 w-48 h-48 bg-purple-400 rounded-full blur-3xl"></div>
         </div>
         
         <div className="relative z-10 max-w-2xl mx-auto">
            <h1 className="text-5xl font-extrabold mb-6 tracking-tight">How can we help you?</h1>
            <p className="text-xl text-indigo-100 mb-10">Master the QC workflows, boost your productivity, and learn how to trade globally with confidence.</p>
            
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Ask a question (e.g. 'How to sign', 'Verification')..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-5 pl-14 rounded-xl border-2 border-transparent focus:border-indigo-400 text-gray-900 shadow-2xl outline-none transition-all"
                />
                <span className="absolute left-5 top-5 text-gray-400 text-xl">🔍</span>
            </div>
         </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="max-w-5xl mx-auto py-16 px-4 space-y-16">
        
        {/* --- 1. VISUAL MIND MAP --- */}
        {searchQuery === '' && (
            <section className="mb-20">
                <WorkflowMap />
            </section>
        )}

        {/* --- 2. FAQ ACCORDIONS --- */}
        {filteredCategories.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                <p className="text-2xl mb-2">🤔</p>
                <p className="text-gray-500">We couldn't find an answer for "{searchQuery}".</p>
                <button onClick={() => setSearchQuery('')} className="text-indigo-600 font-bold mt-2 hover:underline">Clear search</button>
            </div>
        )}

        {filteredCategories.map((cat, catIdx) => (
            <section key={catIdx} className="scroll-mt-24" id={`cat-${catIdx}`}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    {cat.category}
                </h2>
                <div className="space-y-4">
                    {cat.items.map((item, itemIdx) => {
                        const uniqueId = `${catIdx}-${itemIdx}`;
                        const isOpen = openIndex === uniqueId;
                        return (
                            <div key={itemIdx} className={`bg-white rounded-xl border transition-all duration-200 ${isOpen ? 'border-indigo-500 shadow-md ring-1 ring-indigo-100' : 'border-gray-200 shadow-sm hover:border-indigo-200'}`}>
                                <button 
                                    onClick={() => toggleAccordion(uniqueId)}
                                    className="w-full flex justify-between items-center p-5 text-left focus:outline-none"
                                    aria-expanded={isOpen}
                                >
                                    <span className={`font-bold text-lg ${isOpen ? 'text-indigo-700' : 'text-gray-800'}`}>
                                        {item.q}
                                    </span>
                                    <span className={`transform transition-transform duration-300 text-indigo-500 text-2xl font-light ${isOpen ? 'rotate-180' : ''}`}>
                                        {isOpen ? '−' : '+'}
                                    </span>
                                </button>
                                
                                <div 
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    <div className="p-5 pt-0 text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
                                        {item.a}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        ))}
        

        {/* FOOTER CTA */}
        <div className="mt-20 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-10 text-center text-white shadow-2xl">
            <h3 className="text-3xl font-bold mb-4">Need Enterprise Support?</h3>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                For custom integrations, API access, or white-label solutions, our engineering team is here to help you scale.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
                <a href="mailto:info@seosiri.com" className="bg-white text-gray-900 font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-colors">
                    Contact Sales
                </a>
                <Link href="/dashboard" className="bg-transparent border-2 border-white text-white font-bold py-3 px-8 rounded-full hover:bg-white/10 transition-colors">
                    Back to App
                </Link>
            </div>
        </div>
      </main>

      <footer className="bg-white border-t py-12 text-center text-gray-500 text-sm">
<p className="text-xs text-gray-400">
  © {new Date().getFullYear()} SEOSiri. All rights reserved.
</p>      </footer>
    </div>
  );
}
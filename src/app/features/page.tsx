// src/app/features/page.tsx
import Link from 'next/link';

export default function FeaturesPage() {
    return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">Enterprise Tier</h2>
          <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Built for Global Compliance & Teams
          </p>
          <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
            Unlock powerful features designed for professional organizations, global supply chains, and regulated industries.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Feature Card 1: Verification */}
          <div className="pt-6">
            <div className="flow-root bg-white rounded-lg px-6 pb-8 shadow-md">
              <div className="-mt-6">
                <div>
                  <span className="inline-flex items-center justify-center p-3 bg-green-500 rounded-md shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </span>
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Verified Organization Status</h3>
                <p className="mt-5 text-base text-gray-500">
                  Submit your official business documents to earn the "Verified Org" badge. This increases trust with partners and unlocks access to the Global Marketplace.
                </p>
              </div>
            </div>
          </div>

          {/* Feature Card 2: AI Translation */}
          <div className="pt-6">
            <div className="flow-root bg-white rounded-lg px-6 pb-8 shadow-md">
              <div className="-mt-6">
                 <div>
                  <span className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                     <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m4 10h.01M12 21a9 9 0 110-18 9 9 0 010 18zM7 9h8" /></svg>
                  </span>
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">AI-Powered Live Translation</h3>
                <p className="mt-5 text-base text-gray-500">
                  Integrate your OpenAI API key to enable real-time, AI-powered translation in the secure chat hub. Communicate seamlessly with international partners in English and Arabic.
                </p>
              </div>
            </div>
          </div>

          {/* Feature Card 3: Digital Agreements */}
          <div className="pt-6">
            <div className="flow-root bg-white rounded-lg px-6 pb-8 shadow-md">
              <div className="-mt-6">
                 <div>
                  <span className="inline-flex items-center justify-center p-3 bg-purple-500 rounded-md shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </span>
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Digital Agreements & PDF Contracts</h3>
                <p className="mt-5 text-base text-gray-500">
                  Once a project passes QC with a 100% score, our system unlocks a digital signature workflow. Both parties can sign, executing the agreement and generating a legally-formatted PDF contract.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 text-center">
            <Link href="/dashboard" className="text-base font-medium text-indigo-600 hover:text-indigo-500">
                ← Back to Dashboard
            </Link>
        </div>
      </div>
    </div>
  );
}
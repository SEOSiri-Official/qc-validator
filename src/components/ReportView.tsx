'use client';

import Link from 'next/link';
import RequestCustomReport from '@/components/RequestCustomReport';
import ReportActionButtons from '@/components/ReportActionButtons';

export default function ReportView({ report, currentUser }: { report: any, currentUser: any }) {
  if (!report) {
    return <div className="p-10 text-center">Report not found.</div>;
  }

  // Determine if the current viewer is the owner
  const isOwner = currentUser && currentUser.uid === report.uid;
  
  // Robust Score Calculation
  const score = report.score ?? 0;

  // --- FIXED: DATE FORMATTING (GMT) ---
  const formattedDate = report.createdAt 
    ? new Date(report.createdAt).toUTCString().replace('GMT', 'UTC') // e.g. "Tue, 17 Dec 2025 10:30:00 UTC"
    : 'Date Unavailable';

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* --- SMART ADMIN BAR --- */}
      {isOwner && (
          <div className="bg-yellow-100 border-b border-yellow-300 text-center py-2 px-4 sticky top-0 z-20">
              <p className="text-sm text-yellow-800 font-bold">
                  You are viewing your own public listing. 
                  <Link href={`/dashboard#${report.id}`} className="ml-2 underline hover:text-yellow-900">
                      Go to Dashboard to manage &rarr;
                  </Link>
              </p>
          </div>
      )}

      {/* --- NAVBAR --- */}
      <nav className="bg-white shadow-sm border-b px-6 h-16 flex justify-between items-center sticky top-0 z-10">
        <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">QC</div>
            <h1 className="text-xl font-bold text-gray-900">Validator <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded ml-1">Verified Report</span></h1>
        </Link>
        <Link href="/dashboard" className="text-sm font-bold text-white bg-indigo-600 px-4 py-2 rounded hover:bg-indigo-700 transition-colors">
            Go to Dashboard
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto py-10 px-4">
        {/* --- REPORT CARD --- */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
            
            {/* Header / Banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white">
                <h2 className="text-2xl font-bold">{report.title}</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-sm opacity-90 font-mono">
                    <span className="bg-white/20 px-2 py-1 rounded">🏢 {report.industry}</span>
                    <span className="bg-white/20 px-2 py-1 rounded">📜 {report.standard}</span>
                    {/* Fixed Date Display */}
                    <span className="bg-white/20 px-2 py-1 rounded">📅 {formattedDate}</span>
                </div>
            </div>
            
            <div className="p-6">
                {/* Status & Verified By */}
                <div className="flex justify-between items-start mb-6 border-b pb-6">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Verification Status</p>
                        <span className={`flex items-center gap-1 font-bold px-3 py-1 rounded-full border mt-2 w-fit ${score === 100 ? 'text-green-700 bg-green-50 border-green-200' : 'text-yellow-700 bg-yellow-50 border-yellow-200'}`}>
                            {score === 100 ? '✅ PASSED (100%)' : `⚠️ PENDING (${score}%)`}
                        </span>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Verified By</p>
                            <span className="font-medium text-indigo-600">{report.sellerEmail}</span>
                        </div>
                        {/* Action Buttons (Print/Share) */}
                        <ReportActionButtons report={report} />
                    </div>
                </div>

                {/* --- MARKETPLACE INFO (Price & Contact) --- */}
                {/* This section checks if listing data exists and displays it */}
                {report.listing && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Listing Price</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{report.listing.price}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Contact Seller</p>
                            <a href={`mailto:${report.listing.contact}`} className="block text-lg font-bold text-green-700 hover:underline mt-1 truncate">
                                ✉️ {report.listing.contact}
                            </a>
                        </div>
                    </div>
                )}
                
                {/* --- INSPECTION DETAILS (Images) --- */}
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>🔍</span> Inspection Details
                </h3>
                <div className="space-y-4">
                    {report.items && report.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-200 transition-colors">
                            <div className="flex-1">
                                <span className="text-[10px] font-bold bg-white border px-2 py-1 rounded text-gray-500 uppercase">{item.category}</span>
                                <p className="text-sm font-bold text-gray-800 mt-2">{item.requirement}</p>
                            </div>
                            
                            {/* Evidence Images */}
                            <div className="flex gap-4 flex-shrink-0">
                                {item.evidenceBefore && (
                                    <div className="text-center">
                                        <p className="text-[9px] text-gray-400 mb-1 uppercase">Before</p>
                                        <a href={item.evidenceBefore} target="_blank" rel="noopener noreferrer">
                                            <img src={item.evidenceBefore} className="w-24 h-16 object-cover rounded border bg-gray-200" alt="Before" />
                                        </a>
                                    </div>
                                )}
                                {item.evidenceAfter && (
                                    <div className="text-center">
                                        <p className="text-[9px] text-gray-400 mb-1 uppercase">After</p>
                                        <a href={item.evidenceAfter} target="_blank" rel="noopener noreferrer">
                                            <img src={item.evidenceAfter} className="w-24 h-16 object-cover rounded border bg-gray-200" alt="After" />
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* --- CUSTOM REPORT REQUEST --- */}
        <RequestCustomReport report={report} />

        {/* Footer */}
        <div className="text-center text-gray-500 text-xs mt-12 mb-8">
            <p>Verified on the <strong className="text-gray-700">QC Validator</strong> Distributed Ledger.</p>
            <a href="https://www.seosiri.com" className="text-indigo-600 hover:underline mt-2 inline-block">Powered by SEOSiri</a>
        </div>
      </main>
    </div>
  );
}
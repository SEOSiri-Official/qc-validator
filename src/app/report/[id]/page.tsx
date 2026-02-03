import { notFound } from 'next/navigation';
import { db } from '@/lib/firebase-admin'; 
import Link from 'next/link';
import RequestCustomReport from '@/components/RequestCustomReport';

export const dynamic = 'force-dynamic';

// --- SERVER-SIDE DATA FETCHING ---
async function getReportData(id: string) {
  try {
    const reportRef = db.collection('checklists').doc(id);
    const reportSnap = await reportRef.get();
    
    if (!reportSnap.exists) return null;
    
    const data = reportSnap.data();
    
    const toISO = (dateField: any) => {
        if (!dateField) return null;
        if (typeof dateField.toDate === 'function') return dateField.toDate().toISOString(); 
        if (dateField instanceof Date) return dateField.toISOString(); 
        if (typeof dateField === 'string') return dateField; 
        return null;
    };

    const reportData: any = { 
        id: reportSnap.id, 
        ...data,
        createdAt: toISO(data?.createdAt),
        meetingStartedAt: toISO(data?.meetingStartedAt),
        productionDate: data?.productionDate || null, 
        packagingType: data?.packagingType || null,
        qcStatusInternal: data?.qcStatusInternal || null,
        evidenceDetail: data?.evidenceDetail || null,
        messages: [] 
    };

    const listingsQuery = db.collection('market_listings').where('checklistId', '==', id).limit(1);
    const listingsSnap = await listingsQuery.get();
    
    if (!listingsSnap.empty) {
        const listingData = listingsSnap.docs[0].data();
        reportData.listing = {
            ...listingData,
            listedAt: toISO(listingData.listedAt),
            lastMaintainedAt: toISO(listingData.lastMaintainedAt)
        };
    }

    return reportData;
  } catch (error) {
    console.error("Failed to fetch report on server:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const report = await getReportData(id);
    if (!report) return { title: 'Report Not Found' };
    return {
        title: `${report.title} - Verified QC Report`,
        description: `View the quality control report for ${report.title}, compliant with ${report.standard}.`,
    };
}

// --- MAIN PAGE COMPONENT ---
export default async function PublicReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getReportData(id);

  if (!report) {
    notFound();
  }

  const score = report.score ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      
      {/* NAVBAR */}
      <nav className="bg-white shadow-sm border-b px-4 md:px-6 h-16 flex justify-between items-center sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">QC</div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 hidden md:block">Validator <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded ml-1">Verified Report</span></h1>
        </Link>
        <Link href="/dashboard" className="text-sm font-bold text-white bg-indigo-600 px-4 py-2 rounded hover:bg-indigo-700 transition-colors">
            Go to Dashboard
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto py-8 px-4 md:px-6">
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
            
            {/* HEADER */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                <h2 className="text-2xl md:text-3xl font-bold mb-3">{report.title}</h2>
                <div className="flex flex-wrap gap-2 text-sm opacity-90">
                    <span className="bg-white/20 px-2 py-1 rounded flex items-center gap-1">🏢 {report.industry}</span>
                    <span className="bg-white/20 px-2 py-1 rounded flex items-center gap-1">📜 {report.standard}</span>
                    <span>📅 {report.createdAt ? new Date(report.createdAt).toUTCString().slice(0, 16) : 'N/A'} (UTC)</span>
                </div>
            </div>
            
            <div className="p-6">
                {/* STATUS & VERIFIED BY */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b pb-6">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Verification Status</p>
                        <span className={`inline-flex items-center gap-2 font-bold px-4 py-2 rounded-full border ${score === 100 ? 'text-green-700 bg-green-50 border-green-200' : 'text-yellow-700 bg-yellow-50 border-yellow-200'}`}>
                            {score === 100 ? ( <><span className="text-lg">✅</span> PASSED (100%)</> ) : ( <><span className="text-lg">⚠️</span> PENDING ({score}%)</> )}
                        </span>
                    </div>
                    <div className="md:text-right">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Verified By</p>
                        <Link href={`/profile/${report.uid}`} className="font-medium text-indigo-600 hover:underline flex items-center gap-1 md:justify-end">
                             {report.sellerEmail} ↗
                        </Link>
                    </div>
                </div>

                {/* --- LOGISTICS DATA DISPLAY --- */}
                {(report.packagingType || report.qcStatusInternal) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5 mb-8">
                        <h4 className="text-sm font-bold text-yellow-800 uppercase mb-3 flex items-center gap-2">
                            📦 Logistics & Traceability Data
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="block text-gray-500 text-xs">Final QC Status</span>
                                <span className="font-semibold text-gray-900">{report.qcStatusInternal || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 text-xs">Packaging</span>
                                <span className="font-semibold text-gray-900">{report.packagingType || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 text-xs">Production Date</span>
                                <span className="font-semibold text-gray-900">{report.productionDate || 'N/A'}</span>
                            </div>
                             <div className="col-span-2 md:col-span-1">
                                <span className="block text-gray-500 text-xs">Evidence Notes</span>
                                <span className="font-semibold text-gray-900 italic truncate" title={report.evidenceDetail}>{report.evidenceDetail || 'None'}</span>
                            </div>
                        </div>
                    </div>
                )}


                {/* COMMERCIAL INFO */}
                {report.listing && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Listing Price</p>
                            <p className="text-3xl font-extrabold text-gray-900">{report.listing.price}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Contact Seller</p>
                            <a href={`mailto:${report.listing.contact}`} className="text-lg font-bold text-green-700 hover:underline flex items-center gap-2">
                                ✉️ {report.listing.contact}
                            </a>
                        </div>
                    </div>
                )}
                
                {/* CHECKLIST ITEMS */}
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 mb-4">
                    🔍 Inspection Details
                </h3>
                <div className="space-y-4">
                    {report.items.map((item: any, idx: number) => (
                        <div key={idx} className="bg-white border rounded-lg p-4 hover:border-indigo-200 transition-colors">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-600 mb-2 border">
                                        {item.category}
                                    </span>
                                    <p className="font-semibold text-gray-900">{item.requirement}</p>
                                </div>
                                <div className="flex gap-4 mt-2 md:mt-0">
                                    {item.evidenceBefore && (
                                        <div className="text-center">
                                            <span className="text-[9px] text-gray-400 uppercase block mb-1">Before</span>
                                            <img src={item.evidenceBefore} className="w-24 h-16 object-cover rounded border bg-gray-50" alt="Before" />
                                        </div>
                                    )}
                                    {item.evidenceAfter && (
                                        <div className="text-center">
                                            <span className="text-[9px] text-gray-400 uppercase block mb-1">After</span>
                                            <img src={item.evidenceAfter} className="w-24 h-16 object-cover rounded border bg-gray-50" alt="After" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <RequestCustomReport report={report} />

        <div className="text-center text-gray-400 text-xs mt-12 mb-8">
            <p className="mb-2">Verified on the <strong>QC Validator</strong> Distributed Ledger.</p>
            <a href="https://www.seosiri.com" className="text-indigo-500 hover:text-indigo-600 hover:underline transition-colors">
                Powered by SEOSiri
            </a>
        </div>
      </main>
    </div>
  );
}
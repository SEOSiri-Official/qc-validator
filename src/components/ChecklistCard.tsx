'use client';
import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'; 
import { db } from '@/lib/firebase';

export default function ChecklistCard({ list, user, openCommunicationHub }: any) {
  const [signingLoading, setSigningLoading] = useState(false);

  const generatePDF = () => {
    const doc = new jsPDF();
    const reportUrl = `${window.location.origin}/report/${list.id}`;
    doc.setFontSize(22); doc.text("QC COMPLIANCE AGREEMENT", 20, 20);
    doc.setFontSize(12); doc.text(`Project: ${list.title}`, 20, 40);
    doc.text(`Score: ${list.score}%`, 20, 50);
    doc.setTextColor(0, 0, 255);
    doc.textWithLink("VIEW DIGITAL VERIFICATION", 20, 70, { url: reportUrl });
    doc.save(`${list.title}_Contract.pdf`);
  };

  const handleSign = async (signer: 'A' | 'B') => {
    setSigningLoading(true);
    setTimeout(async () => {
        let newStatus = signer === 'A' ? 'party_a_signed' : 'completed';
        if (newStatus === 'completed') generatePDF();
        
        // --- CRITICAL FIX: Send all existing data to satisfy isChecklistDataValid ---
        const updatePayload: any = {
            // Spreads all existing data fields (title, score, items, etc.)
            ...list,
            agreementStatus: newStatus,
            
            // Explicitly ensure new optional fields are included as null or their current value
            productionDate: list.productionDate || null, 
            packagingType: list.packagingType || null, 
            qcStatusInternal: list.qcStatusInternal || null,
            evidenceDetail: list.evidenceDetail || null,
        };
        
        // Clean up fields that cause issues when written back (like the ID and complex message objects)
        delete updatePayload.id; 
        delete updatePayload.messages;
        
        // Ensure Timestamps (if present) are handled by the rule, or explicitly excluded/converted
        // To be safe, we rely on the security rule allowing Timestamps in the payload.

        await updateDoc(doc(db, "checklists", list.id), updatePayload);
        // --- END CRITICAL FIX ---

        setSigningLoading(false);
    }, 1500); 
  };

  const handlePublish = async () => {
    const price = prompt("Price?"); if (!price) return;
    await addDoc(collection(db, "market_listings"), { 
        title: list.title, price, sellerId: user.uid, verifiedAt: serverTimestamp() 
    });
    alert("Listed!");
  };

  const getMarketSuggestions = (std: string, type: string) => {
    if (type === 'software') return ['App Store', 'Google Play'];
    if (std === 'HACCP') return ['Whole Foods', 'Sysco'];
    return ['Amazon', 'Etsy', 'Local'];
  };


  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
      <div className="p-5 flex justify-between items-center bg-gray-50 border-b border-gray-100">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">{list.title}</h3>
          <div className="flex gap-2 mt-1">
            <span className="text-[10px] uppercase font-bold bg-white border px-2 py-0.5 rounded text-gray-500">{list.type}</span>
            <span className="text-[10px] uppercase font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">{list.standard}</span>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-lg text-center ${list.score === 100 ? 'bg-green-100 text-green-800' : 'bg-yellow-50 text-yellow-700'}`}>
          <span className="block text-2xl font-bold leading-none">{list.score}%</span>
        </div>
      </div>

      {list.score === 100 ? (
        <div className="p-6 bg-blue-50 border-t border-blue-100">
          <div className="mb-4">
            <h4 className="text-indigo-900 font-bold text-sm mb-3">
  Workflow: {(list.agreementStatus || 'pending').toUpperCase()}
</h4>
            <div className="flex gap-3 flex-wrap">
                {user.email === list.sellerEmail && (!list.agreementStatus || list.agreementStatus === 'ready_to_sign') && (
                    <button onClick={() => handleSign('A')} disabled={signingLoading} className="bg-indigo-600 text-white px-4 py-2 rounded text-xs font-bold">Sign as Seller</button>
                )}
                {user.email === list.buyerEmail && list.agreementStatus === 'party_a_signed' && (
                    <button onClick={() => handleSign('B')} disabled={signingLoading} className="bg-green-600 text-white px-4 py-2 rounded text-xs font-bold">Sign as Buyer</button>
                )}
                {list.agreementStatus === 'completed' && (
                    <button onClick={generatePDF} className="bg-gray-800 text-white px-4 py-2 rounded text-xs font-bold">Download PDF</button>
                )}
                <div className="ml-auto flex gap-2">
                    <button onClick={() => openCommunicationHub(list, 'teams')} className="w-8 h-8 bg-white border rounded">T</button>
                    <button onClick={() => openCommunicationHub(list, 'meet')} className="w-8 h-8 bg-white border rounded">📹</button>
                </div>
            </div>
          </div>

{/* ------------------------------------------------------------- */}
          {/* NEW FEATURE: LOGISTICS AND TRACEABILITY INPUT FORM */}
          {/* ------------------------------------------------------------- */}
          <div className="mt-6">
              <section className="p-6 border rounded-lg bg-yellow-50">
                  <h3 className="text-lg font-bold text-gray-800">Logistics and Final Evidence Data</h3>
                  <p className="text-sm text-gray-600 mb-4">Required fields for supply chain compliance and tracking.</p>

                  {/* 1. Final QC Status */}
                  <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">Final QC Assessment</label>
                      <select 
                          // NOTE: Needs integration with useState and updateDoc function
                          name="qcStatusInternal"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                          // value={checklist.qcStatusInternal}
                      >
                          <option value="APPROVED">APPROVED (Ready for shipment)</option>
                          <option value="CONDITIONAL">CONDITIONAL (Requires minor rework)</option>
                          <option value="REJECTED">REJECTED (Failures identified)</option>
                      </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      {/* 2. Production Date */}
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Production/Assembly Date</label>
                          <input 
                              type="date" 
                              name="productionDate"
                              // Bind value here
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                          />
                      </div>

                      {/* 3. Packaging Type */}
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Primary Packaging Type</label>
                          <select 
                              name="packagingType"
                              // Bind value here
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                          >
                              <option value="CARTON">Standard Carton/Box</option>
                              <option value="PALLET">Palletized (Shrink-wrapped)</option>
                              <option value="CRATE">Crated (Wooden/Metal)</option>
                              <option value="TAMPER_EVIDENT">Tamper-Evident Security Packaging</option>
                              <option value="OTHER">Other / Bulk</option>
                          </select>
                      </div>
                  </div>
                  
                  {/* 4. Detailed Evidence Notes */}
                  <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Detailed Evidence Notes (e.g., Seal integrity, Labeling)</label>
                      <textarea 
                          name="evidenceDetail"
                          rows={3}
                          placeholder="Document critical physical evidence and packaging status here."
                          // Bind value here
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      />
                  </div>
                  {/* NOTE: Add a "Save Logistics Data" button here when implementing state */}
              </section>
          </div>
{/* --- NEW: ENHANCED TRACEABILITY DATA DISPLAY (Uses Kept Data) --- */}
          {/* We only show this if the score is 100% AND key logistics data exists */}
          {list.score === 100 && (list.packagingType || list.qcStatusInternal) && (
            <div className="mt-4 p-4 border-t border-blue-200 bg-white rounded-lg shadow-inner">
              <h5 className="text-xs font-bold text-gray-700 uppercase mb-2">Traceability Snapshot</h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500 text-xs block">Internal QC</span>
                  <span className="font-semibold text-green-700">{list.qcStatusInternal || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-xs block">Packaging</span>
                  <span className="font-semibold">{list.packagingType || 'N/A'}</span>
                </div>
                {list.productionDate && (
                  <div>
                    <span className="text-gray-500 text-xs block">Prod. Date</span>
                    {/* Note: This assumes date is saved as YYYY-MM-DD string */}
                    <span className="font-semibold">{list.productionDate}</span>
                  </div>
                )}
                {list.evidenceDetail && (
                  <div title={list.evidenceDetail}>
                    <span className="text-gray-500 text-xs block">Evidence Notes</span>
                    <span className="font-semibold truncate">{list.evidenceDetail}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* --- END ENHANCED TRACEABILITY --- */}

          <div className="flex justify-between items-start mt-4">
            <div className="flex gap-2">
                {getMarketSuggestions(list.standard, list.type).map((m:string) => (
                    <span key={m} className="text-[10px] bg-white border px-2 py-1 rounded text-gray-600">{m}</span>
                ))}
            </div>
            {user.email === list.sellerEmail && (
                <button onClick={handlePublish} className="text-xs text-green-700 underline font-bold">Push to Market</button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-white">
          <p className="text-xs text-red-500 font-medium">⚠️ Action Required: Improve score to 100%.</p>
          {/* Display the QC_FAILURE flow for failed projects */}
        </div>
      )}
    </div>
  );
}
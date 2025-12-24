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
        await updateDoc(doc(db, "checklists", list.id), { agreementStatus: newStatus });
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
            <h4 className="text-indigo-900 font-bold text-sm mb-3">Workflow: {list.agreementStatus || 'READY'}</h4>
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
        </div>
      )}
    </div>
  );
}
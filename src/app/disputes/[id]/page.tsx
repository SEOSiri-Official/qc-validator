'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Link from 'next/link';

export default function DisputePage({ params }: { params: { id: string } }) {
  const [dispute, setDispute] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [offerInput, setOfferInput] = useState('');

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    const unsubDispute = onSnapshot(doc(db, 'disputes', params.id), (doc) => {
      setDispute({ id: doc.id, ...doc.data() });
      setLoading(false);
    });
    return () => { unsubAuth(); unsubDispute(); };
  }, [params.id]);

  const sendDisputeMessage = async () => {
    if (!chatInput.trim() || !user) return;
    const message = { senderId: user.uid, senderEmail: user.email, text: chatInput, timestamp: Date.now() };
    await updateDoc(doc(db, 'disputes', params.id), { messages: arrayUnion(message) });
    setChatInput('');
  };
  
  const submitSellerOffer = async () => {
    if (!offerInput.trim()) return;
    await updateDoc(doc(db, 'disputes', params.id), { 
        sellerOffer: offerInput,
        status: 'SELLER_RESPONDED'
    });
  };

  const handleResolution = async (accepted: boolean) => {
      const finalResolution = accepted ? `Offer Accepted: ${dispute.sellerOffer}` : 'Offer Rejected. Escalated to Arbitrator.';
      await updateDoc(doc(db, 'disputes', params.id), {
          resolution: finalResolution,
          status: accepted ? 'CLOSED' : 'ESCALATED'
      });
  };

  if (loading || !user) return <div className="text-center p-10">Loading Dispute...</div>;
  if (!dispute) return <div className="text-center p-10">Dispute not found.</div>;

  const isSeller = user.uid === dispute.sellerId;
  const isBuyer = user.uid === dispute.buyerId;

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 p-8">
      
      {/* --- LEFT: CASE FILE --- */}
      <div className="lg:col-span-3 space-y-6">
        <h1 className="text-2xl font-bold">Dispute Case File</h1>
        <div>
          <h2 className="font-bold text-sm uppercase text-gray-500">Project Details</h2>
          <Link href={`/report/${dispute.checklistId}`} className="text-indigo-600 hover:underline">{dispute.checklistId}</Link>
        </div>
        <div>
            <h2 className="font-bold text-sm uppercase text-gray-500">Timeline</h2>
            <ul className="text-xs text-gray-600 mt-2 space-y-1">
                <li><strong>Created:</strong> {new Date(dispute.createdAt?.seconds * 1000).toLocaleString()}</li>
                {dispute.status === 'SELLER_RESPONDED' && <li><strong>Seller Responded</strong></li>}
                {dispute.status === 'CLOSED' && <li><strong>Closed</strong></li>}
            </ul>
        </div>
        <div>
            <h2 className="font-bold text-sm uppercase text-gray-500">Buyer's Initial Claim</h2>
            <p className="text-sm bg-gray-50 p-2 border rounded mt-1">{dispute.reason}</p>
        </div>
        <div>
            <h2 className="font-bold text-sm uppercase text-gray-500">Buyer's Evidence</h2>
            <div className="flex gap-2 mt-2">
                {dispute.buyerEvidence?.map((ev: any) => <a href={ev.url} target="_blank" key={ev.url}><img src={ev.url} className="w-16 h-16 object-cover rounded border" /></a>)}
            </div>
        </div>
      </div>

      {/* --- CENTER: COMMUNICATION LOG --- */}
      <div className="lg:col-span-6 border-l border-r px-6">
          <h2 className="text-xl font-bold mb-4">Private Communication Log</h2>
          <div className="h-96 overflow-y-auto bg-gray-50 p-4 border rounded space-y-4">
              {dispute.messages?.map((msg: any, idx: number) => (
                  <div key={idx} className={`flex ${msg.senderId === user.uid ? 'justify-end' : ''}`}>
                      <div className={`p-3 rounded-lg max-w-sm ${msg.senderId === user.uid ? 'bg-blue-600 text-white' : 'bg-white'}`}>
                          <p className="font-bold text-xs">{msg.senderEmail.split('@')[0]}</p>
                          <p className="text-sm">{msg.text}</p>
                      </div>
                  </div>
              ))}
          </div>
          <div className="mt-4 flex gap-2">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} className="flex-1 p-2 border rounded" placeholder="Type a message..."/>
              <button onClick={sendDisputeMessage} className="bg-blue-600 text-white font-bold px-4 rounded">Send</button>
          </div>
      </div>

      {/* --- RIGHT: ACTIONS & RESOLUTION --- */}
      <div className="lg:col-span-3 space-y-6">
          <h2 className="text-xl font-bold">Resolution Panel</h2>
          
          {/* Status Display */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
              <p className="text-sm font-bold text-yellow-800">Current Status</p>
              <p className="font-bold text-lg text-yellow-900">{dispute.status.replace(/_/g, ' ')}</p>
          </div>

          {/* Seller Action Panel */}
          {isSeller && dispute.status === 'INITIATED' && (
              <div>
                  <h3 className="font-bold">Propose a Resolution</h3>
                  <textarea value={offerInput} onChange={e => setOfferInput(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="e.g., Offer a 20% refund, Offer to replace the damaged items..."></textarea>
                  <button onClick={submitSellerOffer} className="w-full bg-indigo-600 text-white font-bold py-2 rounded mt-2">Submit Offer</button>
              </div>
          )}

          {/* Buyer Action Panel */}
          {isBuyer && dispute.status === 'SELLER_RESPONDED' && (
              <div className="bg-green-50 border border-green-200 p-4 rounded">
                  <h3 className="font-bold text-green-800">Seller's Offer</h3>
                  <p className="text-sm mt-1">{dispute.sellerOffer}</p>
                  <div className="flex gap-4 mt-4">
                      <button onClick={() => handleResolution(true)} className="flex-1 bg-green-600 text-white font-bold py-2 rounded">Accept Offer</button>
                      <button onClick={() => handleResolution(false)} className="flex-1 bg-gray-600 text-white font-bold py-2 rounded">Reject & Escalate</button>
                  </div>
              </div>
          )}

          {/* Final Resolution Display */}
          {dispute.status === 'CLOSED' || dispute.status === 'ESCALATED' && (
              <div className="bg-gray-100 p-4 rounded">
                  <h3 className="font-bold">Final Resolution</h3>
                  <p className="text-sm mt-1">{dispute.resolution}</p>
              </div>
          )}
      </div>
    </div>
  );
}
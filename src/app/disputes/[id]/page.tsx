'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion,addDoc, collection, serverTimestamp} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Link from 'next/link';
import { useParams } from 'next/navigation'; // <-- Import useParams
import { uploadDisputeEvidence } from '@/lib/storage';

export default function DisputePage() {
  const params = useParams(); // <-- Use the hook
  const disputeId = params.id as string; // Safely get ID

  const [dispute, setDispute] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [offerInput, setOfferInput] = useState('');

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    
    if (!disputeId) return; // Wait for ID
    
    const unsubDispute = onSnapshot(doc(db, 'disputes', disputeId), (doc) => {
      if (doc.exists()) {
          setDispute({ id: doc.id, ...doc.data() });
      }
      setLoading(false);
    });
    return () => { unsubAuth(); unsubDispute(); };
  }, [disputeId]);

 const sendDisputeMessage = async () => {
    if (!chatInput.trim() || !user || !dispute) return;

    const message = { 
        senderId: user.uid, 
        senderEmail: user.email, 
        text: chatInput, 
        timestamp: Date.now() 
    };

    const disputeRef = doc(db, 'disputes', dispute.id);

    try {
        // 1. Update the document with the new message
        await updateDoc(disputeRef, { messages: arrayUnion(message) });

        // --- 2. CREATE THE NOTIFICATION (Client-Side) ---
        // Determine who the *other* person is
        const recipientId = user.uid === dispute.sellerId ? dispute.buyerId : dispute.sellerId;
        const senderName = user.email?.split('@')[0];

        if (recipientId) {
            await addDoc(collection(db, "notifications"), {
                recipientId: recipientId,
                title: `⚠️ New Message in Dispute`,
                message: `${senderName}: "${chatInput.substring(0, 30)}..."`,
                link: `/disputes/${dispute.id}`, // Link directly to the dispute
                isRead: false,
                createdAt: serverTimestamp()
            });
        }

        setChatInput(''); // Clear the input on success
    } catch (error) {
        console.error("Error sending dispute message:", error);
        alert("Failed to send message. Please check your connection or permissions.");
    }
  };
  
  const submitSellerOffer = async () => {
    if (!offerInput.trim() || !disputeId) return;
    await updateDoc(doc(db, 'disputes', disputeId), { 
        sellerOffer: offerInput,
        status: 'SELLER_RESPONDED'
    });
  };

// --- ADD THIS FUNCTION ---
  const handleEvidenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !disputeId) return;

    const downloadURL = await uploadDisputeEvidence(file, disputeId, user.uid);
    if (!downloadURL) {
      alert("Failed to upload evidence.");
      return;
    }

    // Add the URL to the dispute document in a new 'evidence' field
    const newEvidence = { url: downloadURL, uploadedBy: user.uid };
    const disputeRef = doc(db, 'disputes', disputeId);
    await updateDoc(disputeRef, {
      evidence: arrayUnion(newEvidence)
    });
  };

  const handleResolution = async (accepted: boolean) => {
      if (!disputeId) return;
      const finalResolution = accepted ? `Offer Accepted: ${dispute.sellerOffer}` : 'Offer Rejected. Escalated to Arbitrator.';
      await updateDoc(doc(db, 'disputes', disputeId), {
          resolution: finalResolution,
          status: accepted ? 'CLOSED' : 'ESCALATED'
      });
  };

  if (loading) return <div className="text-center p-10">Loading Dispute...</div>;
  if (!user) return <div className="text-center p-10">Please log in to view this dispute.</div>;
  if (!dispute) return <div className="text-center p-10">Dispute not found.</div>;

  const isSeller = user.uid === dispute.sellerId;
  const isBuyer = user.uid === dispute.buyerId;

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 p-8 min-h-screen bg-white">
      
      {/* --- COLUMN 1: LEFT - CASE FILE --- */}
      <div className="lg:col-span-3 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dispute Case File</h1>
        <div>
          <h2 className="font-bold text-sm uppercase text-gray-500">Project Details</h2>
          <Link href={`/report/${dispute.checklistId}`} className="text-indigo-600 hover:underline text-sm break-all">{dispute.checklistId}</Link>
        </div>
        <div>
            <h2 className="font-bold text-sm uppercase text-gray-500">Timeline</h2>
            <ul className="text-xs text-gray-600 mt-2 space-y-1">
                <li><strong>Created:</strong> {dispute.createdAt?.seconds ? new Date(dispute.createdAt.seconds * 1000).toLocaleString() : 'Just now'}</li>
                {dispute.status === 'SELLER_RESPONDED' && <li><strong>Seller Responded</strong></li>}
                {dispute.status === 'CLOSED' && <li><strong>Closed</strong></li>}
            </ul>
        </div>
        <div>
            <h2 className="font-bold text-sm uppercase text-gray-500">Buyer's Initial Claim</h2>
            <p className="text-sm bg-gray-50 p-3 border rounded mt-1 text-gray-700">{dispute.reason}</p>
        </div>
        {/* --- Using the new "Shared Evidence" field --- */}
        {dispute.evidence && dispute.evidence.length > 0 && (
            <div>
                <h2 className="font-bold text-sm uppercase text-gray-500">Shared Evidence</h2>
                <div className="flex gap-2 mt-2 flex-wrap">
                    {dispute.evidence.map((ev: any, idx: number) => (
                        <a href={ev.url} target="_blank" key={idx} rel="noopener noreferrer">
                            <img src={ev.url} className="w-16 h-16 object-cover rounded border hover:opacity-80 transition-opacity" alt={`Evidence ${idx + 1}`} />
                        </a>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* --- COLUMN 2: CENTER - COMMUNICATION LOG --- */}
      <div className="lg:col-span-6 border-l border-r px-6 flex flex-col h-[80vh]">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Private Communication Log</h2>
          {/* Message Display Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4 border rounded-xl space-y-4 mb-4">
              {dispute.messages?.map((msg: any, idx: number) => (
                  <div key={idx} className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-3 rounded-lg max-w-sm text-sm shadow-sm ${msg.senderId === user.uid ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 border border-gray-200'}`}>
                          <p className={`font-bold text-[10px] mb-1 ${msg.senderId === user.uid ? 'text-indigo-200' : 'text-gray-500'}`}>{msg.senderEmail?.split('@')[0]}</p>
                          <p>{msg.text}</p>
                      </div>
                  </div>
              ))}
              {(!dispute.messages || dispute.messages.length === 0) && <p className="text-center text-gray-400 text-sm mt-10">No messages yet. Start the discussion.</p>}
          </div>
          {/* SINGLE, UNIFIED CHAT INPUT */}
          <div className="flex gap-2 items-center">
              <label className="cursor-pointer p-3 border rounded-lg text-gray-500 hover:bg-gray-100">
                  <span>📎</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleEvidenceUpload} />
              </label>
              <input 
                  value={chatInput} 
                  onChange={e => setChatInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && sendDisputeMessage()}
                  className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                  placeholder="Type a message to resolve this..."
              />
              <button onClick={sendDisputeMessage} disabled={!chatInput.trim()} className="bg-indigo-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">Send</button>
          </div>
      </div>

      {/* --- COLUMN 3: RIGHT - ACTIONS & RESOLUTION --- */}
      <div className="lg:col-span-3 space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Resolution Panel</h2>
          
          <div className={`p-4 rounded-lg border ${dispute.status === 'CLOSED' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <p className={`text-sm font-bold uppercase ${dispute.status === 'CLOSED' ? 'text-green-800' : 'text-yellow-800'}`}>Current Status</p>
              <p className={`font-bold text-lg ${dispute.status === 'CLOSED' ? 'text-green-900' : 'text-yellow-900'}`}>{dispute.status?.replace(/_/g, ' ')}</p>
          </div>

          {isSeller && dispute.status === 'INITIATED' && (
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-2">Propose a Resolution</h3>
                  <textarea 
                      value={offerInput} 
                      onChange={e => setOfferInput(e.target.value)} 
                      className="w-full p-2 border rounded-md text-sm mb-2 h-24 focus:ring-2 focus:ring-indigo-500 outline-none" 
                      placeholder="e.g., I offer a 20% refund or replacement of damaged goods..."
                  ></textarea>
                  <button onClick={submitSellerOffer} disabled={!offerInput.trim()} className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">Submit Offer</button>
              </div>
          )}

          {isBuyer && dispute.status === 'SELLER_RESPONDED' && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h3 className="font-bold text-green-800 mb-2">Seller's Offer</h3>
                  <p className="text-sm text-green-900 bg-white p-3 rounded border border-green-100 mb-4">{dispute.sellerOffer}</p>
                  <div className="flex flex-col gap-2">
                      <button onClick={() => handleResolution(true)} className="w-full bg-green-600 text-white font-bold py-2 rounded-lg hover:bg-green-700 transition-colors">Accept Offer</button>
                      <button onClick={() => handleResolution(false)} className="w-full bg-gray-600 text-white font-bold py-2 rounded-lg hover:bg-gray-700 transition-colors">Reject & Escalate</button>
                  </div>
              </div>
          )}

          {(dispute.status === 'CLOSED' || dispute.status === 'ESCALATED') && (
              <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-bold text-gray-700">Final Resolution</h3>
                  <p className="text-sm mt-2 text-gray-600">{dispute.resolution}</p>
              </div>
          )}
      </div>
    </div>
  );
  }
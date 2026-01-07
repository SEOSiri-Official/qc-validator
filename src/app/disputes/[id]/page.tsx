'use client';

import { useEffect, useState, useRef } from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion,addDoc, collection, serverTimestamp} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Link from 'next/link';
import { useParams } from 'next/navigation'; // <-- Import useParams

export default function DisputePage() {
  const params = useParams(); // <-- Use the hook
  const disputeId = params.id as string; // Safely get ID

  const [dispute, setDispute] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [offerInput, setOfferInput] = useState('');

  // --- NEW STATES FOR ADVANCED CHAT ---
  const [otherPartyOnline, setOtherPartyOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherPartyTyping, setOtherPartyTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- NEW: EFFECT for Real-Time Presence & Typing ---
  useEffect(() => {
    if (!user || !dispute) return;

    // Identify the *other* user in the dispute
    const otherPartyId = user.uid === dispute.sellerId ? dispute.buyerId : dispute.sellerId;
    if (!otherPartyId) return;
    
    // Listen for changes on the other user's profile
    const unsubOtherParty = onSnapshot(doc(db, 'users', otherPartyId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setOtherPartyOnline(isUserOnline(data.lastSeen));
        setLastSeen(data.lastSeen);
        
        // Check if the other party is typing in *this* dispute
        if (data.typingInDispute === dispute.id) {
          setOtherPartyTyping(true);
        } else {
          setOtherPartyTyping(false);
        }
      }
    });

    return () => unsubOtherParty();
  }, [user, dispute]);

  // --- NEW: EFFECT for Auto-Scrolling ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dispute?.messages, otherPartyTyping]);

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

const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
    const userRef = doc(db, 'users', user!.uid);
    // Let the other user know you're typing in this specific dispute
    updateDoc(userRef, { typingInDispute: dispute.id });
    setIsTyping(true);
    
    // Set a timeout to clear the typing status
    setTimeout(() => {
      updateDoc(userRef, { typingInDispute: null });
      setIsTyping(false);
    }, 3000); // Clear after 3 seconds of inactivity
  };

  const sendDisputeMessage = async () => {
    if (!chatInput.trim() || !user || !dispute || isSending) return;
    setIsSending(true);

    const message = { 
        senderId: user.uid, 
        senderEmail: user.email, 
        text: chatInput, 
        timestamp: Date.now()
    };

    const disputeRef = doc(db, 'disputes', dispute.id);
    const userRef = doc(db, 'users', user.uid);

    try {
        await updateDoc(disputeRef, { messages: arrayUnion(message) });
        // Clear typing status and update lastSeen
        await updateDoc(userRef, { lastSeen: serverTimestamp(), typingInDispute: null });


        // --- STEP 3: Create the notification ---
        const recipientId = user.uid === dispute.sellerId ? dispute.buyerId : dispute.sellerId;
        if (recipientId) {
            await addDoc(collection(db, "notifications"), {
                recipientId: recipientId,
                title: `⚠️ New Message in Dispute`,
                message: `${user.email?.split('@')[0]}: "${chatInput.substring(0, 30)}..."`,
                link: `/disputes/${dispute.id}`,
                isRead: false,
                createdAt: serverTimestamp()
            });
        }

      setChatInput('');
        setIsTyping(false);
    } catch (error) {
        console.error("Error sending message:", error);
    } finally {
        setIsSending(false);
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
    if (!file || !user || !dispute) return;

    if (file.size > 102400) { // 100KB limit
      alert("File is too large. Max 100KB.");
      return;
    }

    // Convert the image to a Base64 string
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      
      try {
        // Create a new message object that INCLUDES the image data
        const message = { 
            senderId: user.uid, 
            senderEmail: user.email, 
            text: `Attached Evidence:`,
            imageUrl: base64String, // <-- SAVE THE BASE64 STRING DIRECTLY
            timestamp: Date.now() 
        };

        // Update the 'messages' array in the dispute document
        const disputeRef = doc(db, 'disputes', dispute.id);
        await updateDoc(disputeRef, { messages: arrayUnion(message) });

      } catch (error) {
        console.error("Error saving evidence to Firestore:", error);
        alert("Failed to attach evidence.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResolution = async (accepted: boolean) => {
      if (!disputeId) return;
      const finalResolution = accepted ? `Offer Accepted: ${dispute.sellerOffer}` : 'Offer Rejected. Escalated to Arbitrator.';
      await updateDoc(doc(db, 'disputes', disputeId), {
          resolution: finalResolution,
          status: accepted ? 'CLOSED' : 'ESCALATED'
      });
  };
  // --- HELPER FUNCTION for Presence Indicator ---
  const isUserOnline = (lastSeen: any): boolean => {
    if (!lastSeen) return false;
    const lastSeenTime = lastSeen.seconds ? lastSeen.seconds * 1000 : new Date(lastSeen).getTime();
    return (Date.now() - lastSeenTime) < 300000; // 5 minutes
  };

  if (loading) return <div className="text-center p-10">Loading Dispute...</div>;
  if (!user) return <div className="text-center p-10">Please log in to view this dispute.</div>;
  if (!dispute) return <div className="text-center p-10">Dispute not found.</div>;

  const isSeller = user.uid === dispute.sellerId;
  const isBuyer = user.uid === dispute.buyerId;

  // --- HELPER FUNCTION for Presence Indicator ---
 const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastSeen = (timestamp: any) => {
    if (!timestamp) return 'a while ago';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    // Add more complex date formatting logic here if needed (e.g., using date-fns)
    return date.toLocaleDateString();
  };

  const getStatusIcon = (status: string) => {
    // Logic for read receipts (future feature)
    return '✓';
  };

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
  {/* Header with Online Status */}
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-bold text-gray-900">Private Communication Log</h2>
    <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
      <span className={`w-2 h-2 rounded-full ${otherPartyOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
      <span className="text-sm font-medium text-gray-700">
        {otherPartyOnline ? 'Online' : `Last seen ${formatLastSeen(lastSeen)}`}
      </span>
    </div>
  </div>

  {/* Message Display Area */}
  <div className="flex-1 overflow-y-auto bg-gray-50 p-4 border rounded-xl space-y-4 mb-4">
    {dispute.messages?.map((msg: any, idx: number) => {
      const isOwnMessage = msg.senderId === user.uid;
      
      return (
        <div key={`${idx}-${msg.timestamp}`} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
          <div className="max-w-sm flex flex-col">
            {/* Show sender details ONLY for messages from OTHERS */}
            {!isOwnMessage && (
              <div className="flex items-center gap-2 mb-1 px-2">
                <span className={`w-2 h-2 rounded-full ${isUserOnline(msg.lastSeen) ? 'bg-indigo-500 animate-pulse' : 'bg-gray-400'}`}></span>
                <p className="font-bold text-[10px] text-gray-700">{msg.senderEmail?.split('@')[0]}</p>
              </div>
            )}

            {/* Message Bubble */}
            <div className={`p-3 rounded-lg text-sm shadow-sm ${
              isOwnMessage 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-white border rounded-bl-none'
            }`}>
              {/* Message Text */}
              <p className="whitespace-pre-wrap">{msg.text}</p>
              
              {/* Image Attachment (Preserved) */}
              {msg.imageUrl && (
                <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                  <img src={msg.imageUrl} alt="Attached Evidence" className="rounded-lg w-full max-w-xs h-auto cursor-pointer" />
                </a>
              )}
            </div>

            {/* Timestamp and Status */}
            <div className={`flex items-center gap-1 mt-1 px-2 text-xs text-gray-500 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
              <span>{formatTime(msg.timestamp)}</span>
              {isOwnMessage && getStatusIcon(msg.status || 'sent')}
            </div>
          </div>
        </div>
      );
    })}

    {/* Typing Indicator */}
    {otherPartyTyping && (
      <div className="flex justify-start">
        <div className="max-w-sm">
          <div className="bg-white border rounded-lg rounded-bl-none p-3 shadow-sm">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1 px-2">typing...</div>
        </div>
      </div>
    )}

    {/* Empty State */}
    {(!dispute.messages || dispute.messages.length === 0) && !otherPartyTyping && (
      <p className="text-center text-gray-400 text-sm mt-10">No messages yet. Start the discussion.</p>
    )}

    <div ref={messagesEndRef} />
  </div>

  {/* SINGLE, UNIFIED CHAT INPUT */}
  <div className="flex gap-2 items-center">
    {/* --- UPDATED ATTACHMENT BUTTON WITH TOOLTIP --- */}
    <div className="relative group">
      <label className="cursor-pointer p-3 border rounded-lg text-gray-500 hover:bg-gray-100 block">
        <span>📎</span>
        <input type="file" className="hidden" accept="image/jpeg,image/webp" onChange={handleEvidenceUpload} />
      </label>
      {/* Tooltip visible on hover */}
      <div className="absolute bottom-full mb-2 w-32 bg-black text-white text-xs text-center rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        Attach evidence
        <span className="block font-bold">Max 100KB</span>
      </div>
    </div>

    {/* Text Input */}
    <input 
      value={chatInput} 
      onChange={handleTyping}
      onKeyDown={e => e.key === 'Enter' && !isSending && sendDisputeMessage()}
      className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
      placeholder="Type a message..."
      disabled={isSending}
    />
    
    <button 
      onClick={sendDisputeMessage} 
      disabled={!chatInput.trim() || isSending} 
      className="bg-indigo-600 text-white font-bold px-6 py-2 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {isSending ? <span className="animate-spin">⏳</span> : null}
      Send
    </button>
  </div>

  {/* Typing Status Indicator */}
  {isTyping && (
    <div className="text-xs text-gray-500 mt-2 px-2">
      Other party will see you're typing...
    </div>
  )}
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
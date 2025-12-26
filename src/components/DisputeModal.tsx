'use client';

import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
// NOTE: You will need to create this storage helper if it doesn't exist
// import { uploadImageAndGetURL } from '@/lib/storage'; 

export default function DisputeModal({ checklist, onClose }: { checklist: any, onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = auth.currentUser;

  const handleSubmit = async () => {
    if (!reason || !files || !user) {
      alert("Please provide a reason and at least one piece of evidence.");
      return;
    }
    setIsSubmitting(true);

    try {
      // In a real app, you would upload files to Firebase Storage here
      // For now, we'll just mock the URLs
      const evidenceUrls = [`https://placeholder.com/evidence1.jpg`];
      
      await addDoc(collection(db, 'disputes'), {
        checklistId: checklist.id,
        sellerId: checklist.uid,
        buyerId: user.uid,
        status: 'INITIATED',
        reason,
        buyerEvidence: evidenceUrls.map(url => ({ url, timestamp: serverTimestamp() })),
        messages: [{
            senderId: user.uid,
            senderEmail: user.email,
            text: `Dispute Initiated: ${reason}`,
            timestamp: Date.now()
        }],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert("✅ Dispute successfully filed. The seller has been notified.");
      onClose();

    } catch (error) {
      console.error(error);
      alert("Failed to file dispute.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-lg p-6">
        <h3 className="font-bold text-xl mb-4">File a Dispute for "{checklist.title}"</h3>
        <div className="space-y-4">
          <div>
            <label className="font-semibold">Reason for Dispute</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full p-2 border rounded mt-1" placeholder="e.g., Product arrived damaged..."></textarea>
          </div>
          <div>
            <label className="font-semibold">Upload Evidence (Photos/Videos)</label>
            <input type="file" multiple onChange={e => setFiles(e.target.files)} className="w-full p-2 border rounded mt-1" />
          </div>
          <div className="flex justify-end gap-4">
            <button onClick={onClose} className="text-gray-600">Cancel</button>
            <button onClick={handleSubmit} disabled={isSubmitting} className="bg-orange-600 text-white font-bold px-6 py-2 rounded disabled:opacity-50">
              {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
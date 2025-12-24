'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

interface RequestButtonProps {
  report: {
    id: string;
    title: string;
    uid: string; // Seller's UID
    sellerEmail: string;
    industry: string;
    standard: string;
  };
}

export default function RequestCustomReport({ report }: RequestButtonProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Listen for auth state to know if we need to redirect
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleRequest = async () => {
    if (!user) {
      // If not logged in, redirect to auth page with a callback URL
      router.push(`/auth?redirect=/report/${report.id}`);
      return;
    }
    if (!report) return;

    setIsRequesting(true);
    try {
        const newChatRef = await addDoc(collection(db, "checklists"), {
            title: `Custom Request based on "${report.title}"`,
            uid: report.uid,
            sellerEmail: report.sellerEmail,
            buyerUid: user.uid,
            buyerEmail: user.email,
            industry: report.industry,
            standard: report.standard,
            score: 0,
            items: [],
            agreementStatus: 'drafting', // A new status for this state
            createdAt: serverTimestamp(),
            messages: [{
                senderId: user.uid,
                senderEmail: user.email,
                text: `Hello, I saw your "${report.title}" listing and would like to request a custom QC report.`,
                timestamp: Date.now(),
            }]
        });
        alert("✅ Request Sent! You will be redirected to your dashboard to continue the chat.");
        router.push('/dashboard');
    } catch (error) {
        console.error("Failed to create custom chat:", error);
        alert("Sorry, we couldn't start the chat. Please try again.");
    } finally {
        setIsRequesting(false);
    }
  };
  
  // Don't show the button if the viewer is the owner of the report
  if (user && user.uid === report.uid) {
    return (
        <div className="mt-8 bg-gray-100 p-4 rounded-lg text-center text-sm text-gray-500">
            This is your own listing.
        </div>
    );
  }

  return (
    <div className="mt-8 bg-white p-6 rounded-lg border shadow-sm text-center">
        <h3 className="text-xl font-bold text-gray-800">Need a Custom Report?</h3>
        <p className="text-gray-600 mt-2">
            Contact this seller directly to start a private quality control project based on this report's specifications.
        </p>
        <button
            onClick={handleRequest}
            disabled={isRequesting}
            className="mt-4 inline-block bg-indigo-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
            {isRequesting ? 'Starting Chat...' : 'Request Custom Report'}
        </button>
    </div>
  );
}
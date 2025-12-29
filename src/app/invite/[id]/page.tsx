'use client';

import { useEffect, useState } from 'react';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  addDoc,         // <--- ADD THIS
  collection,     // <--- ADD THIS
  serverTimestamp // <--- ADD THIS
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter, useParams } from 'next/navigation'; // <-- Added useParams

export default function InvitePage() {
  const params = useParams(); // <-- Hook to get ID safely
  const inviteId = params.id as string;

  const [checklist, setChecklist] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // 1. Check Auth
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (!currentUser) {
            // Redirect to auth but remember to come back here
            router.push(`/auth?redirect=/invite/${inviteId}`);
        } else {
            setUser(currentUser);
        }
    });

    // 2. Fetch Checklist Data
    async function fetchChecklist() {
        if (!inviteId) return;
        const docRef = doc(db, 'checklists', inviteId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            setChecklist({ id: docSnap.id, ...docSnap.data() });
        }
    }
    
    if(inviteId) fetchChecklist();
    
    return () => unsubscribe();
  }, [inviteId, router]);

  const handleAccept = async () => {
    if (!user || !checklist) return;

    try {
        const checklistRef = doc(db, "checklists", checklist.id);
        
        // 1. Update the Checklist
        await updateDoc(checklistRef, {
            buyerUid: user.uid,
            buyerEmail: user.email,
            agreementStatus: 'ready_to_sign'
        });

        // 2. CREATE NOTIFICATION FOR SELLER (Client-Side)
        // We write directly to the 'notifications' collection
        await addDoc(collection(db, "notifications"), {
            recipientId: checklist.uid, // The Seller
            title: `Invitation Accepted: ${checklist.title}`,
            message: `${user.email} has joined as the buyer.`,
            link: `/report/${checklist.id}`,
            isRead: false,
            createdAt: serverTimestamp()
        });

        alert("✅ Project Accepted! Redirecting...");
        router.push('/dashboard');
    } catch (e) {
        console.error("Error:", e);
        alert("Failed to accept.");
    }
  };

  if (!checklist) return <div className="p-10 text-center text-gray-500">Loading invitation details...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="bg-indigo-600 p-6 text-center">
                <h1 className="text-2xl font-bold text-white">Project Invitation</h1>
                <p className="text-indigo-100 text-sm mt-1">You have been invited to review a QC Project</p>
            </div>
            
            <div className="p-8 text-center">
                <p className="text-gray-600 mb-6">
                    Invited by: <span className="font-bold text-gray-900">{checklist.sellerEmail}</span>
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-8">
                    <h2 className="text-xl font-bold text-gray-800">{checklist.title}</h2>
                    <div className="flex justify-center gap-2 mt-2 text-xs font-bold text-gray-500 uppercase">
                        <span className="bg-white border px-2 py-1 rounded">{checklist.industry}</span>
                        <span className="bg-white border px-2 py-1 rounded">{checklist.standard}</span>
                    </div>
                </div>

                {user ? (
                    <button 
                        onClick={handleAccept} 
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold shadow-md transition-transform active:scale-95"
                    >
                        Accept & View Project
                    </button>
                ) : (
                    <div className="text-center">
                        <p className="text-red-500 font-medium mb-4">Please log in to accept.</p>
                        <button 
                            onClick={() => router.push(`/auth?redirect=/invite/${inviteId}`)}
                            className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold"
                        >
                            Go to Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  addDoc,         // Added for notification
  collection,     // Added for notification
  serverTimestamp // Added for notification (though we use new Date() for client-side)
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth'; // Import User type
import { useRouter, useParams } from 'next/navigation'; // <-- Added useParams

export default function InvitePage() {
  const params = useParams(); // Hook to get ID safely
  const inviteId = params.id as string;

  const router = useRouter();
  const [checklist, setChecklist] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null); // Use User type for clarity
  const [loading, setLoading] = useState(true); // Added loading state

  useEffect(() => {
    // 1. Check Auth State
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
        if (!currentUser) {
            console.log("InvitePage: User not logged in. Redirecting to auth.");
            router.push(`/auth?redirect=/invite/${inviteId}`);
        } else {
            console.log("InvitePage: User logged in:", currentUser.email);
            setUser(currentUser);
        }
    });

    // 2. Fetch Checklist Data
    async function fetchChecklist() {
        if (!inviteId) {
            console.log("InvitePage: No invite ID found in URL.");
            setLoading(false);
            return;
        }
        console.log("InvitePage: Attempting to fetch checklist for ID:", inviteId);
        try {
            const docRef = doc(db, 'checklists', inviteId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                console.log("InvitePage: Checklist data fetched successfully.");
                setChecklist({ id: docSnap.id, ...docSnap.data() });
            } else {
                console.log("InvitePage: Checklist document does not exist for ID:", inviteId);
            }
        } catch (error) {
            console.error("InvitePage: Error fetching checklist:", error);
        } finally {
            setLoading(false);
        }
    }
    
    if(inviteId) fetchChecklist();
    
    return () => unsubscribeAuth();
  }, [inviteId, router]);

// --- UPDATED handleAccept with Full Validation and Debugging ---
const handleAccept = async () => {
    console.log("--- handleAccept: START ---");
    console.log("handleAccept: Current User (from Auth State):", auth.currentUser);
    console.log("handleAccept: User state (from useState):", user);
    console.log("handleAccept: Checklist state (from useState):", checklist);
    console.log("handleAccept: Invite ID from URL params:", inviteId);

    // --- CRITICAL VALIDATION ---
    if (!user) {
        console.error("handleAccept: User not logged in or user state is null.");
        alert("Error: You must be logged in to accept this invitation.");
        router.push(`/auth?redirect=/invite/${inviteId}`); // Force login
        return;
    }
    if (!checklist || !checklist.id) {
        console.error("handleAccept: Checklist data is missing or invalid.");
        alert("Error: Invitation details not found. Cannot accept.");
        return;
    }
    if (user.uid === checklist.uid) {
        console.warn("handleAccept: Seller attempted to accept their own invite.");
        alert("You are the seller of this project and cannot accept your own invitation.");
        router.push('/dashboard'); // Redirect seller back to dashboard
        return;
    }
    if (checklist.agreementStatus !== 'pending_buyer') {
        console.warn(`handleAccept: Project status is '${checklist.agreementStatus}', not 'pending_buyer'.`);
        alert("This project has already been accepted or is no longer pending a buyer.");
        router.push('/dashboard');
        return;
    }
    // --- END CRITICAL VALIDATION ---

    const checklistRef = doc(db, "checklists", checklist.id);
    const notificationRef = collection(db, "notifications");

    const updatePayload = {
        buyerUid: user.uid,
        buyerEmail: user.email,
        agreementStatus: 'ready_to_sign',
    };
    
    console.log("handleAccept: Attempting to update checklist:", checklist.id);
    console.log("handleAccept: Update Payload:", updatePayload);

    try {
        // 1. ATTEMPT TO UPDATE THE CHECKLIST
        await updateDoc(checklistRef, updatePayload);
        console.log("handleAccept: Checklist updated successfully in Firestore.");

        // 2. ATTEMPT TO CREATE NOTIFICATION FOR SELLER (Client-Side)
        await addDoc(notificationRef, {
            recipientId: checklist.uid, // The Seller (original owner)
            title: `Invitation Accepted: "${checklist.title}"`,
            message: `${user.email} has joined your project as the buyer.`,
            link: `/dashboard`, // Link to the seller's dashboard
            isRead: false,
            createdAt: new Date() // Corrected for client-side
        });
        console.log("handleAccept: Notification created for seller.");

        alert("✅ Project Accepted! Redirecting to dashboard...");
        router.push('/dashboard');
        router.refresh(); 
        console.log("--- handleAccept: END (SUCCESS) ---");

    } catch (e: any) {
        console.error("handleAccept: FINAL FAILURE (Firestore update/add error):", e);
        let errorMessage = "An unknown error occurred.";
        if (e.code === "permission-denied") {
            errorMessage = "Permission Denied. Check your Firestore Security Rules.";
        } else if (e.message && e.message.includes("document not found")) {
            errorMessage = "The project document was not found.";
        } else if (e.message) {
            errorMessage = e.message;
        }
        alert(`Failed to accept: ${errorMessage}. Please check the console for details.`);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading invitation details...</div>;
  if (!checklist) return <div className="p-10 text-center text-red-500">Invitation not found or invalid.</div>;

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
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold shadow-md transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading} // Disable if still loading
                    >
                        Accept & View Project
                    </button>
                ) : (
                    <div className="text-center">
                        <p className="text-red-500 font-medium mb-4">Please log in or sign up to accept this project.</p>
                        <button 
                            onClick={() => router.push(`/auth?redirect=/invite/${inviteId}`)}
                            className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-black"
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
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function SourcingRequestForm() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState(''); // Control email field state
  const router = useRouter();

  // Listen to auth state to pre-fill email
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser?.email) {
        setEmail(currentUser.email);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const product = formData.get('product') as string;
    // Use the state for email as it might be pre-filled
    const contactEmail = email; 

    // --- SECURITY GATE LOGIC ---
    if (!user) {
        alert("🔒 Security Check: You must create a free account to post a sourcing request.");
        router.push(`/auth?redirect=/`);
        setLoading(false);
        return;
    }

    let isVerified = false;
    // Check Verification Status
    const userSnap = await getDoc(doc(db, 'users', user.uid));
    if (userSnap.exists() && userSnap.data().isDomainVerified) {
        isVerified = true;
    }

    try {
        // Save the Request
        await addDoc(collection(db, 'sourcing_requests'), {
            product,
            email: contactEmail,
            // Only 'verified' requests will trigger the notification function
            status: isVerified ? 'verified' : 'pending_verification', 
            uid: user.uid,
            createdAt: serverTimestamp()
        });

        // The Hook
        if (isVerified) {
            alert("✅ Request Posted! Our verified supplier network will be notified.");
        } else {
            alert("🔒 Account Not Verified: To broadcast this request, please complete your organization's verification.");
            // Send them to the dashboard where the "Verify Org" button is prominent
            router.push('/dashboard'); 
        }
    } catch (err) {
        console.error(err);
        alert("Error posting request.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-2 rounded-xl shadow-2xl flex flex-col md:flex-row gap-2 max-w-2xl mx-auto">
        <input 
            name="product"
            type="text" 
            placeholder="I'm looking for... (e.g. ISO 9001-compliant Lithium Cells)" 
            className="flex-1 p-4 text-gray-900 bg-transparent outline-none rounded-lg placeholder-gray-500"
            required
        />
        <input 
            name="email"
            type="email" 
            placeholder="Your Business Email" 
            value={email} // Use state for value
            onChange={(e) => setEmail(e.target.value)} // Allow changes if not logged in
            disabled={!!user} // Disable if logged in, as it's pre-filled
            className="md:w-64 p-4 text-gray-900 bg-transparent outline-none rounded-lg placeholder-gray-500 disabled:bg-gray-100 disabled:text-gray-500"
            required
        />
        <button type="submit" disabled={loading} className="bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-4 rounded-lg transition-colors disabled:opacity-50">
            {loading ? 'Processing...' : 'Post Request'}
        </button>
    </form>
  );
}
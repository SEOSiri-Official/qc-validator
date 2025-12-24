'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { User } from 'firebase/auth';

// Helper to generate a simple, human-readable code
const generateCode = (length = 6) => {
    return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
};

export default function ReferralSection() {
  const [user, setUser] = useState<User | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      fetchOrCreateReferralCode(currentUser.uid);
    }
  }, []);
  
  const fetchOrCreateReferralCode = async (userId: string) => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && userSnap.data().referralCode) {
        setReferralCode(userSnap.data().referralCode);
    } else {
        // If no code exists, create one
        const newCode = generateCode();
        await setDoc(userRef, { referralCode: newCode }, { merge: true });
        setReferralCode(newCode);
    }
  };

  if (!user || !referralCode) {
    return <div className="p-4 bg-gray-100 rounded-lg animate-pulse">Loading referral link...</div>;
  }

  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    alert('✅ Referral Link Copied!');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
      <h3 className="font-bold text-lg text-indigo-900 mb-2">🚀 Refer & Earn</h3>
      <p className="text-sm text-gray-600 mb-4">
        Share your unique link. When a new user signs up, you both get rewarded!
      </p>
      <div className="flex gap-2 p-2 bg-gray-50 border rounded-lg">
        <input 
            type="text" 
            readOnly 
            value={referralLink} 
            className="flex-1 bg-transparent text-sm text-gray-500 outline-none"
        />
        <button 
            onClick={handleCopy} 
            className="bg-indigo-600 text-white font-bold px-4 py-1 rounded text-sm hover:bg-indigo-700"
        >
            Copy
        </button>
      </div>
    </div>
  );
}
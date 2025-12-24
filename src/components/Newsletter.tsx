'use client';

import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubscribe = async () => {
    if (!email.includes('@') || !email.includes('.')) {
        alert("Please enter a valid email address.");
        return;
    }

    setStatus('loading');

    try {
      // Add to 'subscribers' collection in Firestore
      await addDoc(collection(db, "subscribers"), {
        email: email,
        source: 'dashboard_footer',
        joinedAt: serverTimestamp(),
        isActive: true
      });

      setStatus('success');
      setEmail('');
      
      // Reset success message after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);

    } catch (e) {
      console.error("Subscription Error:", e);
      setStatus('error');
    }
  };

  return (
    <footer className="mt-12 border-t border-gray-200 pt-10 pb-12 bg-white">
      <div className="max-w-4xl mx-auto text-center px-4">
        <h4 className="text-xl font-bold text-gray-900 mb-2">🔔 Get Real-time QC Alerts</h4>
        <p className="text-sm text-gray-500 mb-6">
  Receive an automated email notification from <strong>QC Val Admin Panel</strong> whenever a new High-Compliance Product is verified on the platform.
</p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-md mx-auto">
            <input 
                type="email" 
                placeholder="Enter your professional email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'success'}
                className="flex-1 border border-gray-300 p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 transition-all"
            />
            <button 
                onClick={handleSubscribe} 
                disabled={status === 'loading' || status === 'success'}
                className={`px-6 py-3 rounded-lg text-sm font-bold text-white transition-all shadow-md
                    ${status === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-900 hover:bg-black'}
                    ${status === 'loading' ? 'opacity-70 cursor-wait' : ''}
                `}
            >
                {status === 'loading' ? 'Processing...' : status === 'success' ? '✅ Subscribed!' : 'Subscribe Free'}
            </button>
        </div>
        
        {status === 'error' && (
            <p className="text-xs text-red-500 mt-3">Something went wrong. Please try again later.</p>
        )}
        
        <p className="text-[10px] text-gray-400 mt-6">
            © {new Date().getFullYear()} QC Validator by SEOSiri. All rights reserved. <br/>
            <a href="https://qcval.seosiri.com/privacy" className="hover:underline">Privacy Policy</a>
            <a href="/faq" className="hover:underline ml-2">Help Center</a>

        </p>
      </div>
    </footer>
  );
}
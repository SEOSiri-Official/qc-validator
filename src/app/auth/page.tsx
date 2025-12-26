'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';
  const referralCode = searchParams.get('ref'); // <-- NEW: CAPTURE THE REF CODE
  const handlePasswordReset = async () => {
    if (!email) {
      alert("Please enter your email address in the email field to receive a reset link.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset link sent! Check your inbox.");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
       } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        // Create user profile
        await setDoc(doc(db, 'users', userCred.user.uid), {
          email: userCred.user.email,
          createdAt: serverTimestamp(),
          isDomainVerified: false,
          referredByCode: referralCode || null,
        });
        
        // --- ADD THIS ---
        // Send verification email and keep them on the auth page
        await sendEmailVerification(userCred.user);
        alert("Account created! A verification link has been sent to your email. Please verify before logging in.");
        setIsLogin(true); // Switch to login view after signup
        return; // Stop the redirect from happening
      }
      router.push(redirectUrl);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userRef = doc(db, 'users', result.user.uid);
      const docSnap = await getDoc(userRef);
      
      if (!docSnap.exists()) {
        await setDoc(userRef, {
          email: result.user.email,
          createdAt: serverTimestamp(),
          isDomainVerified: false,
          referredByCode: referralCode || null, // <-- NEW: SAVE THE CODE
        });
      }
      router.push(redirectUrl);
    } catch (error) { 
      console.error(error);
      alert("Google Sign-In failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">QC Validator</h1>
          <p className="text-gray-500">{isLogin ? 'Sign in to access your dashboard' : 'Create a free enterprise account'}</p>
        </div>

        {/* --- NEW: Referral Message --- */}
        {referralCode && !isLogin && (
            <div className="text-center text-sm text-green-700 bg-green-50 p-3 rounded-md mb-4 border border-green-200">
                You've been referred! Sign up to claim your reward.
            </div>
        )}
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
          </div>
          {isLogin && (
            <div className="text-right text-sm">
              <button type="button" onClick={handlePasswordReset} className="font-semibold text-indigo-600 hover:text-indigo-500">
                Forgot password?
              </button>
            </div>
          )}
<div>
    <input type="checkbox" required id="terms" />
    <label htmlFor="terms" className="text-xs ml-2">
        I agree to the <a href="/legal/terms" target="_blank" className="underline">Terms of Service</a> and <a href="/legal/disclaimer" target="_blank" className="underline">Disclaimer</a>.
    </label>
</div>

          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded-md font-bold hover:bg-indigo-700 transition disabled:opacity-50">
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-4">
            <button onClick={handleGoogle} disabled={loading} className="w-full border border-gray-300 text-gray-700 py-2 rounded-md font-bold hover:bg-gray-50 flex justify-center items-center gap-2 disabled:opacity-50">
                <span>G</span> Continue with Google
            </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-indigo-600 font-bold hover:underline">
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
}
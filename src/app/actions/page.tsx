'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { verifyPasswordResetCode, confirmPasswordReset, applyActionCode } from 'firebase/auth';
import Link from 'next/link';

export default function ActionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get action parameters from the URL
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('Verifying your request...');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!oobCode) {
      setMessage("Invalid action link.");
      return;
    }

    if (mode === 'resetPassword') {
      // Verify the code is valid before showing the form
      verifyPasswordResetCode(auth, oobCode)
        .then(email => {
          setMessage(`Enter a new password for ${email}`);
        })
        .catch(error => {
          setMessage("This link is invalid or has expired. Please request a new one.");
        });
    } else if (mode === 'verifyEmail') {
        // Handle email verification
        applyActionCode(auth, oobCode)
            .then(() => {
                setMessage("✅ Your email has been verified successfully!");
                setIsSuccess(true);
            })
            .catch(error => setMessage("Invalid or expired email verification link."));
    }
  }, [mode, oobCode]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode || !password) return;

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setMessage("✅ Your password has been reset successfully! You can now log in.");
      setIsSuccess(true);
    } catch (error: any) {
      setMessage(`Error resetting password: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Account Action</h1>
        
        {mode === 'resetPassword' && !isSuccess ? (
          <form onSubmit={handleResetPassword}>
            <p className="mb-4 text-gray-600">{message}</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full p-2 border rounded"
              required
            />
            <button type="submit" className="w-full mt-4 bg-indigo-600 text-white font-bold py-2 rounded">
              Reset Password
            </button>
          </form>
        ) : (
          <div>
            <p className={`font-semibold ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
            {isSuccess && (
              <Link href="/auth" className="inline-block mt-4 bg-blue-600 text-white font-bold px-6 py-2 rounded">
                Go to Login
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
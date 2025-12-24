'use client';

import Link from 'next/link';

export default function SignupWall() {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md text-center p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Join the Verified Trade Network</h2>
        <p className="text-gray-600 mb-6">
          Create a free account to unlock unlimited access to the QC Val Town Hall, connect with sellers, and list your own verified products.
        </p>
        <Link 
          href="/auth" 
          className="block w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Sign Up for Free
        </Link>
      </div>
    </div>
  );
}
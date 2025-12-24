// src/components/CookieBanner.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if the user has already accepted cookies
    if (!localStorage.getItem('cookie_consent')) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'true');
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50 flex items-center justify-center flex-wrap gap-4">
      <p className="text-sm text-center">
        We use essential cookies to make our site work. To learn more, see our{' '}
        <Link href="/legal/privacy" className="font-bold underline hover:text-gray-300">
          Privacy Policy
        </Link>.
      </p>
      <button
        onClick={handleAccept}
        className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 text-sm"
      >
        Accept
      </button>
    </div>
  );
}
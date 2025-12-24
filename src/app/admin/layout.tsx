'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// --- CONFIG: Hardcoded Super Admins ---
const ADMIN_EMAILS = ['admin@seosiri.com', 'badhanpbn@gmail.com']; 

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && ADMIN_EMAILS.includes(user.email || '')) {
        setAuthorized(true);
      } else {
        router.push('/dashboard'); // Kick non-admins out
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (!authorized) return <div className="min-h-screen flex items-center justify-center">Verifying Access...</div>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-6 hidden md:block">
        <h1 className="text-xl font-bold mb-8 text-indigo-400">QC Admin</h1>
        <nav className="space-y-4">
            <a href="/admin" className="block hover:text-indigo-300">Dashboard</a>
            <a href="/admin/users" className="block hover:text-indigo-300">User Management</a>
            <a href="/admin/listings" className="block hover:text-indigo-300">Marketplace Moderation</a>
            <a href="/admin/content" className="block hover:text-indigo-300">QC Press CMS</a>
            <a href="/dashboard" className="block text-gray-500 mt-8 pt-8 border-t border-gray-700">← Back to App</a>
        </nav>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
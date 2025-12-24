'use client'; // <--- THIS IS THE KEY FIX

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Newsletter from '@/components/Newsletter';

export default function PressPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from your new API Route
  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch('/api/posts');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setPosts(data);
      } catch (e) {
        console.error("Error loading posts:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b py-6 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">QC Press 📰</h1>
            <Link href="/dashboard" className="text-sm font-semibold text-indigo-600 hover:underline">
                ← Back to Dashboard
            </Link>
        </div>
      </header>

      <main className="flex-grow max-w-5xl mx-auto w-full px-4 py-12">
        <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Verified Industry Insights</h2>
            <p className="text-lg text-gray-600">Direct reports and updates from verified organizations.</p>
        </div>

        {loading ? (
            <div className="text-center py-20">
                <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-500">Loading updates...</p>
            </div>
        ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300">
                <p className="text-xl text-gray-400 mb-2">No press releases found.</p>
                <Link href="/press/create" className="mt-6 inline-block bg-gray-900 text-white px-6 py-3 rounded-lg font-bold">Create New Post</Link>
            </div>
        ) : (
            <div className="grid gap-8 md:grid-cols-2">
              {posts.map((post: any) => (
                <article key={post.id} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col">
                  <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-3 text-xs text-gray-500 uppercase font-bold tracking-wider">
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded">News</span>
                          <span>• {post.publishedAt ? new Date(post.publishedAt * 1000).toLocaleDateString() : 'Recent'}</span>
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
                        <Link href={`/press/${post.id}`} className="hover:text-indigo-600 transition-colors">
                          {post.title}
                        </Link>
                      </h2>
                      <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                        {post.summary}
                      </p>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-50 flex justify-between items-center mt-auto">
                      <span className="text-xs font-bold text-gray-900">By {post.authorName}</span>
                      <Link href={`/press/${post.id}`} className="text-indigo-600 text-sm font-bold hover:underline">
                        Read Article →
                      </Link>
                  </div>
                </article>
              ))}
            </div>
        )}
      </main>
      <Newsletter />
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Post {
  id: string;
  title: string;
}

interface InternalLinkerProps {
  onSelect: (post: Post) => void;
  onClose: () => void;
}

export default function InternalLinker({ onSelect, onClose }: InternalLinkerProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      const postsCollection = collection(db, 'press_releases');
      const q = query(postsCollection, orderBy('publishedAt', 'desc'));
      const postSnapshot = await getDocs(q);
      
      const fetchedPosts = postSnapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title as string,
      }));
      
      setPosts(fetchedPosts);
      setLoading(false);
    }
    fetchPosts();
  }, []);

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg h-[60vh] flex flex-col">
        <header className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-lg">Link to an Existing Post</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500">✕</button>
        </header>

        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Search posts by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && <p className="p-4 text-center text-gray-500">Loading posts...</p>}
          {!loading && filteredPosts.length === 0 && (
            <p className="p-4 text-center text-gray-500">No posts found.</p>
          )}
          <ul className="divide-y">
            {filteredPosts.map(post => (
              <li key={post.id}>
                <button
                  onClick={() => onSelect(post)}
                  className="w-full text-left p-4 hover:bg-gray-50"
                >
                  <p className="font-medium text-gray-800">{post.title}</p>
                  <p className="text-xs text-gray-400">/press/{post.id}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import InternalLinker from '@/components/InternalLinker';
import ImageInserter from '@/components/ImageInserter';

export default function CreatePostPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLinkerOpen, setIsLinkerOpen] = useState(false);
  const [isImageInserterOpen, setIsImageInserterOpen] = useState(false);

  const handleSavePost = async () => {
    if (!title || !content || !auth.currentUser) {
      alert("Title and content are required, and you must be logged in.");
      return;
    }

    setIsSaving(true);
    try {
      await addDoc(collection(db, 'press_releases'), {
        title: title,
        content: content,
        summary: content.substring(0, 150) + '...', // Auto-generate summary
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || auth.currentUser.email,
        publishedAt: serverTimestamp(),
      });
      alert("Post published successfully!");
      router.push('/press');
    } catch (error) {
      console.error("Error saving post:", error);
      alert("Failed to save post.");
      setIsSaving(false);
    }
  };

  const handleSelectLink = (post: { id: string; title: string }) => {
    const linkMarkdown = `[${post.title}](/press/${post.id})`;
    setContent(prevContent => `${prevContent}\n${linkMarkdown}`);
    setIsLinkerOpen(false);
  };

  const handleSelectImage = (imageUrl: string, altText: string) => {
    const imageMarkdown = `![${altText}](${imageUrl})`;
    setContent(prev => `${prev}\n\n${imageMarkdown}\n`);
    setIsImageInserterOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Create New Press Release</h1>

      <div className="space-y-6">
        <div>
          <label htmlFor="title" className="block font-bold mb-2">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Your Post Title"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="content" className="font-bold">Content (Supports Markdown)</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsImageInserterOpen(true)}
                className="px-3 py-1 border rounded bg-white font-bold text-sm hover:bg-gray-50 flex items-center gap-1"
              >
                🖼️ Insert QC Image
              </button>
              
              <button 
                onClick={() => setIsLinkerOpen(true)}
                className="px-3 py-1 border rounded bg-white font-bold text-sm hover:bg-gray-50"
              >
                🔗 Add Internal Link
              </button>
            </div>
          </div>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-3 border rounded-md min-h-[400px] focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Write your 500+ word article here..."
          />
        </div>

        <div className="flex justify-end gap-4">
          <button 
            onClick={() => router.push('/press')}
            className="px-6 py-2 border rounded font-semibold hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSavePost}
            disabled={isSaving}
            className="px-6 py-2 bg-gray-900 text-white font-semibold rounded disabled:opacity-50 hover:bg-black"
          >
            {isSaving ? 'Publishing...' : 'Publish Post'}
          </button>
        </div>
      </div>

      {isLinkerOpen && (
        <InternalLinker 
          onSelect={handleSelectLink}
          onClose={() => setIsLinkerOpen(false)}
        />
      )}

      {isImageInserterOpen && (
        <ImageInserter 
          onSelect={handleSelectImage} 
          onClose={() => setIsImageInserterOpen(false)} 
        />
      )}
    </div>
  );
}
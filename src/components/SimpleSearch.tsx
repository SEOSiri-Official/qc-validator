'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SimpleSearchProps {
  isOpen: boolean;
  onClose: () => void;
  savedChecklists: any[];
}

export default function SimpleSearch({ isOpen, onClose, savedChecklists }: SimpleSearchProps) {
  const [queryText, setQueryText] = useState('');
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch blog posts once on mount for the search
  useEffect(() => {
    async function fetchSearchData() {
        const q = query(collection(db, 'press_releases'), limit(5));
        const snapshot = await getDocs(q);
        setBlogPosts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    fetchSearchData();
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  // Keyboard Shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // --- ROBUST FILTERING LOGIC ---
  const lowerQuery = queryText.toLowerCase();

  const filteredProjects = savedChecklists.filter(list => 
    list.title.toLowerCase().includes(lowerQuery) ||
    list.industry.toLowerCase().includes(lowerQuery) ||
    list.standard.toLowerCase().includes(lowerQuery)
  );

  const filteredBlogs = blogPosts.filter(post =>
    post.title.toLowerCase().includes(lowerQuery)
  );

  const handleNavigate = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    // OVERLAY
    <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}>
      
      {/* MODAL */}
      <div 
        className="fixed top-[15%] left-1/2 -translate-x-1/2 w-[95%] max-w-2xl z-[9999] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[70vh]">
          
          {/* HEADER */}
          <div className="flex items-center px-4 py-4 border-b border-gray-100 bg-white sticky top-0">
            <span className="text-xl mr-3 text-gray-400">🔍</span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search projects, actions, blogs..."
              className="w-full text-lg outline-none placeholder:text-gray-400 text-gray-800"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
            />
            <div className="flex gap-2">
                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 font-mono">ESC</span>
            </div>
          </div>

          {/* SCROLLABLE RESULTS AREA */}
          <div className="overflow-y-auto p-2 bg-gray-50/50">
            
            {/* 1. QUICK ACTIONS */}
            <div className="mb-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase px-3 py-2">Quick Actions</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 px-2">
                  <button onClick={() => handleNavigate('/press/create')} className="text-left px-3 py-3 bg-white hover:bg-indigo-50 border border-gray-100 hover:border-indigo-200 rounded-lg flex items-center gap-3 transition-all group shadow-sm">
                    <span className="bg-indigo-100 text-indigo-600 p-1.5 rounded-md group-hover:bg-white text-lg">✍️</span>
                    <div>
                        <span className="text-sm font-bold text-gray-700 block group-hover:text-indigo-700">Write Press Release</span>
                        <span className="text-[10px] text-gray-400">Publish industry news</span>
                    </div>
                  </button>
                  <button onClick={() => { 
                      const el = document.getElementById('project-setup');
                      el?.scrollIntoView({ behavior: 'smooth' });
                      onClose();
                  }} className="text-left px-3 py-3 bg-white hover:bg-green-50 border border-gray-100 hover:border-green-200 rounded-lg flex items-center gap-3 transition-all group shadow-sm">
                    <span className="bg-green-100 text-green-600 p-1.5 rounded-md group-hover:bg-white text-lg">➕</span>
                    <div>
                        <span className="text-sm font-bold text-gray-700 block group-hover:text-green-700">New QC Project</span>
                        <span className="text-[10px] text-gray-400">Start a new inspection</span>
                    </div>
                  </button>
              </div>
            </div>

            {/* 2. MY PROJECTS (Filtered) */}
            {filteredProjects.length > 0 && (
               <div className="mb-4">
                 <p className="text-[10px] font-bold text-gray-400 uppercase px-3 py-2 sticky top-0 bg-gray-50/95 backdrop-blur">My Projects</p>
                 <div className="space-y-1 px-2">
                    {filteredProjects.slice(0, 5).map((list) => (
                    <button 
                        key={list.id} 
                        onClick={() => handleNavigate(`/report/${list.id}`)}
                        className="w-full text-left px-3 py-2.5 bg-white hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-100 flex justify-between items-center transition-colors group shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-lg">📄</span>
                            <div>
                                <span className="text-sm font-medium text-gray-800 block group-hover:text-blue-700">{list.title}</span>
                                <span className="text-[10px] text-gray-400">{list.industry}</span>
                            </div>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${list.score===100 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {list.score}%
                        </span>
                    </button>
                    ))}
                 </div>
               </div>
            )}

           {/* 3. NAVIGATION & MARKETPLACE */}
             <div className="mb-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase px-3 py-2">Platform Navigation</p>
              <div className="space-y-1 px-2">
                  
                  {/* --- NEW: SMART PUSH TO MARKETPLACE ACTION --- */}
                  {/* Find the first 100% score project that hasn't been pushed yet (logic can be refined) */}
                  {savedChecklists.some(l => l.score === 100) && (
                      <button 
                        onClick={() => {
                            // Find the first eligible project to push
                            const eligibleProject = savedChecklists.find(l => l.score === 100);
                            if (eligibleProject) {
                                // Close search and trigger the publish flow (requires linking to dashboard function)
                                // Since we can't easily call dashboard functions from here, we navigate to dashboard 
                                // and maybe highlight the button.
                                handleNavigate('/dashboard');
                                // In a real app, you might use a global context or URL param to trigger the modal
                                setTimeout(() => alert(`Go to your project "${eligibleProject.title}" and click "Push to Marketplace"`), 500);
                            }
                        }}
                        className="w-full text-left px-3 py-2 bg-green-50 hover:bg-green-100 border border-green-100 rounded-lg text-sm text-green-700 flex items-center gap-3 font-bold"
                      >
                        <span>🚀</span> Push Verified Project to Marketplace
                      </button>
                  )}

                  <button onClick={() => handleNavigate('/marketplace')} className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm text-gray-600 flex items-center gap-3">
                    <span>🏛️</span> Town Hall Marketplace
                  </button>
                  <button onClick={() => handleNavigate('/standards')} className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm text-gray-600 flex items-center gap-3">
                    <span>🌍</span> Standards Hub
                  </button>
                  <button onClick={() => handleNavigate('/analytics')} className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm text-gray-600 flex items-center gap-3">
                    <span>📊</span> Performance Analytics
                  </button>
              </div>
            </div>

            {/* EMPTY STATE */}
            {filteredProjects.length === 0 && filteredBlogs.length === 0 && queryText.length > 0 && (
                <div className="text-center py-12">
                    <p className="text-4xl mb-2">👻</p>
                    <p className="text-gray-500 text-sm font-medium">No results found for "{queryText}"</p>
                    <p className="text-gray-400 text-xs mt-1">Try searching for a project title, industry, or action.</p>
                </div>
            )}

          </div>
          
          {/* FOOTER */}
          <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 flex justify-between items-center text-[10px] text-gray-400">
             <span>QC Validator Search</span>
             <span className="flex gap-2">
                <span>Select ↵</span>
                <span>Navigate ↑↓</span>
             </span>
          </div>

        </div>
      </div>
    </div>
  );
}
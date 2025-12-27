'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SimpleSearchProps {
  isOpen: boolean;
  onClose: () => void;
  savedChecklists: any[];
}

export default function SimpleSearch({ isOpen, onClose, savedChecklists }: SimpleSearchProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle Ctrl+K to toggle (Keep existing shortcut)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        isOpen ? onClose() : null; // Only handle closing here, opening is handled by parent
      }
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter Logic
  const filteredProjects = savedChecklists.filter(list => 
    list.title.toLowerCase().includes(query.toLowerCase()) ||
    list.industry.toLowerCase().includes(query.toLowerCase())
  );

  const handleNavigate = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    // 1. THE OVERLAY (Backdrop) - High Z-Index
    <div 
      className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* 2. THE MODAL CONTAINER - Centered & Highest Z-Index */}
      <div 
        className="fixed top-20 left-1/2 -translate-x-1/2 w-[95%] max-w-2xl z-[9999]"
        onClick={(e) => e.stopPropagation()} // Prevent clicking modal from closing it
      >
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
          
          {/* Header / Input */}
          <div className="flex items-center px-4 py-4 border-b border-gray-100">
            <span className="text-xl mr-3">🔍</span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search projects, actions, or pages..."
              className="w-full text-lg outline-none placeholder:text-gray-400 text-gray-800"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button onClick={onClose} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">ESC</button>
          </div>

          {/* Results List */}
          <div className="max-h-[60vh] overflow-y-auto p-2">
            
            {/* Quick Actions Group */}
            <div className="mb-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase px-3 py-2">Quick Actions</p>
              <button onClick={() => handleNavigate('/press/create')} className="w-full text-left px-3 py-3 hover:bg-indigo-50 rounded-lg flex items-center gap-3 transition-colors group">
                <span className="bg-indigo-100 text-indigo-600 p-1.5 rounded-md group-hover:bg-white">✍️</span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">Create New Press Release</span>
              </button>
               <button onClick={() => { 
                   const el = document.getElementById('project-setup');
                   el?.scrollIntoView({ behavior: 'smooth' });
                   onClose();
               }} className="w-full text-left px-3 py-3 hover:bg-indigo-50 rounded-lg flex items-center gap-3 transition-colors group">
                <span className="bg-indigo-100 text-indigo-600 p-1.5 rounded-md group-hover:bg-white">➕</span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">Create New QC Project</span>
              </button>
            </div>

            {/* Projects Group */}
            {filteredProjects.length > 0 && (
               <div className="mb-2 border-t border-gray-100 mt-2 pt-2">
                 <p className="text-[10px] font-bold text-gray-400 uppercase px-3 py-2">Projects</p>
                 {filteredProjects.map((list) => (
                   <button 
                     key={list.id} 
                     onClick={() => handleNavigate(`/report/${list.id}`)}
                     className="w-full text-left px-3 py-3 hover:bg-indigo-50 rounded-lg flex justify-between items-center transition-colors"
                   >
                     <span className="text-sm font-medium text-gray-800">{list.title}</span>
                     <span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500">{list.standard}</span>
                   </button>
                 ))}
               </div>
            )}

            {/* Navigation Group */}
             <div className="mb-2 border-t border-gray-100 mt-2 pt-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase px-3 py-2">Navigation</p>
              <button onClick={() => handleNavigate('/marketplace')} className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm text-gray-600">🏛️ Town Hall</button>
              <button onClick={() => handleNavigate('/standards')} className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm text-gray-600">🌍 Standards Hub</button>
            </div>

            {/* Empty State */}
            {filteredProjects.length === 0 && query.length > 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                    No projects found matching "{query}"
                </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
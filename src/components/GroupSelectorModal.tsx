'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

interface GroupSelectorProps {
  checklist: any;
  onClose: () => void;
  onPublish: (groupId: string) => void;
}

export default function GroupSelectorModal({ checklist, onClose, onPublish }: GroupSelectorProps) {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false); // NEW loading state for creation
  const user = auth.currentUser;

  // Fetch groups relevant to the product's industry
  useEffect(() => {
    async function fetchGroups() {
      setLoading(true);
      const q = query(collection(db, 'market_groups'), where('industry', '==', checklist.industry));
      const querySnapshot = await getDocs(q);
      setGroups(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }
    fetchGroups();
  }, [checklist.industry]);

  // --- UPDATED handleCreateGroup ---
  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !user) return;
    setIsCreating(true); // Start loading

    try {
        const newGroupRef = await addDoc(collection(db, 'market_groups'), {
          groupName: newGroupName,
          industry: checklist.industry,
          ownerId: user.uid,
          ownerEmail: user.email,
          description: `A new group for ${checklist.industry} products.`,
          createdAt: serverTimestamp(),
        });
        // Automatically publish to the newly created group
        onPublish(newGroupRef.id); 
    } catch (e) {
        console.error("Error creating group:", e);
        alert("Failed to create group.");
        setIsCreating(false); // Stop loading on error
    }
    // No need to set isCreating to false on success, as the component will close.
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="font-bold text-lg mb-4">List to QC Val Town Hall</h3>
        <p className="text-sm text-gray-600 mb-1">Select a group for <span className="font-bold">{checklist.industry}</span> products:</p>
        
        <div className="max-h-48 overflow-y-auto border rounded-md mb-4">
          {loading && <p className="p-3 text-sm text-gray-400">Loading groups...</p>}
          {!loading && groups.map(group => (
            <button key={group.id} onClick={() => onPublish(group.id)} className="w-full text-left p-3 hover:bg-gray-100 border-b">
              {group.groupName}
            </button>
          ))}
          {!loading && groups.length === 0 && <p className="p-3 text-sm text-gray-400">No groups found for this industry. Create one!</p>}
        </div>
        
        {showCreate ? (
          <div className="space-y-3">
            <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="New Group Name" className="w-full p-2 border rounded"/>
            {/* --- UPDATED BUTTON --- */}
            <button onClick={handleCreateGroup} disabled={isCreating} className="w-full bg-indigo-600 text-white py-2 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed">
              {isCreating ? 'Creating...' : 'Create & Publish'}
            </button>
          </div>
        ) : (
          <button onClick={() => setShowCreate(true)} className="w-full text-indigo-600 font-bold text-sm py-2 hover:bg-indigo-50 rounded-md">+ Create New Group</button>
        )}

        <button onClick={onClose} className="w-full mt-4 text-sm text-gray-500 hover:text-gray-800">Cancel</button>
      </div>
    </div>
  );
}
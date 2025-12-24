// src/components/RequirementEditor.tsx
'use client';

import { useState } from 'react';

interface Props {
  category: string;
  onSave: (requirement: string) => void;
  onClose: () => void;
}

export default function RequirementEditor({ category, onSave, onClose }: Props) {
  const [requirementText, setRequirementText] = useState('');

  const handleSave = () => {
    if (requirementText.trim()) {
      onSave(requirementText.trim());
    } else {
      alert("Requirement cannot be empty.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 animate-slide-up">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Add Requirement Detail</h2>
        <p className="text-sm text-gray-500 mb-4">You are adding a requirement for the category: <span className="font-bold text-indigo-600">{category}</span></p>
        
        <textarea
          value={requirementText}
          onChange={(e) => setRequirementText(e.target.value)}
          rows={4}
          className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
          placeholder={`Enter the specific requirement for "${category}"... (e.g., 'Must be 12V +/- 0.5V')`}
          autoFocus
        />

        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg text-sm font-bold hover:bg-gray-300 transition-colors">Cancel</button>
          <button onClick={handleSave} className="bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors">Save Requirement</button>
        </div>
      </div>
    </div>
  );
}
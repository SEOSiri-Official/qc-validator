// src/app/standards/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import * as FirestoreService from '@/lib/firestore';
import Link from 'next/link';

// --- TYPES (Local to this component) ---
interface StandardParam {
  cat: string;
  hint: string;
}
interface NationalStandard {
  id: string;
  countryName: string;
  authorityName: string;
  authorityUrl?: string;
  params: StandardParam[];
  creatorEmail: string;
  endorsementCount: number;
}

// --- MAIN COMPONENT ---
export default function StandardsHubPage() {
  const [user, setUser] = useState<any>(null);
  const [standards, setStandards] = useState<NationalStandard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);

  // Correct useEffect for this page
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, setUser);
    const unsubscribeStandards = FirestoreService.subscribeToCommunityStandards(setStandards as any);
    setLoading(false);
    return () => {
      unsubscribeAuth();
      unsubscribeStandards();
    };
  }, []);

  const handleEndorse = async (standardId: string) => {
    if (!user) return alert("You must be logged in to endorse a standard.");
    try {
        await FirestoreService.endorseStandard(standardId);
    } catch(e) { console.error(e); }
  };

  if (loading) return <div className="p-8 text-center">Loading Standards Hub...</div>;

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Community Standards Hub</h1>
                <p className="mt-1 text-gray-600">Browse, endorse, and contribute national QC standards from around the world.</p>
            </div>
            {user && (
                <button onClick={() => setShowCreator(true)} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700">
                    + Create New Standard
                </button>
            )}
        </div>
        
        {showCreator && user && <StandardCreator user={user} onClose={() => setShowCreator(false)} />}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {standards.map(standard => (
            <div key={standard.id} className="bg-white rounded-lg shadow border p-6 flex flex-col">
              <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-bold text-lg">{standard.countryName}</h2>
                    {standard.authorityUrl ? (
                        <a href={standard.authorityUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                            {standard.authorityName} ↗
                        </a>
                    ) : (
                        <p className="text-sm text-gray-500">{standard.authorityName}</p>
                    )}
                  </div>
                  <button onClick={() => handleEndorse(standard.id)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-600">
                    <span className="text-lg">👍</span> {standard.endorsementCount}
                  </button>
              </div>
              <ul className="mt-4 space-y-2 text-sm flex-grow">
                {standard.params.map((param, index) => (
                  <li key={index} className="bg-gray-50 p-2 rounded">{param.cat}</li>
                ))}
              </ul>
              <p className="text-xs text-gray-400 mt-4 pt-2 border-t">Contributed by: {standard.creatorEmail?.split('@')[0]}</p>
            </div>
          ))}
        </div>
         <div className="text-center mt-12">
            <Link href="/dashboard" className="text-sm font-semibold text-indigo-600 hover:indigo-500">← Back to Dashboard</Link>
          </div>
      </div>
    </div>
  );
}

// --- Standard Creator Component ---
function StandardCreator({ user, onClose }: { user: any; onClose: () => void; }) {
  const [countryName, setCountryName] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [authorityName, setAuthorityName] = useState('');
  const [authorityUrl, setAuthorityUrl] = useState('');
  const [params, setParams] = useState<StandardParam[]>([{ cat: '', hint: '' }]);
  const [isSaving, setIsSaving] = useState(false);

  const addParam = () => setParams([...params, { cat: '', hint: '' }]);
  const updateParam = (index: number, field: keyof StandardParam, value: string) => {
    const newParams = [...params];
    newParams[index][field] = value;
    setParams(newParams);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!countryName || !countryCode || !authorityName || params.some(p => !p.cat)) {
      return alert("Please fill all fields, including a country code and at least one parameter category.");
    }
    setIsSaving(true);
    try {
        await FirestoreService.createNationalStandard(countryCode.toUpperCase(), {
            countryName, authorityName, authorityUrl, params: params.filter(p => p.cat),
            createdBy: user.uid, creatorEmail: user.email, endorsementCount: 0
        });
        alert("Standard published successfully!");
        onClose();
    } catch (error) {
        alert("Error publishing standard.");
        console.error(error);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
        <h2 className="text-2xl font-bold mb-4">Create a New National Standard</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <input type="text" placeholder="Country Name (e.g., Egypt)" value={countryName} onChange={e => setCountryName(e.target.value)} required className="col-span-2 border p-2 rounded" />
            <input type="text" placeholder="2-Letter Code (e.g., EG)" value={countryCode} onChange={e => setCountryCode(e.target.value)} maxLength={2} required className="border p-2 rounded" />
          </div>
          <input type="text" placeholder="Standards Body (e.g., EOS)" value={authorityName} onChange={e => setAuthorityName(e.target.value)} required className="w-full border p-2 rounded" />
          <input type="url" placeholder="Official Authority Website (Optional)" value={authorityUrl} onChange={e => setAuthorityUrl(e.target.value)} className="w-full border p-2 rounded" />
          <h3 className="font-bold pt-4 border-t">Parameters</h3>
          {params.map((param, index) => (
            <div key={index} className="flex gap-2">
              <input type="text" placeholder="Category (e.g., GOEIC Certificate)" value={param.cat} onChange={e => updateParam(index, 'cat', e.target.value)} className="flex-1 border p-2 rounded" />
              <input type="text" placeholder="Hint (optional)" value={param.hint} onChange={e => updateParam(index, 'hint', e.target.value)} className="flex-1 border p-2 rounded" />
            </div>
          ))}
          <button type="button" onClick={addParam} className="text-indigo-600 text-sm font-bold">+ Add Parameter</button>
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button type="button" onClick={onClose} className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg">Cancel</button>
            <button type="submit" disabled={isSaving} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
              {isSaving ? "Publishing..." : "Publish Standard"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
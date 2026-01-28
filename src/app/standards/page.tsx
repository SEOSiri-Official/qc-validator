'use client';

import { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, getDocs, doc, runTransaction, setDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Tooltip from '@/components/Tooltip'; // Ensure you have this component

// --- TYPE DEFINITIONS ---
interface StandardParam {
  cat: string; // Category (e.g., "Certificate")
  hint: string; // Description/Hint
}

interface NationalStandard {
  id: string;
  countryName: string;
  authorityName: string;
  authorityUrl?: string;
  params: StandardParam[];
  creatorEmail?: string;
  endorsementCount: number;
  endorsedBy?: string[]; // Array of user UIDs who endorsed
}

// --- SEED DATA (To populate the hub initially) ---
const SEED_STANDARDS: Omit<NationalStandard, 'id'>[] = [
    {
        countryName: "United States",
        authorityName: "FDA / CPSC / FCC",
        authorityUrl: "https://www.nist.gov/",
        params: [
            { cat: "FDA Registration", hint: "Required for Food, Drugs, and Medical Devices." },
            { cat: "UL Listing", hint: "Safety certification for electronics." },
            { cat: "FCC ID", hint: "Required for devices emitting radio frequencies." }
        ],
        endorsementCount: 120,
    },
    {
        countryName: "European Union",
        authorityName: "CEN / CENELEC",
        authorityUrl: "https://ec.europa.eu/",
        params: [
            { cat: "CE Marking", hint: "Mandatory conformity mark for EEA." },
            { cat: "RoHS", hint: "Restriction of Hazardous Substances." },
            { cat: "GDPR", hint: "Data privacy compliance." }
        ],
        endorsementCount: 150,
    },
    {
        countryName: "China",
        authorityName: "SAMR / SAC",
        authorityUrl: "http://www.sac.gov.cn/",
        params: [
            { cat: "CCC Certification", hint: "China Compulsory Certificate." },
            { cat: "GB Standards", hint: "National Guobiao standards." }
        ],
        endorsementCount: 85,
    }
];

// --- MAIN COMPONENT ---
export default function StandardsHubPage() {
  const [user, setUser] = useState<User | null>(null);
  const [standards, setStandards] = useState<NationalStandard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- AUTH & DATA LISTENER ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
    });

    // Real-time listener for standards
    const q = query(collection(db, "nationalStandards"));
    const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        const firestoreStandards = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as NationalStandard));

        // Merge Seed Data + Firestore Data
        // If a country exists in Firestore, it overrides the Seed data (allowing community updates)
        const mergedMap = new Map<string, NationalStandard>();
        
        // 1. Add Seeds
        SEED_STANDARDS.forEach(seed => {
            const id = seed.countryName.toLowerCase().replace(/\s+/g, '-');
            mergedMap.set(id, { ...seed, id });
        });

        // 2. Add/Overwrite with Live Data
        firestoreStandards.forEach(std => {
            mergedMap.set(std.id, std);
        });

        // Convert back to array and sort
        const sortedList = Array.from(mergedMap.values()).sort((a, b) => b.endorsementCount - a.endorsementCount);
        setStandards(sortedList);
        setLoading(false);
    });

    return () => {
        unsubscribeAuth();
        unsubscribeSnapshot();
    };
  }, []);

  // --- ENDORSEMENT HANDLER ---
  const handleEndorse = async (standardId: string, countryName: string) => {
    if (!user) {
        alert("Please log in to endorse a standard.");
        return;
    }

    const standardRef = doc(db, 'nationalStandards', standardId);

    try {
        await runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(standardRef);

            if (!docSnap.exists()) {
                // If it's a SEED standard that hasn't been saved to DB yet, create it now
                const seed = SEED_STANDARDS.find(s => s.countryName === countryName);
                if (!seed) throw "Standard not found in seeds";

                transaction.set(standardRef, {
                    ...seed,
                    creatorEmail: 'qc-validator-official',
                    endorsementCount: seed.endorsementCount + 1,
                    endorsedBy: [user.uid]
                });
            } else {
                // Toggle Endorsement
                const data = docSnap.data();
                const endorsedBy = data.endorsedBy || [];
                const hasEndorsed = endorsedBy.includes(user.uid);

                if (hasEndorsed) {
                    transaction.update(standardRef, {
                        endorsementCount: data.endorsementCount - 1,
                        endorsedBy: endorsedBy.filter((uid: string) => uid !== user.uid)
                    });
                } else {
                    transaction.update(standardRef, {
                        endorsementCount: data.endorsementCount + 1,
                        endorsedBy: arrayUnion(user.uid)
                    });
                }
            }
        });
    } catch (e) {
        console.error("Endorsement failed:", e);
        alert("Failed to update endorsement. Please try again.");
    }
  };

  // --- SEARCH FILTER ---
  const filteredStandards = useMemo(() => {
      return standards.filter(s => 
        s.countryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.params.some(p => p.cat.toLowerCase().includes(searchQuery.toLowerCase()))
      );
  }, [standards, searchQuery]);

  if (loading) return <div className="p-12 text-center text-gray-500 animate-pulse">Loading Global Standards...</div>;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        
        {/* HEADER & ACTIONS */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Community Standards Hub</h1>
                <p className="mt-2 text-lg text-gray-600">
                    The open-source database for global QC compliance. 
                    <span className="block text-sm text-indigo-600 mt-1 font-medium">Helping non-ISO businesses reach international markets.</span>
                </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                {/* Search Bar */}
                <input 
                    type="text" 
                    placeholder="Search Country or Certificate..." 
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                
                {user && (
                    <button 
                        onClick={() => setShowCreator(true)} 
                        className="bg-black text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-800 transition-all shadow-sm whitespace-nowrap"
                    >
                        + Contribute Standard
                    </button>
                )}
            </div>
        </div>
        
        {/* CREATOR MODAL */}
        <AnimatePresence>
            {showCreator && user && <StandardCreator user={user} onClose={() => setShowCreator(false)} />}
        </AnimatePresence>
        
        {/* STANDARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStandards.map(standard => (
            <motion.div 
                layout
                key={standard.id} 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="font-bold text-xl text-gray-900">{standard.countryName}</h2>
                    {standard.authorityUrl ? (
                        <a href={standard.authorityUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline font-medium uppercase tracking-wide mt-1 block">
                            {standard.authorityName} ↗
                        </a>
                    ) : (
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">{standard.authorityName}</p>
                    )}
                  </div>
                  <Tooltip text={user ? "Verify accuracy" : "Login to verify"}>
                    <button 
                        onClick={() => handleEndorse(standard.id, standard.countryName)}
                        className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors ${
                            user && standard.endorsedBy?.includes(user.uid) 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                        }`}
                    >
                        <span className="text-lg">▲</span>
                        <span className="text-xs font-bold">{standard.endorsementCount}</span>
                    </button>
                  </Tooltip>
              </div>

              <div className="flex-grow">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Key Requirements</h3>
                  <ul className="space-y-2">
                    {standard.params.map((param, index) => (
                      <li key={index} className="text-sm bg-gray-50 px-3 py-2 rounded border border-gray-100 flex justify-between items-start group">
                          <span className="font-medium text-gray-700">{param.cat}</span>
                          {param.hint && (
                              <span className="hidden group-hover:inline text-xs text-gray-500 ml-2 italic text-right max-w-[120px]">{param.hint}</span>
                          )}
                      </li>
                    ))}
                  </ul>
              </div>

              <div className="mt-6 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                  <span>
                      Source: {standard.creatorEmail?.includes('qc-validator') ? 'Verified Database' : 'Community'}
                  </span>
                  {standard.endorsedBy?.includes(user?.uid || '') && (
                      <span className="text-green-600 font-bold flex items-center gap-1">
                          ✓ Endorsed
                      </span>
                  )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-16">
            <Link href="/dashboard" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors">
                ← Back to Dashboard
            </Link>
        </div>
      </div>
    </div>
  );
}

// --- CREATOR MODAL COMPONENT ---
function StandardCreator({ user, onClose }: { user: User; onClose: () => void; }) {
  const [countryName, setCountryName] = useState('');
  const [authorityName, setAuthorityName] = useState('');
  const [authorityUrl, setAuthorityUrl] = useState('');
  const [params, setParams] = useState<StandardParam[]>([{ cat: '', hint: '' }]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!countryName || !authorityName || params.some(p => !p.cat)) {
      return alert("Please fill in Country, Authority, and at least one Requirement.");
    }
    
    setIsSaving(true);
    try {
        // Create a URL-friendly ID (e.g., "Saudi Arabia" -> "saudi-arabia")
        const docId = countryName.toLowerCase().trim().replace(/\s+/g, '-');
        
        await setDoc(doc(db, 'nationalStandards', docId), {
            countryName, 
            authorityName, 
            authorityUrl, 
            params: params.filter(p => p.cat),
            createdBy: user.uid, 
            creatorEmail: user.email, 
            endorsementCount: 1,
            endorsedBy: [user.uid],
            createdAt: new Date()
        });
        alert("Thank you! Standard added to the Hub.");
        onClose();
    } catch (error) {
        console.error(error);
        alert("Error creating standard.");
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Contribute Standard</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Country / Region</label>
            <input className="w-full border p-2 rounded-lg" placeholder="e.g. Brazil" value={countryName} onChange={e => setCountryName(e.target.value)} required />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Authority Name</label>
                <input className="w-full border p-2 rounded-lg" placeholder="e.g. INMETRO" value={authorityName} onChange={e => setAuthorityName(e.target.value)} required />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Website (Optional)</label>
                <input className="w-full border p-2 rounded-lg" placeholder="https://..." value={authorityUrl} onChange={e => setAuthorityUrl(e.target.value)} />
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Requirements / Certificates</label>
            {params.map((p, i) => (
                <div key={i} className="flex gap-2 mb-2">
                    <input 
                        className="flex-1 border p-2 rounded-lg text-sm" 
                        placeholder="Requirement Name" 
                        value={p.cat} 
                        onChange={e => { const newP = [...params]; newP[i].cat = e.target.value; setParams(newP); }} 
                        required 
                    />
                    <input 
                        className="flex-1 border p-2 rounded-lg text-sm" 
                        placeholder="Hint/Description" 
                        value={p.hint} 
                        onChange={e => { const newP = [...params]; newP[i].hint = e.target.value; setParams(newP); }} 
                    />
                </div>
            ))}
            <button type="button" onClick={() => setParams([...params, { cat: '', hint: '' }])} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 mt-1">
                + Add Another Requirement
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={isSaving} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {isSaving ? "Saving..." : "Publish to Hub"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore'; // Added 'where'
import { db, auth } from '@/lib/firebase'; // Added 'auth'

interface Report {
  id: string;
  title: string;
  items: { requirement: string; evidenceBefore?: string; evidenceAfter?: string }[];
}

interface ImageInserterProps {
  onSelect: (imageUrl: string, altText: string) => void;
  onClose: () => void;
}

export default function ImageInserter({ onSelect, onClose }: ImageInserterProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      // Safety check: ensure user is logged in
      if (!auth.currentUser) {
          setLoading(false);
          return;
      }

      const reportsCollection = collection(db, 'checklists');
      
      // Query: Get reports created by the current user, ordered by date
      const q = query(
        reportsCollection, 
        where("uid", "==", auth.currentUser.uid), 
        orderBy('createdAt', 'desc')
      );

      try {
        const querySnapshot = await getDocs(q);
        setReports(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report)));
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  const filteredReports = reports.filter(report =>
    report.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
    // Ensure report has at least one item with evidence
    report.items?.some(item => item.evidenceBefore || item.evidenceAfter)
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl h-[80vh] flex flex-col">
        <header className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-lg">Insert Image from a QC Report</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500">✕</button>
        </header>
        <div className="p-4 border-b">
          <input 
            type="text" 
            placeholder="Search reports by title..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" 
          />
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {loading && <p className="text-center text-gray-500">Loading reports...</p>}
          {!loading && filteredReports.length === 0 && <p className="text-center text-gray-500">No reports found with images.</p>}
          
          {filteredReports.map(report => (
            <div key={report.id}>
              <h4 className="font-bold mb-2 text-gray-800">{report.title}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {report.items?.map((item, index) => (
                  // Show 'After' image if available, else 'Before'
                  (item.evidenceAfter || item.evidenceBefore) && (
                    <div 
                        key={index} 
                        className="cursor-pointer group relative" 
                        onClick={() => onSelect(item.evidenceAfter || item.evidenceBefore!, `${report.title} - ${item.requirement}`)}
                    >
                      <img 
                        src={item.evidenceAfter || item.evidenceBefore} 
                        alt={item.requirement} 
                        className="w-full h-24 object-cover rounded border group-hover:ring-2 group-hover:ring-indigo-500 transition-all" 
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                          <span className="text-white text-xs font-bold">Select</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">{item.requirement}</p>
                    </div>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
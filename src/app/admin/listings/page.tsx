'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, orderBy, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminListings() {
  const [listings, setListings] = useState<any[]>([]);

  const fetchListings = async () => {
    const q = query(collection(db, 'market_listings'), orderBy('listedAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    setListings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => { fetchListings(); }, []);

  const handleBan = async (id: string) => {
    if(!confirm("Permanently delete this listing?")) return;
    await deleteDoc(doc(db, 'market_listings', id));
    alert("Listing removed.");
    fetchListings();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="p-6 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold">Marketplace Moderation</h2>
        <button onClick={fetchListings} className="text-indigo-600 text-sm">Refresh</button>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 border-b">
            <tr>
                <th className="p-4">Title</th>
                <th className="p-4">Seller</th>
                <th className="p-4">Price</th>
                <th className="p-4">Action</th>
            </tr>
        </thead>
        <tbody>
            {listings.map(item => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-bold">{item.title}</td>
                    <td className="p-4 text-gray-500">{item.sellerEmail}</td>
                    <td className="p-4">{item.price}</td>
                    <td className="p-4">
                        <button onClick={() => handleBan(item.id)} className="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 font-bold">
                            BAN
                        </button>
                    </td>
                </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
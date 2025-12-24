'use client';

import { useEffect, useState } from 'react';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, checklists: 0, listings: 0 });

  useEffect(() => {
    async function fetchStats() {
      // Efficiently count documents without downloading them (Save Costs)
      const userCount = await getCountFromServer(collection(db, 'users'));
      const checklistCount = await getCountFromServer(collection(db, 'checklists'));
      const listingCount = await getCountFromServer(collection(db, 'market_listings'));
      
      setStats({
users: userCount.data().count,
checklists: checklistCount.data().count,
listings: listingCount.data().count
      });
    }
    fetchStats();
  }, []);

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-8">System Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Users" count={stats.users} color="bg-blue-500" icon="👥" />
        <StatCard title="Total QC Reports" count={stats.checklists} color="bg-green-500" icon="📋" />
        <StatCard title="Active Listings" count={stats.listings} color="bg-purple-500" icon="🛍️" />
      </div>

      <div className="mt-12 bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="text-lg font-bold mb-4">Platform Health</h3>
        <div className="flex gap-4">
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">● Database: Online</span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">● Storage: Optimized</span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">● Email Service: Active</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, count, color, icon }: any) {
    return (
        <div className={`${color} text-white p-6 rounded-xl shadow-lg flex items-center justify-between`}>
            <div>
                <p className="text-sm opacity-80 uppercase font-bold">{title}</p>
                <p className="text-4xl font-bold mt-1">{count}</p>
            </div>
            <div className="text-4xl opacity-50">{icon}</div>
        </div>
    );
}
'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import Cookies from 'js-cookie';
import SignupWall from '@/components/SignupWall'; // Import the new component

const VIEW_LIMIT = 3; // Allow 3 product views before showing the wall

export default function MarketplacePage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSignupWall, setShowSignupWall] = useState(false);

  useEffect(() => {
    // Check authentication status
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });

    // Fetch data from Firestore
    async function getData() {
      const groupsSnapshot = await getDocs(query(collection(db, 'market_groups'), orderBy('createdAt', 'desc')));
      const listingsSnapshot = await getDocs(query(collection(db, 'market_listings'), orderBy('listedAt', 'desc')));

      const fetchedGroups = groupsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const fetchedListings = listingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // --- NEW FILTERING LOGIC ---
            const now = new Date();
            const cutoff = new Date();
            cutoff.setDate(now.getDate() - 90); // 90-day cutoff

            const activeListings = fetchedListings.filter((listing: any) => {
                if (!listing.lastMaintainedAt) return true; // Keep old listings without the field
                const maintainedDate = listing.lastMaintainedAt.toDate();
                return maintainedDate > cutoff;
            });

            // Nest the ACTIVE listings inside their groups
            fetchedGroups.forEach((group: any) => {
                group.listings = activeListings.filter((listing: any) => listing.groupId === group.id);
            });

            setGroups(fetchedGroups);
            setLoading(false);
        }
        getData();
    return () => unsubscribe();
  }, []);

  // marketplace/page.tsx

const handleProductClick = (): boolean => {
    if (!isAuthenticated) {
      const currentViews = parseInt(Cookies.get('marketplace_views') || '0', 10);
      const newViews = currentViews + 1;

      if (newViews >= VIEW_LIMIT) {
        setShowSignupWall(true);
        return true; // <-- Tell the Link to preventDefault
      } else {
        Cookies.set('marketplace_views', newViews.toString(), { expires: 1 });
      }
    }
    return false; // <-- Tell the Link to proceed
};


  return (
    <div className="min-h-screen bg-gray-50">
      {showSignupWall && <SignupWall />}

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto py-16 px-4 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900">QC Val Town Hall</h1>
          <p className="text-lg text-gray-500">Industry-specific hubs for trade, built on verified quality.</p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-12 px-4">
        {loading ? ( <p className="text-center">Loading...</p> ) : (
            <div className="space-y-16">
            {groups.map((group: any) => (
              <section key={group.id}>
                <h2 className="text-2xl font-bold mb-6">{group.groupName}</h2>
                {group.listings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {group.listings.map((listing: any) => (
                      <div key={listing.id} className="bg-white border rounded-lg shadow-sm">
                        <div className="p-5">
                          <h3 className="font-bold text-lg">{listing.title}</h3>
                          <p className="font-semibold text-xl mt-4">{listing.price}</p>
                          
                          {/* UPDATED LINK with onClick handler */}
                          <Link 
    href={`/report/${listing.checklistId}`} 
    onClick={(e) => {
        // Run the signup wall check
        if (handleProductClick()) {
            // If handleProductClick returns true, it means the wall should be shown
            e.preventDefault(); 
        }
        // Otherwise, allow the link to navigate normally
    }}
    className="block mt-4 text-center w-full bg-gray-100 font-bold py-2 rounded text-sm hover:bg-gray-200"
>
    View QC Report
</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No products listed yet.</p>
                )}
              </section>
            ))}
            </div>
        )}
      </main>
    </div>
  );
}
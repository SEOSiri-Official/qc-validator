'use client';

import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ListingActionsProps {
  listingId: string;
}

export default function ListingActions({ listingId }: ListingActionsProps) {

  const handleUpdate = async () => {
    const newPrice = prompt("Enter new price:");
    if (newPrice) {
      const listingRef = doc(db, 'market_listings', listingId);
      // Also update the maintenance timestamp
      await updateDoc(listingRef, { 
          price: newPrice,
          lastMaintainedAt: serverTimestamp() 
      });
      alert("Price updated and listing refreshed!");
      window.location.reload();
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to permanently delete this listing?")) {
      const listingRef = doc(db, 'market_listings', listingId);
      await deleteDoc(listingRef);
      alert("Listing deleted!");
      window.location.reload();
    }
  };

  return (
    <div className="flex justify-end gap-4 mt-2 border-t pt-2">
      <button onClick={handleUpdate} className="text-xs font-bold text-blue-600 hover:underline">Update Price</button>
      <button onClick={handleDelete} className="text-xs font-bold text-red-600 hover:underline">Delete Listing</button>
    </div>
  );
}
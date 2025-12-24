'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function NotificationCenter({ id }: { id?: string }) {

  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = async (notif: any) => {
    // Mark as read
    const notifRef = doc(db, 'notifications', notif.id);
    await updateDoc(notifRef, { isRead: true });

    // Navigate to the relevant page
    if (notif.link) {
      router.push(notif.link);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 text-gray-400 hover:text-gray-600">
        🔔
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border z-50">
          <div className="p-4 font-bold border-b">Notifications</div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="p-4 text-sm text-gray-500">No notifications yet.</p>
            )}
            {notifications.map(notif => (
              <button
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`w-full text-left p-4 border-b hover:bg-gray-50 ${!notif.isRead ? 'bg-indigo-50' : ''}`}
              >
                <p className="font-semibold text-sm">{notif.title}</p>
                <p className="text-xs text-gray-600">{notif.message}</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {new Date(notif.createdAt?.seconds * 1000).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
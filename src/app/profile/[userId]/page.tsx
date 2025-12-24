// This page fetches data on the server for SEO
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notFound } from 'next/navigation';
import { documentId } from 'firebase/firestore';

async function getProfileData(userId: string) {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return null;
    const userData = userSnap.data();

    // Fetch the badge details for the badges the user has earned
   if (userData.achievedBadges && userData.achievedBadges.length > 0) {
    const badgesQuery = query(collection(db, 'badges'), where(documentId(), 'in', userData.achievedBadges));
    const badgesSnap = await getDocs(badgesQuery);
    userData.badges = badgesSnap.docs.map(d => d.data());
} else {
        userData.badges = [];
    }

    return userData;
}

export default async function ProfilePage({ params }: { params: { userId: string } }) {
    const profile = await getProfileData(params.userId);
    if (!profile) notFound();

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <header className="text-center mb-12">
                <h1 className="text-4xl font-bold">{profile.email.split('@')[0]}</h1>
                {profile.isDomainVerified && <p className="text-green-600 font-semibold">✓ Verified Organization</p>}
            </header>

            <section>
                <h2 className="text-2xl font-bold mb-6">🏆 Badges Earned</h2>
                {profile.badges.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {profile.badges.map((badge: any, index: number) => (
                            <div key={index} className="bg-white border rounded-lg p-4 text-center shadow-sm">
                                <div className="text-4xl mb-2">{badge.iconUrl}</div>
                                <h3 className="font-bold text-gray-800">{badge.title}</h3>
                                <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No badges earned yet. Start creating reports!</p>
                )}
            </section>
        </div>
    );
}
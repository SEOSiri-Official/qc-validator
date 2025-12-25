'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

// --- HELPER FUNCTION (can be moved to a utils file) ---
const calculateAnalytics = (checklists: any[], listings: any[]) => {
    if (!checklists || checklists.length === 0) {
        return {
            totalReports: 0, completedContracts: 0, topFailure: 'N/A',
            avgTimeToSignDays: 0, activeListings: listings.length
        };
    }

    const totalReports = checklists.length;
    const completedContracts = checklists.filter(c => c.agreementStatus === 'completed').length;
    
    // Most Common Failure Point
    const allFailedItems = checklists.flatMap(c => c.items?.filter((item: any) => item.status === 'fail') || []);
    const failureCounts = allFailedItems.reduce((acc: any, item: any) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
    }, {});
    const topFailure = Object.keys(failureCounts).sort((a, b) => failureCounts[b] - failureCounts[a])[0];

    // Deal Velocity Calculation
    const signedDeals = checklists.filter(c => c.agreementStatus === 'completed' && c.createdAt && c.signedAt);
    const totalSigningTime = signedDeals.reduce((acc, deal) => {
        const created = (deal.createdAt as Timestamp).toDate();
        const signed = (deal.signedAt as Timestamp).toDate();
        return acc + (signed.getTime() - created.getTime());
    }, 0);
    
    const avgTimeToSignDays = signedDeals.length > 0
        ? Math.round(totalSigningTime / signedDeals.length / (1000 * 60 * 60 * 24))
        : 0;
    
    return {
        totalReports,
        completedContracts,
        topFailure: topFailure || 'N/A',
        avgTimeToSignDays,
        activeListings: listings.length,
    };
};

// --- SKELETON LOADER COMPONENT ---
const AnalyticsSkeleton = () => (
    <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-200 h-32 rounded-lg"></div>
        <div className="bg-gray-200 h-32 rounded-lg"></div>
        <div className="bg-gray-200 h-32 rounded-lg"></div>
        <div className="bg-gray-200 h-32 rounded-lg"></div>
        <div className="bg-gray-200 h-32 rounded-lg"></div>
    </div>
);


// --- MAIN PAGE COMPONENT ---
export default function AnalyticsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                fetchData(currentUser.uid);
            } else {
                router.push('/auth?redirect=/analytics');
            }
        });
        return () => unsubscribe();
    }, [router]);

    const fetchData = async (userId: string) => {
        try {
            const checklistsQuery = query(collection(db, 'checklists'), where('uid', '==', userId));
            const listingsQuery = query(collection(db, 'market_listings'), where('sellerId', '==', userId));
            
            const [checklistSnapshot, listingSnapshot] = await Promise.all([
                getDocs(checklistsQuery),
                getDocs(listingsQuery)
            ]);

            const checklists = checklistSnapshot.docs.map(doc => doc.data());
            const listings = listingSnapshot.docs.map(doc => doc.data());

            setStats(calculateAnalytics(checklists, listings));
        } catch (error) {
            console.error("Error fetching analytics data:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-12 px-4">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
                <p className="text-gray-500 mt-1">An overview of your QC and Marketplace activity.</p>
            </header>

            {loading ? <AnalyticsSkeleton /> : (
                stats ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Stat Card */}
                        <div className="bg-white p-6 rounded-xl border shadow-sm">
                            <p className="text-sm font-semibold text-gray-500">Total QC Reports</p>
                            <p className="text-5xl font-bold mt-2 text-gray-800">{stats.totalReports}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border shadow-sm">
                            <p className="text-sm font-semibold text-gray-500">Completed Contracts</p>
                            <p className="text-5xl font-bold mt-2 text-green-600">{stats.completedContracts}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border shadow-sm">
                            <p className="text-sm font-semibold text-gray-500">Avg. Deal Velocity</p>
                            <p className="text-5xl font-bold mt-2 text-blue-600">{stats.avgTimeToSignDays} <span className="text-2xl">Days</span></p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border shadow-sm">
                            <p className="text-sm font-semibold text-gray-500">Active Marketplace Listings</p>
                            <p className="text-5xl font-bold mt-2 text-gray-800">{stats.activeListings}</p>
                        </div>
                        <div className="bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm">
                            <p className="text-sm font-semibold text-red-700">Top QC Failure Point</p>
                            <p className="text-3xl font-bold mt-2 text-red-900">{stats.topFailure}</p>
                            <p className="text-xs text-red-500 mt-1">Focus on improving this area to increase your score.</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                        <p className="text-gray-400">No data available to generate analytics yet. Create a report to get started!</p>
                    </div>
                )
            )}
        </div>
    );
}
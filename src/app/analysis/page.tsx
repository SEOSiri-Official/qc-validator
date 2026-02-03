'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, getDocs, Timestamp, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { getAiCompletion, ProviderName } from '@/lib/ai';
import Tooltip from '@/components/Tooltip';
import { motion } from 'framer-motion';

// --- TYPE DEFINITIONS ---
interface ChecklistItem {
  category: string;
  status: 'pending' | 'pass' | 'fail';
}

interface Checklist {
  id: string;
  uid: string; // Creator (Seller) ID
  buyerUid?: string; // Buyer ID
  buyerEmail?: string;
  score: number;
  items: ChecklistItem[];
  agreementStatus?: 'pending_qc' | 'ready_to_sign' | 'party_a_signed' | 'completed' | 'pending_buyer' | 'drafting' | 'cancelled';
  qcResult?: 'PASS' | 'FAIL' | 'CONDITIONAL';
  createdAt?: Timestamp;
  completedAt?: Timestamp;
  title: string;
  industry: string;
  standard: string;
}

interface MarketListing {
  id: string;
  sellerId: string;
}

interface Stats {
  totalReports: number;
  completedContracts: number;
  avgTimeToSignDays: number;
  activeListings: number;
  topFailure: string;
  totalLeads: number;
  pipelineValue: number;
  dealsLost: number;
  conversionRate: string;
  businessHealth: number;
  userRole: 'Seller' | 'Buyer' | 'Hybrid'; // New stat to adjust UI context
}

// --- SKELETON LOADER ---
const AnalyticsSkeleton = () => (
    <div className="animate-pulse space-y-8 max-w-7xl mx-auto px-4 py-8">
        <div className="h-10 bg-gray-200 w-1/3 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <div key={`top-${i}`} className="bg-gray-200 h-28 rounded-xl"></div>)}
        </div>
        <div className="bg-gray-200 h-72 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => <div key={`main-${i}`} className="bg-gray-200 h-64 rounded-xl"></div>)}
        </div>
    </div>
);

// --- FINANCIAL IMPACT ENGINE (Dual Role) ---
const ProfitBoomChart = ({ leads, role }: { leads: number, role: string }) => {
    const [simulatedCount, setSimulatedCount] = useState(leads > 0 ? leads : 5); 
    
    // Logic: 
    // Sellers save on CAC (Customer Acquisition Cost) -> Avg $35/lead
    // Buyers save on Sourcing Cost (Vetting/Travel) -> Avg $50/supplier
    const BASE_SAVING = role.includes('Buyer') ? 50 : 35;
    
    const dailySaved = simulatedCount * BASE_SAVING;
    const monthlySaved = dailySaved * 30;
    const yearlySaved = dailySaved * 365;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl border border-slate-700 overflow-hidden relative"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 relative z-10">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span>🚀 Financial Impact Engine</span>
                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border border-emerald-500/30">
                            {role} Mode
                        </span>
                    </h2>
                    <p className="text-slate-400 text-xs mt-1">
                        {role.includes('Buyer') 
                            ? `Savings on Supplier Vetting & Sourcing (Avg $${BASE_SAVING} vs $0).` 
                            : `Savings on Lead Acquisition & Sales Friction (Avg $${BASE_SAVING} vs $0).`}
                    </p>
                </div>
                
                <div className="mt-4 md:mt-0 w-full md:w-64 bg-slate-800/80 p-3 rounded-lg border border-slate-600">
                    <label className="text-xs text-slate-300 flex justify-between mb-2">
                        <span>Activity Level:</span>
                        <span className="text-indigo-400 font-bold">{simulatedCount} Deals/Day</span>
                    </label>
                    <input 
                        type="range" 
                        min="1" 
                        max="100" 
                        value={simulatedCount} 
                        onChange={(e) => setSimulatedCount(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                <div className="col-span-1 bg-slate-800/50 p-5 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                    <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider border-b border-slate-700 pb-2">Cost Analysis</h3>
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Traditional Cost</span>
                            <span className="text-red-400 font-mono">${BASE_SAVING.toLocaleString()}/deal</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">QCVal Platform</span>
                            <span className="text-emerald-400 font-mono font-bold">$0/deal</span>
                        </div>
                        <div className="pt-3 border-t border-slate-700 mt-2">
                            <p className="text-xs text-slate-500 mb-1">Projected Annual Value</p>
                            <p className="text-3xl font-bold text-emerald-400 font-mono">${yearlySaved.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="col-span-1 lg:col-span-2 flex flex-col justify-center space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-400">
                            <span>Monthly Value Generated</span>
                            <span>${monthlySaved.toLocaleString()}</span>
                        </div>
                        <div className="h-10 bg-slate-700/50 rounded-full overflow-hidden flex relative border border-slate-600">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 flex items-center px-4"
                            >
                                <span className="font-bold text-white text-xs whitespace-nowrap">Net Margin Increase</span>
                            </motion.div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-400">
                            <span>Yearly Growth Impact (YoY)</span>
                            <span className="text-emerald-400 font-bold">+${yearlySaved.toLocaleString()}</span>
                        </div>
                        <div className="h-12 bg-slate-700/50 rounded-full overflow-hidden flex relative border border-slate-600">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 flex items-center px-4"
                            >
                                <span className="font-bold text-white text-sm whitespace-nowrap">Exponential Scaling 🚀</span>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// --- MAIN PAGE COMPONENT ---
export default function AnalyticsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    
    // State to hold merged data from both roles
    const [createdProjects, setCreatedProjects] = useState<Checklist[]>([]);
    const [buyingProjects, setBuyingProjects] = useState<Checklist[]>([]);
    const [listings, setListings] = useState<MarketListing[]>([]);

    // AI & BYOK States
    const [aiInsight, setAiInsight] = useState('');
    const [isGettingInsight, setIsGettingInsight] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<ProviderName>('OpenAI');
    const [availableKeys, setAvailableKeys] = useState<{ [key in ProviderName]?: boolean }>({});

    const router = useRouter();

    // --- AUTH ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                if (typeof window !== 'undefined') {
                    setAvailableKeys({
                        'OpenAI': !!localStorage.getItem('openai_key'),
                        'Google AI': !!localStorage.getItem('google_key'),
                        'Anthropic': !!localStorage.getItem('anthropic_key')
                    });
                }
            } else {
                router.push('/auth?redirect=/analysis');
            }
        });
        return () => unsubscribe();
    }, [router]);

    // --- DUAL ROLE DATA SUBSCRIPTION ---
    useEffect(() => {
        if (!user) return;
        setLoading(true);

        // 1. Fetch Projects where User is SELLER (Creator)
        const qCreated = query(collection(db, 'checklists'), where('uid', '==', user.uid));
        const unsubCreated = onSnapshot(qCreated, (snap) => {
            setCreatedProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Checklist)));
        });

        // 2. Fetch Projects where User is BUYER
        const qBuying = query(collection(db, 'checklists'), where('buyerUid', '==', user.uid));
        const unsubBuying = onSnapshot(qBuying, (snap) => {
            setBuyingProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Checklist)));
        });

        // 3. Fetch Listings (Seller Only)
        const qListings = query(collection(db, 'market_listings'), where('sellerId', '==', user.uid));
        const unsubListings = onSnapshot(qListings, (snap) => {
            setListings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketListing)));
        });

        return () => {
            unsubCreated();
            unsubBuying();
            unsubListings();
        };
    }, [user]);

    // --- COMBINE & CALCULATE STATS ---
    useEffect(() => {
        if (!user) return;

        // Merge arrays (handle duplicates if any, though ID check prevents it)
        const allChecklists = [...createdProjects, ...buyingProjects];
        // Remove duplicates just in case
        const uniqueChecklists = Array.from(new Map(allChecklists.map(item => [item.id, item])).values());

        // Determine Primary Role for UI
        const role = createdProjects.length >= buyingProjects.length ? 'Seller' : 'Buyer';
        const displayRole = createdProjects.length > 0 && buyingProjects.length > 0 ? 'Hybrid' : role;

        setStats(calculateAnalytics(uniqueChecklists, listings, displayRole));
        setLoading(false);

    }, [createdProjects, buyingProjects, listings, user]);

    
    // --- ANALYTICS LOGIC ---
    const calculateAnalytics = (checklists: Checklist[], listings: MarketListing[], role: string): Stats => {
        if (checklists.length === 0) {
            return { 
                totalReports: 0, completedContracts: 0, topFailure: 'N/A', avgTimeToSignDays: 0, activeListings: listings.length,
                totalLeads: 0, pipelineValue: 0, dealsLost: 0, conversionRate: '0%', businessHealth: 50, userRole: 'Seller'
            };
        }
        
        const totalReports = checklists.length;
        
        // CRM Metrics
        const completedContracts = checklists.filter(c => c.agreementStatus === 'completed').length;
        
        // Leads: For Seller (Invites sent), For Buyer (Invites received)
        const leads = checklists.filter(c => c.agreementStatus !== 'drafting').length;
        
        const pipeline = checklists.filter(c => 
            ['pending_qc', 'ready_to_sign', 'party_a_signed', 'pending_buyer'].includes(c.agreementStatus || '')
        ).length;
        
        const lost = checklists.filter(c => c.agreementStatus === 'cancelled' || c.qcResult === 'FAIL').length;
        
        const conversionRateVal = leads > 0 ? (completedContracts / leads) * 100 : 0;
        const conversionRate = `${conversionRateVal.toFixed(1)}%`;

        // Health Score
        let health = 50; 
        health += (conversionRateVal * 0.5);
        if (pipeline > 0) health += 10;
        if (listings.length > 0) health += 5;
        if (lost > (completedContracts * 2)) health -= 15;
        health = Math.min(Math.max(Math.round(health), 0), 100);

        // QC Failure Analysis
        const failureCounts: { [key: string]: number } = {};
        checklists.forEach(checklist => {
            if (checklist.score < 100 && Array.isArray(checklist.items)) {
                checklist.items.forEach(item => {
                    if (item.status === 'fail') {
                        failureCounts[item.category] = (failureCounts[item.category] || 0) + 1;
                    }
                });
            }
        });
        const topFailure = Object.keys(failureCounts).sort((a, b) => failureCounts[b] - failureCounts[a])[0] || 'N/A';

        // Velocity
        const signedDeals = checklists.filter(c => c.agreementStatus === 'completed' && c.createdAt && c.completedAt);
        const totalSigningTime = signedDeals.reduce((acc, deal) => {
            if (deal.createdAt && deal.completedAt) {
                const created = deal.createdAt.toDate();
                const signed = deal.completedAt.toDate();
                return acc + (signed.getTime() - created.getTime());
            }
            return acc;
        }, 0);
        const avgTimeToSignDays = signedDeals.length > 0 ? Math.round(totalSigningTime / signedDeals.length / (1000 * 60 * 60 * 24)) : 0;

        return { 
            totalReports, completedContracts, topFailure, avgTimeToSignDays, activeListings: listings.length,
            totalLeads: leads, pipelineValue: pipeline, dealsLost: lost, conversionRate, businessHealth: health,
            userRole: role as any
        };
    };

    // --- AI HANDLER ---
    const getAiSuggestion = async () => {
        let apiKey = '';
        if (selectedProvider === 'OpenAI') apiKey = localStorage.getItem('openai_key') || '';
        else if (selectedProvider === 'Google AI') apiKey = localStorage.getItem('google_key') || '';
        else if (selectedProvider === 'Anthropic') apiKey = localStorage.getItem('anthropic_key') || '';

        if (!apiKey) {
            alert(`Please set your ${selectedProvider} API key in Settings to use this feature.`);
            return;
        }
        if (!stats?.topFailure || stats.topFailure === 'N/A') {
            alert("No failure data available to generate suggestions. Create a report with some failed items first.");
            return;
        }

        setIsGettingInsight(true);
        setAiInsight('');
        
        // Contextual Prompt based on Role
        const roleContext = stats.userRole.includes('Buyer') ? "I am a Buyer sourcing products." : "I am a Supplier/Manufacturer.";
        const prompt = `Act as a Global Quality Control Expert. ${roleContext} My projects are facing consistent failures in the category: "${stats.topFailure}". Provide 3 specific, internationally compliant (ISO/ASTM context) recommendations to rectify this. Format as HTML-ready bullet points.`;

        try {
            const result = await getAiCompletion(prompt, selectedProvider, apiKey);
            setAiInsight(result);
        } catch (e: any) {
            alert(`Failed to get AI insight from ${selectedProvider}: ${e.message}`);
        } finally {
            setIsGettingInsight(false);
        }
    };
    
    const openChatGptAssistant = () => {
        if (!stats?.topFailure || stats.topFailure === 'N/A') return;
        const promptText = `My top quality control failure point is: "${stats.topFailure}". Please give me three actionable suggestions to fix this.`;
        const encodedPrompt = encodeURIComponent(promptText);
        const gptUrl = `https://chatgpt.com/g/g-696c7a5dc4e081919fa40b90ab298215-qc-val-global-assistant?q=${encodedPrompt}`;
        window.open(gptUrl, '_blank');
    };

    if (loading) return <AnalyticsSkeleton />;
    
    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-10">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Business Intelligence</h1>
                <p className="text-gray-500 mt-2">
                    Real-time analysis for <span className="font-bold text-indigo-600">{stats?.userRole}s</span>.
                </p>
            </div>

            {/* --- 1. BUSINESS PIPELINE (CRM) --- */}
            <section className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span>💼 Pipeline Health</span>
                    <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">Live</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="p-5 bg-blue-50/50 rounded-xl border border-blue-100">
                        <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Total Opportunities</p>
                        <p className="text-4xl font-extrabold text-blue-900 mt-2">{stats?.totalLeads}</p>
                        <p className="text-xs text-blue-500 mt-2">Active Projects</p>
                    </div>
                    <div className="p-5 bg-orange-50/50 rounded-xl border border-orange-100">
                        <p className="text-sm font-semibold text-orange-600 uppercase tracking-wide">In Progress</p>
                        <p className="text-4xl font-extrabold text-orange-900 mt-2">{stats?.pipelineValue}</p>
                        <p className="text-xs text-orange-500 mt-2">Pending Signature/QC</p>
                    </div>
                    <div className="p-5 bg-green-50/50 rounded-xl border border-green-100">
                        <p className="text-sm font-semibold text-green-600 uppercase tracking-wide">Completed Deals</p>
                        <p className="text-4xl font-extrabold text-green-900 mt-2">{stats?.completedContracts}</p>
                        <p className="text-xs text-green-600 mt-2 font-bold">Success Rate: {stats?.conversionRate}</p>
                    </div>
                    <div className="p-5 bg-gray-50/50 rounded-xl border border-gray-200">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Failed / Cancelled</p>
                        <p className="text-4xl font-extrabold text-gray-700 mt-2">{stats?.dealsLost}</p>
                        <p className="text-xs text-gray-400 mt-2">Action Required</p>
                    </div>
                </div>
            </section>

            {/* --- 2. PROFIT BOOM ENGINE (Adapts to Role) --- */}
            <section>
                <ProfitBoomChart leads={stats?.totalLeads || 0} role={stats?.userRole || 'Seller'} />
            </section>

            {/* --- 3. OPERATIONAL METRICS & HEALTH --- */}
            {stats && (
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-sm font-semibold text-gray-500">Avg. Deal Velocity</p>
                        <p className="text-5xl font-bold mt-3 text-indigo-600">{stats.avgTimeToSignDays} <span className="text-lg text-gray-400 font-normal">Days</span></p>
                        <p className="text-xs text-gray-400 mt-2">From creation to completion</p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-sm font-semibold text-gray-500">Market Listings</p>
                        <p className="text-5xl font-bold mt-3 text-gray-800">{stats.activeListings}</p>
                        <p className="text-xs text-gray-400 mt-2">Publicly Visible</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <span className="text-8xl">❤️</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-500">Business Health Score</p>
                        <div className="flex items-baseline gap-2 mt-3">
                            <p className={`text-5xl font-bold ${stats.businessHealth > 75 ? 'text-green-600' : stats.businessHealth > 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {stats.businessHealth}
                            </p>
                            <span className="text-gray-400">/ 100</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 mt-4 overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${stats.businessHealth}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className={`h-2 rounded-full ${stats.businessHealth > 75 ? 'bg-green-500' : stats.businessHealth > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                            ></motion.div>
                        </div>
                    </div>
                </section>
            )}

            {/* --- 4. INTELLIGENT QC INSIGHTS (Failure Analysis) --- */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Control Panel */}
                <div className="bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm col-span-1 h-fit">
                    <p className="text-sm font-bold text-red-800 uppercase tracking-wider mb-1">Primary Failure Point</p>
                    <p className="text-3xl font-extrabold text-red-900 mb-2">{stats?.topFailure}</p>
                    <p className="text-xs text-red-600/80 mb-6 leading-relaxed">
                        {stats?.userRole.includes('Buyer') 
                            ? "This is the most common reason you are rejecting suppliers."
                            : "This is the most frequent reason your products are failing."}
                    </p>
                    
                    {/* BYOK SELECTOR AND INPUT */}
                    <div className="bg-white p-3 rounded-lg border border-red-100 mb-4 shadow-sm">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Select AI Expert (BYOK)</label>
                        <select 
                            value={selectedProvider}
                            onChange={(e) => setSelectedProvider(e.target.value as ProviderName)}
                            className="w-full p-2 text-sm bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-red-500 focus:outline-none font-medium text-gray-700 cursor-pointer"
                        >
                            <option value="OpenAI">OpenAI (GPT-4)</option>
                            <option value="Google AI">Google (Gemini)</option>
                            <option value="Anthropic">Anthropic (Claude)</option>
                        </select>
                        
                        {/* --- NEW: KEY INPUT SECTION --- */}
                        {!availableKeys[selectedProvider] && (
                            <div className="mt-3">
                                <p className="text-xs text-red-500 mb-1">
                                    No API Key found for {selectedProvider}.
                                </p>
                                <input
                                    type="password"
                                    placeholder={`Paste Your ${selectedProvider} API Key Here...`}
                                    onBlur={(e) => {
                                        // Save the key when user focuses away (onBlur)
                                        const keyName = selectedProvider.toLowerCase().replace(' ', '_') + '_key';
                                        if (e.target.value) {
                                            localStorage.setItem(keyName, e.target.value);
                                            setAvailableKeys(prev => ({ ...prev, [selectedProvider]: true }));
                                        }
                                    }}
                                    className="w-full p-2 text-xs border border-red-300 rounded-md shadow-inner"
                                />
                            </div>
                        )}
                        {/* --- END NEW INPUT --- */}
                    </div>

                    <div className="space-y-3">
                        {/* Primary Action */}
                        <Tooltip text={availableKeys[selectedProvider] ? `Generate fix using ${selectedProvider}` : `No API Key found for ${selectedProvider}. Check settings.`}>
                            <button 
                                onClick={getAiSuggestion}
                                disabled={isGettingInsight || stats?.topFailure === 'N/A'}
                                className="w-full bg-red-600 text-white text-sm font-bold px-4 py-3 rounded-lg hover:bg-red-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                {isGettingInsight ? <span className="animate-spin">🔄</span> : '⚡'} 
                                {isGettingInsight ? 'Analyzing...' : 'Get Instant Fix'}
                            </button>
                        </Tooltip>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-red-200"></div>
                            <span className="flex-shrink-0 mx-2 text-gray-400 text-[10px] font-bold">OR USE FREE</span>
                            <div className="flex-grow border-t border-red-200"></div>
                        </div>

                        {/* Fallback Action */}
                        <Tooltip text="Open our specialized QC Assistant in ChatGPT (Free/Plus)">
                            <button 
                                onClick={openChatGptAssistant}
                                className="w-full bg-white text-gray-700 border border-gray-300 text-sm font-bold px-4 py-3 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm flex items-center justify-center gap-2 group"
                            >
                                <span className="group-hover:scale-110 transition-transform">🤖</span> Launch QC Assistant
                            </button>
                        </Tooltip>
                    </div>
                </div>

                {/* Insight Result Area */}
                <div className="lg:col-span-2">
                    {aiInsight ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="h-full bg-gradient-to-br from-indigo-50 to-white p-8 rounded-xl border border-indigo-100 shadow-sm"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-indigo-600 text-white p-2 rounded-lg shadow-lg shadow-indigo-200">⚡</div>
                                <div>
                                    <h4 className="font-bold text-indigo-900 text-lg">AI Strategic Recommendations</h4>
                                    <p className="text-xs text-indigo-500 font-medium">Generated via {selectedProvider} for "{stats?.topFailure}"</p>
                                </div>
                            </div>
                            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: aiInsight.replace(/\n/g, '<br />') }} />
                        </motion.div>
                    ) : (
                        <div className="h-full min-h-[300px] flex flex-col items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
                            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                <span className="text-4xl">💡</span>
                            </div>
                            <h4 className="font-bold text-gray-900 text-lg">No Insights Generated Yet</h4>
                            <p className="text-sm text-gray-500 max-w-xs mt-2 leading-relaxed">
                                Select your AI provider on the left and click <strong>"Get Instant Fix"</strong> to receive enterprise-grade solutions for your quality issues.
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
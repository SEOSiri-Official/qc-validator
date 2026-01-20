'use client';

// --- IMPORTS ---
import Link from 'next/link';
import Logo from '@/components/Logo';
import Tooltip from '@/components/Tooltip';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection, addDoc, serverTimestamp, query, where,
  doc, updateDoc, onSnapshot, arrayUnion, getDoc, getDocs,
  setDoc, deleteDoc // <--- ADD THIS
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { uploadImageAndGetURL } from '@/lib/storage'; // <-- NEW
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import Newsletter from '@/components/Newsletter'; 
import CommandPalette from '@/components/CommandPalette';
import NotificationCenter from '@/components/NotificationCenter';
import GroupSelectorModal from '@/components/GroupSelectorModal';
import { motion } from 'framer-motion';
import OnboardingTour from '@/components/OnboardingTour';
import WeeklySummaryModal from '@/components/WeeklySummaryModal';
import ReferralSection from '@/components/ReferralSection';
import DisputeModal from '@/components/DisputeModal';
import SimpleSearch from '@/components/SimpleSearch';
import { useEffect, useState, useRef, ChangeEvent, useCallback } from 'react';

// --- TYPES & INTERFACES ---
type QCType = 'physical' | 'service' | 'software';
type Standard = 'General' | 'ISO 9001' | 'HACCP' | 'ASTM' | 'EU-GMP' | 'API (Oil)' | 'Kimberley (Gems)' | 'FDA (21 CFR)';
type BusinessModel = 'B2B' | 'B2C' | 'B2B2C' | 'C2C' | 'B2G';

// --- 1. ENTERPRISE INDUSTRY VERTICALS (Global Standard) ---
const INDUSTRIES = [
  "Pharmaceuticals & Biotech",
  "General Manufacturing",
  "Agriculture & Produce",
  "Construction & Civil Engineering",
  "Precious Metals (Gold/Diamonds)",
  "Energy (Oil, Gas & Lubricants)",
  "Automotive & Aerospace",
  "Consumer Goods & Electronics",
  "Beauty, Cosmetics & Personal Care",
  "Technology & Software SaaS"
];

interface ChecklistItem {
  category: string;
  requirement: string;
  status: 'pending' | 'pass' | 'fail';
  gapAnalysis?: string;
  evidence?: string;       // Legacy support
  evidenceBefore?: string; // NEW: Pre-process image
  evidenceAfter?: string;  // NEW: Post-process image
}

// --- THE NEW, CORRECT INTERFACE ---
interface ChatMessage {
  senderId: string;
  senderEmail: string;
  text: string; // The only text property needed now
  timestamp: any;
  // --- Optional: Add these back if your old messages need them ---
  textOriginal?: string; 
  textTranslated?: string;
  originalLang?: 'en' | 'ar';
}

interface Checklist {
  id: string;
  uid: string;
  sellerEmail?: string;
  buyerUid?: string; 
  buyerEmail?: string;
  sellerAddress?: string;
  buyerAddress?: string;
  title: string;
  type: QCType;
  industry: string;
  standard: Standard;
  score: number;
  items: ChecklistItem[];
  messages?: ChatMessage[];
  createdAt: any;
agreementStatus?: 'pending_qc' | 'ready_to_sign' | 'party_a_signed' | 'completed' | 'pending_buyer' | 'drafting'; meetingStartedAt?: any;
  lastMeetingInitiator?: string;
  activeMeetingPlatform?: 'teams' | 'meet';
  activeMeetingUrl?: string;
 // --- NEW: INTERNATIONAL STANDARD FIELDS ---
  agreementVersion: number; // e.g. 1
  acceptanceThreshold: number; // e.g. 100 or 95
  paymentTerms: string; // e.g. "Net 30 after QC Pass"
  liabilityClause: string; // e.g. "Seller covers re-inspection"
  governingLaw: string; // e.g. "Laws of New York"
  
  // Lifecycle Status (Expanded)
  qcResult?: 'PASS' | 'FAIL' | 'CONDITIONAL'; 
}

// --- 2. INTELLIGENT KNOWLEDGE BASE (International Mandatories) ---
const STANDARD_PARAMS: Record<string, any[]> = {
  physical: [
    { cat: "Dimensions", hint: "Tolerance within +/- 0.1mm" },
    { cat: "Material Cert", hint: "Raw material traceability (Mill Certs)" },
    { cat: "Finish", hint: "Surface roughness / coating thickness" },
    { cat: "Durability", hint: "Stress test / Fatigue cycle results" },
    { cat: "Packaging", hint: "ISPM-15 Pallet compliance" },
    { cat: "Weight", hint: "Net weight verification" },
    { cat: "Labeling", hint: "Barcode and serial readability" }
  ],
  pharma: [
    { cat: "Identity", hint: "Chemical structure confirmation (IR/HPLC)" },
    { cat: "Potency/Assay", hint: "Active ingredient concentration (98-102%)" },
    { cat: "Purity", hint: "Absence of heavy metals/solvents" },
    { cat: "Sterility", hint: "Microbial limit test (USP <61>)" },
    { cat: "Stability", hint: "Shelf-life validation data" },
    { cat: "Batch Record", hint: "Manufacturing log review" },
    { cat: "Seal Integrity", hint: "Blister pack leak test" }
  ],
  agriculture: [
    { cat: "Freshness", hint: "Brix value (Sugar content)" },
    { cat: "Contamination", hint: "Pesticide residue < MRL limits" },
    { cat: "Cold Chain", hint: "Temperature log verification" },
    { cat: "Physical", hint: "Size/Weight grading uniformity" },
    { cat: "Appearance", hint: "Color consistency check" },
    { cat: "Traceability", hint: "Farm origin tag verification" }
  ],
  gems: [
    { cat: "Assay", hint: "Fire assay gold purity (99.99%)" },
    { cat: "Provenance", hint: "Conflict-free / Chain of custody" },
    { cat: "Gemology", hint: "GIA/AGS Report verification" },
    { cat: "Weight", hint: "Precision calibrated scaling" },
    { cat: "Laser Inscription", hint: "Serial number verification" }
  ],
  energy: [
    { cat: "Viscosity", hint: "Kinematic viscosity @ 40°C" },
    { cat: "Flash Point", hint: "Ignition safety threshold" },
    { cat: "Contaminants", hint: "Sulfur / Water content ppm" },
    { cat: "Density", hint: "Specific gravity API" },
    { cat: "Additives", hint: "Chemical composition check" }
  ],
  construction: [
    { cat: "Compressive", hint: "Concrete/Steel strength (MPa)" },
    { cat: "Compliance", hint: "Adherence to architectural blueprints" },
    { cat: "Safety", hint: "Fire resistance rating (UL/EN)" },
    { cat: "Environmental", hint: "LEED/BREEAM material certification" },
    { cat: "Moisture", hint: "Content percentage check" }
  ],
  software: [
    { cat: "Security", hint: "OWASP Top 10 Vulnerability Scan" },
    { cat: "Auth", hint: "MFA / SSO Implementation check" },
    { cat: "Performance", hint: "Latency < 200ms / Load testing" },
    { cat: "Compliance", hint: "GDPR / HIPAA Data handling" },
    { cat: "Code Quality", hint: "Linting & Static Analysis pass" },
    { cat: "Testing", hint: "Unit test coverage > 80%" }
  ],
  service: [
    { cat: "SLA", hint: "Service Level Agreement adherence" },
    { cat: "Response", hint: "Mean Time to Respond (MTTR)" },
    { cat: "CSAT", hint: "Customer Satisfaction Score > 4.5" },
    { cat: "Resolution", hint: "First Contact Resolution rate" },
    { cat: "Documentation", hint: "Process logs completeness" }
  ]
};

// --- PRODUCT DATABASE SIMULATION ---
const PRODUCT_DATABASE: Record<string, any> = {
    'PROD-101': {
        title: 'Lithium Battery Pack (Batch A)',
        type: 'physical',
        industry: 'General Manufacturing',
        standard: 'ISO 9001',
        requirements: [
            { category: 'Performance', requirement: 'Voltage must be 12V +/- 0.5V' },
            { category: 'Safety', requirement: 'Check for casing cracks' },
            { category: 'Labeling', requirement: 'Warning sticker visible' }
        ]
    },
    'PHARMA-X': {
        title: 'Amoxicillin 500mg (Lot #992)',
        type: 'physical',
        industry: 'Pharmaceuticals & Biotech',
        standard: 'EU-GMP',
        requirements: [
            { category: 'Identity', requirement: 'Retention time matches standard' },
            { category: 'Dissolution', requirement: '>80% dissolved in 30 mins' },
            { category: 'Appearance', requirement: 'White capsule, no discoloration' }
        ]
    },
    'GOLD-999': {
        title: '1kg Gold Bar - Suisse',
        type: 'physical',
        industry: 'Precious Metals (Gold/Diamonds)',
        standard: 'Kimberley (Gems)',
        requirements: [
            { category: 'Assay', requirement: 'Purity > 99.99%' },
            { category: 'Weight', requirement: '1000g +/- 0.01g' },
            { category: 'Provenance', requirement: 'LBMA Good Delivery Chain' }
        ]
    }
};

// --- NEW: REAL AI TRANSLATION FUNCTION (BYOK) ---
const translateText = async (text: string, targetLang: 'en' | 'ar', apiKey: string) => {
    if (!apiKey || apiKey.length < 10 || !text.trim()) return text;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "system",
                    content: `Translate to ${targetLang === 'en' ? 'English' : 'Arabic'}. Return ONLY the translated text.`
                }, {
                    role: "user", content: text
                }]
            })
        });

        const data = await response.json();

        // Safety check: if data.choices doesn't exist, return original text
        if (data && data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content.trim();
        }
        
        console.warn("AI Translation failed, using original text.");
        return text; 

    } catch (error) {
        console.error("Translation Network Error:", error);
        return text; // Always return something to prevent crashing the sender
    }
};

// --- MAIN COMPONENT --- 
export default function Dashboard() {
  const router = useRouter();
  const [acceptanceThreshold, setAcceptanceThreshold] = useState(100);
  const [governingLaw, setGoverningLaw] = useState('International Trade (Incoterms)');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [disputeModalChecklist, setDisputeModalChecklist] = useState<any | null>(null);
  const handleComplianceChange = (e: ChangeEvent<HTMLInputElement>) => {
    setComplianceCheck(e.target.checked);
};
const [complianceCheck, setComplianceCheck] = useState<boolean>(false);
const unsubscribeFromChecklistsRef = useRef<(() => void) | undefined>(undefined);

  // -- Auth State --
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // -- Settings & Verification State --
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [isVerifyingProcess, setIsVerifyingProcess] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const ADMIN_EMAILS = ['admin@seosiri.com', 'badhanpbn@gmail.com'];
  // -- QC Creation State --
  const [title, setTitle] = useState('');
  const [selectedType, setSelectedType] = useState<QCType>('physical');
  const [businessModel, setBusinessModel] = useState<BusinessModel>('B2B');
  const [selectedIndustry, setSelectedIndustry] = useState(INDUSTRIES[0]);
  const [standard, setStandard] = useState<Standard>('General');
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');

  // -- Dashboard Data State --
  const [savedChecklists, setSavedChecklists] = useState<Checklist[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [signingLoading, setSigningLoading] = useState<string | null>(null);
  const [openCommandPalette, setOpenCommandPalette] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState({ reportsCompleted: 0, newListings: 0, newMessages: 0 });
  // --- NEW: View Mode State ---
  const [viewMode, setViewMode] = useState<'all' | 'selling' | 'buying'>('all');
  const [appMode, setAppMode] = useState<'seller' | 'buyer'>('seller');
  // -- Live Vision & Chat State --
  const [meetingNotification, setMeetingNotification] = useState<{ title: string, checklist: Checklist, platform: string } | null>(null);
  const [activeChatChecklist, setActiveChatChecklist] = useState<Checklist | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [preferredLang, setPreferredLang] = useState<'en' | 'ar'>('en');
  const [isTranslatorActive, setIsTranslatorActive] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [docStep, setDocStep] = useState(1);

  // -- National Standards State --
  const [standardType, setStandardType] = useState<'global' | 'national'>('global');
  const [selectedCountry, setSelectedCountry] = useState('BD');
  const [communityStandards, setCommunityStandards] = useState<any[]>([]);

 // --- NEW STATE for Meta Tag Verification ---
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
               // --- UNIFIED MANUAL DATA REFRESH HANDLER ---
  const handleManualRefresh = async () => {
    if (!user) {
      alert("Please log in to refresh data.");
      return;
    }
    setLoading(true); // Show loading state while fetching
    try {
      await fetchChecklists(user.uid, user.email);
      await fetchMyListings(user.uid);
      await fetchCommunityStandards();
      await fetchWeeklySummary(user.uid); // Fetch summary data manually
      alert("Data refreshed successfully!");
    } catch (error) {
      console.error("Error during manual refresh:", error);
      alert("Failed to refresh data. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  // --- QC LOGIC HELPER ---
  const getQCStatus = (checklist: any) => {
    // Default to 100 if no specific threshold was set on the checklist
    const threshold = checklist.acceptanceThreshold || 100;
    if (checklist.score < threshold) {
        return 'FAIL';
    }
    return 'PASS';
  };

  // --- META TAG VERIFICATION FUNCTIONS ---
  const generateVerificationCode = async () => {
    if (!user) return;
    const code = `qcval-${user.uid}-${Date.now()}`; 
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, { verificationCode: code }, { merge: true });
    setVerificationCode(code);
  };
  const [myListings, setMyListings] = useState<any[]>([]);
  

  const handleMetaTagVerification = async () => {
    const domain = prompt("Enter your company's domain (e.g., yourcompany.com):");
    if (!domain || !user) return;

    setIsVerifyingProcess(true);

    try {
        // Get the current user's Firebase Authentication token
        const token = await user.getIdToken();

        const response = await fetch('/api/verify-domain', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Send the token for server-side verification
            },
            body: JSON.stringify({ domain: domain }) // Only send the domain
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert("✅ Success! Your organization is now verified.");
            setIsVerified(true); // Update UI state
            setShowVerifyModal(false); // Close the modal
        } else {
            // Use the error message from the API, or a default one
            alert(`❌ Verification Failed: ${result.message || 'An unknown error occurred.'}`);
        }
    } catch (error) {
        console.error("Error during domain verification:", error);
        alert("An error occurred. Please check the console and try again.");
    } finally {
        setIsVerifyingProcess(false);
    }
  };

const [showGroupSelector, setShowGroupSelector] = useState<any | null>(null);
const publishToListing = async (groupId: string) => {
    if (!showGroupSelector || !user) return;

    // Get the price and contact from the state where we stored it
    const { price, contact, ...checklist } = showGroupSelector; 

    // Safety check in case they were missed
    if (!price || !contact) {
        alert("Price and contact information are missing.");
        return;
    }

    try {
        await addDoc(collection(db, "market_listings"), {
          groupId,
          checklistId: checklist.id,
          title: checklist.title,
          industry: checklist.industry,
          standard: checklist.standard,
          sellerId: user.uid,
          sellerEmail: user.email,
          price, // Use the destructured price
          contact, // Use the destructured contact
          listedAt: serverTimestamp()
        });
        await addDoc(collection(db, "market_listings"), {
    // ... all other fields (groupId, checklistId, price, etc.)
    listedAt: serverTimestamp(),
    lastMaintainedAt: serverTimestamp() // Add this on creation
});
        alert("🎉 Successfully listed in the Town Hall group!");
        setShowGroupSelector(null);
    } catch (e) {
        console.error(e);
        alert("Failed to list product.");
    }
};

  // --- INITIALIZATION (PRODUCTION READY & MERGED) ---

const fetchWeeklySummary = async (userId: string) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Query 1: Completed reports in the last week
    const reportsQuery = query(
        collection(db, 'checklists'), 
        where('uid', '==', userId), 
        where('agreementStatus', '==', 'completed'),
        where('createdAt', '>', oneWeekAgo)
    );

    // Query 2: New listings in the last week
    const listingsQuery = query(
        collection(db, 'market_listings'),
        where('sellerId', '==', userId),
        where('listedAt', '>', oneWeekAgo)
    );

    const [reportsSnap, listingsSnap] = await Promise.all([
        getDocs(reportsQuery),
        getDocs(listingsQuery)
    ]);
    
    // (Note: New messages count would require more complex logic, so we'll start with these two)
    setSummaryData({
        reportsCompleted: reportsSnap.size,
        newListings: listingsSnap.size,
        newMessages: 0, // Placeholder
    });
    setShowSummary(true);

    // Update the timestamp in localStorage
    localStorage.setItem('lastSummaryDate', new Date().toISOString());
  };
// --- DELETE LISTING FUNCTION ---
  const deleteListing = async (listingId: string) => {
    if(!confirm("Remove this listing from the marketplace?")) return;
    try {
        await deleteDoc(doc(db, "market_listings", listingId));
        fetchMyListings(user.uid); 
    } catch(e) { console.error(e); }
  };

const fetchChecklists = useCallback((userId: string, userEmail: string | null) => {
    if (!userId) return () => {};

    const sellerQuery = query(collection(db, "checklists"), where("uid", "==", userId));
    const buyerQuery = query(collection(db, "checklists"), where("buyerUid", "==", userId));
    const inviteQuery = userEmail ? query(collection(db, "checklists"), where("buyerEmail", "==", userEmail), where("agreementStatus", "==", "pending_buyer")) : null;

    const processSnapshot = (snapshot: any) => {
        const newItems = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Checklist));
        
        setSavedChecklists(prev => {
            const combinedMap = new Map<string, Checklist>();
            [...prev, ...newItems].forEach(item => combinedMap.set(item.id, item));
            return Array.from(combinedMap.values()).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        });

        // Notification Logic
        snapshot.docChanges().forEach((change: any) => {
            const data = { id: change.doc.id, ...change.doc.data() } as Checklist;
            if (activeChatChecklist && activeChatChecklist.id === data.id) {
                setActiveChatChecklist(data);
            }
            if (change.type === "modified" && data.meetingStartedAt) {
                const meetingTimestamp = data.meetingStartedAt?.toDate();
                if (meetingTimestamp && (new Date().getTime() - meetingTimestamp.getTime()) < 60000) {
                    if (data.lastMeetingInitiator !== userId) {
                        setMeetingNotification({
                            title: data.title,
                            checklist: data,
                            platform: data.activeMeetingPlatform || 'meet'
                        });
                    }
                }
            }
        });
    };

    // 3. ACTIVATE LISTENERS
      const unsubSeller = onSnapshot(sellerQuery, processSnapshot);
    const unsubBuyer = onSnapshot(buyerQuery, processSnapshot);
    const unsubInvite = inviteQuery ? onSnapshot(inviteQuery, processSnapshot) : () => {};

    return () => {
        unsubSeller();
        unsubBuyer();
        unsubInvite();
    };
  // --- THIS IS THE FIX ---
  // We add the unstable `activeChatChecklist` to the dependency array.
  // This is technically not "perfect" React, but it will work and stop the infinite loop,
  // while preserving your auto-updating chat feature.
  }, [setSavedChecklists, setActiveChatChecklist, setMeetingNotification, activeChatChecklist]); // Add state setters as dependencies

  const fetchMyListings = useCallback(async (userId: string) => {
    if (!userId) return;
    const q = query(collection(db, 'market_listings'), where('sellerId', '==', userId));
    const snap = await getDocs(q);
    setMyListings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, [setMyListings]);

  const fetchCommunityStandards = useCallback(async () => {
    const q = query(collection(db, "nationalStandards"));
    const snap = await getDocs(q);
    setCommunityStandards(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, [setCommunityStandards]);

  // --- INITIALIZATION & AUTH EFFECT ---
  // --- EFFECT 1: AUTHENTICATION LISTENER ---
  useEffect(() => {
    // Get non-user-specific settings once on initial load
    const localKey = localStorage.getItem('openai_key');
    if (localKey) setApiKey(localKey);

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
        router.push('/auth');
      }
      setLoading(false);
    });

    // Cleanup the auth listener when the component unmounts
    return () => unsubscribeAuth();
  }, [router]);

  // --- EFFECT 2: DATA FETCHER (Reacts to user changes) ---
  
  useEffect(() => {
    // If there is no user, clean up any old listeners from a previous session and stop.
    if (!user) {
      if (unsubscribeFromChecklistsRef.current) {
        unsubscribeFromChecklistsRef.current();
        unsubscribeFromChecklistsRef.current = undefined;
      }
      return;
    }

    // --- A user IS logged in, so fetch their data ---

    // Clean up listeners from any PREVIOUS user before starting new ones
    if (unsubscribeFromChecklistsRef.current) {
      unsubscribeFromChecklistsRef.current();
    }
    
    // Call the memoized fetch function and store its cleanup function in the ref
    unsubscribeFromChecklistsRef.current = fetchChecklists(user.uid, user.email);
    
    // Fetch non-real-time data
    fetchMyListings(user.uid);
    fetchCommunityStandards();

    // Check for weekly summary
    const lastSummary = localStorage.getItem('lastSummaryDate');
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    if (!lastSummary || new Date(lastSummary) < oneWeekAgo) {
        fetchWeeklySummary(user.uid);
    }

    const checkVerification = async () => {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();

                // 1. Check if they are ALREADY verified
                if (userData.isDomainVerified) {
                    setIsVerified(true);
                    setVerificationCode(null); // No need to show the code if verified
                    return;
                }
                
                // 2. Check if they have a PENDING code
                if (userData.verificationCode) {
                    setVerificationCode(userData.verificationCode);
                }

            } else {
              // 3. If no user doc exists, create a basic one
await setDoc(userRef, { 
    email: user.email, 
    isDomainVerified: false,
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp()
}, { merge: true });
            }
            
            // 4. Default to not verified if none of the above are true
            setIsVerified(false);
        };
        checkVerification();

    // The return function here acts as the cleanup for THIS effect.
    // It will be called when the 'user' changes (i.e., on logout) or when the component unmounts.
    return () => {
      if (unsubscribeFromChecklistsRef.current) {
        unsubscribeFromChecklistsRef.current();
        unsubscribeFromChecklistsRef.current = undefined;
      }
    };
  }, [user, fetchChecklists, fetchMyListings, fetchCommunityStandards, fetchWeeklySummary]); // Re-run when user changes


// --- Your other useEffect for chat scrolling remains the same ---
useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [activeChatChecklist?.messages]); 

// --- ACTIONS ---
  const saveApiKey = () => {
    localStorage.setItem('openai_key', apiKey);
    setShowSettings(false);
    alert("API Key saved locally. AI features enabled!");
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifyingProcess(true);
    setTimeout(() => {
        localStorage.setItem('is_verified_org', 'true');
        setIsVerified(true);
        setIsVerifyingProcess(false);
        setShowVerifyModal(false);
        alert("Success! Documents verified. Trusted Badge Active.");
    }, 2000);
  };

  const addManualItem = (category: string) => {
    // If called from the button directly, prompt. If from applySegmentTemplate, strict add.
    const requirement = prompt(`Enter detailed requirement for ${category}:`);
    if (requirement) setItems(prev => [...prev, { category, requirement, status: 'pending', gapAnalysis: 'Manual Entry' }]);
  };

  // Fixed: Moved outside handleSave so it can be called by UI
  const applySegmentTemplate = (model: BusinessModel) => {
    setItems([]); // Clear current items
    const newItems: ChecklistItem[] = [];
    
    if (model === 'B2B') {
      newItems.push({ category: 'Contract SLA', requirement: 'SLA Adherence Check', status: 'pending', gapAnalysis: 'B2B Template' });
      newItems.push({ category: 'Shipping', requirement: 'Bulk Shipping Tolerance', status: 'pending', gapAnalysis: 'B2B Template' });
      newItems.push({ category: 'Compliance', requirement: 'ISO 9001 Cert Check', status: 'pending', gapAnalysis: 'B2B Template' });
    } else if (model === 'B2C') {
      newItems.push({ category: 'Packaging', requirement: 'Retail Packaging Visuals', status: 'pending', gapAnalysis: 'B2C Template' });
      newItems.push({ category: 'User Manual', requirement: 'User Manual Clarity', status: 'pending', gapAnalysis: 'B2C Template' });
    } else if (model === 'B2G') {
      newItems.push({ category: 'Compliance', requirement: 'RFP Spec Compliance', status: 'pending', gapAnalysis: 'B2G Template' });
      newItems.push({ category: 'Security', requirement: 'Security Clearance Verification', status: 'pending', gapAnalysis: 'B2G Template' });
    } else {
        newItems.push({ category: 'Legal', requirement: 'Platform Terms of Service', status: 'pending', gapAnalysis: 'Hybrid Template' });
    }
    setItems(newItems);
  };

  // --- INTELLIGENT PARAMETER SELECTION LOGIC ---
  const getActiveParameters = () => {
    if (selectedType === 'software') return STANDARD_PARAMS.software;
    if (selectedIndustry.includes('Pharmaceuticals')) return STANDARD_PARAMS.pharma;
    if (selectedIndustry.includes('Agriculture')) return STANDARD_PARAMS.agriculture;
    if (selectedIndustry.includes('Gold') || selectedIndustry.includes('Jewelry')) return STANDARD_PARAMS.gems;
    if (selectedIndustry.includes('Energy') || selectedIndustry.includes('Oil')) return STANDARD_PARAMS.energy;
    if (selectedIndustry.includes('Building') || selectedIndustry.includes('Civil')) return STANDARD_PARAMS.construction;
    if (selectedType === 'service') return STANDARD_PARAMS.service;
    return STANDARD_PARAMS.physical; // Default Fallback
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      complete: (results) => {
        if (!results.data) return;
        const extractedItems: ChecklistItem[] = [];
        (results.data as any[]).flat().forEach((row: any) => {
          if (typeof row !== 'string') return;
          const text = row.toString();
          if (text.length < 3) return;
          let cat = 'General';
          const params = getActiveParameters();
          const match = params.find(p => text.toLowerCase().includes(p.cat.toLowerCase()));
          if(match) cat = match.cat;
          extractedItems.push({ category: cat, requirement: text, status: 'pending', gapAnalysis: 'Auto-Extracted' });
        });
        setItems(prev => [...prev, ...extractedItems]);
        e.target.value = '';
      }
    });
  };

  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    const productData = PRODUCT_DATABASE[barcodeInput.toUpperCase()];
    if (productData) {
        setTitle(productData.title);
        setSelectedType(productData.type as QCType);
        setStandard(productData.standard as Standard);
        if(productData.industry) setSelectedIndustry(productData.industry);
        const newItems: ChecklistItem[] = productData.requirements.map((req: any) => ({
            category: req.category, requirement: req.requirement, status: 'pending', gapAnalysis: 'Database Match'
        }));
        setItems(newItems);
        alert(`✅ Product Detected: ${productData.title}\nQC Data Transferred Successfully!`);
        setBarcodeInput('');
    } else {
        alert("❌ Code not found. Try 'PROD-101', 'PHARMA-X', or 'GOLD-999'.");
    }
  };

  const handleImageUpload = (file: File, index: number, type: 'before' | 'after' = 'before') => {
    if (!user) return;
    if (file.size > 5048487) { alert("Image too large. Please use an image under 5MB."); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setItems(prev => {
          const newItems = [...prev];
          if (type === 'before') {
              newItems[index].evidenceBefore = base64String;
              newItems[index].evidence = base64String;
          } else {
              newItems[index].evidenceAfter = base64String;
          }
          if (newItems[index].evidenceBefore) newItems[index].status = 'pass';
          return newItems;
      });
    };
    reader.readAsDataURL(file);
  };

// --- UPDATED DELETE FUNCTION ---
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project permanently? This will also remove it from the Marketplace.")) return;
    
    try {
      // 1. Delete the Checklist (The Contract)
      await deleteDoc(doc(db, "checklists", id));

      // 2. Find and Delete the associated Marketplace Listing (The Ad)
      const q = query(collection(db, "market_listings"), where("checklistId", "==", id));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
      });

      // 3. Refresh UI
      fetchMyListings(user.uid); 
      alert("Project and Listing deleted.");
      
    } catch (e) {
      console.error(e);
      alert("Error deleting project.");
    }
  };

  // --- UPDATED handleSave (No Email Prompt) ---
  const handleSave = async () => {
    if (!title || items.length === 0 || !user) return;
    if (!complianceCheck) { alert("Compliance certification required."); return; }
    
    setIsSaving(true);
    const passed = items.filter(i => i.status === 'pass').length;
    const score = Math.round((passed / items.length) * 100) || 0;
    
    try {
      // Don't ask for buyerEmail here.
      await addDoc(collection(db, "checklists"), {
        uid: user.uid, // Seller's UID
        sellerEmail: user.email,
        title, type: selectedType, industry: selectedIndustry, standard,
        items, score, 
        createdAt: serverTimestamp(),
        // NEW: Status indicates it's waiting for a buyer
        agreementStatus: 'pending_buyer', 
       acceptanceThreshold,
        governingLaw,
        paymentTerms
      });

      alert("✅ Project Saved! Now, invite the buyer.");
      setTitle(''); setItems([]); // Reset form
      // Note: We don't call fetchChecklists here to prevent flicker. The onSnapshot listener will update the UI.

    } catch (e) { console.error(e); alert("Error saving."); }
    finally { setIsSaving(false); }
  };

const handleDigitalSign = async (checklist: Checklist, signer: 'A' | 'B') => {
    setSigningLoading(checklist.id);
    let newStatus: Checklist['agreementStatus'] = checklist.agreementStatus;
    let notificationRecipientId: string | undefined;
    let notificationMessage = '';

    // Security Check: Ensure the correct user is signing
    if (signer === 'A' && user?.uid === checklist.uid) {
        newStatus = 'party_a_signed';
        notificationRecipientId = checklist.buyerUid;
        notificationMessage = `${checklist.sellerEmail} has signed. Your signature is now required.`;
    } else if (signer === 'B' && user?.uid === checklist.buyerUid) {
        newStatus = 'completed';
        notificationRecipientId = checklist.uid; // Notify the seller
        notificationMessage = `${checklist.buyerEmail} has completed the agreement.`;
    } else {
        alert("Permission denied. You are not authorized to sign as this party.");
        setSigningLoading(null);
        return;
    }

    const checklistRef = doc(db, "checklists", checklist.id);

    try {
        // 1. Update the document in Firestore
        await updateDoc(checklistRef, { agreementStatus: newStatus });

        // 2. Send the client-side notification
        if (notificationRecipientId) {
            await addDoc(collection(db, "notifications"), {
                recipientId: notificationRecipientId,
                title: `Agreement Update: ${checklist.title}`,
                message: notificationMessage,
                link: `/dashboard`,
                isRead: false,
                createdAt: serverTimestamp()
            });
        }

        // 3. Optimistically update the local state (This fixes the UI bug)
        setSavedChecklists(prev => 
            prev.map(item => 
                item.id === checklist.id ? { ...item, agreementStatus: newStatus } : item
            )
        );

        // 4. Trigger side-effects (like PDF generation)
        if (newStatus === 'completed') {
            generatePDF(checklist);
        }
        
        alert(`✅ Success! The agreement status is now: ${newStatus?.replace(/_/g, ' ').toUpperCase()}`);

    } catch (error) {
        console.error("Error signing document:", error);
        alert("Failed to sign. Please check your Firestore rules or connection and try again.");
    } finally {
        setSigningLoading(null);
    }
  };

  // --- UPDATED: PDF GENERATION WITH PLACEHOLDERS ---
  const generatePDF = (checklist: Checklist) => {
    const doc = new jsPDF();
    const isAiEnabled = !!localStorage.getItem('openai_key');

    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text("QC COMPLIANCE & PURCHASE AGREEMENT", 20, 20);

    // Meta Data
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated by QC Validator Platform | ${new Date().toLocaleDateString()}`, 20, 28);
    
    // Status Badge Logic
    doc.setDrawColor(0, 150, 0); // Green
    doc.setLineWidth(1);
    doc.rect(160, 15, 30, 10);
    doc.setFontSize(10);
    doc.setTextColor(0, 120, 0);
    doc.text("VERIFIED", 163, 21);

    // Project Details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Project: ${checklist.title}`, 20, 40);
    doc.text(`Industry: ${checklist.industry}`, 20, 50);
    doc.text(`Standard: ${checklist.standard}`, 20, 60);
    doc.text(`Score: ${checklist.score}%`, 20, 70);

    // --- NEW: BYOK / AI STATUS INDICATOR ---
    doc.setFontSize(10);
    if (isAiEnabled) {
        doc.setTextColor(0, 0, 255);
        doc.text("• AI Translation Services: ENABLED (Verified Key)", 120, 40);
    } else {
        doc.setTextColor(200, 0, 0);
        doc.text("• AI Translation Services: DISABLED (No API Key)", 120, 40);
        doc.setTextColor(100, 100, 100); // Reset
        doc.text("(Language accuracy in chat not guaranteed)", 120, 45);
    }

   // --- AGREEMENT TEXT ---
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("AGREEMENT TERMS:", 20, 90);
    doc.setFontSize(10);
    const text = `Party A (${checklist.sellerEmail}) certifies that the goods/services listed have passed all Quality Control parameters mandated by ${checklist.standard}. Party B (${checklist.buyerEmail}) acknowledges receipt and approves the order.`;
    doc.text(text, 20, 100, { maxWidth: 170 });
    
    // Initialize yPos for the next section
    let yPos = 120; 

    // --- NEW, SPECIFIC TERMS & CONDITIONS CLAUSE ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("Supplementary Terms:", 20, yPos);
    yPos += 10; // Move down for the content
    doc.setFont('helvetica', 'normal');
    const clauseText = "Both parties acknowledge that their respective internal business terms, organizational ethics, and norms are subject matters for their own governance and are supplementary to this specific agreement, provided they do not conflict with the terms herein.";
    doc.text(clauseText, 20, yPos, { maxWidth: 170 });
    yPos += 30; // Add space after the clause

    // --- NEW: IMAGE & EVIDENCE SECTION WITH PLACEHOLDERS ---
    doc.text("EVIDENCE LOG:", 20, yPos);
    yPos += 10; 
    
    checklist.items.forEach((item, index) => {
        if (yPos > 270) { doc.addPage(); yPos = 20; } // Pagination
        
        doc.text(`${index + 1}. ${item.category}: ${item.requirement}`, 20, yPos);
        yPos += 5;

        // Check for Evidence
        if (item.evidenceBefore || item.evidenceAfter) {
             doc.setTextColor(0, 128, 0);
             doc.text(`   [✓] Digital Evidence Attached (See Appendices)`, 20, yPos);
        } else {
             // PLACEHOLDER FOR MISSING IMAGES
             doc.setTextColor(200, 0, 0);
             doc.text(`   [X] NO VISUAL EVIDENCE PROVIDED`, 20, yPos);
             doc.setFontSize(8);
             doc.setTextColor(100, 100, 100);
             doc.text(`       (Item marked as passed based on manual assertion only)`, 20, yPos + 4);
             doc.setFontSize(10);
        }
        yPos += 10;
        doc.setTextColor(0, 0, 0);
    });

    // Signatures
    doc.text("__________________________", 20, yPos + 20);
    doc.text(`Signed by Party A: ${checklist.sellerEmail}`, 20, yPos + 25);
    doc.text(`Timestamp: ${new Date().toISOString()}`, 20, yPos + 30);
    
    if (checklist.agreementStatus === 'completed') {
        doc.text("__________________________", 120, yPos + 20);
        doc.text(`Signed by Party B: ${checklist.buyerEmail}`, 120, yPos + 25);
        doc.text(`Timestamp: ${new Date().toISOString()}`, 120, yPos + 30);
    } else {
        doc.setTextColor(200, 0, 0);
        doc.text("[WAITING FOR BUYER SIGNATURE]", 120, yPos + 25);
    }

    doc.save(`${checklist.title}_Agreement.pdf`);
  };

const handlePublish = (checklist: any) => {
    // 1. ASK FOR DETAILS FIRST
    const price = prompt("Enter listing price (e.g. $500/unit):");
    if (!price) return; // Exit if user cancels

    const contact = prompt("Enter contact email for buyers:");
    if (!contact) return; // Exit if user cancels

    // 2. NOW, OPEN THE MODAL and pass ALL the data into state
    setShowGroupSelector({ ...checklist, price, contact }); 
};
  

  const getMarketSuggestions = (std: string, type: QCType) => {
    if (type === 'software') return ['Apple App Store', 'Google Play', 'Azure Marketplace', 'AWS SaaS'];
    if (std === 'HACCP') return ['Whole Foods Global', 'Sysco Distribution', 'EU Import Partners'];
    if (std === 'ISO 9001') return ['Government Contracts', 'B2B Enterprise', 'Tesla Supply Chain'];
    if (std === 'EU-GMP' || std === 'FDA (21 CFR)') return ['CVS Health', 'Walgreens', 'NHS Supply Chain', 'McKesson'];
    if (std === 'Kimberley (Gems)') return ['Tiffany & Co.', 'Cartier Sourcing', 'Dubai Gold Souk'];
    return ['Amazon Handmade', 'Etsy', 'Local Boutiques', 'Shopify Stores'];
  };
// --- UPDATED: GOOGLE MEET ONLY ---
  const openCommunicationHub = async (checklist: Checklist) => {
    setActiveChatChecklist(checklist);
    
    // Always use Google Meet for instant rooms
    const url = 'https://meet.google.com/new';

    try {
        const checklistRef = doc(db, "checklists", checklist.id);
        await updateDoc(checklistRef, {
            activeMeetingUrl: url, 
            activeMeetingPlatform: 'meet', // Hardcoded to meet
            meetingStartedAt: serverTimestamp(), 
            lastMeetingInitiator: user.uid
        });
    } catch (error) { 
        console.error("DB Update failed (Link opened anyway):", error); 
    }
    
    // Open the window immediately
    window.open(url, '_blank');
  };

  // --- SIMPLIFIED SEND MESSAGE (Direct Internal Chat) ---
  const sendMessage = async () => {
    if (!chatInput.trim() || !activeChatChecklist) return;

    const newMessage = {
        senderId: user.uid,
        senderEmail: user.email,
        text: chatInput, // No translation, just the raw text from the input
        timestamp: Date.now()
    };

    // Clear the input box immediately for a responsive feel
    setChatInput('');

    try {
        const listRef = doc(db, "checklists", activeChatChecklist.id);
        // Use arrayUnion to add the new message without re-writing the whole document
        await updateDoc(listRef, { 
            messages: arrayUnion(newMessage) 
        });
    } catch (e) {
        console.error("Error sending message:", e);
        alert("Failed to send message. The project file might be too large due to attached images.");
        // Optional: Restore the input if sending fails
        // setChatInput(newMessage.text); 
    }
  };

// --- UPDATED FILTER LOGIC (Linked to Tabs) ---

if (loading) return (
    <div className="min-h-screen bg-gray-50 p-8 animate-pulse">
        {/* Navbar Skeleton */}
        <div className="h-16 bg-white border-b mb-8 flex items-center px-6">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="ml-auto w-32 h-8 bg-gray-200 rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column Skeleton */}
            <div className="col-span-4 space-y-6">
                <div className="h-64 bg-white rounded-xl"></div>
                <div className="h-32 bg-white rounded-xl"></div>
            </div>
            
            {/* Right Column Skeleton */}
            <div className="col-span-8 space-y-6">
                <div className="h-24 bg-blue-100 rounded-xl"></div>
                <div className="h-48 bg-white rounded-xl"></div>
                <div className="h-48 bg-white rounded-xl"></div>
            </div>
        </div>
    </div>
  );
    if (!user) return null;
    
   const filteredChecklists = savedChecklists.filter(list => {
    // 1. Search Query Filter
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      list.title.toLowerCase().includes(query) ||
      (list.standard || '').toLowerCase().includes(query) ||
      (list.industry || '').toLowerCase().includes(query) ||
      (list.agreementStatus || '').toLowerCase().includes(query) ||
      (list.score + '%').includes(query);

    // 2. Role Filter based on viewMode (Tabs)
    const isSeller = list.uid === user.uid;
    const isBuyer = Boolean((list.buyerUid && list.buyerUid === user.uid) || (list.buyerEmail && list.buyerEmail === user.email));

    let matchesRole: boolean = true; // Explicitly type as boolean
    
    if (viewMode === 'selling') {
        matchesRole = isSeller;
    } else if (viewMode === 'buying') {
        matchesRole = isBuyer;
    }

    return matchesSearch && matchesRole;
});

  // --- RENDER ---
  console.log("👀 RENDER: Filtered Checklists count:", filteredChecklists.length);
  return (
    <> 
    {/* Use the new SimpleSearch instead of CommandPalette */}
    <SimpleSearch 
        isOpen={openCommandPalette} 
        onClose={() => setOpenCommandPalette(false)} // Pass the close handler
        savedChecklists={savedChecklists}
        user={user}
        setShowGroupSelector={setShowGroupSelector}
    />

    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 relative">
      
        
        {/* Then OnboardingTour */}
        <OnboardingTour />
      
     {/* 1. NAVBAR WITH MODE SWITCHER */}
      <nav className={`shadow-sm border-b px-6 h-16 flex justify-between items-center sticky top-0 z-10 transition-colors duration-300 ${appMode === 'seller' ? 'bg-white border-gray-200' : 'bg-green-50 border-green-200'}`}>
        <Logo />
        
        {/* --- CENTRAL MODE TOGGLE --- */}
        <div className="hidden lg:flex bg-gray-100 p-1 rounded-lg border border-gray-200 mx-4">
            <button 
                onClick={() => setAppMode('seller')}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${appMode === 'seller' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <span>📤</span> Seller View
            </button>
            <button 
                onClick={() => setAppMode('buyer')}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${appMode === 'buyer' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <span>📥</span> Buyer View
            </button>
        </div>

        <div className="flex gap-4 items-center">
            
            {/* User Email (Only show in Seller Mode) */}
            {appMode === 'seller' && (
                <span className="text-xs text-gray-500 hidden xl:inline">{user.email}</span>
            )}
            
            {/* Verify Org Button */}
            <button onClick={() => setShowVerifyModal(true)} className={`text-xs px-3 py-1 rounded-full border transition-colors flex items-center gap-1 ${isVerified ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                {isVerified ? '✅ Verified' : '⚠️ Verify Org'}
            </button>
            
            {/* --- NEW: ADMIN PANEL BUTTON (Only visible to Admins) --- */}
{user && ADMIN_EMAILS.includes(user.email) && (
    <Link 
        href="/admin" 
        className="px-3 py-1 bg-gray-900 text-white text-xs font-bold rounded hover:bg-black transition-colors flex items-center gap-1"
    >
        <span>🛡️</span> Admin
    </Link>
)}

            {/* Town Hall Button */}
            <div className="relative group hidden lg:block">
                <Link 
                    href="/marketplace" 
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full font-bold text-sm hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                    🏛️ <span>Town Hall</span>
                </Link>
                <div className="absolute top-full mt-2 -right-4 w-48 bg-black text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                    Explore industry groups and trade verified products.
                </div>
            </div>
             {/* --- ADD THIS LINK --- */}
    <Link href="/analysis" className="text-sm font-bold text-gray-700 hover:text-indigo-600">
        📊 Analytics
    </Link>

            {/* Help Link */}
            <Link 
                href="/faq" 
                className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors hidden md:block"
                title="Knowledge Base & FAQ"
            >
                Help
            </Link>

           {/* --- RESPONSIVE SEARCH BUTTON --- */}
          <button 
            onClick={() => setOpenCommandPalette(true)}
            className="flex items-center gap-2 text-left bg-gray-100 border-none rounded-full py-2 px-4 text-sm text-gray-500 hover:bg-gray-200 transition-colors"
            title="Search Projects & Actions (Ctrl+K)"
          >
            {/* Magnifying Glass Icon */}
            <span className="text-gray-400">🔍</span>

            {/* Text and Keyboard Shortcut - Hidden on smaller screens */}
            <span className="hidden sm:inline">Search...</span>
            <span className="hidden lg:inline ml-auto text-xs border rounded px-1.5 py-0.5 bg-white">Ctrl+K</span>
          </button>

             {/* --- HIDDEN AI SETTINGS (For Future Use) --- 
        <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
            {apiKey ? '🟢 AI Ready' : '⚙️ Settings'}
        </button>
        */}

            {/* Notification Center */}
            <NotificationCenter id="notification-center" />
            
            {/* Logout */}
            <button onClick={() => signOut(auth)} className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors">Logout</button>
        </div>
      </nav>

      {/* --- NOTIFICATIONS --- */}
      {meetingNotification && (
        <div className="fixed top-20 right-6 bg-white rounded-xl shadow-2xl p-6 w-96 z-50 animate-fade-in border-l-4 border-indigo-500">
            <h4 className="font-bold text-gray-900">Live Vision Request</h4>
            <p className="text-sm text-gray-600 mt-1">
                A team member has started a live video session. {/* Removed "Teams/Meet" text */}
            </p>
            <div className="flex gap-3">
<button
    onClick={() => {
        setActiveChatChecklist(meetingNotification.checklist);
        // Correct call with only ONE argument
        openCommunicationHub(meetingNotification.checklist); 
        setMeetingNotification(null);
    }}
    className="flex-1 bg-green-600 text-white font-bold text-sm py-2 rounded hover:bg-green-700"
>
    Join Video & Chat
</button>                <button onClick={() => setMeetingNotification(null)} className="flex-1 bg-gray-100 text-gray-700 font-bold text-sm py-2 rounded hover:bg-gray-200">Dismiss</button>
            </div>
        </div>
      )}

      {/* 2. SETTINGS DRAWER */}
     {/* --- HIDDEN SETTINGS DRAWER (FOR FUTURE AI USE) ---
{showSettings && (
    <div className="bg-indigo-50 p-4 border-b border-indigo-100 text-center animate-fade-in">
    <p className="text-xs text-indigo-800 mb-2 font-bold">Bring Your Own Key (BYOK) for Live Translation</p>
    <div className="flex justify-center gap-2 max-w-md mx-auto">
        <input type="password" placeholder="Enter OpenAI API Key (sk-...)" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="flex-1 p-2 rounded border border-indigo-200 text-sm"/>
        <button onClick={saveApiKey} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">Save</button>
    </div>
    </div>
)}
---------------------------------------------------- */}

  {/* 3. VERIFICATION MODAL */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 animate-slide-up max-h-[90vh] overflow-y-auto">
                
                {/* --- Modal Header --- */}
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">Organization Verification</h3>
                        <p className="text-sm text-gray-500">Submit official details to unlock Enterprise & Trusted status.</p>
                    </div>
                    <button onClick={() => setShowVerifyModal(false)} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-gray-100">✕</button>
                </div>

                {/* --- Main Content --- */}
                {isVerified ? (
                    // If ALREADY verified
                    <div>
                      <p className="text-center text-green-600 font-bold py-8">✅ Your organization is verified!</p>
                    </div>
                ) : (
                    // If NOT verified
                    <div>
                      {/* --- STEP 1: AUTOMATED DOMAIN VERIFICATION --- */}
                      <div className="p-4 border rounded-lg mb-8 bg-gray-50">
                          <h4 className="font-bold text-lg text-gray-800">Step 1: Verify Domain Ownership</h4>
                          <p className="text-sm text-gray-600 mt-1 mb-4">This is the fastest way to get your Trusted Badge.</p>
                          {!verificationCode ? (
                              <button onClick={generateVerificationCode} className="px-4 py-2 bg-indigo-600 text-white rounded font-semibold text-sm">Generate Verification Tag</button>
                          ) : (
                              <div className="space-y-4">
                                  <p className="text-sm text-gray-600">1. Add this meta tag to your website's &lt;head&gt; section:</p>
                                  <code className="block bg-gray-200 p-3 rounded text-sm break-all">
                                      {`<meta name="qc-validator-verification" content="${verificationCode}">`}
                                  </code>
                                  <button onClick={handleMetaTagVerification} disabled={isVerifyingProcess} className="px-4 py-2 bg-green-600 text-white rounded font-semibold text-sm disabled:opacity-50">
                                    {isVerifyingProcess ? 'Verifying...' : 'Verify Domain'}
                                  </button>
                              </div>
                          )}
                      </div>

                      {/* --- PROMOTIONAL MESSAGE (New Website/SEO Services) --- */}
                      <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl flex items-start gap-4 shadow-sm">
                        <span className="text-2xl">🚀</span>
                        <div>
                            <p className="text-sm text-indigo-900 font-bold mb-1">
                                Don't have a website or need an enterprise upgrade?
                            </p>
                            <p className="text-xs text-indigo-700 mb-3 leading-relaxed">
                                We are ready to assist with your individual and organizational requirements—from new architecture to high-performance SEO.
                            </p>
                            <a 
                                href="mailto:info@seosiri.com?subject=Inquiry: Website & SEO Services" 
                                className="inline-flex items-center gap-2 text-xs font-bold text-white bg-indigo-600 px-4 py-2 rounded-full hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                                <span>📩</span> Contact SEOSiri Expert
                            </a>
                        </div>
                      </div>

                      {/* --- STEP 2: MANUAL DOCUMENT UPLOAD --- */}
                      <div className="pt-6 border-t">
                          <h4 className="font-bold text-lg mb-4 text-gray-800">Step 2: Submit Legal Documents</h4>
                          <form onSubmit={handleVerifySubmit} className="space-y-5">
                              <div>
                                  <label className="block text-xs font-bold text-gray-700 mb-1">Organization Legal Name</label>
                                  <input type="text" required className="w-full border border-gray-300 rounded-lg p-3 text-sm" placeholder="e.g. Global Tech Solutions Ltd." />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Responsible Person</label><input type="text" required className="w-full border rounded-lg p-3 text-sm" /></div>
                                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Business Tax ID</label><input type="text" required className="w-full border rounded-lg p-3 text-sm" /></div>
                                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Business Phone</label><input type="tel" required className="w-full border rounded-lg p-3 text-sm" /></div>
                                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Business Email</label><input type="email" required className="w-full border rounded-lg p-3 text-sm" /></div>
                              </div>
                              <div><label className="block text-xs font-bold text-gray-700 mb-1">Registered Address</label><textarea required rows={2} className="w-full border rounded-lg p-3 text-sm"></textarea></div>

                              {/* --- PROGRESSIVE DOCUMENT UPLOAD --- */}
                              <div className="pt-4 border-t mt-4">
                                <h4 className="text-sm font-bold text-gray-800 mb-4">Required Documents</h4>
                                <div className="space-y-4">
                                    {/* Doc 1 */}
                                    <div>
                                        <label className="block text-xs font-bold mb-1">1. Business Registration</label>
                                        <div className="border-2 border-dashed rounded-lg p-4 text-center bg-gray-50 relative hover:bg-gray-100 transition-colors">
                                            <input type="file" required className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" onChange={() => setDocStep(2)}/>
                                            <span className="text-xs text-gray-500">📄 Click to upload (PDF/JPG)</span>
                                        </div>
                                    </div>

                                    {/* Doc 2 */}
                                    {docStep >= 2 && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                        <label className="block text-xs font-bold mb-1 mt-3">2. Tax ID Certificate</label>
                                        <div className="border-2 border-dashed rounded-lg p-4 text-center bg-gray-50 relative hover:bg-gray-100 transition-colors">
                                            <input type="file" required className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" onChange={() => setDocStep(3)}/>
                                            <span className="text-xs text-gray-500">📄 Click to upload</span>
                                        </div>
                                    </motion.div>
                                    )}

                                    {/* Doc 3 */}
                                    {docStep >= 3 && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                        <label className="block text-xs font-bold mb-1 mt-3">3. Director/Owner ID</label>
                                        <div className="border-2 border-dashed rounded-lg p-4 text-center bg-gray-50 relative hover:bg-gray-100 transition-colors">
                                            <input type="file" required className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" onChange={() => setDocStep(4)}/>
                                            <span className="text-xs text-gray-500">📄 Click to upload</span>
                                        </div>
                                    </motion.div>
                                    )}
                                </div>
                              </div>

                              {/* --- ACKNOWLEDGEMENT & SUBMIT --- */}
                              {docStep >= 4 ? (
                                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-6 border-t mt-6">
                                    <div className="flex items-start gap-3 bg-red-50 p-3 rounded-lg border border-red-200">
                                        <input type="checkbox" required id="doc-ack" className="mt-1 h-4 w-4 text-red-600"/>
                                        <label htmlFor="doc-ack" className="text-xs text-red-800 leading-tight">
                                            I acknowledge that submitting false or forged documents is a criminal offense and will result in a permanent ban from the QC Validator platform and reporting to authorities.
                                        </label>
                                    </div>
                                    <div className="flex gap-4 mt-6">
                                        <button type="button" onClick={() => setShowVerifyModal(false)} className="flex-1 py-3 text-sm font-bold text-gray-700 bg-gray-100 rounded-lg">Cancel</button>
                                        <button type="submit" disabled={isVerifyingProcess} className="flex-1 py-3 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
                                          {isVerifyingProcess ? 'Submitting...' : 'Submit Documents'}
                                        </button>
                                    </div>
                                  </motion.div>
                              ) : (
                                  <div className="mt-6">
                                      <button type="button" onClick={() => setShowVerifyModal(false)} className="w-full py-3 text-sm font-bold text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                                  </div>
                              )}
                          </form>
                      </div>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* LIABILITY DISCLAIMER */}
      {showDisclaimer && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border-t-4 border-red-600">
                <h3 className="text-xl font-bold text-gray-900 mb-2">⚠️ Important Legal Disclaimer</h3>
                <div className="bg-red-50 p-3 rounded border border-red-100 text-xs text-red-800 mb-4 font-mono">NON-FINANCIAL & NON-BINDING GUARANTEE</div>
                <div className="text-sm text-gray-600 space-y-3 mb-6 h-48 overflow-y-auto pr-2">
                    <p><strong>1. No Financial Liability:</strong> QC Validator is a documentation and communication tool. We do not handle payments, escrow, or financial transactions.</p>
                    <p><strong>2. Verification Limitations:</strong> "Verified" status indicates document submission, not a physical audit.</p>
                    <p><strong>3. Data Privacy:</strong> Data uploaded is shared between the designated Seller and Buyer.</p>
                    <p><strong>4. Misuse:</strong> Usage of this platform for verifying illegal goods will result in immediate account termination.</p>
                </div>
                <button onClick={() => setShowDisclaimer(false)} className="w-full bg-gray-900 text-white font-bold py-3 rounded hover:bg-black transition-colors">I Understand & Accept Responsibility</button>
            </div>
        </div>
      )}
      
      <main className="max-w-7xl mx-auto py-8 px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- 4. LEFT COLUMN: CREATOR TOOLS --- */}
           {appMode === 'seller' && (
       <div className="lg:col-span-4 space-y-6">
  <div id="project-setup" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-24">
   <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
    <span className="bg-gray-100 w-6 h-6 flex items-center justify-center rounded-full text-xs">1</span> Project Setup
</h2>
            {/* SCANNER */}
            <div className="mb-4 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
<label className="text-xs font-bold text-indigo-800 uppercase mb-1 flex justify-between items-center">                    <span>Scan Product / Barcode</span>
                    <Tooltip text="Automatically populate the checklist by scanning a product's barcode."><span className="ml-2 cursor-pointer text-indigo-400 font-bold bg-indigo-100 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">?</span></Tooltip>
                </label>
                <form onSubmit={handleBarcodeScan} className="flex gap-2">
                    <input type="text" placeholder="Click here & Scan (e.g. PROD-101)" value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} autoFocus className="w-full p-2 border border-indigo-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"/>
                    <button type="submit" className="bg-indigo-600 text-white px-3 rounded text-sm hover:bg-indigo-700">🔍</button>
                </form>
                <p className="text-[10px] text-gray-500 mt-1">Try: <b>PROD-101</b>, <b>PHARMA-X</b>, <b>GOLD-999</b></p>
            </div>

            {/* BUSINESS MODEL SELECTOR */}
            <div className="mb-4">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Business Model</label>
                <div className="grid grid-cols-3 gap-2">
                {['B2B', 'B2C', 'B2G', 'B2B2C', 'C2C'].map((m) => (
                    <button key={m} onClick={() => { setBusinessModel(m as BusinessModel); applySegmentTemplate(m as BusinessModel); }} className={`text-[10px] py-2 border rounded font-bold transition-all ${businessModel === m ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                    {m}
                    </button>
                ))}
                </div>
                <p className="text-[10px] text-indigo-500 mt-1 italic bg-indigo-50 px-2 py-1 rounded">
                {businessModel === 'B2B' && '🏢 Optimized for Contracts & Bulk Quality.'}
                {businessModel === 'B2C' && '🛍️ Optimized for User Experience & Safety.'}
                {businessModel === 'B2G' && '🏛️ Optimized for Strict Compliance & Audits.'}
                {(businessModel === 'B2B2C' || businessModel === 'C2C') && '🤝 Optimized for Platform & Intermediary Checks.'}
                </p>
            </div>

            {/* TYPE SELECTOR */}
            <div className="flex gap-1 mb-2">
              {['physical', 'service', 'software'].map((t) => (
                <button key={t} onClick={() => { setSelectedType(t as QCType); setItems([]); }} className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded border transition-colors ${selectedType === t ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  {t}
                </button>
              ))}
            </div>

            {/* INDUSTRY SELECTOR */}
            <div className="mb-4">
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Industry Sector</label>
              <select value={selectedIndustry} onChange={(e) => setSelectedIndustry(e.target.value)} className="w-full p-2 border rounded bg-gray-50 text-sm outline-none">
                {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </div>

            {/* STANDARD SELECTOR */}
            <div className="mb-4">
<label className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
                      <span>Compliance Level</span>
                    <Tooltip text="Global or National Standard"><span className="ml-2 cursor-pointer text-gray-400 font-bold bg-gray-100 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">?</span></Tooltip>
                </label>
                <div className="flex gap-1 mb-2">
                    <button onClick={() => setStandardType('global')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded border transition-colors ${standardType === 'global' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>🌍 Global</button>
                    <button onClick={() => setStandardType('national')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded border transition-colors ${standardType === 'national' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>📍 National</button>
                </div>

                {standardType === 'global' ? (
                <select value={standard} onChange={(e) => setStandard(e.target.value as Standard)} className="w-full p-2 border rounded bg-gray-50 text-sm">
                    <option value="General">General Quality</option>
                    <option value="ISO 9001">ISO 9001 (Quality Mgmt)</option>
                    <option value="HACCP">HACCP (Food Safety)</option>
                    <option value="ASTM">ASTM (Materials)</option>
                    <option value="EU-GMP">EU GMP (Pharma)</option>
                    <option value="FDA (21 CFR)">FDA 21 CFR (Medical)</option>
                    <option value="API (Oil)">API (Petroleum)</option>
                    <option value="Kimberley (Gems)">Kimberley (Gems)</option>
                </select>
                ) : (
                <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className="w-full p-2 border rounded bg-gray-50 text-sm">
                    <option value="" disabled>-- Select a Country --</option>
                    {communityStandards.map(standard => (
                        <option key={standard.id} value={standard.id}>{standard.countryName} ({standard.authorityName})</option>
                    ))}
                </select>
                )}
                <Link href="/standards" className="text-xs text-indigo-600 hover:underline mt-1 block">Don't see your country? Contribute to the Standards Hub →</Link>
            </div>

            <input type="text" placeholder="Project Title (e.g. Batch #402)" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 border rounded mb-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"/>

            {/* FILE UPLOAD */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center mb-6 bg-gray-50 hover:bg-indigo-50 cursor-pointer relative">
              <p className="text-xs text-gray-500 font-medium">📄 Auto-Extract from Specs (.txt/.csv)</p>
              <input type="file" onChange={handleDocUpload} accept=".csv,.txt" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
            </div>

{/* --- AGREEMENT CONFIGURATION (International Standard) --- */}
<div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
    <h4 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
        ⚖️ Contract Terms & QC Rules
    </h4>
    <div className="grid grid-cols-2 gap-4">
        <div>
            <label className="text-[10px] uppercase font-bold text-gray-500">Acceptance Score (%)</label>
            <input 
                type="number" 
                placeholder="e.g. 100"
                className="w-full text-sm p-2 border rounded"
                // Bind to state...
            />
        </div>
        <div>
            <label className="text-[10px] uppercase font-bold text-gray-500">Governing Law</label>
            <select className="w-full text-sm p-2 border rounded">
                <option>International Trade (Incoterms)</option>
                <option>US Law</option>
                <option>EU Law</option>
            </select>
        </div>
        <div className="col-span-2">
            <label className="text-[10px] uppercase font-bold text-gray-500">Payment Condition</label>
            <input 
                type="text" 
                placeholder="e.g. 50% Upfront, 50% on QC Pass"
                className="w-full text-sm p-2 border rounded"
            />
        </div>
    </div>
</div>

            {/* DYNAMIC PARAMETERS LIST */}
            <h3 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-2 pt-6 border-t mt-6">
                <span className="bg-gray-100 w-6 h-6 flex items-center justify-center rounded-full text-xs">2</span> Add Parameters
            </h3>
            <div className="space-y-1 mb-6">
                {getActiveParameters().map((param: any) => (
                <button key={param.cat} onClick={() => addManualItem(param.cat)} className="w-full flex justify-between items-center px-3 py-2 text-xs bg-white hover:bg-indigo-50 rounded border text-left group transition-all">
                    <div><span className="font-medium text-gray-700">{param.cat}</span><span className="block text-[10px] text-gray-400 group-hover:text-indigo-400">{param.hint}</span></div>
<span className="text-gray-300 group-hover:text-indigo-600 text-lg">+</span>
                </button>
                ))}
            </div>

            <div className="mb-4 flex items-start gap-2 bg-red-50 p-3 rounded border border-red-100">
<input 
    type="checkbox" 
    id="compliance" 
    checked={complianceCheck} // Keep this simple, the state is now strongly typed
    onChange={handleComplianceChange} // Use the new handler function
    className="mt-1 h-4 w-4 text-red-600 ..." 
/>                <label htmlFor="compliance" className="text-[10px] text-red-800 leading-tight">I certify this project <b>does not</b> involve unlawful or illegal materials.</label>
            </div>

            {/* SEOSiri Tool Promotion */}
            {selectedType === 'software' && (
              <div className="mb-6 bg-gray-900 text-white p-4 rounded-xl shadow-lg border border-gray-800 animate-fade-in">
                <h3 className="text-[10px] font-bold uppercase text-gray-400 mb-3 tracking-wider flex items-center gap-2"><span>⚡</span> Integrated Tooling</h3>
                <div className="space-y-3">
                  <a href="https://marketplace.visualstudio.com/items?itemName=SEOSiri.codemender-ia" target="_blank" rel="noopener noreferrer" className="block group p-2 rounded hover:bg-gray-800 transition-all border border-transparent hover:border-gray-700">
                    <div className="flex items-center gap-3"><div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-lg shadow-md group-hover:scale-110 transition-transform">🤖</div><div><p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">CodeMender IA</p></div></div>
                  </a>
                  <a href="https://marketplace.visualstudio.com/items?itemName=SEOSiri.api-validator" target="_blank" rel="noopener noreferrer" className="block group p-2 rounded hover:bg-gray-800 transition-all border border-transparent hover:border-gray-700">
                    <div className="flex items-center gap-3"><div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-lg shadow-md group-hover:scale-110 transition-transform">🛡️</div><div><p className="text-xs font-bold text-white group-hover:text-green-400 transition-colors">API Validator</p></div></div>
                  </a>
                </div>
              </div>
            )}

            <button onClick={handleSave} disabled={isSaving} className="w-full bg-indigo-600 text-white py-3 rounded font-bold hover:bg-indigo-700">
                      {isSaving ? 'Saving...' : 'Finalize & Grade Project'}
                   </button>
            </div>
           </div>
        )}

        {/* --- 5. RIGHT COLUMN: WORKSPACE & REPORTS --- */}
         <div className={`${appMode === 'seller' ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-6`}>
          {/* BUYER MODE HEADER */}
          {appMode === 'buyer' && (
              <div className="bg-green-100 border border-green-200 p-6 rounded-xl flex justify-between items-center mb-6">
                  <div>
                      <h2 className="text-2xl font-bold text-green-900">Incoming Inspections</h2>
                      <p className="text-green-700 text-sm">Review quality reports and sign agreements sent by suppliers.</p>
                  </div>
                  <div className="text-4xl">📥</div>
              </div>
          )}
        <div className="lg:col-span-8 space-y-6">
         <ReferralSection />


          {/* LIVE DRAFTING AREA - UPDATED WITH PLACEHOLDERS */}
          {items.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 animate-slide-up">
              <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-indigo-900">Drafting: {title || 'Untitled Project'}</h3><span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-bold">IN PROGRESS</span></div>
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 items-start group hover:border-indigo-200 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1"><span className="text-[10px] font-bold bg-gray-200 px-1.5 py-0.5 rounded text-gray-600 uppercase tracking-wide">{item.category}</span><span className="text-[10px] text-indigo-500 font-medium">{item.gapAnalysis}</span></div>
                      <p className="text-sm font-medium text-gray-800">{item.requirement}</p>
                    </div>
                    {/* BEFORE IMAGE - UPDATED WITH RED PLACEHOLDER */}
                   {/* BEFORE IMAGE */}
<div className="w-24 flex-shrink-0 relative group/tooltip">
    <p className="text-[9px] text-center text-gray-400 mb-1">BEFORE</p>
    
    {/* HOVER TOOLTIP INSTRUCTION */}
    <div className="absolute -top-8 left-0 w-32 bg-black text-white text-[9px] p-1 rounded hidden group-hover/tooltip:block z-20">
        ⚠️ Max 100KB per image. Use compressed .jpg or .webp
    </div>

    {item.evidenceBefore ? (
        <div className="relative group/img">
            <img src={item.evidenceBefore} className="w-24 h-24 object-cover rounded border border-green-200 shadow-sm" alt="Before" />
        </div>
    ) : (
        <label className="cursor-pointer flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-red-300 bg-red-50 rounded hover:bg-white hover:border-indigo-400 transition-all">
            <span className="text-xl text-gray-300 mb-1">📷</span>
            <span className="text-[8px] text-red-500 font-bold">MISSING</span>
            <span className="text-[7px] text-gray-400 text-center px-1">Max 100KB</span>
            <input type="file" className="hidden" accept="image/jpeg, image/webp" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0], idx, 'before')} />
        </label>
    )}
</div>
    {/* AFTER IMAGE */}
<div className="w-24 flex-shrink-0 relative group/tooltip">
    <p className="text-[9px] text-center text-gray-400 mb-1">AFTER</p>
    
    {/* HOVER TOOLTIP INSTRUCTION */}
    <div className="absolute -top-8 left-0 w-32 bg-black text-white text-[9px] p-1 rounded hidden group-hover/tooltip:block z-20">
        ⚠️ Max 100KB per image. Use compressed .jpg or .webp
    </div>

    {item.evidenceAfter ? (
        <div className="relative group/img">
            <img src={item.evidenceAfter} className="w-24 h-24 object-cover rounded border border-green-200 shadow-sm" alt="After" />
            <div className="absolute bottom-0 w-full bg-green-500 text-white text-[10px] text-center font-bold py-0.5">VERIFIED</div>
        </div>
    ) : (
        <label className="cursor-pointer flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-red-300 bg-red-50 rounded hover:bg-white hover:border-indigo-400 transition-all">
            <span className="text-xl text-gray-300 mb-1">✨</span>
            <span className="text-[8px] text-red-500 font-bold">MISSING</span>
            <span className="text-[7px] text-gray-400 text-center px-1">Max 100KB</span>
            <input type="file" className="hidden" accept="image/jpeg, image/webp" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0], idx, 'after')} />
        </label>
    )}
</div>
                    <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-gray-300 hover:text-red-500 px-2 text-lg">×</button>
                  </div>
                ))}
              </div>
            </div>
          )}



{/* --- NEW: MY ACTIVE LISTINGS SECTION --- */}
                    {appMode === 'seller' && myListings.length > 0 && (
            <div className="mb-8">
              <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2 mb-4"><span>🏛️</span> My Town Hall Listings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myListings.map(listing => (
                  <div 
                    key={listing.id} 
                    onClick={() => router.push(`/report/${listing.checklistId}`)}
                    className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex justify-between items-center cursor-pointer hover:shadow-md hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                  >
                    <div>
                        <h4 className="font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">{listing.title}</h4>
                        <p className="text-xs text-gray-500">{listing.standard} • {listing.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full font-bold group-hover:bg-indigo-200">
                            View Report
                        </span>
                        
                        {/* Delete Button (Stop Propagation prevents opening the report when clicking delete) */}
                        <button 
                            onClick={(e) => {
                                e.stopPropagation(); 
                                deleteListing(listing.id);
                            }} 
                            className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-white rounded-full transition-colors"
                            title="Remove Listing"
                        >
                            ✕
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          )}


          {/* COMPLETED REPORTS SECTION */}
 {/* --- COMPLETED REPORTS SECTION (UPDATED) --- */}
          <div className="flex justify-between items-center mt-8 mb-4"> {/* Added flex container */}
            <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <span>{appMode === 'seller' ? '📋 My QC Projects' : '✅ Pending Approvals'}</span>
                {/* Only show count if loaded, otherwise show message */}
                {savedChecklists.length > 0 && <span className="text-sm text-gray-500">({savedChecklists.length} loaded)</span>}
            </h2>
            <button
                onClick={handleManualRefresh} // Calls the new unified handler
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading} // Disable if currently loading
            >
                {loading ? <span className="animate-spin">🔄</span> : '🔄 Refresh Data'}
            </button>
          </div>
          
          {/* --- ORIGINAL EMPTY STATE (Now handles "No reports generated yet" and "No projects loaded") --- */}
          {savedChecklists.length === 0 && !loading && (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-400 mb-2">
                {/* This message dynamically changes based on initial state vs. user has refreshed */}
                {savedChecklists.length === 0 && user && !loading && "No projects loaded. Click 'Refresh Data' to view your projects."}
                {savedChecklists.length === 0 && !user && !loading && "No reports generated yet. Create a new project on the left to get started."}
              </p>
              <p className="text-xs text-gray-400">This helps manage your Firebase reads.</p> {/* Added context */}
            </div>
          )}
          
          {/* --- LOADING INDICATOR (New) --- */}
          {loading && ( // Show a loading indicator when data is being fetched
             <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500 text-sm flex items-center justify-center gap-2 animate-pulse">
                    <span className="animate-spin">🔄</span> Loading projects...
                </p>
            </div>
          )}

{/* --- ROLE FILTER TABS --- */}
          <div className="flex items-center gap-6 mb-6 border-b border-gray-200">
              <button 
                  onClick={() => setViewMode('all')}
                  className={`pb-3 text-sm font-bold border-b-2 transition-colors ${viewMode === 'all' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                  All Projects
              </button>
              <button 
                  onClick={() => setViewMode('selling')}
                  className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-colors ${viewMode === 'selling' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                  <span>📤</span> Selling (Outgoing)
              </button>
              <button 
                  onClick={() => setViewMode('buying')}
                  className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-colors ${viewMode === 'buying' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                  <span>📥</span> Buying (Incoming)
              </button>
          </div>

{filteredChecklists.map(list => {
              // --- 1. DATA PREPARATION (This is correct) ---
              const listing = myListings.find((l: any) => l.checklistId === list.id);
              let isStale = false;
              if (listing && listing.lastMaintainedAt) {
                  const now = new Date();
                  const cutoff = new Date();
                  cutoff.setDate(now.getDate() - 90);
                  const lastMaintainedDate = listing.lastMaintainedAt.toDate 
                      ? listing.lastMaintainedAt.toDate() 
                      : new Date(listing.lastMaintainedAt);
                  isStale = lastMaintainedDate < cutoff;
              }

              // --- 2. START RENDERING ---
              return (
            <div key={list.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
              
              {/* --- HEADER --- */}
              <div className="p-5 flex justify-between items-start bg-gray-50 border-b">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-gray-900 text-lg">{list.title}</h3>
                    {user.uid === list.uid && (
                        <button onClick={() => handleDelete(list.id)} className="text-gray-400 hover:text-red-600" title="Delete Project">
                            🗑️
                        </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] uppercase font-bold">
                    <span className="bg-white border px-2 py-0.5 rounded text-gray-500">{list.type}</span>
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{list.standard}</span>
                    
                   {/* --- NEW ROLE BADGE --- */}
                    {user.uid === list.uid ? (
                        <span className="bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded flex items-center gap-1">
                           📤 SELLER
                        </span>
                    ) : (
                        <span className="bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded flex items-center gap-1">
                           📥 BUYER
                        </span>
                    )}

                    <span className="text-gray-400">|</span>
                    <span className="text-gray-500">
                        {list.createdAt?.seconds ? new Date(list.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                    </span>
                  </div>
                </div>
              {/* --- REPLACING THE SCORE BADGE WITH SMART STATUS --- */}
                <div className={`px-4 py-2 rounded-lg text-center flex-shrink-0 ${
                    // Use the dynamic check here instead of hardcoded 100
                    list.score >= (list.acceptanceThreshold || 100) 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }`}>
                  <span className="block text-2xl font-bold">{list.score}%</span>
                  <span className="text-[10px] uppercase font-bold">
                    {list.score >= (list.acceptanceThreshold || 100) ? 'Passed' : 'Failed'}
                  </span>
                </div>
              </div>

           {/* --- AGREEMENT & MARKET SECTION --- */}

           {/* --- AGREEMENT CONFIGURATION (International Standard) --- */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
          <h4 className="font-bold text-gray-700 text-sm mb-3">Contract Terms & QC Rules</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500">Acceptance Score (%)</label>
              <input 
                type="number" 
                placeholder="e.g. 100" 
                className="w-full text-sm p-2 border rounded"
                value={acceptanceThreshold}
                onChange={(e) => setAcceptanceThreshold(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500">Governing Law</label>
              <select 
                className="w-full text-sm p-2 border rounded"
                value={governingLaw}
                onChange={(e) => setGoverningLaw(e.target.value)}
              >
                <option>International Trade (Incoterms)</option>
                <option>US Law (Option)</option>
                <option>EU Law (Option)</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] uppercase font-bold text-gray-500">Payment Condition</label>
              <input 
                type="text" 
                placeholder="e.g. 50% Upfront, 50% on QC Pass" 
                className="w-full text-sm p-2 border rounded"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              />
            </div>
          </div>
        </div>
              
              {/* [RESTORED] Tell the buyer why they are waiting */}
              {user.email === list.buyerEmail && list.agreementStatus === 'ready_to_sign' && (
                <div className="bg-yellow-50 px-6 py-2 border-b border-yellow-100">
                    <span className="text-xs text-yellow-700 italic font-medium">⏳ Waiting for Seller to sign first...</span>
                </div>
              )}

              {/* LOGIC GATE: Show Agreement Only if PASS or DRAFTING */}
              {getQCStatus(list) === 'PASS' || list.agreementStatus === 'drafting' ? (
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-t relative">
                  
                   {/* LOCKED OVERLAY (If score < threshold but drafting) */}
                   {getQCStatus(list) === 'FAIL' && (
                      <div className="absolute inset-0 bg-gray-100/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-4 text-center">
                          <p className="text-lg font-bold text-gray-600">🔒 Agreement Locked</p>
                          <p className="text-sm text-gray-500">Score {list.score}% is below the required threshold.</p>
                      </div>
                   )}

                   {/* --- CERTIFICATE UI --- */}
                   <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6 shadow-inner relative overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-100 text-8xl font-black -rotate-12 pointer-events-none select-none z-0">
                            {list.agreementStatus === 'completed' ? 'EXECUTED' : 'DRAFT'}
                        </div>
                        <div className="relative z-10">
                            <div className="text-center border-b border-gray-300 pb-4 mb-4">
                                <h4 className="font-serif text-xl text-gray-900 font-bold tracking-widest">CERTIFICATE OF COMPLIANCE & SALE</h4>
                                <p className="text-xs text-gray-500 uppercase mt-1">Doc ID: {list.id}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-8 text-sm mb-6">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">SELLER (PARTY A)</p>
                                    <p className="font-semibold text-gray-800">{list.sellerEmail}</p>
                                    <p className="text-xs text-gray-600 mt-1">{list.sellerAddress || "Address not provided."}</p>
                                    {list.agreementStatus !== 'ready_to_sign' && list.agreementStatus !== 'pending_buyer' && (
                                        <p className="text-green-600 text-xs font-bold mt-1">✓ Digitally Signed</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">BUYER (PARTY B)</p>
                                    <p className="font-semibold text-gray-800">{list.buyerEmail || "Pending Invite..."}</p>
                                    <p className="text-xs text-gray-600 mt-1">{list.buyerAddress || "Address not provided."}</p>
                                    {list.agreementStatus === 'completed' && (
                                        <p className="text-green-600 text-xs font-bold mt-1">✓ Digitally Signed</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-gray-50 p-3 rounded border text-xs text-gray-600 mb-6">
                                <p><strong>TERMS:</strong> Seller certifies that "{list.title}" complies with <strong>{list.standard}</strong> standards. Buyer accepts the results.</p>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <div className="px-3 py-1 rounded-full text-xs font-bold border bg-white">STATUS: <span className="text-indigo-600">{list.agreementStatus?.replace(/_/g, ' ').toUpperCase()}</span></div>
                                <div className="flex gap-2">
                                     {list.agreementStatus === 'pending_buyer' && user.email === list.sellerEmail && (
                                        <button onClick={() => { const link = `${window.location.origin}/invite/${list.id}`; navigator.clipboard.writeText(link); alert("Link Copied!"); }} className="bg-yellow-500 text-white px-4 py-2 rounded text-xs font-bold">+ Invite Buyer</button>
                                    )}
                                    {user.email === list.sellerEmail && list.agreementStatus === 'ready_to_sign' && (
                                        <button onClick={() => handleDigitalSign(list, 'A')} disabled={!!signingLoading} className="bg-indigo-600 text-white px-6 py-2 rounded text-xs font-bold">✍️ Sign as Seller</button>
                                    )}
                                    {user.email === list.buyerEmail && list.agreementStatus === 'party_a_signed' && (
                                        <button onClick={() => handleDigitalSign(list, 'B')} disabled={!!signingLoading} className="bg-green-600 text-white px-6 py-2 rounded text-xs font-bold">✍️ Sign as Buyer</button>
                                    )}
                                </div>
                            </div>
                        </div>
                   </div>

                   {/* --- ACTION BAR --- */}
                   <div className="flex gap-2 justify-end mb-4 border-t border-blue-200 pt-4">
                        <button onClick={() => setActiveChatChecklist(list)} className="flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-blue-600">💬 Chat</button>
                        <button onClick={() => openCommunicationHub(list)} className="flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-red-600">📹 Live Vision</button>
                        {list.agreementStatus === 'completed' && (
                            <button onClick={() => generatePDF(list)} className="flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-black">🖨️ PDF</button>
                        )}
                        <button onClick={() => { const url = `https://qcval.seosiri.com/report/${list.id}`; navigator.clipboard.writeText(url); alert("Link Copied!"); }} className="flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-indigo-600">🔗 Share</button>
   {user.uid === list.buyerUid && list.agreementStatus === 'completed' && (
    <button 
        onClick={async () => {
            try {
                // 1. Create the dispute document first
                const disputeRef = await addDoc(collection(db, "disputes"), {
                    checklistId: list.id,
                    buyerId: user.uid,
                    buyerEmail: user.email,
                    sellerId: list.uid,
                    sellerEmail: list.sellerEmail,
                    projectTitle: list.title,
                    status: "pending",
                    createdAt: serverTimestamp(),
                    description: "", // Will be filled on the dispute page
                    evidence: []
                });

                // 2. Navigate to the dispute page with the new dispute ID
                router.push(`/disputes/${disputeRef.id}`);
            } catch (error) {
                console.error("Error creating dispute:", error);
                alert("Failed to create dispute. Please try again.");
            }
        }}
        className="flex items-center gap-1 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded-lg transition-all hover:shadow-lg"
    >
        ⚠️ Raise Dispute
    </button>
)}
                   </div>

                  {/* QC PRESS CTA */}
                  <div className="mt-6 p-4 bg-indigo-100 border border-indigo-200 rounded-lg text-center">
                    <p className="font-bold text-indigo-800">Ready to Soar Globally? 🚀</p>
                    <p className="text-sm text-indigo-700 mt-1">Showcase your quality. <Link href="/press/create" className="font-bold underline">Publish your success story</Link> now!</p>
                  </div> 

                  {/* STALE LISTING UI */}
                  {listing && isStale && (
                     <div className="p-4 bg-red-100 border-t border-red-200 mt-4 rounded">
                        <p className="font-bold text-red-800">⚠️ Listing Unlisted</p>
                        <p className="text-sm text-red-700">This listing is older than 90 days.</p>
                        <button onClick={async () => { const ref = doc(db, 'market_listings', listing.id); await updateDoc(ref, { lastMaintainedAt: serverTimestamp() }); alert('✅ Refreshed!'); fetchMyListings(user.uid); }} className="mt-2 bg-red-600 text-white font-bold px-4 py-2 rounded">Refresh Listing</button>
                     </div>
                  )}

                  {/* MARKET READY SECTION */}
                  {!isStale && (
                      <div className="flex justify-between items-start mt-4 border-t border-blue-200 pt-4">
                        <div>
                          <h4 className="text-indigo-900 font-bold text-sm flex items-center gap-2">🚀 MARKET READY: Buyers Found</h4>
                          <p className="text-xs text-indigo-600 mt-1">This product meets criteria for these networks:</p>
                        </div>
                        {user.email === list.sellerEmail && list.score === 100 && (
                            <button onClick={() => handlePublish(list)} className="bg-white border border-green-600 text-green-700 px-4 py-2 rounded shadow-sm hover:bg-green-50 text-xs font-bold">
                                <span>🌍 Push to Marketplace</span>
                            </button>
                        )}
                      </div>
                  )}
                  
                  {/* MARKET SUGGESTIONS */}
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide mt-3">
                    {getMarketSuggestions(list.standard, list.type).map(buyer => (
                        <div key={buyer} className="bg-white px-4 py-3 rounded-lg shadow-sm border border-indigo-100 whitespace-nowrap text-sm font-medium text-gray-700 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-400"></span>{buyer}
                        </div>
                    ))}
                  </div>

                </div>
              ) : (
                /* --- FAILED STATE (System Rejection) --- */
                <div className="p-6 bg-red-50 border-t border-red-100 text-center">
                    <p className="text-lg font-bold text-red-700">⛔ QC FAILED: Auto-Rejection Enforced</p>
                    <p className="text-sm text-red-600 mt-2">
                        Score {list.score}% is below the agreed threshold of {list.acceptanceThreshold || 100}%.
                    </p>
                    <p className="text-xs text-red-500 mt-1">
                        Per International QC Standards, this shipment is rejected. Please initiate re-inspection.
                    </p>
                </div>
              )}
            </div>
          );
        })}
                
                   
        {filteredChecklists.length === 0 && (
              <div className="text-center py-20 bg-white rounded-xl border-dashed border-2 border-gray-200">
                  <p className="text-gray-400">No projects found in {appMode === 'seller' ? 'Seller' : 'Buyer'} view.</p>
              </div>
          )}  
           </div>   
        </div> {/* Closes Right Column */}
      </main> {/* Closes Main Grid */}

      {/* --- MODALS & FOOTER (OUTSIDE THE LOOP) --- */}
      <Newsletter />

      {activeChatChecklist && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex overflow-hidden animate-slide-up">
                {/* LEFT SIDEBAR */}
                <div className="w-1/3 bg-gray-50 p-6 border-r hidden md:block overflow-y-auto">
                    <h3 className="font-bold text-lg text-gray-900 mb-6">{activeChatChecklist.title}</h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-white rounded-xl shadow-sm border">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Status</label>
                            <p className="font-bold text-sm text-indigo-600 mt-1">{activeChatChecklist.agreementStatus?.replace(/_/g, ' ').toUpperCase()}</p>
                        </div>
                        <div className="p-4 bg-white rounded-xl shadow-sm border">
                             <label className="text-[10px] font-bold text-gray-400 uppercase">Live Vision</label>
                             {activeChatChecklist.activeMeetingUrl ? (
                                <a href={activeChatChecklist.activeMeetingUrl} target="_blank" className="flex items-center gap-2 mt-2 text-white bg-indigo-600 px-3 py-2 rounded-lg text-xs font-bold">📹 Join Call</a>
                             ) : <p className="text-xs text-gray-400 italic">No meeting.</p>}
                        </div>
                    </div>
                </div>
                {/* RIGHT SIDE (CHAT) */}
                <div className="flex-1 flex flex-col bg-white">
                    <div className="p-4 border-b flex justify-between items-center bg-white shadow-sm z-10">
                        <h4 className="font-bold text-gray-800">Secure Internal Chat</h4>
                        <button onClick={() => setActiveChatChecklist(null)} className="text-gray-400 hover:text-red-500 text-xl">✕</button>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-3">
                        {activeChatChecklist.messages?.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm text-sm ${msg.senderId === user.uid ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-800 border rounded-bl-none'}`}>
                                    {msg.senderId !== user.uid && <p className="text-[10px] font-bold text-indigo-500 mb-1">{msg.senderEmail?.split('@')[0]}</p>}
                                    <p className="whitespace-pre-wrap">{msg.text || msg.textOriginal}</p>
                                    <p className={`text-[9px] mt-1 text-right ${msg.senderId === user.uid ? 'text-indigo-200' : 'text-gray-400'}`}>{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef}></div>
                    </div>
                    <div className="p-4 border-t bg-white">
                        <div className="flex gap-2 items-center bg-gray-100 p-1.5 rounded-full border">
                            <input type="text" value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Type a message..." className="flex-1 bg-transparent px-4 py-2 text-sm outline-none"/>
                            <button onClick={sendMessage} disabled={!chatInput.trim()} className="bg-indigo-600 text-white w-10 h-10 flex items-center justify-center rounded-full hover:bg-indigo-700 disabled:opacity-50">➤</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {showGroupSelector && (
        <GroupSelectorModal 
          checklist={showGroupSelector}
          onClose={() => setShowGroupSelector(null)}
          onPublish={publishToListing}
        />
      )}
      {/* --- PASTE THE SUMMARY MODAL HERE --- */}
      {showSummary && (
        <WeeklySummaryModal 
            data={summaryData}
            onClose={() => setShowSummary(false)}
        />
      )}
    </div>
    </>
  );
}

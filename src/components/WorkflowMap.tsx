'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getCountFromServer, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// --- THE WORKFLOW DATA (Updated for Cross Mitigation) ---
const workflowSteps = {
  seller: [
    { id: 1, title: "Verify Identity", icon: "🛡️", desc: "Generate Meta Tag & verify domain to become a Trusted Seller.", keywords: "verification, trust" },
    { id: 2, title: "Create Project", icon: "📝", desc: "Select Industry & ISO Standards. Upload 100% Evidence.", keywords: "drafting, compliance" },
    { id: 3, title: "Invite Buyer", icon: "📩", desc: "Generate a secure link to invite your buyer to the digital contract.", keywords: "invitation, secure link" },
    { id: 4, title: "Execute Contract", icon: "✍️", desc: "Sign as Party A. Once the buyer signs, the deal is legally binding.", keywords: "esignature, contract" },
    { id: 5, title: "Push to Market", icon: "🚀", desc: "List your verified surplus in the QC Val Town Hall.", keywords: "marketplace, export" }
  ],
  buyer: [
    { id: 1, title: "Join Platform", icon: "👋", desc: "Sign up for free to access the secure ecosystem.", keywords: "signup, free account" },
    { id: 2, title: "Browse Town Hall", icon: "🏛️", desc: "Find verified products sorted by Industry Groups.", keywords: "sourcing, procurement" },
    { id: 3, title: "Request Custom", icon: "💬", desc: "Click 'Request Custom Report' on any listing to start a private chat.", keywords: "leads, negotiation" },
    { id: 4, title: "Review Evidence", icon: "🔍", desc: "Inspect the 'Before/After' photos in the seller's QC report.", keywords: "audit, inspection" },
    { id: 5, title: "Sign & Purchase", icon: "✅", desc: "Countersign as Party B to complete the trade securely.", keywords: "purchase, closing" }
  ]
};

export default function WorkflowMap() {
  const [roleView, setRoleView] = useState<'seller' | 'buyer'>('seller');
  const [reportCount, setReportCount] = useState<number | null>(null);

  // --- LIVE STATS FETCH ---
  useEffect(() => {
    async function fetchCount() {
        try {
            const coll = collection(db, "checklists");
            const snapshot = await getCountFromServer(coll);
            setReportCount(snapshot.data().count);
        } catch (e) {
            console.error("Stats fetch error:", e);
        }
    }
    fetchCount();
  }, []);

  return (
    <div className="py-16 w-full overflow-x-hidden bg-gray-50">
      
      {/* HEADER & TOGGLE */}
      <div className="text-center mb-12 px-4">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">System Workflow Map</h2>
        
        {/* LIVE STATS BADGE */}
        <div className="inline-flex items-center gap-2 bg-indigo-100 border border-indigo-200 px-4 py-1.5 rounded-full mb-8">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>
            <span className="text-sm font-bold text-indigo-800">
                {reportCount !== null ? `${reportCount}+` : '...'} Verified Reports Generated
            </span>
        </div>

        {/* ROLE TOGGLE */}
        <div className="flex justify-center gap-4">
            <button 
                onClick={() => setRoleView('seller')} 
                className={`px-8 py-3 rounded-lg font-bold transition-all shadow-sm ${roleView === 'seller' ? 'bg-indigo-600 text-white ring-2 ring-indigo-600 ring-offset-2' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
                I am a Seller
            </button>
            <button 
                onClick={() => setRoleView('buyer')} 
                className={`px-8 py-3 rounded-lg font-bold transition-all shadow-sm ${roleView === 'buyer' ? 'bg-green-600 text-white ring-2 ring-green-600 ring-offset-2' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
                I am a Buyer
            </button>
        </div>
      </div>

      {/* WORKFLOW STEPS */}
      <div className="relative max-w-7xl mx-auto px-4">
        
        {/* Connecting Line (Desktop) */}
        <div className="hidden md:block absolute top-1/2 left-4 right-4 h-1 bg-gray-200 -z-10 transform -translate-y-1/2 rounded"></div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {workflowSteps[roleView].map((step, index) => (
            <motion.div 
              key={`${roleView}-${step.id}`} // Force re-render on toggle
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative group h-full"
            >
              {/* Connector Line (Mobile) */}
              {index !== workflowSteps[roleView].length - 1 && (
                <div className="md:hidden absolute bottom-[-24px] left-1/2 w-1 h-6 bg-gray-200 transform -translate-x-1/2"></div>
              )}

              {/* The Node Card */}
              <div className="bg-white border-2 border-gray-100 p-6 rounded-xl shadow-sm hover:shadow-xl hover:border-indigo-500 transition-all duration-300 cursor-default flex flex-col items-center text-center z-10 h-full">
                
                {/* Step Number Badge */}
                <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md group-hover:scale-110 transition-transform text-white ${roleView === 'seller' ? 'bg-indigo-600' : 'bg-green-600'}`}>
                  {step.id}
                </div>

                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{step.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">{step.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                
                {/* Hidden Keywords for SEO */}
                <span className="sr-only">Keywords: {step.keywords}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
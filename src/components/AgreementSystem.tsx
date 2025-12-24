// src/components/AuthForm.tsx  <-- WRONG FILE NAME IN PREVIOUS PROMPT, USE THIS:
// src/components/AgreementSystem.tsx

'use client';

import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface AgreementProps {
  projectId: string;
  partyAName: string; // The Supplier/Seller
  partyBName: string; // The Buyer
  qcScore: number;
  projectTitle: string;
}

export default function AgreementSystem({ projectId, partyAName, partyBName, qcScore, projectTitle }: AgreementProps) {
  // States: 'pending_qc', 'ready_to_sign', 'party_a_signed', 'completed'
  const [status, setStatus] = useState('ready_to_sign'); 
  const [loading, setLoading] = useState(false);

  // 1. Logic to Sign the Document (Digital Signature)
  const handleDigitalSign = async (signer: 'A' | 'B') => {
    setLoading(true);
    const timestamp = new Date().toISOString();
    
    // In a real app, we update Firebase here
    // await updateDoc(doc(db, "projects", projectId), { ... });

    // Simulate network delay
    setTimeout(() => {
        if (signer === 'A') {
            setStatus('party_a_signed');
            alert(`Signed by ${partyAName}. Notification sent to ${partyBName}.`);
        } else {
            setStatus('completed');
            alert("Agreement Fully Executed!");
            generatePDF(); // Auto download upon final signature
        }
        setLoading(false);
    }, 1000);
  };

  // 2. Logic to Generate Printable PDF
  const generatePDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.text("QUALITY CONTROL COMPLIANCE AGREEMENT", 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Project: ${projectTitle}`, 20, 40);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 50);
    doc.text(`QC Score: ${qcScore}% (PASSED)`, 20, 60);

    doc.text("AGREEMENT TERMS:", 20, 80);
    doc.setFontSize(10);
    const text = `Party A (${partyAName}) certifies that the goods/services listed in this project have passed all Quality Control parameters as defined in the system. Party B (${partyBName}) acknowledges receipt of this validation.`;
    doc.text(text, 20, 90, { maxWidth: 170 });

    // Digital Signatures Section in PDF
    doc.text("__________________________", 20, 140);
    doc.text(`Signed by: ${partyAName}`, 20, 145);
    doc.text(`Timestamp: ${new Date().toISOString()}`, 20, 150);
    doc.text("[ Verified Digital Signature ]", 20, 155);

    if (status === 'completed') {
        doc.text("__________________________", 120, 140);
        doc.text(`Signed by: ${partyBName}`, 120, 145);
        doc.text(`Timestamp: ${new Date().toISOString()}`, 120, 150);
        doc.text("[ Verified Digital Signature ]", 120, 155);
    }

    doc.save(`${projectTitle}_Agreement.pdf`);
  };

  if (qcScore < 100) {
    return (
        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400">
            <p className="text-yellow-700">⚠️ Improve QC Score to 100% to unlock Agreement generation.</p>
        </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mt-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        📄 Digital Contract & Execution
        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Secure</span>
      </h3>

      <div className="bg-gray-50 p-4 rounded mb-4 text-sm font-mono border border-gray-300">
        <p><strong>AGREEMENT ID:</strong> {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
        <p><strong>STATUS:</strong> {status.replace(/_/g, ' ').toUpperCase()}</p>
      </div>

      <div className="flex gap-4">
        {status === 'ready_to_sign' && (
            <button 
                onClick={() => handleDigitalSign('A')}
                disabled={loading}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 w-full"
            >
                {loading ? 'Signing...' : `Sign as ${partyAName} (Party A)`}
            </button>
        )}

        {status === 'party_a_signed' && (
            <button 
                onClick={() => handleDigitalSign('B')}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full"
            >
                {loading ? 'Processing...' : `Approve & Sign as ${partyBName} (Party B)`}
            </button>
        )}

        {status === 'completed' && (
            <button 
                onClick={generatePDF}
                className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 w-full flex items-center justify-center gap-2"
            >
                🖨️ Download Signed PDF
            </button>
        )}
      </div>
    </div>
  );
}
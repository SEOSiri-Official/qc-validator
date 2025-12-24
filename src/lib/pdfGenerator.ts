// src/lib/pdfGenerator.ts

import { jsPDF } from 'jspdf';
import { Checklist } from '@/lib/knowledgeBase'; // Import the Checklist type

// This function is now a self-contained utility for creating PDF contracts.
export const generatePDF = (checklist: Checklist) => {
  const doc = new jsPDF();
  
  doc.setFontSize(22);
  doc.text("QC COMPLIANCE & PURCHASE AGREEMENT", 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Project: ${checklist.title}`, 20, 40);
  doc.text(`Industry: ${checklist.industry}`, 20, 50);
  doc.text(`Business Model: ${checklist.businessModel}`, 20, 60);
  doc.text(`Standard: ${checklist.standard}`, 20, 70);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 80);
  doc.text(`QC Score: ${checklist.score}% (PASSED)`, 20, 90);

  doc.text("AGREEMENT TERMS:", 20, 110);
  doc.setFontSize(10);
  const termsText = `Party A (${checklist.sellerEmail}) certifies that the goods/services listed have passed all Quality Control parameters mandated by ${checklist.standard}. Party B (${checklist.buyerEmail}) acknowledges receipt and approves the order.`;
  doc.text(termsText, 20, 120, { maxWidth: 170 });

  doc.text("COMPLIANCE STATEMENT:", 20, 150);
  doc.text("Both parties certify that no unlawful or illegal materials are involved.", 20, 155);
  doc.text("Adherence to international trade laws and safety regulations is confirmed.", 20, 160);

  // Signature Block for Party A (Seller)
  doc.text("__________________________", 20, 180);
  doc.text(`Signed by Party A: ${checklist.sellerEmail}`, 20, 185);
  doc.text(`Timestamp: ${new Date().toISOString()}`, 20, 190);
  
  // Signature Block for Party B (Buyer), only if fully completed
  if (checklist.agreementStatus === 'completed') {
      doc.text("__________________________", 120, 180);
      doc.text(`Signed by Party B: ${checklist.buyerEmail}`, 120, 185);
      doc.text(`Timestamp: ${new Date().toISOString()}`, 120, 190);
  }

  doc.save(`${checklist.title}_Agreement.pdf`);
};
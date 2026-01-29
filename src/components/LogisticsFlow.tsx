// src/components/LogisticsFlow.tsx

import React from 'react';

interface LogisticsFlowProps {
  finalStatus: 'completed' | 'cancelled' | 'pending';
  qcStatus: 'PASS' | 'FAIL' | 'CONDITIONAL' | undefined;
  // We can pass more data later, like destination country, if needed
}

// 🚨 ACTION REQUIRED: Replace these placeholders with your actual Miro/Creately embed URLs.
// You must create these three main flows on your external platform first.
const MAPPED_FLOW_URLS = {
    // Phase 3: Successful QC, Ready for Signed Delivery
    SUCCESS_DELIVERY: 'https://miro.com/app/live-embed/uXjVGJceok8=/?embedMode=view_only_without_ui&moveToViewport=3135%2C-183%2C4618%2C2623&embedId=728087722799', 
    
    // Phase 4: Exception - QC failed, triggering Rework/Scrap protocol
    QC_FAILURE: 'https://miro.com/app/live-embed/uXjVGIix6yI=/?focusWidget=3458764657441735936&embedMode=view_only_without_ui&embedId=735894026750',
    
    // Phase 4: Exception - Delivery failed (No signature), triggering Return protocol
    DELIVERY_EXCEPTION: 'https://miro.com/app/live-embed/uXjVGIi77mw=/?embedMode=view_only_without_ui&moveToViewport=143%2C-1231%2C5041%2C2863&embedId=697960738630', 
    
    // Default or Generic Overview
    OVERVIEW: 'https://miro.com/app/live-embed/uXjVGIiKeQY=/?focusWidget=3458764657443151894&embedMode=view_only_without_ui&embedId=108163346849'
};

const getFlowUrl = (status: 'completed' | 'cancelled' | 'pending', qc: 'PASS' | 'FAIL' | 'CONDITIONAL' | undefined): string => {
    
    if (qc === 'FAIL') {
        return MAPPED_FLOW_URLS.QC_FAILURE;
    }
    if (status === 'completed' && qc === 'PASS') {
        return MAPPED_FLOW_URLS.SUCCESS_DELIVERY; // Golden Path
    }
    if (status === 'cancelled' || status === 'pending') {
         return MAPPED_FLOW_URLS.DELIVERY_EXCEPTION; // Delivery/Transit issues
    }
    return MAPPED_FLOW_URLS.OVERVIEW;
};

const LogisticsFlow: React.FC<LogisticsFlowProps> = ({ finalStatus, qcStatus }) => {
  const flowUrl = getFlowUrl(finalStatus, qcStatus);

  return (
    <div className="mt-8 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
          📦 Dynamic Logistics Workflow Map
      </h3>
      <p className="text-sm text-gray-600 mb-4">
          This map shows the required Chain-of-Custody based on the product's status: 
          <span className="font-semibold text-indigo-600"> {finalStatus.toUpperCase()} ({qcStatus || 'N/A'})</span>
      </p>

      {/* --- EMBED WINDOW (Crucial for free tier performance) --- */}
      <div className="relative pt-[56.25%]"> {/* 16:9 Aspect Ratio Container */}
        <iframe 
          src={flowUrl}
          frameBorder="0"
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          allowFullScreen
          title="Dynamic Supply Chain Workflow Map"
        ></iframe>
      </div>
    </div>
  );
};

export default LogisticsFlow;
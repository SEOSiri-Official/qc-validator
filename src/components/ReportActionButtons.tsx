'use client';

// --- 1. Define the props interface ---
interface ReportActionButtonsProps {
  report: any; // Or a more specific type if you have one for 'report'
}

export default function ReportActionButtons({ report }: ReportActionButtonsProps) {
    const handleShare = () => {
        // Use the report ID to create a clean, canonical URL
        const url = `${window.location.origin}/report/${report.id}`;
        navigator.clipboard.writeText(url);
        alert('✅ Report Link Copied!');
    };

    const handlePrint = () => {
        window.print();
    };

    // Don't render buttons if there's no report data
    if (!report) return null;

    return (
        <div className="flex gap-2">
            <button 
                onClick={handlePrint} 
                className="bg-gray-100 text-gray-700 font-bold px-4 py-2 rounded-lg text-sm hover:bg-gray-200"
            >
                🖨️ Print / PDF
            </button>
            <button 
                onClick={handleShare}
                className="bg-gray-100 text-gray-700 font-bold px-4 py-2 rounded-lg text-sm hover:bg-gray-200"
            >
                🔗 Share Link
            </button>
        </div>
    );
}
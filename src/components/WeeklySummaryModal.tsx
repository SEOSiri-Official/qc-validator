'use client';

interface SummaryData {
  reportsCompleted: number;
  newListings: number;
  newMessages: number;
}

interface WeeklySummaryProps {
  data: SummaryData;
  onClose: () => void;
}

export default function WeeklySummaryModal({ data, onClose }: WeeklySummaryProps) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-8 text-center animate-slide-up">
        <h2 className="text-2xl font-bold text-gray-900">Welcome Back!</h2>
        <p className="text-gray-600 mt-2 mb-6">Here's your summary for the past week:</p>
        
        <div className="grid grid-cols-3 gap-4 text-center mb-8">
          <div>
            <p className="text-4xl font-bold text-indigo-600">{data.reportsCompleted}</p>
            <p className="text-xs text-gray-500 font-medium uppercase">Reports Completed</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-indigo-600">{data.newListings}</p>
            <p className="text-xs text-gray-500 font-medium uppercase">New Listings</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-indigo-600">{data.newMessages}</p>
            <p className="text-xs text-gray-500 font-medium uppercase">Messages Received</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-black transition-colors"
        >
          Continue to Dashboard
        </button>
      </div>
    </div>
  );
}
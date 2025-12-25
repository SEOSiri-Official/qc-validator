import Link from "next/link";

export default function ManualPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto bg-white p-10 rounded-xl shadow-sm border border-gray-200">
        <div className="mb-8 border-b pb-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">QC Validator User Manual</h1>
          <Link href="/dashboard" className="text-sm font-bold text-indigo-600 hover:underline">← Go to App</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-indigo-900 border-b pb-2">1. Starting a Project</h3>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
                <li><strong>Scan Barcode:</strong> Use the scanner input for standard products (e.g., PROD-101).</li>
                <li><strong>Select Industry:</strong> Choose from Pharma, Manufacturing, Gems, etc. The system will auto-load <a href="https://www.iso.org/iso-9001-quality-management.html" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">ISO 9001</a> or relevant parameters.</li>
                <li><strong>Upload Specs:</strong> Use the CSV/TXT upload to auto-extract requirements.</li>
            </ul>

            <h3 className="text-xl font-bold text-indigo-900 border-b pb-2 mt-8">2. Live Vision & Evidence</h3>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
                <li><strong>Before/After Photos:</strong> Upload evidence for every checkpoint. Both are required for a "Pass" status.</li>
                <li><strong>Live Communication Hub:</strong> Click the "Teams" or "Meet" buttons to launch a secure video call with the counterparty.</li>
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold text-indigo-900 border-b pb-2">3. Agreements & Translation</h3>
            <h3 className="text-xl font-bold text-gray-800 mb-4">3. Agreements & Analytics</h3>
<ul className="list-disc pl-5 text-gray-600 space-y-2">
    <li><strong>Digital Signature:</strong> Once a project score reaches 100%, the digital contract unlocks. Both Seller and Buyer must sign to generate a legally binding PDF certificate.</li>
    <li><strong>AI Gap Analysis (BYOK):</strong> Navigate to the "AI Analysis" page from the main site. Paste your product specifications and provide your own API key (from OpenAI, Google AI, etc.) to get an instant compliance audit against international standards like ISO 9001.</li>
    <li><strong>Performance Analytics:</strong> Visit your "Analytics" page from the dashboard to get insights on your deal velocity, top QC failure points, and marketplace performance.</li>
</ul>

{/* --- ADDED FAQ LINK --- */}
<p className="mt-6 text-sm text-gray-600">
    Have more questions? <a href="/faq" className="text-indigo-600 font-bold hover:underline">Explore our FAQ page</a> for detailed answers on the compliance workflow.
</p>

            <div className="bg-indigo-50 p-6 rounded-xl mt-8">
                <h4 className="font-bold text-indigo-800 mb-2">Need Enterprise Support?</h4>
                <p className="text-sm text-indigo-600 mb-4">For custom integrations or high-volume API access.</p>
                <a href="https://www.seosiri.com/p/contact-us.html" target="_blank" className="block w-full bg-indigo-600 text-white text-center py-2 rounded font-bold hover:bg-indigo-700">Contact SEOSiri Support</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import Link from "next/link";

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white p-10 rounded-xl shadow-sm border-l-8 border-red-600">
        <div className="mb-8 border-b pb-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Liability Disclaimer</h1>
          <Link href="/dashboard" className="text-sm font-bold text-indigo-600 hover:underline">← Back to Dashboard</Link>
        </div>

        <div className="prose prose-indigo text-gray-600 max-w-none space-y-6">
          <div className="bg-red-50 p-4 rounded text-red-800 font-bold text-sm mb-6">
            PLEASE READ CAREFULLY: QC VALIDATOR IS A DOCUMENTATION TOOL, NOT A FINANCIAL INSTITUTION OR INSURANCE PROVIDER.
          </div>

          <h3 className="text-xl font-bold text-gray-900">1. No Financial Responsibility</h3>
          <p>QC Validator and SEOSiri are not responsible for any financial loss, fraud, chargebacks, or non-payment between Party A (Seller) and Party B (Buyer). All financial transactions occur outside of this platform.</p>

          <h3 className="text-xl font-bold text-gray-900">2. Verification Accuracy</h3>
          <p>The "Verified" status on this platform indicates that digital documents and images were submitted. It does not constitute a physical audit or guarantee of quality by SEOSiri. Users are encouraged to follow guidelines from the <a href="https://asq.org/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">American Society for Quality (ASQ)</a> for rigorous inspection protocols.</p>

          <h3 className="text-xl font-bold text-gray-900">3. User Responsibility</h3>
          <p>Users are solely responsible for the authenticity of the data, images ("Before/After" evidence), and certificates uploaded. Providing false information is a violation of our Terms of Service.</p>
        </div>
      </div>
    </div>
  );
}
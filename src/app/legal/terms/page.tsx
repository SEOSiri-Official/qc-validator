import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white p-10 rounded-xl shadow-sm border border-gray-200">
        <div className="mb-8 border-b pb-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          <Link href="/dashboard" className="text-sm font-bold text-indigo-600 hover:underline">← Back to Dashboard</Link>
        </div>

        <div className="prose prose-indigo text-gray-600 max-w-none space-y-6">
          <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>

          <h3 className="text-xl font-bold text-gray-900">1. Acceptance of Terms</h3>
          <p>By accessing QC Validator (provided by SEOSiri), you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.</p>

          <h3 className="text-xl font-bold text-gray-900">2. Use License & Compliance</h3>
          <p>Permission is granted to use QC Validator for legitimate business quality assurance. You verify that you adhere to standards set by organizations such as the <a href="https://www.iso.org/home.html" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">International Organization for Standardization (ISO)</a>.</p>
          <ul className="list-disc pl-5">
            <li>You must not use this platform to validate illegal goods, weapons, or contraband.</li>
            <li>You must not falsify QC records or "Before/After" evidence images.</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900">3. Disclaimer of Warranties</h3>
          <p>The materials on QC Validator are provided "as is". SEOSiri makes no warranties, expressed or implied, regarding the physical condition of goods verified on this platform.</p>

          <h3 className="text-xl font-bold text-gray-900">4. Limitations</h3>
          <p>In no event shall SEOSiri or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit) arising out of the use or inability to use the materials on QC Validator.</p>
        </div>
      </div>
    </div>
  );
}
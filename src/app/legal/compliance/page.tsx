import Link from "next/link";

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto bg-white p-10 rounded-xl shadow-sm border border-gray-200">
        
        {/* Header */}
        <div className="mb-10 border-b pb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Compliance Standards & Frameworks</h1>
            <p className="text-gray-500 mt-2">QC Validator is designed to support adherence to the following global regulations.</p>
          </div>
          <Link href="/dashboard" className="text-sm font-bold text-indigo-600 hover:underline">← Back to Dashboard</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* ISO 9001 */}
          <div className="p-6 border rounded-xl hover:border-indigo-300 transition-colors">
            <h3 className="text-xl font-bold text-gray-900 mb-2">ISO 9001:2015</h3>
            <p className="text-sm text-gray-600 mb-4">
              Our "General Manufacturing" templates are structured to align with the Quality Management System (QMS) requirements set by the <a href="https://www.iso.org/iso-9001-quality-management.html" target="_blank" className="text-indigo-600 hover:underline">ISO</a>.
            </p>
            <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded">Manufacturing</span>
          </div>

          {/* FDA / GMP */}
          <div className="p-6 border rounded-xl hover:border-indigo-300 transition-colors">
            <h3 className="text-xl font-bold text-gray-900 mb-2">FDA 21 CFR & EU-GMP</h3>
            <p className="text-sm text-gray-600 mb-4">
              Supports electronic record-keeping and audit trails required for pharmaceutical and medical device manufacturing under <a href="https://www.fda.gov/medical-devices/quality-system-qs-regulation/medical-device-quality-systems-manual" target="_blank" className="text-indigo-600 hover:underline">FDA regulations</a>.
            </p>
            <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded">Pharma / Medical</span>
          </div>

          {/* HACCP */}
          <div className="p-6 border rounded-xl hover:border-indigo-300 transition-colors">
            <h3 className="text-xl font-bold text-gray-900 mb-2">HACCP (Food Safety)</h3>
            <p className="text-sm text-gray-600 mb-4">
              Critical Control Point verification workflows designed for the agriculture and food processing sectors to ensure consumer safety.
            </p>
            <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Agriculture</span>
          </div>

          {/* Kimberley Process */}
          <div className="p-6 border rounded-xl hover:border-indigo-300 transition-colors">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Kimberley Process</h3>
            <p className="text-sm text-gray-600 mb-4">
              Supply chain transparency tools to support conflict-free diamond certification and ethical sourcing in the precious metals industry.
            </p>
            <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2 py-1 rounded">Precious Metals</span>
          </div>

        </div>

        <div className="mt-10 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-2">Disclaimer on Certification</h4>
            <p className="text-sm text-gray-600">
                QC Validator provides the <strong>digital infrastructure</strong> to record compliance data. However, the software itself does not issue certification labels. Certification must be granted by authorized third-party auditors. We help you prepare for those audits.
            </p>
        </div>

      </div>
    </div>
  );
}
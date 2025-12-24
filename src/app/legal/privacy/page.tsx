// src/app/legal/privacy/page.tsx
import Link from "next/link";

export default function PrivacyPage() {
  const lastUpdated = "December 10, 2025"; // Update this date when you make changes

  return (
    <div className="bg-gray-50 font-sans">
      <div className="max-w-4xl mx-auto py-16 px-6">
        <div className="bg-white p-8 md:p-12 rounded-lg shadow-md border border-gray-200">
          <div className="mb-8 border-b pb-4">
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
            <p className="mt-1 text-sm text-gray-500">Last Updated: {lastUpdated}</p>
          </div>

          <div className="prose prose-indigo max-w-none text-gray-700 space-y-6">
            <p>
              Welcome to QC Validator ("we," "us," or "our"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our web application (the "Service"). Please read this policy carefully.
            </p>

            <h2 className="text-xl font-bold text-gray-900 pt-4">1. Information We Collect</h2>
            <p>We may collect information about you in a variety of ways. The information we may collect via the Service includes:</p>
            <ul>
              <li>
                <strong>Personal Data:</strong> Personally identifiable information, such as your email address, that you voluntarily give to us when you register with the Service.
              </li>
              <li>
                <strong>Project Data:</strong> All data you create and upload within the Service, including but not limited to QC checklist titles, parameters, requirements, uploaded images ("evidence"), and chat messages.
              </li>
              <li>
                <strong>Derivative Data:</strong> Information our servers automatically collect when you access the Service, such as your IP address, browser type, and timestamps, which is standard for most web services.
              </li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 pt-4">2. Use of Your Information</h2>
            <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we use information collected about you via the Service to:</p>
            <ul>
              <li>Create and manage your account.</li>
              <li>Provide the core functionality of creating, sharing, and managing QC checklists between you and your designated partners (Seller/Buyer).</li>
              <li>Enable user-to-user communications within the platform's chat feature.</li>
              <li>Monitor and analyze usage and trends to improve your experience with the Service.</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 pt-4">3. Disclosure of Your Information</h2>
            <p>We do not sell, rent, or lease your personal data to third parties. We may share information we have collected about you in certain situations:</p>
            <ul>
                <li>
                    <strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others.
                </li>
                <li>
                    <strong>Third-Party Service Providers:</strong> We use Google Firebase as our backend provider for authentication, database (Firestore), and hosting. Your data is stored on their secure servers.
                </li>
                 <li>
                    <strong>AI Translation Feature:</strong> If you provide your own API key (BYOK) for the AI translation feature, the text you submit for translation is sent to the OpenAI API for processing. We do not store your API key on our servers; it is stored only in your browser's local storage.
                </li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 pt-4">4. Data Security</h2>
            <p>
              We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.
            </p>
            
            <h2 className="text-xl font-bold text-gray-900 pt-4">5. Your Data Protection Rights (GDPR)</h2>
            <p>If you are a resident of the European Economic Area (EEA), you have certain data protection rights. We aim to take reasonable steps to allow you to correct, amend, delete, or limit the use of your Personal Data.</p>
            <ul>
                <li><strong>The right to access, update or to delete</strong> the information we have on you.</li>
                <li><strong>The right of rectification.</strong></li>
                <li><strong>The right to object.</strong></li>
                <li><strong>The right of restriction.</strong></li>
                <li><strong>The right to data portability.</strong></li>
                <li><strong>The right to withdraw consent.</strong></li>
            </ul>
             <p>If you wish to be informed what Personal Data we hold about you or if you want it to be removed from our systems, please contact us at <a href="mailto:info@seosiri.com">info@seosiri.com</a>.</p>
            
            <h2 className="text-xl font-bold text-gray-900 pt-4">6. Contact Us</h2>
            <p>
              If you have questions or comments about this Privacy Policy, please contact us at:
            </p>
            <p>
              SEOSiri<br />
              Email: <a href="mailto:info@seosiri.com">info@seosiri.com</a>
            </p>
          </div>
          <div className="mt-12 text-center">
            <Link href="/" className="text-sm font-semibold text-indigo-600 hover:indigo-500">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
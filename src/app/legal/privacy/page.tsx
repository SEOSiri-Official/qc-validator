import Link from "next/link";

export default function PrivacyPage() {
  // 🚨 IMPORTANT: UPDATE THIS DATE WHEN YOU MAKE ANY CHANGES TO THE CONTENT
  const lastUpdated = "January 28, 2026"; 
  
  // 🚨 IMPORTANT: Confirm your Firebase/Firestore region and update this placeholder
  const FIRESTORE_REGION = "us-central1 (or your configured region)"; 

  return (
    <div className="bg-gray-50 font-sans">
      <div className="max-w-4xl mx-auto py-16 px-6">
        <div className="bg-white p-8 md:p-12 rounded-lg shadow-2xl border border-gray-200">
          <header className="mb-8 border-b pb-4">
            <h1 className="text-3xl font-extrabold text-gray-900">Data Compliance & Privacy</h1>
            <p className="mt-1 text-sm text-gray-500">
              **Last Updated:** {lastUpdated} | **Service:** QCVal (qcval.seosiri.com)
            </p>
          </header>

          <article className="prose prose-indigo max-w-none text-gray-700 space-y-6">
            <p>
              This page explains how QCVal handles data, what we collect, why we collect it, where it’s stored, who we share it with (our processors/sub-processors), and what rights you have.
            </p>
            <p className="border-l-4 border-indigo-400 pl-4 py-2 bg-indigo-50 text-sm italic">
                QCVal is a web application that helps users **create, manage, and verify quality control checklists** for international trade and supply chain management. We designed QCVal using privacy-by-default principles: collect the minimum data needed to operate the service, keep it secure, and give you control.
            </p>

            <h2 className="text-xl font-bold text-gray-900 pt-4">1. Data We Collect (Inventory)</h2>
            
            <h3 className="text-lg font-semibold text-gray-800 pt-2">A) Data you provide</h3>
            <ul>
              <li>
                <strong>Account Data:</strong> Email address, unique Firebase User ID (UID), and basic profile name (if provided).
              </li>
              <li>
                <strong>Project Data:</strong> All user-generated content, including Checklist titles, parameters, scores, standards, **Seller UID**, **Buyer UID** or **Buyer Email**, and chat messages.
              </li>
              <li>
                <strong>AI Credentials (BYOK):</strong> **Your provided OpenAI / Gemini / Anthropic API Keys.** These keys are **NOT stored in our database (Firestore) or server**. They are stored only in your browser's **Local Storage** and sent directly to the AI vendor from your browser.
              </li>
              <li>
                <strong>Endorsements:</strong> Your UID is stored when you endorse a community standard to track integrity.
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 pt-2">B) Data collected automatically</h3>
            <ul>
              <li>
                <strong>Log Data:</strong> IP address, device/browser type, pages visited, timestamps, and error logs (collected by Firebase and Vercel for security).
              </li>
              <li>
                <strong>Security Telemetry:</strong> Data used to prevent abuse, troubleshoot, and monitor reliability.
              </li>
            </ul>
            
            <h2 className="text-xl font-bold text-gray-900 pt-4">2. Why We Collect Data (Purposes)</h2>
            <p>We process data to:</p>
            <ul>
              <li>Provide and operate all core QCVal features (Checklist creation, sharing, management).</li>
              <li>Authenticate users, manage accounts, and maintain secure sessions.</li>
              <li>Enable features like AI-powered suggestions and translation using your provided API keys.</li>
              <li>Monitor reliability, prevent fraud/abuse, and enforce rate limits.</li>
              <li>Calculate your in-app performance metrics (Pipeline, Conversion, Health Score).</li>
              <li>Respond to support requests and meet legal obligations.</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 pt-4">3. Legal Bases (GDPR / UK GDPR)</h2>
            <p>For users in the EEA/UK, we rely on:</p>
            <ul>
                <li><strong>Contract Necessity:</strong> To fulfill the service you sign up for (account management, storing your projects).</li>
                <li><strong>Legitimate Interests:</strong> Security, fraud prevention, reliability monitoring, and service improvement.</li>
                <li><strong>Consent:</strong> For future non-essential cookies or analytics (if implemented).</li>
            </ul>
            
            <h2 className="text-xl font-bold text-gray-900 pt-4">4. Where Data Is Stored & International Transfers</h2>
            <ul>
                <li>
                    <strong>Primary Database (Firestore):</strong> Data is stored in the Google Cloud region: **{FIRESTORE_REGION}**.
                </li>
                <li>
                    <strong>Hosting (Vercel):</strong> Hosting and edge delivery may process requests globally for speed.
                </li>
                <li>
                    If personal data is transferred internationally (e.g., outside the EEA/UK), we rely on appropriate safeguards such as **Standard Contractual Clauses (SCCs)** implemented by our vendors.
                </li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 pt-4">5. Our Sub-Processors (Vendors)</h2>
            <p>We do not sell your data. We share it only with necessary third parties to operate the service:</p>
            <ul>
                <li>
                    <strong>Hosting & Delivery:</strong> Vercel (Web hosting, CDN/edge)
                </li>
                <li>
                    <strong>Database & Auth:</strong> Google Firebase / Firestore (Authentication and data storage)
                </li>
                <li>
                    <strong>AI Services:</strong> OpenAI, Google AI, Anthropic (Process user-submitted prompts for suggestions/translation, but **do not store your API Key**).
                </li>
                <li>
                    <strong>Source Control:</strong> GitHub (Code repository, build logs).
                </li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 pt-4">6. Security, Retention & Deletion</h2>
            <ul>
                <li>
                    <strong>Security:</strong> We use industry-standard security: **Encryption in transit** (HTTPS/TLS), **Encryption at rest** (provided by Google Cloud/Firebase), and strict access control.
                </li>
                <li>
                    <strong>Retention:</strong> We retain data as long as your account is active. Logs are retained for a limited period (**60 days**) unless needed for security investigations.
                </li>
                <li>
                    <strong>Deletion:</strong> When you delete content or your account, we delete or de-identify data within a reasonable timeframe (max **30 days**), subject to backups rotating out.
                </li>
            </ul>
            
            <h2 className="text-xl font-bold text-gray-900 pt-4">7. Your Rights & Choices</h2>
            <p>Depending on your location (e.g., California, EEA/UK), you have rights including Access, Correction, Deletion, and Portability. We commit to fulfilling these rights.</p>
            
            <h2 className="text-xl font-bold text-gray-900 pt-4">8. CCPA/CPRA-Style Notice (California)</h2>
            <p>We do not sell or share personal information for cross-context behavioral advertising.</p>

            <h2 className="text-xl font-bold text-gray-900 pt-4">9. Contact Us</h2>
            <p>To exercise your rights, or for privacy, compliance, or security questions, please contact us:</p>
            <p>
              Email: <a href="mailto:info@seosiri.com">info@seosiri.com</a>
            </p>
          </article>
          <div className="mt-12 text-center">
            <Link href="/" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
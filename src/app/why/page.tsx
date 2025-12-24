// src/app/why/page.tsx
import Link from 'next/link';

const features = [
  { name: 'Global Standards, Simplified', description: 'Our intelligent knowledge base contains QC parameters for dozens of industries and international standards like ISO 9001, HACCP, and EU-GMP.' },
  { name: 'Digital Agreements', description: 'Go beyond checklists. Execute legally-formatted, digitally-signed agreements directly on the platform once QC is passed.' },
  { name: 'Live Field Vision', description: 'Connect with remote teams, factories, or warehouses instantly with integrated video calls and a real-time communication hub.' },
  { name: 'AI-Powered Translation', description: 'Break down language barriers. Our secure chat includes optional, AI-powered live translation for seamless international collaboration.' },
  { name: 'Immutable Evidence', description: 'Capture "Before" and "After" photo evidence for each QC point, creating an undeniable, timestamped audit trail.' },
  { name: 'Decentralized Trust', description: 'We provide the tools for verification, but you control your data. We are a communication and documentation tool, not a financial intermediary.' },
]

export default function WhyPage() {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">Why QC Validator?</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            A New Paradigm for Global Trade Assurance
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            We are the first platform in the world to combine intelligent QC checklists, multi-party digital agreements, and live communication into a single, accessible system.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="text-lg font-semibold leading-7 text-gray-900">
                  {feature.name}
                </dt>
                <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="mt-16 text-center">
            <Link href="/auth" className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
                Create Your First QC Project →
            </Link>
        </div>
      </div>
    </div>
  )
}
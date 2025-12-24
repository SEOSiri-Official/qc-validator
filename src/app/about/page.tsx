// src/app/about/page.tsx
import Link from 'next/link';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">About SEOSiri & QC Validator</h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            We are a team of innovators dedicated to solving complex global challenges with intelligent software solutions. QC Validator is our vision for a transparent and trustworthy global trade ecosystem.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 text-base leading-7 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:gap-x-16">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Our Mission</h3>
            <p className="mt-4 text-gray-600">
              To build the global standard for distributed quality control. We empower businesses of all sizes—from local artisans to multinational corporations—to verify product quality, ensure compliance, and build lasting trust with their partners through a single, unified platform.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">The Founder</h3>
            <div className="mt-4 flex items-center gap-4">
                {/* Optional: Add a profile picture here */}
                {/* <Image src="/path/to/momenul.jpg" alt="Momenul Ahmad" width={64} height={64} className="rounded-full" /> */}
                <div>
                    <p className="font-semibold text-gray-900">Momenul Ahmad, SEOSiri</p>
                    <p className="text-gray-600">
                        With a deep background in strategic intelligence and global systems, Momenul Ahmad designed QC Validator to address the critical need for a decentralized, verifiable quality assurance network.
                    </p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
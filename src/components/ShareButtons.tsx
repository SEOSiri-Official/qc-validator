'use client';

import { usePathname } from 'next/navigation';

export default function ShareButtons({ title }: { title: string }) {
  // Get the current URL path
  const pathname = usePathname();
  // Construct the full URL (Change 'qcval.seosiri.com' if your domain is different)
  const url = `https://qcval.seosiri.com${pathname}`;

  const networks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`
  };

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="my-8 py-4 border-t border-b flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="font-bold text-gray-700 text-sm uppercase tracking-wide">Share this Article</span>
        <div className="flex gap-4">
            <a href={networks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-400 font-bold text-sm">Twitter</a>
            <a href={networks.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-700 font-bold text-sm">LinkedIn</a>
            <a href={networks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600 font-bold text-sm">Facebook</a>
            <a href={networks.whatsapp} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-green-500 font-bold text-sm">WhatsApp</a>
            <button onClick={copyLink} className="text-gray-500 hover:text-gray-900 font-bold text-sm">Copy Link</button>
        </div>
    </div>
  );
}
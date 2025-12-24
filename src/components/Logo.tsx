import Link from 'next/link';

export default function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className="flex items-center gap-3 group transition-opacity hover:opacity-80">
      
      {/* --- Your Unique Shield Icon (Always Visible) --- */}
      <div className="relative w-10 h-10 flex-shrink-0">
        <div className="absolute inset-0 bg-indigo-600 rounded-lg transform -skew-y-3 shadow-md transition-transform group-hover:scale-110"></div>
        <div className="absolute inset-1 bg-white rounded-md transform -skew-y-3"></div>
        <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-6 border-b-4 border-r-4 border-indigo-600 transform rotate-45 -skew-y-3"
            style={{ marginTop: '-4px', marginLeft: '2px' }}
        ></div>
      </div>
      
      {/* --- Text (Hidden on small screens, visible on medium and up) --- */}
      <div className="hidden md:flex flex-col justify-center">
        <h1 className={`text-xl font-bold leading-none transition-colors group-hover:text-indigo-600 ${className || 'text-gray-900'}`}>
          QC Validator
        </h1>
        <p className="text-xs text-indigo-500 font-medium leading-none tracking-wider">
          GLOBAL
        </p>
      </div>

    </Link>
  );
}
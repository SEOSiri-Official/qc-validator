// src/components/Logo.tsx

export default function Logo({ className }: { className?: string }) {
  return (
    <div className="flex items-center gap-3">
      {/* The Shield Icon */}
      <div className="relative w-10 h-10">
        {/* Main Shield Body */}
        <div className="absolute inset-0 bg-indigo-600 rounded-lg transform -skew-y-3 shadow-md"></div>
        {/* Inner White Shield */}
        <div className="absolute inset-1 bg-white rounded-md transform -skew-y-3"></div>
        {/* The Checkmark */}
        <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-6 border-b-4 border-r-4 border-indigo-600 transform rotate-45 -skew-y-3"
            style={{ marginTop: '-4px', marginLeft: '2px' }}
        ></div>
      </div>
      {/* The Text */}
      <div className="flex flex-col justify-center">
        <h1 className={`text-xl font-bold leading-none ${className || 'text-gray-900'}`}>
          QC Validator
        </h1>
        <p className="text-xs text-indigo-500 font-medium leading-none tracking-wider">
          GLOBAL
        </p>
      </div>
    </div>
  );
}
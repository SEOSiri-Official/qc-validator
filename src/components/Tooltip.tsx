'use client';

import { ReactNode } from 'react';

interface TooltipProps {
  text: string;
  children: ReactNode; // Correct type is ReactNode
}

export default function Tooltip({ text, children }: TooltipProps) {
  return (
    <div className="relative flex group items-center justify-center"> {/* Added items-center justify-center for button alignment */}
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs
                      bg-gray-900 text-white text-center text-xs rounded-lg py-2 px-3
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300
                      pointer-events-none z-20 shadow-xl"> {/* Added shadow-xl */}
        {text}
        {/* Triangle pointer */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
                        border-x-4 border-x-transparent
                        border-t-4 border-t-gray-900">
        </div>
      </div>
    </div>
  );
}
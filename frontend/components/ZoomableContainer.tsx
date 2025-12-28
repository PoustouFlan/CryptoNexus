'use client';

import { useState, useEffect, useRef } from 'react';
import { Maximize2, X } from 'lucide-react';

interface ZoomableContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function ZoomableContainer({ children, className = '' }: ZoomableContainerProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [placeholderHeight, setPlaceholderHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsZoomed(false);
    };
    if (isZoomed) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isZoomed]);

  // Capture height before zooming to prevent layout shift
  const handleZoom = () => {
    if (containerRef.current) {
      setPlaceholderHeight(containerRef.current.offsetHeight);
    }
    setIsZoomed(true);
  };

  return (
    <>
      {/* 1. Placeholder: Holds the vertical space in the document flow 
        when the actual content becomes 'fixed' (popped out).
      */}
      {isZoomed && <div style={{ height: placeholderHeight }} className="w-full my-4" />}

      {/* 2. The Main Container: Swaps between 'relative' (normal) and 'fixed' (fullscreen)
        React does NOT remount this, so state is preserved.
      */}
      <div
        ref={containerRef}
        className={
          isZoomed
            ? "fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 transition-all duration-200"
            : `relative group ${className}`
        }
      >
        {/* Close Button (Fullscreen only) */}
        {isZoomed && (
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors z-50 border border-slate-700"
          >
            <X size={24} />
          </button>
        )}

        {/* Maximize Button (Normal view only, appears on hover) */}
        {!isZoomed && (
          <button
            onClick={handleZoom}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-slate-800/80 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 z-10 backdrop-blur-sm border border-slate-700/50"
            title="Fullscreen"
          >
            <Maximize2 size={16} />
          </button>
        )}

        {/* Content Wrapper */}
        <div className={isZoomed ? "max-w-[95vw] max-h-[90vh] overflow-auto rounded-lg shadow-2xl bg-slate-900 border border-slate-800" : "w-full"}>
          {children}
        </div>
      </div>
    </>
  );
}
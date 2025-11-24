"use client";

import React, { useEffect } from 'react';
import { useLoadingStore } from '@/lib/store/loadingStore';

const CyberLoader = () => {
    const setLoading = useLoadingStore((state) => state.setLoading);

    useEffect(() => {
        setLoading(true);
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('cyber-loading-start'));
        }
        return () => {
            setLoading(false);
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('cyber-loading-stop'));
            }
        };
    }, [setLoading]);

    return (
        <div className="flex flex-col items-center justify-center h-full w-full min-h-[50vh] p-4">
            <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Outer Rotating Ring */}
                <div className="absolute inset-0 border-2 border-transparent border-t-green-500/50 border-b-green-500/50 rounded-full animate-[spin_3s_linear_infinite]"></div>

                {/* Inner Rotating Ring (Reverse) */}
                <div className="absolute inset-4 border-2 border-transparent border-l-green-400 border-r-green-400 rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>

        {/* Center Hexagon/Target */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-green-500/10 animate-pulse"
            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
          ></div>
          <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e] animate-ping"></div>
        </div>
      </div>
      
      {/* Glitch Text */}
      <div className="mt-8 relative">
        <div className="font-mono text-green-500 text-sm tracking-[0.2em] animate-pulse">
          SYSTEM_INITIALIZING...
        </div>
      </div>
    </div>
  );
};

export default CyberLoader;
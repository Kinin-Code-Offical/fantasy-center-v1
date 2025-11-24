import React from 'react';

const SkeletonCard = () => (
    <div className="relative h-[400px] w-full bg-black/40 border border-green-500/20 rounded-xl overflow-hidden">
        {/* Header Image Placeholder */}
        <div className="h-32 bg-green-900/10 w-full animate-pulse" />

        {/* Content */}
        <div className="p-4 space-y-4">
            {/* Title */}
            <div className="h-6 bg-green-500/10 rounded w-3/4 animate-pulse" />
            {/* Subtitle */}
            <div className="h-4 bg-green-500/10 rounded w-1/2 animate-pulse" />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="h-16 bg-green-500/5 rounded border border-green-500/10 animate-pulse" />
                <div className="h-16 bg-green-500/5 rounded border border-green-500/10 animate-pulse" />
            </div>

            {/* Button */}
            <div className="h-10 bg-green-500/10 rounded w-full mt-4 animate-pulse" />
        </div>

        {/* Scanning Line Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/5 to-transparent -translate-y-full animate-scan" />
    </div>
);

const MarketSkeleton = () => {
    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-8">
                <div className="h-10 w-48 bg-green-500/10 rounded animate-pulse" />
                <div className="h-10 w-32 bg-green-500/10 rounded animate-pulse" />
            </div>

            {/* Filter Skeleton */}
            <div className="h-16 w-full bg-green-500/5 rounded-xl mb-8 border border-green-500/10 animate-pulse" />

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        </div>
    );
};

export default MarketSkeleton;

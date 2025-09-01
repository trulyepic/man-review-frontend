import React from "react";
import ShimmerBox from "./ShimmerBox";

export const ListHeaderShimmer: React.FC = () => (
  <div className="rounded-xl border border-gray-200 bg-white/70 backdrop-blur-sm shadow-sm">
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
      <div className="flex items-center gap-2 min-w-0">
        <ShimmerBox className="h-5 w-5 rounded" /> {/* caret */}
        <ShimmerBox className="h-5 w-40 rounded" /> {/* name */}
        <ShimmerBox className="h-5 w-16 rounded" /> {/* public/private */}
        <ShimmerBox className="h-4 w-10 rounded" /> {/* (count) */}
      </div>
      <div className="flex items-center gap-2">
        <ShimmerBox className="h-8 w-20 rounded-md" />
        <ShimmerBox className="h-8 w-28 rounded-md" />
        <ShimmerBox className="h-8 w-28 rounded-md" />
        <ShimmerBox className="h-8 w-24 rounded-md" />
      </div>
    </div>
    <div className="px-4 py-3">
      {/* a couple of item rows preview under header */}
      <ItemRowShimmer />
      <ItemRowShimmer />
    </div>
  </div>
);

export const ItemRowShimmer: React.FC = () => (
  <div className="flex items-center gap-3 py-3">
    <div className="relative">
      <ShimmerBox className="h-16 w-12 rounded-md" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <ShimmerBox className="h-4 w-40 rounded" />
        <ShimmerBox className="h-4 w-14 rounded hidden md:inline-block" />
      </div>
      <div className="mt-1 flex items-center gap-3">
        <ShimmerBox className="h-3 w-12 rounded" />
        <ShimmerBox className="h-3 w-16 rounded" />
        <ShimmerBox className="h-3 w-20 rounded" />
      </div>
    </div>
    <ShimmerBox className="h-7 w-20 rounded-md" />
  </div>
);

export const ItemRowsShimmerBlock: React.FC<{ count?: number }> = ({
  count = 6,
}) => (
  <ul className="divide-y">
    {Array.from({ length: count }).map((_, i) => (
      <li key={i} className="px-4">
        <ItemRowShimmer />
      </li>
    ))}
  </ul>
);

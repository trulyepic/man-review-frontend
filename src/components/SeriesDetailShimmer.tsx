const ShimmerBox = ({ className = "" }: { className?: string }) => (
  <div className={`relative overflow-hidden bg-gray-200 rounded ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer" />
  </div>
);

const SeriesDetailShimmer = () => {
  return (
    <div className="space-y-6">
      {/* Cover Image */}
      <ShimmerBox className="w-full h-[350px] rounded-lg shadow" />

      {/* Title & Meta */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1 space-y-2">
          <ShimmerBox className="h-8 w-3/4" />
          <ShimmerBox className="h-4 w-1/2" />
        </div>
        <ShimmerBox className="w-32 h-16 rounded-2xl" />
      </div>

      {/* Synopsis */}
      <div className="bg-white shadow rounded p-4 space-y-3">
        <ShimmerBox className="h-6 w-40" />
        <ShimmerBox className="h-4 w-full" />
        <ShimmerBox className="h-4 w-5/6" />
        <ShimmerBox className="h-4 w-4/6" />
      </div>

      {/* Ratings */}
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white shadow rounded p-4 space-y-2">
            <ShimmerBox className="h-4 w-24" />
            <ShimmerBox className="h-6 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeriesDetailShimmer;

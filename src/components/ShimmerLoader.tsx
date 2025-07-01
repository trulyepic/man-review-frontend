const ShimmerLoader = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
      {Array.from({ length: 12 }).map((_, index) => (
        <div
          key={index}
          className="w-40 h-64 bg-gray-200 rounded-md relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer"></div>
        </div>
      ))}
    </div>
  );
};

export default ShimmerLoader;

const ShimmerBox = ({ className = "" }: { className?: string }) => (
  <div className={`relative overflow-hidden bg-gray-200 rounded ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer" />
  </div>
);

export default ShimmerBox;

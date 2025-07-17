import { Info } from "lucide-react";
// import { Tooltip } from "react-tooltip";

const RatingInfoTooltip = () => {
  return (
    <>
      <div className="inline-block ml-1 relative group">
        <Info className="w-4 h-4 text-gray-500 cursor-pointer" />
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white text-sm text-gray-700 border border-gray-300 rounded shadow-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
          Based on user votes across 5 categories: Story, Characters, World
          Building, Art, and Drama/Fighting.
        </div>
      </div>
    </>
  );
};

export default RatingInfoTooltip;

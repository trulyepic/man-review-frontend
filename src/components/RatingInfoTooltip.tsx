import { Info } from "lucide-react";
// import { Tooltip } from "react-tooltip";

const RatingInfoTooltip = () => {
  return (
    <div className="group relative ml-1 inline-block">
      <Info className="h-4 w-4 cursor-pointer text-gray-500 dark:text-slate-400" />
      <div className="pointer-events-none absolute bottom-full right-0 z-[80] mb-2 w-64 rounded-lg bg-slate-900 px-3 py-2 text-left text-xs font-normal normal-case tracking-normal leading-5 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
        Based on user votes across five categories: story, characters, world
        building, art, and drama or fighting.
      </div>
    </div>
  );
};

export default RatingInfoTooltip;

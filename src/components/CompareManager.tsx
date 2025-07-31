import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { RankedSeries } from "../api/manApi";

interface Props {
  children: (compareControls: {
    toggleCompare: (series: RankedSeries) => void;
    isSelectedForCompare: (id: number) => boolean;
    compareList: RankedSeries[];
  }) => React.ReactNode;
}

const CompareManager = ({ children }: Props) => {
  const [compareList, setCompareList] = useState<RankedSeries[]>([]);
  const [compareError, setCompareError] = useState<string | null>(null);

  const toggleCompare = (series: RankedSeries) => {
    setCompareList((prev) => {
      const exists = prev.find((item) => item.id === series.id);
      if (exists) {
        setCompareError(null);
        return prev.filter((item) => item.id !== series.id);
      }
      if (prev.length >= 4) {
        setCompareError("You can only compare up to 4 series.");
        return prev;
      }
      setCompareError(null);
      return [...prev, series];
    });
  };

  const isSelectedForCompare = (id: number) =>
    compareList.some((item) => item.id === id);

  useEffect(() => {
    if (compareError) {
      const timer = setTimeout(() => setCompareError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [compareError]);

  return (
    <>
      {children({ toggleCompare, isSelectedForCompare, compareList })}

      {compareError && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-700 px-4 py-2 rounded shadow-lg z-50">
          {compareError}
        </div>
      )}

      {compareList.length >= 2 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <Link
            to="/compare"
            state={{ items: compareList }}
            className="bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 transition"
          >
            Compare {compareList.length} Series
          </Link>
        </div>
      )}
    </>
  );
};

export default CompareManager;

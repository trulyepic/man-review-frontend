import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { getSeriesDetailById } from "../api/manApi";
import { UsersIcon } from "@heroicons/react/24/outline";
import { UserIcon } from "lucide-react";

const ComparePage = () => {
  const location = useLocation();
  const { items = [] } = location.state || {};
  const [details, setDetails] = useState<any[]>([]);

  useEffect(() => {
    const fetchDetails = async () => {
      const results = await Promise.all(
        items.map((item: { id: number }) => getSeriesDetailById(item.id))
      );
      setDetails(results);
    };

    if (items.length) {
      fetchDetails();
    }
  }, [items]);

  const calculateRatings = (detail: any) => {
    const labelKeyMap: Record<string, string> = {
      Story: "story",
      Characters: "characters",
      "World Building": "worldbuilding",
      Art: "art",
      "Drama / Fighting": "drama_or_fight",
    };

    const ratings: Record<string, number> = {};

    Object.entries(labelKeyMap).forEach(([label, key]) => {
      const total = detail[`${key}_total`];
      const count = detail[`${key}_count`];
      ratings[label] = count ? total / count : -1;
    });

    return ratings;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
        Compare Series
      </h1>

      {/* Horizontal scroll for mobile */}
      <div className="block sm:hidden overflow-x-auto pb-4">
        <div className="flex gap-4 w-max">
          {details.map((detail, i) => {
            const item = items[i];
            const ratings = calculateRatings(detail);

            return (
              <div
                key={item.id}
                className="bg-white shadow-md p-4 rounded text-center flex flex-col min-w-[280px] max-w-[280px]"
              >
                <div className="relative w-full h-48 mb-2 rounded overflow-hidden">
                  <div className="absolute top-2 left-2 text-sm font-bold text-white bg-black/70 px-2 py-1 rounded-full z-10 shadow ring-1 ring-white">
                    {typeof item.rank === "number" ? `#${item.rank}` : "–"}
                  </div>
                  <img
                    src={item.cover_url}
                    alt={item.title}
                    className="w-full object-cover"
                  />
                </div>

                <h2 className="font-semibold text-base mb-0.5">
                  {item.title}
                </h2>
                <p className="text-xs text-gray-500">{item.genre}</p>
                <p className="text-xs text-gray-500">{item.type}</p>

                <p className="text-blue-600 font-semibold mt-2 text-sm">
                  Score:{" "}
                  {item.final_score !== undefined
                    ? Number(item.final_score).toFixed(1)
                    : "-"}
                </p>

                <p className="text-xs text-gray-600 mb-3">
                  Votes: {item.vote_count.toLocaleString()}
                </p>

                <div className="grid grid-cols-1 gap-2 mt-auto">
                  {Object.entries(ratings).map(([label, score]) => {
                    const voteCount = detail.vote_counts?.[label];
                    return (
                      <div
                        key={label}
                        className="bg-gray-100 p-2 rounded text-left text-sm relative"
                      >
                        <h4 className="text-gray-700 font-medium">{label}</h4>
                        <p className="text-blue-500 font-bold text-lg">
                          {score === -1 ? "-/10" : `${score.toFixed(1)}/10`}
                        </p>
                        {voteCount !== undefined && (
                          <div className="absolute bottom-1 right-2 text-xs text-gray-500 flex items-center gap-1">
                            {voteCount > 1 ? (
                              <UsersIcon className="w-4 h-4 text-blue-400" />
                            ) : (
                              <UserIcon className="w-4 h-4 text-blue-400" />
                            )}
                            {voteCount}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Original grid view for sm and above */}
      <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {details.length === 0 ? (
          <p className="text-center text-gray-500 col-span-full">
            Loading series details...
          </p>
        ) : (
          details.map((detail, i) => {
            const item = items[i];
            // const ratings = calculateRatings(detail);

            return (
              <div
                key={item.id}
                className="bg-white shadow-md p-4 rounded text-center flex flex-col"
              >
                <div className="relative w-full h-48 sm:h-60 md:h-64 lg:h-72 xl:h-80 mb-2 rounded overflow-hidden">
                  <div className="absolute top-2 left-2 text-sm font-bold text-white bg-black/70 px-2 py-1 rounded-full z-10 shadow ring-1 ring-white">
                    {typeof item.rank === "number" ? `#${item.rank}` : "–"}
                  </div>
                  <img
                    src={item.cover_url}
                    alt={item.title}
                    className="w-full object-cover"
                  />
                </div>

                <h2 className="font-semibold text-base sm:text-lg mb-0.5">
                  {item.title}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">{item.genre}</p>
                <p className="text-xs sm:text-sm text-gray-500">{item.type}</p>

                <p className="text-blue-600 font-semibold mt-2 text-sm sm:text-base">
                  Score:{" "}
                  {item.final_score !== undefined
                    ? Number(item.final_score).toFixed(1)
                    : "-"}
                </p>

                <p className="text-xs sm:text-sm text-gray-600 mb-3">
                  Votes: {item.vote_count.toLocaleString()}
                </p>

                <div className="grid grid-cols-1 gap-2 mt-auto">
                  {Object.entries(calculateRatings(detail)).map(([label, score]) => {
                    const voteCount = detail.vote_counts?.[label];
                    return (
                      <div
                        key={label}
                        className="bg-gray-100 p-2 rounded text-left text-sm relative"
                      >
                        <h4 className="text-gray-700 font-medium">{label}</h4>
                        <p className="text-blue-500 font-bold text-lg">
                          {score === -1 ? "-/10" : `${score.toFixed(1)}/10`}
                        </p>
                        {voteCount !== undefined && (
                          <div className="absolute bottom-1 right-2 text-xs text-gray-500 flex items-center gap-1">
                            {voteCount > 1 ? (
                              <UsersIcon className="w-4 h-4 text-blue-400" />
                            ) : (
                              <UserIcon className="w-4 h-4 text-blue-400" />
                            )}
                            {voteCount}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="text-center mt-6">
        <Link
          to="/"
          className="text-blue-600 underline hover:text-blue-800 transition"
        >
          ← Back to Rankings
        </Link>
      </div>
    </div>
  );
};

export default ComparePage;

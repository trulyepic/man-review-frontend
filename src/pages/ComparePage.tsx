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
        items.map((item) => getSeriesDetailById(item.id))
      );
      setDetails(results);
    };

    if (items.length) {
      fetchDetails();
    }
  }, [items]);

const calculateRatings = (detail: any) => {
 const labelKeyMap: Record<string, string> = {
  "Story": "story",
  "Characters": "characters",
  "World Building": "worldbuilding",
  "Art": "art",
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


console.log("details test ", details)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Compare Series</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {details.length === 0 ? (
          <p className="text-center text-gray-500 col-span-full">
            Loading series details...
          </p>
        ) : (
          details.map((detail, i) => {
            const item = items[i];
            const ratings = calculateRatings(detail);
            const voteCounts = detail.vote_counts || {};

            return (
              <div
                key={item.id}
                className="bg-white shadow p-4 rounded text-center"
              >
                <div className="relative w-full mb-2">
  {/* Rank badge */}
  <div className="absolute top-2 left-2 text-[1.2rem] font-bold text-white bg-black/70 px-2 py-1 rounded-full z-10 shadow-md ring-2 ring-white">
    {item.rank !== null && item.rank !== undefined && typeof item.rank === "number"
      ? `#${item.rank}`
      : "–"}
  </div>

  <img
    src={item.cover_url}
    alt={item.title}
    className="w-full object-cover rounded"
  />
</div>

                <h2 className="font-semibold text-lg">{item.title}</h2>
                <p className="text-sm text-gray-500">{item.genre}</p>
                <p className="text-sm text-gray-500">{item.type}</p>

                <p className="text-blue-600 font-medium mt-2">
                  Score:{" "}
                  {item.final_score !== undefined
                    ? Number(item.final_score).toFixed(1)
                    : "-"}
                </p>

                <p className="text-sm text-gray-600 mb-3">
                  Votes: {item.vote_count.toLocaleString()}
                </p>

                <div className="grid grid-cols-1 gap-2">
                 {Object.entries(ratings).map(([label, score]) => {
  const voteCount = detail.vote_counts?.[label];

  return (
    <div
      key={label}
      className="bg-gray-100 p-2 rounded text-sm text-left relative"
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

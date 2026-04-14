import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { getSeriesDetailById } from "../api/manApi";
import { UsersIcon } from "@heroicons/react/24/outline";
import { UserIcon } from "lucide-react";
import type { SeriesDetailData } from "../types/types";
import { getDisplayVoteCounts } from "../util/displayVoteCounts";

const ComparePage = () => {
  const location = useLocation();
  const { items = [] } = location.state || {};
  const [details, setDetails] = useState<SeriesDetailData[]>([]);

  useEffect(() => {
    const fetchDetails = async () => {
      const results = await Promise.all(
        items.map((item: { id: number }) => getSeriesDetailById(item.id))
      );
      setDetails(results);
    };

    if (items.length) fetchDetails();
  }, [items]);

  type RatingLabel =
    | "Story"
    | "Characters"
    | "World Building"
    | "Art"
    | "Drama / Fighting";

  const calculateRatings = (
    detail: SeriesDetailData
  ): Record<RatingLabel, number> => {
    const labelKeyMap: Record<RatingLabel, string> = {
      Story: "story",
      Characters: "characters",
      "World Building": "worldbuilding",
      Art: "art",
      "Drama / Fighting": "drama_or_fight",
    };

    const ratings: Record<RatingLabel, number> = {
      Story: -1,
      Characters: -1,
      "World Building": -1,
      Art: -1,
      "Drama / Fighting": -1,
    };

    (Object.keys(labelKeyMap) as RatingLabel[]).forEach((label) => {
      const key = labelKeyMap[label];
      const total = detail[`${key}_total` as keyof SeriesDetailData] as number;
      const count = detail[`${key}_count` as keyof SeriesDetailData] as number;
      ratings[label] = count ? total / count : -1;
    });

    return ratings;
  };

  const renderCard = (
    item: any,
    detail: SeriesDetailData,
    mobile = false
  ) => (
    <div
      key={item.id}
      className={`dark-theme-card flex flex-col rounded-[1.75rem] border border-slate-200 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-[#3a3028] ${
        mobile ? "min-w-[280px] max-w-[280px]" : ""
      }`}
    >
      <div className="relative mb-3 overflow-hidden rounded-2xl">
        <div className="absolute left-2 top-2 z-10 rounded-full bg-black/75 px-2 py-1 text-sm font-bold text-white ring-1 ring-white/80">
          {typeof item.rank === "number" ? `#${item.rank}` : "-"}
        </div>
        <img
          src={item.cover_url}
          alt={item.title}
          className={`w-full object-cover ${mobile ? "h-48" : "h-72"}`}
        />
      </div>

      <h2 className="mb-0.5 text-base font-semibold text-slate-900 dark:text-stone-50 sm:text-lg">
        {item.title}
      </h2>
      <p className="text-xs text-slate-500 dark:text-stone-400 sm:text-sm">
        {item.genre}
      </p>
      <p className="text-xs text-slate-500 dark:text-stone-400 sm:text-sm">
        {item.type}
      </p>

      <p className="mt-2 text-sm font-semibold text-blue-600 dark:text-blue-300 sm:text-base">
        Score:{" "}
        {item.final_score !== undefined
          ? Number(item.final_score).toFixed(1)
          : "-"}
      </p>

      <div className="mt-auto grid grid-cols-1 gap-2 pt-3">
        {Object.entries(calculateRatings(detail)).map(([label, score]) => {
          const displayCounts = getDisplayVoteCounts(detail.vote_counts, item.id);
          const voteCount = displayCounts[label];
          return (
            <div
              key={label}
              className="dark-theme-card-soft relative rounded-2xl border border-slate-200 p-3 dark:border-[#3a3028]"
            >
              <h4 className="font-medium text-slate-700 dark:text-stone-300">
                {label}
              </h4>
              <p className="text-lg font-bold text-blue-500 dark:text-blue-300">
                {score === -1 ? "-/10" : `${score.toFixed(1)}/10`}
              </p>
              {voteCount !== undefined && (
                <div className="absolute bottom-2 right-3 flex items-center gap-1 text-xs text-slate-500 dark:text-stone-400">
                  {voteCount > 1 ? (
                    <UsersIcon className="h-4 w-4 text-blue-400" />
                  ) : (
                    <UserIcon className="h-4 w-4 text-blue-400" />
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

  return (
    <div className="dark-theme-shell mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-center text-2xl font-bold text-slate-900 dark:text-stone-50 sm:text-3xl">
        Compare Series
      </h1>

      <div className="block overflow-x-auto pb-4 sm:hidden">
        <div className="flex w-max gap-4">
          {details.map((detail, i) => renderCard(items[i], detail, true))}
        </div>
      </div>

      <div className="hidden grid-cols-1 gap-4 sm:grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 sm:gap-6">
        {details.length === 0 ? (
          <p className="col-span-full text-center text-slate-500 dark:text-stone-400">
            Loading series details...
          </p>
        ) : (
          details.map((detail, i) => renderCard(items[i], detail))
        )}
      </div>

      <div className="mt-6 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-1 font-medium text-blue-600 underline transition hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
        >
          <span aria-hidden className="text-sm">
            Back
          </span>
          <span>to Rankings</span>
        </Link>
      </div>
    </div>
  );
};

export default ComparePage;

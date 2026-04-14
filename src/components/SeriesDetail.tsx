import { useEffect, useState } from "react";
import { voteOnSeries } from "../api/manApi";
import { Check } from "lucide-react";
import type { SeriesDetailData } from "../types/types";
import { useUser } from "../login/useUser";

type Category =
  | "Story"
  | "Characters"
  | "World Building"
  | "Art"
  | "Drama / Fighting";

type Props = {
  series: {
    id: number;
    title: string;
    genre: string;
    type: string;
    description: string;
  };
  updateRating: (category: string, avg: number) => void;
  seriesDetail?: SeriesDetailData | null;
};

const categories: Category[] = [
  "Story",
  "Characters",
  "World Building",
  "Art",
  "Drama / Fighting",
];

const descriptions: Record<Category, string> = {
  Story:
    "Evaluate how engaging and well-paced the plot is. Does it keep you hooked?",
  Characters: "Rate the uniqueness, depth, and development of the characters.",
  "World Building": "Is the universe immersive, consistent, and imaginative?",
  Art: "Judge the quality of the artwork, paneling, and style.",
  "Drama / Fighting":
    "For dramas: emotional depth. For action: excitement and choreography.",
};

const categoryKeyMap: Record<Category, string> = {
  Story: "story",
  Characters: "characters",
  "World Building": "worldbuilding",
  Art: "art",
  "Drama / Fighting": "drama_or_fight",
};

const SeriesDetail = ({ series, updateRating, seriesDetail }: Props) => {
  const [votes, setVotes] = useState<Record<Category, number | null>>(
    () =>
      Object.fromEntries(categories.map((cat) => [cat, null])) as Record<
        Category,
        number | null
      >
  );
  const { user } = useUser();
  const isLoggedIn = !!user;

  type TotalsRecord = Record<Category, { total: number; count: number }>;

  const [, setTotals] = useState<TotalsRecord>(
    () =>
      Object.fromEntries(
        categories.map((cat) => [cat, { total: 0, count: 0 }])
      ) as TotalsRecord
  );

  useEffect(() => {
    if (!seriesDetail) return;

    const initTotals: TotalsRecord = {
      Story: {
        total: seriesDetail.story_total,
        count: seriesDetail.story_count,
      },
      Characters: {
        total: seriesDetail.characters_total,
        count: seriesDetail.characters_count,
      },
      "World Building": {
        total: seriesDetail.worldbuilding_total,
        count: seriesDetail.worldbuilding_count,
      },
      Art: {
        total: seriesDetail.art_total,
        count: seriesDetail.art_count,
      },
      "Drama / Fighting": {
        total: seriesDetail.drama_or_fight_total ?? 0,
        count: seriesDetail.drama_or_fight_count ?? 0,
      },
    };

    const initVotes = categories.reduce((acc, cat) => {
      const normalizedKey = categoryKeyMap[cat];
      const userScore =
        seriesDetail.vote_scores?.[cat] ??
        seriesDetail.vote_scores?.[normalizedKey] ??
        null;
      acc[cat] = userScore;
      return acc;
    }, {} as Record<Category, number | null>);

    setTotals(initTotals);
    setVotes(initVotes);

    categories.forEach((cat) => {
      const totalSet = initTotals[cat];
      if (totalSet.count > 0) {
        updateRating(cat, totalSet.total / totalSet.count);
      }
    });
  }, [seriesDetail]);

  const handleVote = async (category: Category, value: number) => {
    if (votes[category] !== null) return;
    try {
      await voteOnSeries(series.id, category, value);
      setVotes((prev) => ({ ...prev, [category]: value }));
      setTotals((prev) => {
        const updated = {
          ...prev,
          [category]: {
            total: prev[category].total + value,
            count: prev[category].count + 1,
          },
        };
        const avg = updated[category].total / updated[category].count;
        updateRating(category, avg);
        return updated;
      });
    } catch (err) {
      alert("Your vote couldn't be submitted. If you've already voted, your original score is still locked in.");
      console.error("Voting failed:", err);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[22px] border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-800 shadow-sm dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-200">
        Each category can be rated once. After you submit a score, that choice is locked in.
      </div>

      {categories.map((category) => {
        const hasVoted = votes[category] !== null;

        return (
          <div
            key={category}
            className={`rounded-[24px] border px-4 py-4 shadow-sm transition sm:px-5 ${
              hasVoted
                ? "border-blue-100 bg-blue-50/60 dark:border-[#475276] dark:bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_30%),linear-gradient(145deg,_rgba(27,22,19,0.98),_rgba(21,17,14,0.98))] dark:shadow-[0_18px_34px_-28px_rgba(0,0,0,0.82)]"
                : "border-slate-200 bg-slate-50/70 dark:border-[#3a3028] dark:bg-[linear-gradient(145deg,_rgba(24,20,17,0.94),_rgba(19,16,13,0.94))]"
            }`}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 lg:max-w-sm">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {category}
                </h4>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {descriptions[category]}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {[...Array(10)].map((_, i) => {
                  const score = i + 1;
                  const voted = votes[category] === score;
                  const alreadyVoted = votes[category] !== null;
                  const canVote = isLoggedIn && !alreadyVoted;

                  return (
                    <div className="relative group" key={score}>
                      <button
                        onClick={() => handleVote(category, score)}
                        disabled={!canVote}
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold transition ${
                          voted
                            ? "bg-blue-600 text-white shadow-sm"
                            : !isLoggedIn
                            ? "cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-[#241d19] dark:text-slate-500"
                            : alreadyVoted
                            ? "cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-[#241d19] dark:text-slate-400"
                            : "bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:ring-blue-200 dark:bg-[linear-gradient(145deg,_rgba(27,22,19,0.96),_rgba(21,17,14,0.96))] dark:text-slate-200 dark:ring-[#3a3028] dark:hover:bg-[linear-gradient(145deg,_rgba(34,47,83,0.78),_rgba(24,31,55,0.78))] dark:hover:text-blue-200 dark:hover:ring-[#475276]"
                        }`}
                        title={
                          !isLoggedIn
                            ? "Please log in or register to vote"
                            : voted
                            ? "You already voted"
                            : `${score} out of 10`
                        }
                      >
                        {voted ? (
                          <Check className="h-5 w-5 text-white" strokeWidth={3} />
                        ) : (
                          score
                        )}
                      </button>

                      {!isLoggedIn && (
                        <div
                          className={`pointer-events-none absolute -top-10 z-10 w-max rounded-lg bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 ${
                            score >= 9
                              ? "right-0"
                              : score <= 2
                              ? "left-0"
                              : "left-1/2 -translate-x-1/2"
                          }`}
                        >
                          Please log in or register to vote
                        </div>
                      )}

                      {isLoggedIn && alreadyVoted && !voted && (
                        <div
                          className={`pointer-events-none absolute -top-10 z-10 w-max rounded-lg bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 ${
                            score >= 9
                              ? "right-0"
                              : score <= 2
                              ? "left-0"
                              : "left-1/2 -translate-x-1/2"
                          }`}
                        >
                          You already voted on this category
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SeriesDetail;

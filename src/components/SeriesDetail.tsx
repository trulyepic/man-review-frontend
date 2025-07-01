import { useEffect, useState } from "react";
import { voteOnSeries } from "../api/manApi";
import { useUser } from "../login/UserContext";
import { Check } from "lucide-react";
import type { SeriesDetailData } from "../types/types";

type Category =
  | "Story"
  | "Characters"
  | "World Building"
  | "Art"
  | "Drama / Fighting";

// type Props = {
//   series: {
//     id: number;
//     title: string;
//     genre: string;
//     type: string;
//     description: string;
//   };
//   updateRating: (category: string, avg: number) => void;
//   seriesDetail?: {
//     story_total: number;
//     story_count: number;
//     characters_total: number;
//     characters_count: number;
//     worldbuilding_total: number;
//     worldbuilding_count: number;
//     art_total: number;
//     art_count: number;
//     drama_or_fight_total: number;
//     drama_or_fight_count: number;
//     voted_categories?: string[];
//     vote_scores?: Record<string, number>;
//   } | null;
// };
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
    "For dramas: emotional depth. For action: excitement & choreography.",
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

  // const [totals, setTotals] = useState<
  //   Record<Category, { total: number; count: number }>
  // >(
  //   () =>
  //     Object.fromEntries(
  //       categories.map((cat) => [cat, { total: 0, count: 0 }])
  //     ) as Record<Category, { total: number; count: number }>
  // );
  type TotalsRecord = Record<Category, { total: number; count: number }>;

  const [, setTotals] = useState<TotalsRecord>(
    () =>
      Object.fromEntries(
        categories.map((cat) => [cat, { total: 0, count: 0 }])
      ) as TotalsRecord
  );

  // Sync backend data after load
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
      const userScore = seriesDetail.vote_scores?.[cat] ?? null;
      acc[cat] = userScore;
      return acc;
    }, {} as Record<Category, number | null>);

    setTotals(initTotals);
    setVotes(initVotes);

    // Update average ratings
    categories.forEach((cat) => {
      const t = initTotals[cat];
      if (t.count > 0) {
        updateRating(cat, t.total / t.count);
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
      alert("You can only vote once on this series.");
      console.error("Voting failed:", err);
    }
  };
  console.log("votes", votes);
  console.log("vote_scores keys", Object.keys(seriesDetail?.vote_scores || {}));

  //   console.log("sereiesDetail", seriesDetail);
  return (
    <div className="space-y-6">
      <p className="text-sm text-red-600 font-medium border border-red-300 bg-red-50 px-4 py-2 rounded-md shadow-sm">
        ⚠️ You can only vote once per category. Your selections are final.
      </p>
      {categories.map((category) => {
        const hasVoted = votes[category] !== null;
        return (
          <div
            key={category}
            className={`mb-6 p-2 rounded ${
              hasVoted ? "bg-gray-50 opacity-90" : ""
            }`}
          >
            <h4 className="font-semibold text-lg mb-2">{category}</h4>
            <p className="text-sm text-gray-600 mb-2">
              {descriptions[category]}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
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
                      className={`relative w-8 h-8 rounded-full text-sm flex items-center justify-center transition duration-200 ${
                        voted
                          ? "bg-blue-300 text-white cursor-default"
                          : !isLoggedIn
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : alreadyVoted
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-gray-200 hover:bg-blue-300 hover:text-white"
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
                        <Check
                          className="text-white w-5 h-5 "
                          strokeWidth={3}
                        />
                      ) : (
                        score
                      )}
                    </button>

                    {/* Tooltip for unauthenticated users */}
                    {!isLoggedIn && (
                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-max px-2 py-1 bg-black text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                        Please log in or register to vote
                      </div>
                    )}

                    {/* Tooltip for already voted users (non-selected buttons) */}
                    {isLoggedIn && alreadyVoted && !voted && (
                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-max px-2 py-1 bg-black text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                        You already voted on this category
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
  );
};

export default SeriesDetail;

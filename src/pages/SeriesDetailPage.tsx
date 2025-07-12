import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import SeriesDetail from "../components/SeriesDetail";
import AddSeriesDetailModal from "../components/AddSeriesDetailModal";
import { getCurrentUser, getSeriesDetailById } from "../api/manApi";
import { UserIcon } from "lucide-react";
import { UsersIcon } from "@heroicons/react/24/outline";
import SeriesDetailShimmer from "../components/SeriesDetailShimmer";
import type { SeriesDetailData } from "../types/types";

const dummyData = {
  id: 1,
  title: "Heavenly Chronicles",
  genre: "Action",
  type: "MANHWA",
  description:
    "A legendary tale of a martial artist who reincarnates to challenge fate and the heavens.",
  author: "Jane Smith",
  artist: "John Doe",
};

const SeriesDetailPage = () => {
  const user = getCurrentUser();
  const isAdmin = user?.role === "ADMIN";
  const { id } = useParams();
  const location = useLocation();
  const { title, genre, type, author, artist } = location.state || {};

  const [showEditModal, setShowEditModal] = useState(false);
  const [series, setSeries] = useState<typeof dummyData>({
    ...dummyData,
    id: Number(id),
    title: title || dummyData.title,
    genre: genre || dummyData.genre,
    type: type || dummyData.type,
    author: author || dummyData.author,
    artist: artist || dummyData.artist,
  });

  // const [seriesDetail, setSeriesDetail] = useState<{
  //   synopsis: string;
  //   series_cover_url: string;
  //   author?: string;
  //   artist?: string;
  //   [key: string]: any;
  // } | null>(null);
  const [seriesDetail, setSeriesDetail] = useState<SeriesDetailData | null>(
    null
  );

  const [ratings, setRatings] = useState<Record<string, number>>({
    Story: -1,
    Characters: -1,
    "World Building": -1,
    Art: -1,
    "Drama / Fighting": -1,
  });

  const [counts, setCounts] = useState<Record<string, number>>({});

  const validScores = Object.values(ratings).filter((s) => s !== -1);
  const avgScore =
    validScores.length > 0
      ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1)
      : "-";

  useEffect(() => {
    setSeries((prev) => ({
      ...prev,
      id: Number(id),
      title: title || prev.title,
      genre: genre || prev.genre,
      type: type || prev.type,
      artist: artist || prev.artist,
      author: author || prev.author,
    }));
  }, [id, title, genre, type, author, artist]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const detail = await getSeriesDetailById(Number(id));
        setSeriesDetail(detail);

        const newRatings = { ...ratings };
        for (const cat in newRatings) {
          if (detail[cat.toLowerCase().replace(" / ", "_") + "_count"]) {
            newRatings[cat] =
              detail[cat.toLowerCase().replace(" / ", "_") + "_total"] /
              detail[cat.toLowerCase().replace(" / ", "_") + "_count"];
          }
        }

        setRatings(newRatings);
        setCounts(detail.vote_counts || {});
      } catch (err) {
        console.error("Failed to fetch series detail", err);
      }
    };

    fetchDetails();
  }, [id, showEditModal]);

  const updateRating = (category: string, avg: number) => {
    setRatings((prev) => ({
      ...prev,
      [category]: avg,
    }));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-10 py-6">
      {isAdmin && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowEditModal(true)}
            className="px-5 py-2.5 rounded-md font-medium text-gray-800 bg-white/70 backdrop-blur-sm border border-gray-300 shadow-md hover:bg-white hover:shadow-lg hover:text-black transition-all duration-200"
          >
            ✏️ Edit Series Detail
          </button>
        </div>
      )}

      {!seriesDetail ? (
        <SeriesDetailShimmer />
      ) : (
        <>
          <img
            src={seriesDetail.series_cover_url}
            alt={series.title}
            className="w-full rounded-lg shadow mb-6"
          />

          {/* Series title and metadata */}
          <div className="flex flex-col sm:flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold mb-1 break-words whitespace-normal">
                {series.title}
              </h1>
              <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-gray-600 capitalize break-words">
                <span>{series.type}</span>
                <span>|</span>
                <span>{series.genre}</span>
                {seriesDetail?.author && (
                  <>
                    <span>|</span>
                    <span className="text-gray-700 whitespace-normal break-words">
                      <strong>Author:</strong> {seriesDetail.author}
                    </span>
                  </>
                )}
                {seriesDetail?.artist && (
                  <>
                    <span>|</span>
                    <span className="text-gray-700 whitespace-normal break-words">
                      <strong>Artist:</strong> {seriesDetail.artist}
                    </span>
                  </>
                )}
              </div>
            </div>

            {avgScore && (
              <div className="shrink-0 self-start md:self-auto md:ml-6">
                <div className="rounded-3xl px-6 py-3 shadow-md text-center">
                  <div className="text-xs text-gray-600 uppercase tracking-wider mb-1">
                    Avg. Rating
                  </div>
                  <div
                    className="text-5xl text-gray-900 leading-none tracking-tight"
                    style={{
                      textShadow: "2px 2px 4px rgba(0, 0, 0, 0.25)",
                      fontWeight: 750,
                    }}
                  >
                    {avgScore}/10
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white shadow rounded p-4 mb-6">
            <h2 className="text-xl font-semibold mb-2">Synopsis</h2>
            <p className="text-gray-700">
              {seriesDetail.synopsis || "No synopsis available yet."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {Object.entries(ratings).map(([label, score]) => (
              <RatingCard
                key={label}
                label={label}
                score={score}
                count={counts[label]}
              />
            ))}
          </div>

          <div className="bg-white p-4 shadow rounded">
            <h2 className="text-xl font-semibold mb-4">
              Determine Series Rank
            </h2>
            <SeriesDetail
              series={series}
              updateRating={updateRating}
              seriesDetail={seriesDetail}
            />
          </div>
        </>
      )}

      {showEditModal && (
        <AddSeriesDetailModal
          seriesId={series.id}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
};

const RatingCard = ({
  label,
  score,
  count,
}: {
  label: string;
  score: number;
  count?: number;
}) => (
  <div className="bg-white shadow rounded p-4 relative">
    <h3 className="font-medium text-gray-700 mb-1">{label}</h3>
    <p className="text-lg font-bold text-blue-400">
      {score === -1 ? "-/10" : `${score.toFixed(1)}/10`}
    </p>
    {count !== undefined && (
      <div className="absolute bottom-2 right-3 text-xs text-gray-500 flex items-center gap-1">
        {count > 1 ? (
          <UsersIcon className="w-5 h-5 text-blue-400" />
        ) : (
          <UserIcon className="w-5 h-5 text-blue-400" />
        )}
        {count}
      </div>
    )}
  </div>
);

export default SeriesDetailPage;

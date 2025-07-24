import { useState } from "react";
import { TrashIcon, PencilSquareIcon } from "@heroicons/react/24/solid";
import { Palette, Pencil, StarIcon } from "lucide-react";
import { Link } from "react-router-dom";
import UserIcon from "./icons/UserIcon";
import ShimmerBox from "./ShimmerBox";
import { formatScore } from "../util/formatScore";

type Props = {
  id: number;
  rank: number | string;
  title: string;
  type: string;
  genre: string;
  votes: number;
  coverUrl: string;
  onDelete: (id: number) => void;
  onEdit?: () => void;
  isAdmin: boolean;
  author?: string;
  artist?: string;
  avgScore?: number;
  onCompareToggle?: () => void;
  isCompared?: boolean| void;
};

const ManCard = ({
  id,
  rank,
  title,
  type,
  genre,
  votes,
  coverUrl,
  onDelete,
  onEdit,
  isAdmin,
  author,
  artist,
  avgScore,
  onCompareToggle,
  isCompared
}: Props) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <article className="relative w-40">
      {/* Rank badge */}
      <div className="absolute top-2 left-2 text-[1.2rem] font-bold text-white bg-black/70 px-2 py-1 rounded-full z-10 shadow-md ring-2 ring-white">
        {rank !== null && rank !== undefined && typeof rank === "number"
          ? `#${rank}`
          : "–"}
      </div>

      {/* Admin controls */}
      {isAdmin && (
        <div className="absolute top-2 right-2 flex gap-1 z-10">
          <button
            onClick={onEdit}
            title="Edit"
            className="bg-white/80 rounded-full p-1 shadow hover:bg-blue-100"
          >
            <PencilSquareIcon className="w-4 h-4 text-blue-500" />
          </button>
          <button
            onClick={() => onDelete(id)}
            className="bg-white/80 rounded-full p-1 shadow hover:bg-red-100"
            title="Delete"
          >
            <TrashIcon className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}

      {/* Card image and content */}
      <Link
        to={`/series/${id}`}
        state={{ title, genre, type }}
        className="block"
      >
        {/* <div className="relative w-full">
          {!imageLoaded && <ShimmerBox className="w-full h-60" />}

          <img
            src={coverUrl}
            alt={`Cover for ${title}`}
            onLoad={() => setImageLoaded(true)}
            className={`rounded-md shadow transition-opacity duration-500 w-full object-cover ${
              imageLoaded ? "opacity-100" : "opacity-0 absolute top-0 left-0"
            }`}
          />
        </div> */}
        <div className="relative w-full group overflow-hidden rounded-md">
          {!imageLoaded && <ShimmerBox className="w-full h-60" />}

          <img
            src={coverUrl}
            alt={`Cover for ${title}`}
            onLoad={() => setImageLoaded(true)}
            className={`transition-all duration-300 ease-in-out w-full h-60 object-cover shadow rounded-md ${
              imageLoaded
                ? "opacity-100 group-hover:scale-105 group-hover:shadow-lg"
                : "opacity-0 absolute top-0 left-0"
            }`}
          />
        </div>

        {/* Content */}
        <div className="mt-2 space-y-0.5">
          <h2 className="text-base font-semibold truncate w-full" title={title}>
            {title}
          </h2>
          <p className="text-xs text-gray-500 capitalize flex items-center gap-2.5">
            {type}
            {avgScore !== undefined && (
              <span
                className={`flex items-center gap-0.5 font-medium ${
                  avgScore >= 9
                    ? "text-green-600"
                    : avgScore >= 7.5
                    ? "text-blue-500"
                    : avgScore >= 5
                    ? "text-yellow-500"
                    : avgScore >= 3
                    ? "text-orange-400"
                    : "text-red-500"
                }`}
              >
                <StarIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
                {/* {avgScore.toFixed(3)} */}
                {/* {cleanScore(avgScore)} */}
                {formatScore(avgScore, 3)}
              </span>
            )}
          </p>

          {author && (
            <p
              className="text-sm text-gray-600 flex items-center gap-1"
              title={author}
            >
              <Pencil className="w-4 h-4 text-gray-700 flex-shrink-0" />
              <span
                className="truncate"
                style={{ maxWidth: "calc(100% - 1.25rem)" }}
              >
                {author}
              </span>
            </p>
          )}
          {artist && (
            <p
              className="text-sm text-gray-600 flex items-center gap-1"
              title={artist}
            >
              <Palette className="w-4 h-4 text-gray-700 flex-shrink-0" />
              <span
                className="truncate"
                style={{ maxWidth: "calc(100% - 1.25rem)" }}
              >
                {artist}
              </span>
            </p>
          )}
          <div className="flex items-center justify-between mt-1 text-sm text-gray-700">
  <div className="flex items-center space-x-1">
    <UserIcon className="w-5 h-5 text-blue-400" />
    <span>{votes.toLocaleString()}</span>
  </div>

  {onCompareToggle && (
    <button
      onClick={(e) => {
        e.preventDefault();
        onCompareToggle();
      }}
      title="Select to Compare"
      className={`ml-2 px-2 py-0.5 text-xs rounded-full font-semibold ${
        isCompared ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
      }`}
    >
      {isCompared ? "✓" : "+"} Compare
    </button>
  )}
</div>

        </div>
      </Link>
    </article>
  );
};

// function cleanScore(value: number | string, sliceLength = 6): string {
//   const str = String(value).slice(0, sliceLength);
//   const num = Number(str);

//   // Ensure at least one decimal place
//   if (Number.isInteger(num)) {
//     return `${num}.0`;
//   }

//   return num.toString();
// }

export default ManCard;

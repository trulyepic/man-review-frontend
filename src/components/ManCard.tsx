import {
  TrashIcon,
  TrophyIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/solid";
import { Palette, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import UserIcon from "./icons/UserIcon";

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
}: Props) => {
  // console.log("ManCard - Title:", title, "| Rank:", rank);

  return (
    <div className="relative w-40">
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

      {/* Cover image */}
      <Link
        to={`/series/${id}`}
        state={{ title, genre, type }}
        className="block "
      >
        <img
          src={coverUrl}
          alt={title}
          className="rounded-md shadow transition-transform duration-300 ease-in-out hover:scale-105"
        />

        {/* Content */}
        <div className="mt-2 space-y-0.5">
          <h3
            className="text-base font-semibold truncate w-full cursor-pointer"
            title={title}
          >
            {title}
          </h3>
          <p className="text-xs text-gray-500 capitalize">{type}</p>
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
          <div className="flex items-center space-x-1 text-sm text-gray-700 mt-1">
            <UserIcon className="w-5 h-5 text-blue-400" />
            {/* <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-blue-300"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg> */}
            <span>{votes.toLocaleString()}</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ManCard;

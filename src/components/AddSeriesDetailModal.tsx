import { useState } from "react";
import { createSeriesDetail } from "../api/manApi";

const AddSeriesDetailModal = ({
  seriesId,
  onClose,
}: {
  seriesId: number;
  onClose: () => void;
}) => {
  const [synopsis, setSynopsis] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_SIZE_KB = 800;

  const handleSubmit = async () => {
    if (!cover || !synopsis.trim()) {
      setError("All fields are required.");
      return;
    }

    const fileSizeKB = cover.size / 1024;
    if (fileSizeKB > MAX_SIZE_KB) {
      setError("Cover image must be less than 800KB.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await createSeriesDetail({
        series_id: seriesId,
        synopsis,
        series_cover: cover,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to save detail.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="dark-theme-shell w-full max-w-lg rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_28px_80px_rgba(15,23,42,0.22)] dark:border-[#3a3028]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-stone-50">
              Add Title Details
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-stone-300">
              Add the synopsis and detail cover art for this title.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50 dark:border-[#3a3028] dark:text-stone-300 dark:hover:bg-[#241d19]"
          >
            Close
          </button>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="rounded-2xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/70 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          )}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-stone-200">
              Synopsis
            </label>
            <textarea
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              className="dark-theme-field h-32 w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 dark:border-[#3a3028] dark:text-stone-100 dark:placeholder:text-stone-500"
              placeholder="Enter synopsis..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-stone-200">
              Series Cover Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCover(e.target.files?.[0] || null)}
              className="block w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border file:border-slate-200 file:bg-slate-50 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-100 dark:border-[#3a3028] dark:text-stone-300 dark:file:border-[#3a3028] dark:file:bg-[#18120f] dark:hover:file:bg-[#241d19]"
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-stone-400">
              Recommended size: 600x400px. Max size: 800KB.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-[#3a3028] dark:text-stone-200 dark:hover:bg-[#241d19]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSeriesDetailModal;

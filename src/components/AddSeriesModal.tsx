import { useState } from "react";
import { createSeries } from "../api/manApi";
import type { SeriesPayload } from "../api/manApi";

interface Props {
  onClose: () => void;
}

const fieldClass =
  "dark-theme-field w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 dark:border-[#3a3028] dark:text-stone-100 dark:placeholder:text-stone-500";

const AddSeriesModal = ({ onClose }: Props) => {
  const [form, setForm] = useState<Partial<SeriesPayload>>({});
  const [cover, setCover] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!form.title || !form.genre || !form.type || !cover) {
      setError("Title, genre, type, and cover image are required.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await createSeries({ ...form, cover } as SeriesPayload);
      onClose();
      window.location.reload();
    } catch (err) {
      setError("Error adding series.");
      console.error("Error adding series:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageValidation = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const { width, height } = img;
      const aspectRatio = width / height;

      if (aspectRatio < 0.6 || aspectRatio > 0.7) {
        setError("Please upload an image with a 2:3 portrait ratio (e.g. 200x300).");
        return;
      }

      setError(null);
      setCover(file);
    };

    img.onerror = () => {
      setError("Invalid image file.");
      setCover(null);
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="dark-theme-shell w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_28px_80px_rgba(15,23,42,0.22)] dark:border-[#3a3028]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-stone-50">
              Add New Series
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-stone-300">
              Create a new title with the core metadata and cover art.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50 dark:border-[#3a3028] dark:text-stone-300 dark:hover:bg-[#241d19]"
          >
            Close
          </button>
        </div>

        <div className="space-y-3">
          {error && (
            <div className="rounded-2xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/70 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          )}
          <input
            type="text"
            placeholder="Title"
            className={fieldClass}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            type="text"
            placeholder="Genre"
            className={fieldClass}
            onChange={(e) => setForm({ ...form, genre: e.target.value })}
          />
          <input
            type="text"
            placeholder="Author"
            className={fieldClass}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
          />
          <input
            type="text"
            placeholder="Artist"
            className={fieldClass}
            onChange={(e) => setForm({ ...form, artist: e.target.value })}
          />
          <select
            className={fieldClass}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value as SeriesPayload["type"] })
            }
          >
            <option value="">Select Type</option>
            <option value="MANGA">Manga</option>
            <option value="MANHWA">Manhwa</option>
            <option value="MANHUA">Manhua</option>
          </select>

          <select
            className={fieldClass}
            onChange={(e) =>
              setForm({
                ...form,
                status:
                  e.target.value === ""
                    ? undefined
                    : (e.target.value as SeriesPayload["status"]),
              })
            }
          >
            <option value="">Status (optional)</option>
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETE">Complete</option>
            <option value="HIATUS">Hiatus</option>
            <option value="SEASON_END">Season End</option>
            <option value="UNKNOWN">Unknown</option>
          </select>

          <label
            htmlFor="cover-upload"
            className="block w-full cursor-pointer rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-[#4b3d33] dark:text-stone-200 dark:hover:bg-[#241d19]"
          >
            {cover ? cover.name : "Choose Cover Image"}
          </label>
          <input
            id="cover-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageValidation(e)}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-[#3a3028] dark:text-stone-200 dark:hover:bg-[#241d19]"
          >
            Cancel
          </button>
          <button
            disabled={loading}
            onClick={handleSubmit}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSeriesModal;

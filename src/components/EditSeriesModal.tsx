import { useState } from "react";
import { editSeries, type SeriesType } from "../api/manApi";

type Props = {
  id: number;
  initialData: {
    title: string;
    genre: string;
    type: SeriesType;
    author?: string;
    artist?: string;
    status?:
      | "ONGOING"
      | "COMPLETE"
      | "HIATUS"
      | "UNKNOWN"
      | "SEASON_END"
      | null;
  };
  onClose: () => void;
  onSuccess: () => void;
};

const fieldClass =
  "dark-theme-field w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 dark:border-[#3a3028] dark:text-stone-100 dark:placeholder:text-stone-500";

const EditSeriesModal = ({ id, initialData, onClose, onSuccess }: Props) => {
  const [form, setForm] = useState({ ...initialData });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      await editSeries(id, form);
      onSuccess();
      onClose();
    } catch (err) {
      setError("Failed to update series.");
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="dark-theme-shell w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_28px_80px_rgba(15,23,42,0.22)] dark:border-[#3a3028]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-stone-50">
              Edit Series
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-stone-300">
              Update the title metadata without leaving the page.
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
            name="title"
            value={form.title}
            onChange={handleChange}
            className={fieldClass}
          />
          <input
            name="genre"
            value={form.genre}
            onChange={handleChange}
            className={fieldClass}
          />
          <input
            name="author"
            value={form.author}
            onChange={handleChange}
            className={fieldClass}
            placeholder="Author"
          />
          <input
            name="artist"
            value={form.artist}
            onChange={handleChange}
            className={fieldClass}
            placeholder="Artist"
          />
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className={fieldClass}
          >
            <option value="MANGA">Manga</option>
            <option value="MANHWA">Manhwa</option>
            <option value="MANHUA">Manhua</option>
          </select>

          <select
            name="status"
            value={form.status || ""}
            onChange={(e) => {
              const v = e.target.value as Props["initialData"]["status"];
              setForm((prev) => ({ ...prev, status: v || null }));
            }}
            className={fieldClass}
          >
            <option value="">Status (optional)</option>
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETE">Complete</option>
            <option value="HIATUS">Hiatus</option>
            <option value="SEASON_END">Season End</option>
            <option value="UNKNOWN">Unknown</option>
          </select>
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
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditSeriesModal;

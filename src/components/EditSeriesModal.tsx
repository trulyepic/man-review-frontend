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
  };
  onClose: () => void;
  onSuccess: () => void;
};

const EditSeriesModal = ({ id, initialData, onClose, onSuccess }: Props) => {
  const [form, setForm] = useState({ ...initialData });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    try {
      await editSeries(id, form);
      onSuccess();
      onClose();
    } catch (err) {
      alert("Failed to update series.");
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center z-50">
      <div className="bg-white/30 backdrop-blur-md p-6 rounded-md shadow-lg w-full max-w-md border border-white/20">
        <h2 className="text-xl font-bold mb-4">Edit Series</h2>
        <div className="space-y-3">
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full p-2 border rounded bg-white bg-opacity-30 mb-4"
          />
          <input
            name="genre"
            value={form.genre}
            onChange={handleChange}
            className="w-full p-2 border rounded bg-white bg-opacity-30 mb-4"
          />
          <input
            name="author"
            value={form.author}
            onChange={handleChange}
            className="w-full p-2 border rounded bg-white bg-opacity-30 mb-4"
            placeholder="Author"
          />
          <input
            name="artist"
            value={form.artist}
            onChange={handleChange}
            className="w-full p-2 border rounded bg-white bg-opacity-30 mb-4"
            placeholder="Artist"
          />
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full p-2 border rounded bg-white/30 text-gray-800 backdrop-blur-sm mb-4 focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <option value="MANGA">Manga</option>
            <option value="MANHWA">Manhwa</option>
            <option value="MANHUA">Manhua</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditSeriesModal;

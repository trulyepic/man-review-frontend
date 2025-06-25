import { useState } from "react";
import { createSeries } from "../api/manApi";
import type { SeriesPayload } from "../api/manApi";

interface Props {
  onClose: () => void;
}

const AddSeriesModal = ({ onClose }: Props) => {
  const [form, setForm] = useState<Partial<SeriesPayload>>({});
  const [cover, setCover] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !form.genre || !form.type || !cover) return;
    setLoading(true);
    try {
      await createSeries({ ...form, cover } as SeriesPayload);
      onClose();
      window.location.reload(); // Reload to see new series
    } catch (err) {
      alert("Error adding series.");
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
        alert(
          "Please upload an image with a 2:3 portrait ratio (e.g. 200x300)."
        );
        return;
      }

      setCover(file);
    };

    img.onerror = () => {
      alert("Invalid image file.");
      setCover(null);
    };
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center z-50">
      <div className="bg-white/50 backdrop-blur-md p-6 rounded-md shadow-lg w-full max-w-md border border-white/60">
        <h2 className="text-xl font-bold mb-4">Add New Series</h2>

        <input
          type="text"
          placeholder="Title"
          className="w-full p-2 border rounded bg-white bg-opacity-30 mb-4"
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          type="text"
          placeholder="Genre"
          className="w-full p-2 border rounded bg-white bg-opacity-30 mb-4"
          onChange={(e) => setForm({ ...form, genre: e.target.value })}
        />
        <input
          type="text"
          placeholder="Author"
          className="w-full p-2 border rounded bg-white bg-opacity-30 mb-4"
          onChange={(e) => setForm({ ...form, author: e.target.value })}
        />
        <input
          type="text"
          placeholder="Artist"
          className="w-full p-2 border rounded bg-white bg-opacity-30 mb-4"
          onChange={(e) => setForm({ ...form, artist: e.target.value })}
        />
        <select
          className="w-full p-2 border rounded bg-white/30 text-gray-800 backdrop-blur-sm mb-4 focus:outline-none focus:ring-2 focus:ring-white/40"
          onChange={(e) =>
            setForm({ ...form, type: e.target.value as SeriesPayload["type"] })
          }
        >
          <option value="">Select Type</option>
          <option value="MANGA">Manga</option>
          <option value="MANHWA">Manhwa</option>
          <option value="MANHUA">Manhua</option>
        </select>

        <label
          htmlFor="cover-upload"
          className="block w-full bg-white/30 text-gray-800 border rounded p-2 text-center cursor-pointer mb-6 hover:bg-white/40 transition"
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

        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
            Cancel
          </button>
          <button
            disabled={loading}
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSeriesModal;

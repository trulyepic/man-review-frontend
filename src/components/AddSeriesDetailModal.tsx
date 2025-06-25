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

  const MAX_SIZE_KB = 800;

  const handleSubmit = async () => {
    if (!cover || !synopsis.trim()) return alert("All fields required");

    // ✅ Enforce 800KB max file size
    const fileSizeKB = cover.size / 1024;
    if (fileSizeKB > MAX_SIZE_KB) {
      return alert("Cover image must be less than 800KB");
    }

    setLoading(true);
    try {
      await createSeriesDetail({
        series_id: seriesId,
        synopsis,
        series_cover: cover,
      });
      alert("Series detail saved!");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save detail.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg space-y-4">
        <h2 className="text-xl font-bold mb-4">Edit Series Details</h2>

        <label className="block text-sm font-medium text-gray-700">
          Synopsis
        </label>
        <textarea
          value={synopsis}
          onChange={(e) => setSynopsis(e.target.value)}
          className="w-full h-28 p-2 border rounded"
          placeholder="Enter synopsis..."
        />

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Series Cover Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCover(e.target.files?.[0] || null)}
            className="mt-1 block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer"
          />
          <p className="mt-1 text-xs text-gray-500">
            Recommended size: 900x600px. Max size: 800KB.
          </p>
        </div>

        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded bg-green-600 text-white"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSeriesDetailModal;

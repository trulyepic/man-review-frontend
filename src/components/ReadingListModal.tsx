import { useEffect, useState } from "react";
import {
  getMyReadingLists,
  createReadingList,
  addSeriesToReadingList,
  type ReadingList,
} from "../api/manApi";

type Props = {
  open: boolean;
  onClose: () => void;
  // If seriesId is provided, we're adding that series to a list.
  seriesId?: number;
  // Called after successful action (create or add)
  onDone?: () => void;
};

const MAX_LISTS = 2;

export default function ReadingListModal({
  open,
  onClose,
  seriesId,
  onDone,
}: Props) {
  const [lists, setLists] = useState<ReadingList[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [newListName, setNewListName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMyReadingLists();
        setLists(data);
        if (data.length > 0) setSelectedListId(data[0].id);
      } catch (e) {
        setError((e as Error).message || "Failed to load lists");
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  const canCreateMore = lists.length < MAX_LISTS;

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      setError("Please enter a name.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await createReadingList(newListName.trim());
      setLists((prev) => [created, ...prev]);
      setSelectedListId(created.id);
      setNewListName("");
    } catch (e) {
      setError((e as Error).message || "Failed to create list");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdd = async () => {
    if (!seriesId) {
      // “Create only” mode: nothing else to do
      onDone?.();
      onClose();
      return;
    }
    if (!selectedListId) {
      setError("Choose a list first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await addSeriesToReadingList(selectedListId, seriesId);
      onDone?.();
      onClose();
    } catch (e) {
      setError((e as Error).message || "Failed to add to list");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            {seriesId ? "Add to Reading List" : "Create a Reading List"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-6 text-center text-gray-500">Loading…</div>
        ) : (
          <>
            {/* Existing lists */}
            {lists.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Your Lists</p>
                <div className="space-y-2">
                  {lists.map((l) => (
                    <label
                      key={l.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="reading-list"
                        value={l.id}
                        checked={selectedListId === l.id}
                        onChange={() => setSelectedListId(l.id)}
                      />
                      <span className="font-medium">{l.name}</span>
                      <span className="text-xs text-gray-500">
                        ({l.items?.length ?? 0})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Create new (only if below cap) */}
            {canCreateMore && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Create New</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 border rounded px-2 py-1"
                    placeholder="List name (e.g., Current Reads)"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    maxLength={50}
                  />
                  <button
                    onClick={handleCreateList}
                    disabled={submitting}
                    className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </div>
            )}

            {!canCreateMore && (
              <div className="mb-3 text-xs text-gray-500">
                You’ve reached the limit of 2 lists. Delete a list from “My
                Lists”.
              </div>
            )}

            {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="px-3 py-1 rounded border">
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={
                  submitting ||
                  (!!seriesId && !selectedListId && lists.length > 0)
                }
                className="px-4 py-1.5 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {seriesId ? "Add" : "Done"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

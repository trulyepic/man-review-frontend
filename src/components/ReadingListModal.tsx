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
  seriesId?: number;
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
  const [leftOffChapter, setLeftOffChapter] = useState("");
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
        setLeftOffChapter("");
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
      await addSeriesToReadingList(
        selectedListId,
        seriesId,
        leftOffChapter.trim() || null
      );
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="dark-theme-shell w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_28px_80px_rgba(15,23,42,0.22)] dark:border-[#3a3028]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-stone-50">
              {seriesId ? "Add to Reading List" : "Create a Reading List"}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-stone-300">
              {seriesId
                ? "Choose a list and optionally save where you left off."
                : "Create a new list to organize your reading."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50 dark:border-[#3a3028] dark:text-stone-300 dark:hover:bg-[#241d19]"
          >
            Close
          </button>
        </div>

        {loading ? (
          <div className="py-6 text-center text-gray-500 dark:text-stone-400">
            Loading...
          </div>
        ) : (
          <>
            {lists.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-sm text-gray-600 dark:text-stone-300">
                  Your Lists
                </p>
                <div className="space-y-2">
                  {lists.map((l) => (
                    <label
                      key={l.id}
                      className="flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 dark:border-[#3a3028] dark:bg-[#18120f]"
                    >
                      <input
                        type="radio"
                        name="reading-list"
                        value={l.id}
                        checked={selectedListId === l.id}
                        onChange={() => setSelectedListId(l.id)}
                      />
                      <span className="font-medium text-slate-900 dark:text-stone-100">
                        {l.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-stone-400">
                        ({l.items?.length ?? 0})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {canCreateMore && (
              <div className="mb-4">
                <p className="mb-2 text-sm text-gray-600 dark:text-stone-300">
                  Create New
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="dark-theme-field flex-1 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 dark:border-[#3a3028] dark:text-stone-100 dark:placeholder:text-stone-500"
                    placeholder="List name (e.g., Current Reads)"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    maxLength={50}
                  />
                  <button
                    onClick={handleCreateList}
                    disabled={submitting}
                    className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </div>
            )}

            {seriesId && (
              <div className="mb-4">
                <label className="mb-2 block text-sm text-gray-600 dark:text-stone-300">
                  Left off chapter
                </label>
                <input
                  type="text"
                  className="dark-theme-field w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 dark:border-[#3a3028] dark:text-stone-100 dark:placeholder:text-stone-500"
                  placeholder="Optional, e.g. 128 or 128.5"
                  value={leftOffChapter}
                  onChange={(e) => setLeftOffChapter(e.target.value)}
                  maxLength={50}
                />
              </div>
            )}

            {!canCreateMore && (
              <div className="mb-3 text-xs text-gray-500 dark:text-stone-400">
                You've reached the limit of 2 lists. Delete a list from "My Lists".
              </div>
            )}

            {error && (
              <div className="mb-3 text-sm text-red-600 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-700 dark:border-[#3a3028] dark:text-stone-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={
                  submitting ||
                  (!!seriesId && !selectedListId && lists.length > 0)
                }
                className="rounded-xl bg-emerald-600 px-4 py-1.5 text-white hover:bg-emerald-700 disabled:opacity-50"
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

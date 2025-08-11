import { useEffect, useState } from "react";
import {
  getMyReadingLists,
  deleteReadingList,
  removeSeriesFromReadingList,
  getSeriesSummary,
  type ReadingList,
  type RankedSeries,
} from "../api/manApi";
import { Link } from "react-router-dom";

export default function MyReadingListsPage() {
  const [lists, setLists] = useState<ReadingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // seriesId -> summary
  const [summaries, setSummaries] = useState<Record<number, RankedSeries>>({});
  const [summariesLoading, setSummariesLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyReadingLists();
      setLists(data);
    } catch (e) {
      setError((e as Error).message || "Failed to load lists");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // fetch summaries for unique series ids whenever lists change
  useEffect(() => {
    const ids = Array.from(
      new Set(lists.flatMap((l) => l.items?.map((i) => i.series_id) ?? []))
    );
    if (ids.length === 0) {
      setSummaries({});
      return;
    }

    let canceled = false;
    (async () => {
      setSummariesLoading(true);
      try {
        const results = await Promise.allSettled(
          ids.map((id) => getSeriesSummary(id))
        );
        if (canceled) return;
        const map: Record<number, RankedSeries> = {};
        results.forEach((r) => {
          if (r.status === "fulfilled") map[r.value.id] = r.value;
        });
        setSummaries(map);
      } finally {
        if (!canceled) setSummariesLoading(false);
      }
    })();

    return () => {
      canceled = true;
    };
  }, [lists]);

  const handleDeleteList = async (id: number) => {
    if (!confirm("Delete this list?")) return;
    try {
      await deleteReadingList(id);
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleRemoveItem = async (listId: number, seriesId: number) => {
    try {
      await removeSeriesFromReadingList(listId, seriesId);
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  if (loading) return <div className="max-w-5xl mx-auto p-6">Loading…</div>;
  if (error)
    return <div className="max-w-5xl mx-auto p-6 text-red-600">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Reading Lists</h1>

      {lists.length === 0 ? (
        <div className="text-gray-600">
          No lists yet. Use “+ Create Reading List” on the homepage.
        </div>
      ) : (
        <div className="space-y-6">
          {lists.map((l) => (
            <section
              key={l.id}
              className="rounded-xl border border-gray-200 bg-white/70 backdrop-blur-sm shadow-sm"
            >
              <header className="flex items-center justify-between px-4 py-3 border-b">
                <h2 className="text-lg font-semibold">{l.name}</h2>
                <button
                  onClick={() => handleDeleteList(l.id)}
                  className="text-sm px-3 py-1 rounded-md bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Delete List
                </button>
              </header>

              {!l.items?.length ? (
                <div className="px-4 py-6 text-sm text-gray-500">
                  No items yet.
                </div>
              ) : summariesLoading ? (
                // ✅ Option 3: hold off rendering items until summaries load
                <div className="px-4 py-6 text-sm text-gray-500">Loading…</div>
              ) : (
                <ul className="divide-y">
                  {l.items.map((it) => {
                    const s = summaries[it.series_id];
                    return (
                      <li
                        key={it.series_id}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        {/* thumb + rank badge */}
                        <div className="relative">
                          <img
                            src={s?.cover_url || ""}
                            alt={s?.title || `Series ${it.series_id}`}
                            className="h-16 w-12 object-cover rounded-md bg-gray-100"
                          />
                          {s?.rank ? (
                            <span className="absolute -top-2 -left-2 text-[10px] font-bold text-white bg-black/70 px-1.5 py-0.5 rounded-full ring-1 ring-white">
                              #{s.rank}
                            </span>
                          ) : null}
                        </div>

                        {/* title + meta */}
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/series/${it.series_id}`}
                            className="block font-medium hover:underline truncate"
                            title={s?.title || `Series #${it.series_id}`}
                          >
                            {s?.title || `Series #${it.series_id}`}
                          </Link>

                          <div className="mt-0.5 text-sm text-gray-600 flex items-center gap-3">
                            <span className="uppercase text-xs tracking-wide">
                              {s?.type || "—"}
                            </span>

                            <span
                              className={`text-xs font-semibold ${
                                (s?.final_score ?? 0) >= 9
                                  ? "text-green-600"
                                  : (s?.final_score ?? 0) >= 7.5
                                  ? "text-blue-500"
                                  : (s?.final_score ?? 0) >= 5
                                  ? "text-yellow-600"
                                  : "text-gray-500"
                              }`}
                            >
                              {s?.final_score != null
                                ? `★ ${Number(s.final_score).toFixed(3)}`
                                : "★ —"}
                            </span>

                            <span className="text-xs text-gray-400">
                              {s?.vote_count
                                ? `${s.vote_count} votes`
                                : "No votes"}
                            </span>
                          </div>
                        </div>

                        {/* actions */}
                        <button
                          onClick={() => handleRemoveItem(l.id, it.series_id)}
                          className="text-xs px-2.5 py-1 rounded-md bg-gray-200 hover:bg-gray-300"
                        >
                          Remove
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

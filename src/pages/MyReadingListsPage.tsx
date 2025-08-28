import { useEffect, useState } from "react";
import {
  getMyReadingLists,
  deleteReadingList,
  removeSeriesFromReadingList,
  getSeriesSummary,
  shareReadingList,
  unshareReadingList,
  type ReadingList,
  type RankedSeries,
} from "../api/manApi";
import { Link } from "react-router-dom";

export default function MyReadingListsPage() {
  const [lists, setLists] = useState<ReadingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summaries, setSummaries] = useState<Record<number, RankedSeries>>({});
  const [summariesLoading, setSummariesLoading] = useState(false);

  const [busyId, setBusyId] = useState<number | null>(null);
  const [copyId, setCopyId] = useState<number | null>(null);

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

  const toggleShare = async (l: ReadingList) => {
    try {
      setBusyId(l.id);
      const next = l.is_public
        ? await unshareReadingList(l.id)
        : await shareReadingList(l.id);
      setLists((prev) => prev.map((x) => (x.id === l.id ? next : x)));
    } catch (e) {
      alert((e as Error).message || "Failed to update share state.");
    } finally {
      setBusyId(null);
    }
  };

  const copyPrivateAnchor = async (l: ReadingList) => {
    try {
      setCopyId(l.id);
      const url = `${window.location.origin}/my-lists#list-${l.id}`;
      await navigator.clipboard.writeText(url);
    } finally {
      setCopyId(null);
    }
  };

  const copyPublicUrl = async (l: ReadingList) => {
    if (!l.is_public || !l.share_token) return;
    try {
      setCopyId(l.id);
      const url = `${window.location.origin}/lists/${l.share_token}`;
      await navigator.clipboard.writeText(url);
      alert("Public URL copied!");
    } finally {
      setCopyId(null);
    }
  };

  const statusClass = (status?: string) => {
    switch ((status || "").toUpperCase()) {
      case "ONGOING":
        return "bg-green-500 text-white";
      case "COMPLETE":
        return "bg-blue-600 text-white";
      case "HIATUS":
        return "bg-amber-500 text-white";
      case "UNKNOWN":
        return "bg-gray-400 text-white";
      default:
        return "bg-gray-400 text-white";
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
              id={`list-${l.id}`}
              className="rounded-xl border border-gray-200 bg-white/70 backdrop-blur-sm shadow-sm"
            >
              <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b">
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-lg font-semibold truncate">{l.name}</h2>
                  <span
                    className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-full ${
                      l.is_public
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                    title={
                      l.is_public
                        ? "This list is public"
                        : "This list is private"
                    }
                  >
                    {l.is_public ? "Public" : "Private"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleShare(l)}
                    disabled={busyId === l.id}
                    className="text-sm px-3 py-1 rounded-md border hover:bg-gray-50"
                    title={l.is_public ? "Make private" : "Share publicly"}
                  >
                    {busyId === l.id ? "…" : l.is_public ? "Unshare" : "Share"}
                  </button>

                  {l.is_public && (
                    <button
                      onClick={() => copyPublicUrl(l)}
                      disabled={copyId === l.id}
                      className="text-sm px-3 py-1 rounded-md bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      title="Copy public URL"
                    >
                      {copyId === l.id ? "Copying…" : "Copy Public URL"}
                    </button>
                  )}

                  <button
                    onClick={() => copyPrivateAnchor(l)}
                    disabled={copyId === l.id}
                    className="text-sm px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200"
                    title="Copy private anchor link"
                  >
                    {copyId === l.id ? "Copying…" : "Copy Private Link"}
                  </button>

                  <button
                    onClick={() => handleDeleteList(l.id)}
                    className="text-sm px-3 py-1 rounded-md bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    Delete List
                  </button>
                </div>
              </header>

              {!l.items?.length ? (
                <div className="px-4 py-6 text-sm text-gray-500">
                  No items yet.
                </div>
              ) : summariesLoading ? (
                <div className="px-4 py-6 text-sm text-gray-500">Loading…</div>
              ) : (
                <ul className="divide-y">
                  {l.items.map((it) => {
                    const s = summaries[it.series_id];
                    const st = s?.status?.toUpperCase();
                    return (
                      <li
                        key={it.series_id}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <div className="relative">
                          {s?.cover_url ? (
                            <img
                              src={s.cover_url}
                              alt={s?.title || `Series ${it.series_id}`}
                              className="h-16 w-12 object-cover rounded-md bg-gray-100"
                              loading="lazy"
                              decoding="async"
                              width={80}
                              height={120}
                            />
                          ) : (
                            <div
                              className="h-16 w-12 rounded-md bg-gray-100 flex items-center justify-center text-[10px] text-gray-400"
                              aria-label={
                                s?.title
                                  ? `${s.title} (no cover)`
                                  : `Series ${it.series_id} (no cover)`
                              }
                            >
                              —
                            </div>
                          )}

                          {s?.rank ? (
                            <span className="absolute -top-2 -left-2 text-[10px] font-bold text-white bg-black/70 px-1.5 py-0.5 rounded-full ring-1 ring-white">
                              #{s.rank}
                            </span>
                          ) : null}

                          {st ? (
                            <div className="absolute bottom-0 right-0 z-10 pointer-events-none select-none md:hidden">
                              <div
                                className={
                                  "px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide whitespace-nowrap shadow ring-1 ring-white/70 " +
                                  statusClass(st)
                                }
                                style={{
                                  clipPath:
                                    "polygon(0 0, 100% 0, 86% 100%, 0% 100%)",
                                }}
                                title={st}
                                aria-label={`Status: ${st}`}
                              >
                                {st}
                              </div>
                            </div>
                          ) : null}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/series/${it.series_id}`}
                              className="block font-medium hover:underline truncate"
                              title={s?.title || `Series #${it.series_id}`}
                            >
                              {s?.title || `Series #${it.series_id}`}
                            </Link>

                            {st ? (
                              <span
                                className={
                                  "hidden md:inline-block leading-none px-2 py-[2px] text-[10px] font-bold uppercase tracking-wide whitespace-nowrap rounded-sm shadow ring-1 ring-white/70 " +
                                  statusClass(st)
                                }
                                style={{
                                  clipPath:
                                    "polygon(0 0, 100% 0, 90% 100%, 0% 100%)",
                                }}
                                title={st}
                                aria-label={`Status: ${st}`}
                              >
                                {st}
                              </span>
                            ) : null}
                          </div>

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

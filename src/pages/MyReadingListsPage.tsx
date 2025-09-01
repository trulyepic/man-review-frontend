import { useEffect, useState, type ChangeEvent } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { Link } from "react-router-dom";
import {
  getMyReadingListsPaged,
  getReadingListItemsPaged,
  deleteReadingList,
  removeSeriesFromReadingList,
  getSeriesSummary,
  shareReadingList,
  unshareReadingList,
  type RankedSeries,
  type ReadingList,
  type ReadingListItem,
  type ReadingListPreview,
} from "../api/manApi";
import {
  ItemRowsShimmerBlock,
  ListHeaderShimmer,
} from "../components/ReadingListShimmers";
import ShimmerBox from "../components/ShimmerBox";

const PAGE_SIZE_LISTS = 10;
const PAGE_SIZE_ITEMS = 25;

function statusClass(status?: string): string {
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
}

/** Child that loads/paginates items only when mounted (list expanded). */
function ListItems({
  listId,
  initialCount,
  onRemove,
}: {
  listId: number;
  initialCount: number;
  onRemove: (seriesId: number) => void;
}) {
  const [items, setItems] = useState<ReadingListItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialCount > 0);
  const [loading, setLoading] = useState(false);

  // summaries cache only for items we fetched
  const [summaries, setSummaries] = useState<Record<number, RankedSeries>>({});
  const [summariesLoading, setSummariesLoading] = useState(false);

  // 🔽 NEW: filter state
  const [filterType, setFilterType] = useState<
    "" | "MANHWA" | "MANGA" | "MANHUA"
  >("");
  // const [rankMin, setRankMin] = useState<string>(""); // string to allow empty
  // const [rankMax, setRankMax] = useState<string>("");
  const [minStars, setMinStars] = useState<string>(""); // e.g. 7.5
  const [minVotes, setMinVotes] = useState<string>(""); // e.g. 100

  type SortKey =
    | "DEFAULT"
    | "RANK_ASC"
    | "RANK_DESC"
    | "STARS_DESC"
    | "STARS_ASC"
    | "VOTES_DESC"
    | "VOTES_ASC"
    | "TITLE_ASC"
    | "TITLE_DESC";
  type StatusKey = "" | "ONGOING" | "COMPLETE" | "HIATUS" | "UNKNOWN";
  const [sortBy, setSortBy] = useState<SortKey>("DEFAULT");
  const [filterStatus, setFilterStatus] = useState<StatusKey>("");
  const toSortable = (it: ReadingListItem) => summaries[it.series_id];

  // load first page on mount
  useEffect(() => {
    let ignore = false;
    const run = async () => {
      if (!hasMore || loading) return;
      setLoading(true);
      try {
        const res = await getReadingListItemsPaged(listId, 1, PAGE_SIZE_ITEMS);
        if (ignore) return;
        setItems(res.items);
        setPage(res.page + 1);
        setHasMore(res.has_more);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, [listId]);

  // summaries for the currently fetched items
  useEffect(() => {
    const ids = Array.from(new Set(items.map((i) => i.series_id)));
    if (ids.length === 0) return;

    let cancelled = false;
    (async () => {
      setSummariesLoading(true);
      try {
        const results = await Promise.allSettled(
          ids.map((id) => getSeriesSummary(id))
        );
        if (cancelled) return;
        const next: Record<number, RankedSeries> = { ...summaries };
        results.forEach((r) => {
          if (r.status === "fulfilled") next[r.value.id] = r.value;
        });
        setSummaries(next);
      } finally {
        if (!cancelled) setSummariesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const loadMore = async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    try {
      const res = await getReadingListItemsPaged(listId, page, PAGE_SIZE_ITEMS);
      // de-dupe by series_id
      const existing = new Set(items.map((i) => i.series_id));
      const incoming = res.items.filter((i) => !existing.has(i.series_id));
      setItems((prev) => [...prev, ...incoming]);
      setPage(res.page + 1);
      setHasMore(res.has_more);
    } finally {
      setLoading(false);
    }
  };

  // 🔽 NEW: filter predicate
  const passesFilter = (s?: RankedSeries) => {
    // If summary not loaded yet, show it for now (it will re-evaluate once loaded)
    if (!s) return true;

    // Type
    if (filterType && s.type !== filterType) return false;

    // Status (case-insensitive)
    if (filterStatus) {
      const st = (s.status || "").toString().toUpperCase();
      if (st !== filterStatus) return false;
    }

    // Stars (final_score)
    const ms = minStars.trim() !== "" ? Number(minStars) : null;
    if (ms != null) {
      if (s.final_score == null) return false;
      if (Number(s.final_score) < ms) return false;
    }

    // Votes
    const mv = minVotes.trim() !== "" ? Number(minVotes) : null;
    if (mv != null) {
      if (s.vote_count == null) return false;
      if (s.vote_count < mv) return false;
    }

    return true;
  };

  // const visibleItems = items.filter((it) =>
  //   passesFilter(summaries[it.series_id])
  // );

  const compareNullable = <T,>(
    aVal: T | null | undefined,
    bVal: T | null | undefined,
    cmp: (a: T, b: T) => number
  ) => {
    const aN = aVal == null;
    const bN = bVal == null;
    if (aN && bN) return 0;
    if (aN) return 1; // nulls last
    if (bN) return -1;
    return cmp(aVal as T, bVal as T);
  };

  const byTitle = (a: string, b: string) =>
    a.localeCompare(b, undefined, { sensitivity: "base" });

  const sortedItems = (() => {
    // base: filtered items in current order
    const base = items.filter((it) => passesFilter(toSortable(it)));
    if (sortBy === "DEFAULT") return base;

    const withIndex = base.map((it, i) => ({ it, i }));
    withIndex.sort((A, B) => {
      const a = toSortable(A.it);
      const b = toSortable(B.it);
      switch (sortBy) {
        case "RANK_ASC":
          return (
            compareNullable(a?.rank, b?.rank, (x, y) => x - y) || A.i - B.i
          );
        case "RANK_DESC":
          return (
            compareNullable(a?.rank, b?.rank, (x, y) => y - x) || A.i - B.i
          );
        case "STARS_DESC":
          return (
            compareNullable(
              a?.final_score != null ? Number(a.final_score) : null,
              b?.final_score != null ? Number(b.final_score) : null,
              (x, y) => y - x
            ) || A.i - B.i
          );
        case "STARS_ASC":
          return (
            compareNullable(
              a?.final_score != null ? Number(a.final_score) : null,
              b?.final_score != null ? Number(b.final_score) : null,
              (x, y) => x - y
            ) || A.i - B.i
          );
        case "VOTES_DESC":
          return (
            compareNullable(a?.vote_count, b?.vote_count, (x, y) => y - x) ||
            A.i - B.i
          );
        case "VOTES_ASC":
          return (
            compareNullable(a?.vote_count, b?.vote_count, (x, y) => x - y) ||
            A.i - B.i
          );
        case "TITLE_ASC":
          return compareNullable(a?.title, b?.title, byTitle) || A.i - B.i;
        case "TITLE_DESC":
          return (
            compareNullable(a?.title, b?.title, (x, y) => byTitle(y, x)) ||
            A.i - B.i
          );
        default:
          return A.i - B.i;
      }
    });

    return withIndex.map((x) => x.it);
  })();
  const handleTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFilterType(e.target.value as "" | "MANHWA" | "MANGA" | "MANHUA");
  };

  const isFiltering =
    !!filterType ||
    !!filterStatus ||
    minStars.trim() !== "" ||
    minVotes.trim() !== "" ||
    sortBy !== "DEFAULT";

  const effectiveHasMore = hasMore && !isFiltering;

  return initialCount === 0 ? (
    <div className="px-4 py-6 text-sm text-gray-500">No items yet.</div>
  ) : (
    <>
      {/* 🔽 NEW: Filter bar */}
      <div className="px-4 pt-3 pb-2 border-b bg-white/60 backdrop-blur-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500">Type</label>
            <select
              value={filterType}
              onChange={handleTypeChange}
              className="border rounded-md px-2 py-1 text-sm"
            >
              <option value="">All</option>
              <option value="MANHWA">Manhwa</option>
              <option value="MANGA">Manga</option>
              <option value="MANHUA">Manhua</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-500">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as StatusKey)}
              className="border rounded-md px-2 py-1 text-sm"
            >
              <option value="">All</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETE">Complete</option>
              <option value="HIATUS">Hiatus</option>
              <option value="UNKNOWN">Unknown</option>
            </select>
          </div>

          {/* Sort (from previous step) */}
          <div className="flex flex-col">
            <label className="text-xs text-gray-500">Sort</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="border rounded-md px-2 py-1 text-sm"
            >
              <option value="DEFAULT">Default (list order)</option>
              <option value="RANK_ASC">Rank ↑</option>
              <option value="RANK_DESC">Rank ↓</option>
              <option value="STARS_DESC">Stars ↑ (high→low)</option>
              <option value="STARS_ASC">Stars ↓ (low→high)</option>
              <option value="VOTES_DESC">Votes ↑ (high→low)</option>
              <option value="VOTES_ASC">Votes ↓ (low→high)</option>
              <option value="TITLE_ASC">Title A–Z</option>
              <option value="TITLE_DESC">Title Z–A</option>
            </select>
          </div>

          {/* Stars ≥ and Votes ≥ */}
          <div className="flex items-end gap-2">
            <div className="flex flex-col">
              <label className="text-xs text-gray-500">Stars ≥</label>
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                value={minStars}
                onChange={(e) => setMinStars(e.target.value)}
                placeholder="e.g. 7.5"
                className="w-24 border rounded-md px-2 py-1 text-sm"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-gray-500">Votes ≥</label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={minVotes}
                onChange={(e) => setMinVotes(e.target.value)}
                placeholder="e.g. 100"
                className="w-28 border rounded-md px-2 py-1 text-sm"
              />
            </div>
          </div>

          {/* Reset */}
          <button
            onClick={() => {
              setFilterType("");
              setFilterStatus("");
              setMinStars("");
              setMinVotes("");
              setSortBy("DEFAULT");
            }}
            className="ml-auto text-xs px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200"
            title="Clear filters"
          >
            Reset
          </button>
        </div>
      </div>

      <InfiniteScroll
        key={`list-${listId}-${filterType}-${filterStatus}-${minStars}-${minVotes}-${sortBy}`}
        dataLength={sortedItems.length}
        next={loadMore}
        hasMore={effectiveHasMore}
        loader={
          loading ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-4 border-gray-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : null
        }
        endMessage={
          sortedItems.length > 0 ? (
            <p className="text-center py-3 text-gray-300">End of this list.</p>
          ) : null
        }
      >
        {items.length === 0 && (loading || summariesLoading) ? (
          <ItemRowsShimmerBlock
            count={Math.min(Math.max(initialCount, 4), 8)}
          />
        ) : sortedItems.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">
            No items match your filters.
          </div>
        ) : (
          <ul className="divide-y">
            {sortedItems.map((it) => {
              const s = summaries[it.series_id];
              const stx = s?.status?.toUpperCase();
              const isThumbLoading = summariesLoading && !s;

              return (
                <li
                  key={it.series_id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="relative">
                    {isThumbLoading ? (
                      <ShimmerBox className="h-16 w-12 rounded-md" />
                    ) : s?.cover_url ? (
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

                    {stx ? (
                      <div className="absolute bottom-0 right-0 z-10 pointer-events-none select-none md:hidden">
                        <div
                          className={
                            "px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide whitespace-nowrap shadow ring-1 ring-white/70 " +
                            statusClass(stx)
                          }
                          style={{
                            clipPath: "polygon(0 0, 100% 0, 86% 100%, 0% 100%)",
                          }}
                          title={stx}
                          aria-label={`Status: ${stx}`}
                        >
                          {stx}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {summariesLoading && !s ? (
                        <ShimmerBox className="h-4 w-40 rounded" />
                      ) : (
                        <Link
                          to={`/series/${it.series_id}`}
                          className="block font-medium hover:underline truncate"
                          title={s?.title || `Series #${it.series_id}`}
                        >
                          {s?.title || `Series #${it.series_id}`}
                        </Link>
                      )}

                      {stx ? (
                        <span
                          className={
                            "hidden md:inline-block leading-none px-2 py-[2px] text-[10px] font-bold uppercase tracking-wide whitespace-nowrap rounded-sm shadow ring-1 ring-white/70 " +
                            statusClass(stx)
                          }
                          style={{
                            clipPath: "polygon(0 0, 100% 0, 90% 100%, 0% 100%)",
                          }}
                          title={stx}
                          aria-label={`Status: ${stx}`}
                        >
                          {stx}
                        </span>
                      ) : summariesLoading && !s ? (
                        <ShimmerBox className="h-4 w-14 rounded hidden md:inline-block" />
                      ) : null}
                    </div>

                    <div className="mt-0.5 text-sm text-gray-600 flex items-center gap-3">
                      {summariesLoading && !s ? (
                        <>
                          <ShimmerBox className="h-3 w-12 rounded" />
                          <ShimmerBox className="h-3 w-16 rounded" />
                          <ShimmerBox className="h-3 w-20 rounded" />
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>

                  {summariesLoading && !s ? (
                    <ShimmerBox className="h-7 w-20 rounded-md" />
                  ) : (
                    <button
                      onClick={() => {
                        onRemove(it.series_id);
                        setItems((prev) =>
                          prev.filter((x) => x.series_id !== it.series_id)
                        );
                      }}
                      className="text-xs px-2.5 py-1 rounded-md bg-gray-200 hover:bg-gray-300"
                    >
                      Remove
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </InfiniteScroll>
    </>
  );
}

export default function MyReadingListsPage() {
  // lists pagination
  const [lists, setLists] = useState<ReadingListPreview[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // which list sections are expanded (only expanded lists mount ListItems)
  const [open, setOpen] = useState<Record<number, boolean>>({});

  const [busyId, setBusyId] = useState<number | null>(null);
  const [copyId, setCopyId] = useState<number | null>(null);

  const loadLists = async (next: number) => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getMyReadingListsPaged(next, PAGE_SIZE_LISTS);

      // Merge lists (de-dupe) just like before
      setLists((prev) => {
        const map = new Map<number, ReadingListPreview>();
        [...prev, ...res.items].forEach((l) => map.set(l.id, l));
        return Array.from(map.values()).sort((a, b) => b.id - a.id);
      });

      // ✅ NEW: expand all newly fetched lists by default
      setOpen((prev) => {
        const nextOpen: Record<number, boolean> = { ...prev };
        for (const l of res.items) {
          // only set true if the user hasn't explicitly toggled this one before
          if (prev[l.id] === undefined) nextOpen[l.id] = true;
        }
        return nextOpen;
      });

      setHasMore(res.has_more);
      setPage(res.page + 1);
    } catch (e) {
      setError((e as Error).message || "Failed to load lists");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLists(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteList = async (id: number) => {
    if (!confirm("Delete this list?")) return;
    try {
      await deleteReadingList(id);
      setLists((prev) => prev.filter((x) => x.id !== id));
      setOpen((prev) => {
        const n = { ...prev };
        delete n[id];
        return n;
      });
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleRemoveItem = async (listId: number, seriesId: number) => {
    try {
      await removeSeriesFromReadingList(listId, seriesId);
      // optimistically decrement the count shown on header
      setLists((prev) =>
        prev.map((l) =>
          l.id === listId
            ? { ...l, item_count: Math.max(0, l.item_count - 1) }
            : l
        )
      );
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const toggleShare = async (l: ReadingListPreview) => {
    try {
      setBusyId(l.id);
      const next: ReadingList = l.is_public
        ? await unshareReadingList(l.id)
        : await shareReadingList(l.id);

      setLists((prev) =>
        prev.map((x) =>
          x.id === l.id
            ? { ...x, is_public: next.is_public, share_token: next.share_token }
            : x
        )
      );
    } catch (e) {
      alert((e as Error).message || "Failed to update share state.");
    } finally {
      setBusyId(null);
    }
  };

  const copyPrivateAnchor = async (l: ReadingListPreview) => {
    try {
      setCopyId(l.id);
      const url = `${window.location.origin}/my-lists#list-${l.id}`;
      await navigator.clipboard.writeText(url);
    } finally {
      setCopyId(null);
    }
  };

  const copyPublicUrl = async (l: ReadingListPreview) => {
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

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="text-red-600 mb-3">{error}</div>
        <button
          className="px-3 py-1 rounded-md border hover:bg-gray-50"
          onClick={() => loadLists(1)}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* <h1 className="text-2xl font-bold mb-6">My Reading Lists</h1> */}

      {lists.length === 0 && loading ? (
        <div className="space-y-6">
          <ListHeaderShimmer />
          <ListHeaderShimmer />
        </div>
      ) : (
        <InfiniteScroll
          dataLength={lists.length}
          next={() => loadLists(page)}
          hasMore={hasMore}
          loader={
            lists.length > 0 ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : null
          }
          endMessage={
            lists.length > 0 ? (
              <p className="text-center py-6 text-gray-400">
                You’ve reached the end of your lists.
              </p>
            ) : null
          }
        >
          {lists.length === 0 && !loading ? (
            <div className="text-gray-600">
              No lists yet. Use “+ Create Reading List” on the homepage.
            </div>
          ) : (
            <div className="space-y-6">
              {lists.map((l) => {
                const isOpen = !!open[l.id];
                return (
                  <section
                    key={l.id}
                    id={`list-${l.id}`}
                    className="rounded-xl border border-gray-200 bg-white/70 backdrop-blur-sm shadow-sm"
                  >
                    <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          className="text-left"
                          onClick={() =>
                            setOpen((prev) => ({
                              ...prev,
                              [l.id]: !prev[l.id],
                            }))
                          }
                          title={isOpen ? "Collapse" : "Expand"}
                        >
                          <h2 className="text-lg font-semibold truncate">
                            {isOpen ? "▾ " : "▸ "} {l.name}
                          </h2>
                        </button>
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
                        <span className="text-xs text-gray-500">
                          ({l.item_count})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleShare(l)}
                          disabled={busyId === l.id}
                          className="text-sm px-3 py-1 rounded-md border hover:bg-gray-50"
                          title={
                            l.is_public ? "Make private" : "Share publicly"
                          }
                        >
                          {busyId === l.id
                            ? "…"
                            : l.is_public
                            ? "Unshare"
                            : "Share"}
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

                    {isOpen ? (
                      <ListItems
                        listId={l.id}
                        initialCount={l.item_count}
                        onRemove={(seriesId) =>
                          handleRemoveItem(l.id, seriesId)
                        }
                      />
                    ) : null}
                  </section>
                );
              })}
            </div>
          )}
        </InfiniteScroll>
      )}
    </div>
  );
}

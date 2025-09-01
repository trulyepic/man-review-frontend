import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import InfiniteScroll from "react-infinite-scroll-component";
import {
  getPublicReadingList,
  getSeriesSummary,
  type PublicReadingList,
  type RankedSeries,
} from "../api/manApi";
import { ItemRowsShimmerBlock } from "../components/ReadingListShimmers";
import ShimmerBox from "../components/ShimmerBox";

const PAGE_SIZE_ITEMS = 25;

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

function statusClass(status?: string) {
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
const byTitle = (a?: string, b?: string) =>
  compareNullable(a, b, (x, y) =>
    x.localeCompare(y, undefined, { sensitivity: "base" })
  );

export default function PublicReadingListPage() {
  const { token } = useParams<{ token: string }>();

  const [list, setList] = useState<PublicReadingList | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // seriesId -> RankedSeries
  const [summaries, setSummaries] = useState<Record<number, RankedSeries>>({});
  const [summariesLoading, setSummariesLoading] = useState(false);

  // pagination + sort (client-side)
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortKey>("DEFAULT");

  // ---- load the public list by token ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingList(true);
      setError(null);
      setSummaries({});
      setPage(1);
      try {
        if (!token) throw new Error("Missing list token.");
        const data = await getPublicReadingList(token);
        if (!cancelled) setList(data);
      } catch (e: unknown) {
        const msg =
          (e as { message?: string })?.message ||
          "This list is private, missing, or temporarily unavailable.";
        if (!cancelled) {
          setError(msg);
          setList(null);
        }
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // ---- sorted ids (across the whole list) ----
  const sortedItems = useMemo(() => {
    if (!list) return [];
    const base = list.items.slice(); // clone
    if (sortBy === "DEFAULT") return base;

    const withIndex = base.map((it, i) => ({ it, i }));
    withIndex.sort((A, B) => {
      const a = summaries[A.it.series_id];
      const b = summaries[B.it.series_id];
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
          return byTitle(a?.title, b?.title) || A.i - B.i;
        case "TITLE_DESC":
          return byTitle(b?.title, a?.title) || A.i - B.i;
        default:
          return A.i - B.i;
      }
    });
    return withIndex.map((x) => x.it);
  }, [list, sortBy, summaries]);

  const totalCount = list?.items.length ?? 0;
  const visibleItems = useMemo(
    () => sortedItems.slice(0, page * PAGE_SIZE_ITEMS),
    [sortedItems, page]
  );
  const hasMore = visibleItems.length < (list?.items.length ?? 0);

  // ---- fetch summaries for just the currently visible page slice ----
  useEffect(() => {
    if (!list || visibleItems.length === 0) return;

    const missingIds = visibleItems
      .map((i) => i.series_id)
      .filter((id) => !summaries[id]);

    if (missingIds.length === 0) return;

    let cancelled = false;
    (async () => {
      setSummariesLoading(true);
      try {
        const results = await Promise.allSettled(
          missingIds.map((id) => getSeriesSummary(id))
        );
        if (cancelled) return;
        const next = { ...summaries };
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
  }, [list, page, sortedItems]);

  const loadMore = () => {
    if (hasMore) setPage((p) => p + 1);
  };

  const pageTitle = list
    ? `${list.name} — Shared Reading List`
    : "Shared Reading List";

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as SortKey);
    // keep current page but the memoized sortedItems will change; visibleItems recalcs
    // Optionally reset to page 1 if you prefer:
    // setPage(1);
  };

  if (loadingList) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Helmet>
          <title>{pageTitle}</title>
        </Helmet>
        <ItemRowsShimmerBlock count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Helmet>
          <title>{pageTitle}</title>
        </Helmet>
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-800">
          {error}
        </div>
      </div>
    );
  }

  if (!list) return null;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={`Shared list: ${list.name}`} />
      </Helmet>

      <header className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-2xl font-bold truncate">{list.name}</h1>
          <span
            className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700"
            title="This list is public"
          >
            Public
          </span>
          <span className="text-xs text-gray-500">({totalCount})</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort only (no other filters here) */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Sort</label>
            <select
              value={sortBy}
              onChange={handleSortChange}
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

          <button
            onClick={async () => {
              await navigator.clipboard.writeText(window.location.href);
              alert("Link copied!");
            }}
            className="text-sm px-3 py-1 rounded-md border hover:bg-gray-50"
          >
            Copy Link
          </button>
        </div>
      </header>

      {list.items.length === 0 ? (
        <div className="text-gray-600">This list is empty.</div>
      ) : summariesLoading && Object.keys(summaries).length === 0 ? (
        <ItemRowsShimmerBlock count={Math.min(list.items.length, 8)} />
      ) : (
        <InfiniteScroll
          dataLength={visibleItems.length}
          next={loadMore}
          hasMore={hasMore}
          loader={
            // Only show the spinner while *actually* loading the next page or summaries for it
            summariesLoading ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-4 border-gray-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : null
          }
          endMessage={
            visibleItems.length > 0 ? (
              <p className="text-center py-3 text-gray-300">
                End of this list.
              </p>
            ) : null
          }
        >
          {visibleItems.length === 0 && summariesLoading ? (
            <ItemRowsShimmerBlock count={6} />
          ) : (
            <ul className="divide-y rounded-xl border border-gray-200 bg-white/70 backdrop-blur-sm shadow-sm">
              {visibleItems.map((it) => {
                const s = summaries[it.series_id];
                const st = s?.status?.toUpperCase();
                const isLoading = summariesLoading && !s;

                return (
                  <li
                    key={it.series_id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    {/* cover + rank badge + MOBILE status ribbon */}
                    <div className="relative">
                      {isLoading ? (
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

                    {/* title + meta */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {isLoading ? (
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
                        ) : isLoading ? (
                          <ShimmerBox className="h-4 w-14 rounded hidden md:inline-block" />
                        ) : null}
                      </div>

                      <div className="mt-0.5 text-sm text-gray-600 flex items-center gap-3">
                        {isLoading ? (
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
                  </li>
                );
              })}
            </ul>
          )}
        </InfiniteScroll>
      )}
    </div>
  );
}

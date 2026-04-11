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
import { getDisplayVoteCount } from "../util/displayVoteCounts";

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
    case "SEASON_END":
      return "bg-purple-600 text-white";
    default:
      return "bg-gray-400 text-white";
  }
}

function statChipClass(tone: "neutral" | "accent" | "muted" = "neutral") {
  if (tone === "accent") {
    return "inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-100";
  }
  if (tone === "muted") {
    return "inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 ring-1 ring-inset ring-slate-200";
  }
  return "inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200";
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
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Helmet>
          <title>{pageTitle}</title>
        </Helmet>
        <ItemRowsShimmerBlock count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={`Shared list: ${list.name}`} />
      </Helmet>

      <header className="mb-8 flex flex-wrap items-start justify-between gap-5 overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_30%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.95))] px-6 py-7 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.45)] sm:px-8">
        <div className="min-w-0 max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            Shared reading list
          </p>
          <h1 className="mt-3 truncate text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {list.name}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 ring-1 ring-inset ring-emerald-100"
            title="This list is public"
          >
            Public
          </span>
          <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
            {totalCount} {totalCount === 1 ? "title" : "titles"}
          </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            Browse this shared collection with the same ranking and score context
            as the detail pages.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-[180px] flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Sort
            </label>
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
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
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Copy Link
          </button>
        </div>
      </header>

      {list.items.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/80 px-6 py-12 text-center text-slate-600 shadow-sm">
          This list is empty.
        </div>
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
            <ul className="divide-y divide-slate-200/80 overflow-hidden rounded-[28px] border border-slate-200 bg-white/90 shadow-[0_22px_55px_-40px_rgba(15,23,42,0.45)] backdrop-blur-sm">
              {visibleItems.map((it) => {
                const s = summaries[it.series_id];
                const st = s?.status?.toUpperCase();
                const isLoading = summariesLoading && !s;
                const displayVoteCount = getDisplayVoteCount(
                  s?.vote_count,
                  it.series_id
                );

                return (
                  <li key={it.series_id} className="px-4 py-4 sm:px-5">
                    <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.55)] transition hover:border-slate-300/80 hover:shadow-[0_18px_40px_-28px_rgba(15,23,42,0.65)]">
                    <div className="relative shrink-0">
                      {isLoading ? (
                        <ShimmerBox className="h-24 w-16 rounded-2xl" />
                      ) : s?.cover_url ? (
                        <img
                          src={s.cover_url}
                          alt={s?.title || `Series ${it.series_id}`}
                          className="h-24 w-16 rounded-2xl bg-slate-100 object-cover shadow-sm"
                          loading="lazy"
                          decoding="async"
                          width={80}
                          height={120}
                        />
                      ) : (
                        <div
                          className="flex h-24 w-16 items-center justify-center rounded-2xl bg-slate-100 text-[10px] text-slate-400"
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
                        <span className="absolute -left-2 -top-2 rounded-full bg-slate-900/80 px-2 py-1 text-[10px] font-bold text-white ring-2 ring-white">
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
                      <div className="flex flex-wrap items-start gap-2">
                        {isLoading ? (
                          <ShimmerBox className="h-4 w-40 rounded" />
                        ) : (
                          <Link
                            to={`/series/${it.series_id}`}
                            className="block truncate text-base font-semibold text-slate-900 transition hover:text-slate-700 hover:underline"
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

                      <div className="mt-3 flex flex-wrap items-center gap-2.5 text-sm text-slate-600">
                        {isLoading ? (
                          <>
                            <ShimmerBox className="h-7 w-20 rounded-full" />
                            <ShimmerBox className="h-7 w-20 rounded-full" />
                            <ShimmerBox className="h-7 w-24 rounded-full" />
                          </>
                        ) : (
                          <>
                            <span className={statChipClass("muted")}>
                              {s?.type || "—"}
                            </span>
                            <span
                              className={`${statChipClass("accent")} ${
                                (s?.final_score ?? 0) >= 9
                                  ? "text-emerald-700 bg-emerald-50 ring-emerald-100"
                                  : (s?.final_score ?? 0) >= 7.5
                                  ? "text-blue-700 bg-blue-50 ring-blue-100"
                                  : (s?.final_score ?? 0) >= 5
                                  ? "text-amber-700 bg-amber-50 ring-amber-100"
                                  : "text-slate-500 bg-slate-100 ring-slate-200"
                              }`}
                            >
                              {s?.final_score != null
                                ? `★ ${Number(s.final_score).toFixed(3)}`
                                : "★ —"}
                            </span>
                            <span className={statChipClass()}>
                              {displayVoteCount
                                ? `${displayVoteCount} votes`
                                : "No votes"}
                            </span>
                          </>
                        )}
                      </div>
                      {it.left_off_chapter ? (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/90 px-3 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Reading progress
                          </p>
                          <p className="mt-2 text-sm font-medium text-slate-700">
                            Left off at Ch. {it.left_off_chapter}
                          </p>
                        </div>
                      ) : null}
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

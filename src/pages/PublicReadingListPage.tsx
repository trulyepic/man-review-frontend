import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import {
  getPublicReadingList,
  getSeriesSummary,
  type PublicReadingList,
  type RankedSeries,
} from "../api/manApi";

export default function PublicReadingListPage() {
  const { token } = useParams<{ token: string }>();

  const [list, setList] = useState<PublicReadingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // seriesId -> RankedSeries (for rank, status, score, etc.)
  const [summaries, setSummaries] = useState<Record<number, RankedSeries>>({});
  const [summariesLoading, setSummariesLoading] = useState(false);

  // ---- load the public list by token ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
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
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // ---- fetch per-series summaries (rank/status/score) just like private page ----
  useEffect(() => {
    if (!list || list.items.length === 0) {
      setSummaries({});
      return;
    }
    const ids = Array.from(new Set(list.items.map((i) => i.series_id)));
    let cancelled = false;

    (async () => {
      setSummariesLoading(true);
      try {
        const results = await Promise.allSettled(
          ids.map((id) => getSeriesSummary(id))
        );
        if (cancelled) return;
        const map: Record<number, RankedSeries> = {};
        results.forEach((r) => {
          if (r.status === "fulfilled") map[r.value.id] = r.value;
        });
        setSummaries(map);
      } finally {
        if (!cancelled) setSummariesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [list]);

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

  const pageTitle = list
    ? `${list.name} — Shared Reading List`
    : "Shared Reading List";

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Helmet>
          <title>{pageTitle}</title>
        </Helmet>
        Loading…
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

      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-2xl font-bold truncate">{list.name}</h1>
          <span
            className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700"
            title="This list is public"
          >
            Public
          </span>
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
      </header>

      {list.items.length === 0 ? (
        <div className="text-gray-600">This list is empty.</div>
      ) : summariesLoading ? (
        <div className="text-gray-600">Loading…</div>
      ) : (
        <ul className="divide-y rounded-xl border border-gray-200 bg-white/70 backdrop-blur-sm shadow-sm">
          {list.items.map((it) => {
            const s = summaries[it.series_id];
            const st = s?.status?.toUpperCase();
            return (
              <li
                key={it.series_id}
                className="flex items-center gap-3 px-4 py-3"
              >
                {/* cover + rank badge + MOBILE status ribbon */}
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

                  {/* Mobile status ribbon */}
                  {st ? (
                    <div className="absolute bottom-0 right-0 z-10 pointer-events-none select-none md:hidden">
                      <div
                        className={
                          "px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide whitespace-nowrap shadow ring-1 ring-white/70 " +
                          statusClass(st)
                        }
                        style={{
                          clipPath: "polygon(0 0, 100% 0, 86% 100%, 0% 100%)",
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
                    <Link
                      to={`/series/${it.series_id}`}
                      className="block font-medium hover:underline truncate"
                      title={s?.title || `Series #${it.series_id}`}
                    >
                      {s?.title || `Series #${it.series_id}`}
                    </Link>

                    {/* Desktop inline status tag */}
                    {st ? (
                      <span
                        className={
                          "hidden md:inline-block leading-none px-2 py-[2px] text-[10px] font-bold uppercase tracking-wide whitespace-nowrap rounded-sm shadow ring-1 ring-white/70 " +
                          statusClass(st)
                        }
                        style={{
                          clipPath: "polygon(0 0, 100% 0, 90% 100%, 0% 100%)",
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
                      {s?.vote_count ? `${s.vote_count} votes` : "No votes"}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

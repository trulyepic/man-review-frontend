import { useEffect, useRef, useState } from "react";
import {
  createForumThread,
  type ForumThread,
  type ForumSeriesRef,
  forumSeriesSearch,
  deleteForumThread,
  getForumThread,
  updateForumThread,
  listForumThreadsPaged,
} from "../api/manApi";
import { Link, useSearchParams } from "react-router-dom";
import { useUser } from "../login/useUser";
import { Helmet } from "react-helmet";
import { stripMdHeading } from "../util/strings";
import { ConfirmModal } from "../components/ConfirmModal";
import { useNotice } from "../hooks/useNotice";
import { NoticeModal } from "../components/NoticeModal";

const MAX_THREADS_PER_USER = 10;
const MAX_SERIES_REFS = 10;
const PATCH_NOTES_TITLE = "Patch Notes & Site Updates";
const normalize = (s: string) => (s || "").trim().toLowerCase();

function promotePatchNotes(list: ForumThread[]) {
  const i = list.findIndex(
    (t) => normalize(t.title) === normalize(PATCH_NOTES_TITLE)
  );
  if (i > 0) {
    const [pinned] = list.splice(i, 1);
    list.unshift(pinned);
  }
  return list;
}

function SeriesRefPill({ s }: { s: ForumThread["series_refs"][number] }) {
  return (
    <Link
      to={`/series/${s.series_id}`}
      className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-white/60 backdrop-blur-sm border border-white/70 hover:bg-white/80"
      title={s.title || `#${s.series_id}`}
    >
      {s.cover_url ? (
        <img
          src={s.cover_url}
          alt={s.title || `Series #${s.series_id}`}
          className="w-6 h-8 object-cover rounded"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="w-6 h-8 bg-gray-200 rounded" />
      )}
      <span className="max-w-[10rem] truncate">
        {s.title || `#${s.series_id}`}
      </span>
    </Link>
  );
}

function Pager({
  page,
  totalPages,
  hasPrev,
  hasNext,
  onGo,
}: {
  page: number;
  totalPages: number;
  hasPrev?: boolean;
  hasNext?: boolean;
  onGo: (p: number) => void;
}) {
  const nums: number[] = [];
  const add = (n: number) => {
    if (n >= 1 && n <= totalPages) nums.push(n);
  };
  add(1);
  add(2);
  for (let n = page - 2; n <= page + 2; n++) add(n);
  add(totalPages - 1);
  add(totalPages);
  const unique = Array.from(new Set(nums)).sort((a, b) => a - b);

  return (
    <nav
      className="flex flex-wrap items-center gap-2 text-sm"
      aria-label="Pagination"
    >
      <button
        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => onGo(page - 1)}
        disabled={hasPrev === undefined ? page <= 1 : !hasPrev}
        // disabled={page <= 1}
      >
        Prev
      </button>
      {unique.map((n, i) => {
        const prev = unique[i - 1];
        const gap = prev != null && n - prev > 1;
        return (
          <span key={n} className="flex items-center">
            {gap && <span className="px-1">…</span>}
            <button
              className={`rounded-full border px-3 py-1.5 transition ${
                n === page
                  ? "border-slate-900 bg-slate-900 font-semibold text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
              onClick={() => onGo(n)}
              aria-current={n === page ? "page" : undefined}
            >
              {n}
            </button>
          </span>
        );
      })}
      <button
        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => onGo(page + 1)}
        // disabled={page >= totalPages}
        disabled={hasNext === undefined ? page >= totalPages : !hasNext}
      >
        Next
      </button>
    </nav>
  );
}

export default function ForumPage() {
  const [q, setQ] = useState("");
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [editingThread, setEditingThread] = useState<ForumThread | null>(null);
  const [editingBody, setEditingBody] = useState<string>("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [myThreadCount, setMyThreadCount] = useState(0);
  const [confirmThread, setConfirmThread] = useState<ForumThread | null>(null);
  const { user } = useUser();
  const notice = useNotice();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(15); // tweak if you like
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPrev, setHasPrev] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const myName = user?.username || "";
  const isAdmin = (user?.role || "").toUpperCase() === "ADMIN";

  const siteUrl = "https://toonranks.com";
  const isSearching = !!q.trim();
  const canonical = `${siteUrl}/forum`;
  const queryLabel = q.trim();
  const pageTitleSafe = isSearching
    ? `Forum search "${queryLabel}" - Toon Ranks`
    : "Forum - Toon Ranks";
  const pageDescription = isSearching
    ? `Search results for "${queryLabel}" in the Toon Ranks forum.`
    : "Community forum on Toon Ranks.";
  const resultsLabel = isSearching ? `results for "${queryLabel}"` : "threads";

  // keep URL as the source of truth for the current page
  useEffect(() => {
    const p = parseInt(searchParams.get("page") || "1", 10);
    setPage(Number.isFinite(p) && p > 0 ? p : 1);
  }, [searchParams]);

  // const load = async () => {
  //   const data = await listForumThreads(q);
  //   setThreads(promotePatchNotes(data.slice()));

  //   if (user) {
  //     const all = await listForumThreads("", 1, 1000);
  //     setMyThreadCount(all.filter((t) => t.author_username === myName).length);
  //   } else {
  //     setMyThreadCount(0);
  //   }
  // };

  const load = async () => {
    const r = await listForumThreadsPaged(q, page, pageSize);
    // Only promote pinned/patch notes on page 1 to avoid duplicates
    const items =
      page === 1 ? promotePatchNotes(r.items.slice()) : r.items.slice();

    setThreads(items);
    setTotal(r.total);
    setTotalPages(r.total_pages);
    setHasPrev(r.has_prev);
    setHasNext(r.has_next);

    // Optional: get "my threads" count fast without fetching 1000 rows
    if (user?.id) {
      try {
        const mine = await listForumThreadsPaged("", 1, 1, {
          author_id: user.id,
        });
        setMyThreadCount(mine.total ?? 0); // stays a number
      } catch {
        setMyThreadCount(0);
      }
    } else {
      setMyThreadCount(0);
    }
  };

  // useEffect(() => {
  //   load();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [q, user?.username]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, page, user?.id]);

  const onClickNewThread = () => {
    if (!user) {
      notice.show({
        title: "Sign in required",
        message: "You need to be logged in to create a thread.",
        variant: "warning",
      });
      return;
    }
    if (myThreadCount >= MAX_THREADS_PER_USER) {
      notice.show({
        title: "Thread limit reached",
        message: `You've reached the limit of ${MAX_THREADS_PER_USER} threads. Delete one of your existing threads to create a new one.`,
        variant: "warning",
      });
      return;
    }
    setShowNew(true);
  };

  const onDeleteThread = async (t: ForumThread) => {
    const isOwner = t.author_username === myName;
    if (!(isAdmin || isOwner) || deletingId) return;
    setConfirmThread(t);
  };

  const goToPage = (p: number) => {
    const next = Math.max(1, Math.min(totalPages, p));
    const qp: Record<string, string> = {};
    if (q.trim()) qp.q = q.trim();
    qp.page = String(next);
    setSearchParams(qp);
    // `useEffect` above will react to this and call load()
  };

  return (
    <div className="relative mx-auto max-w-5xl bg-[radial-gradient(900px_260px_at_50%_-100px,rgba(99,102,241,0.10),transparent)] px-3 py-6 sm:px-6 sm:py-8">
      <Helmet>
        <title>{pageTitleSafe}</title>
        <link rel="canonical" href={canonical} />
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitleSafe} />
        <meta property="og:description" content="Join community discussions." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <meta
          property="og:image"
          content="https://toonranks.com/android-chrome-512x512.png"
        />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="mb-4 rounded-[2rem] border border-slate-200/80 bg-white/80 px-4 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:mb-6 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
              Community
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Forum
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                Follow updates, start discussions, and keep series talk in one
                place.
              </p>
            </div>
          </div>
        <button
          onClick={onClickNewThread}
          className="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
        >
          New Thread
        </button>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-[1.75rem] border border-slate-200/80 bg-white/80 px-4 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-sm sm:px-6">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          Showing <strong>{threads.length}</strong> of <strong>{total}</strong>
          <span>{resultsLabel}</span>
          {totalPages > 1 && (
            <>
              {" "}
              - page {page} of {totalPages}
            </>
          )}
          {/* summary badge */}
          {user && myThreadCount > 0 && (
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              Your threads <strong>{myThreadCount}</strong>
            </span>
          )}
        </div>
        {totalPages > 1 && (
          // <Pager page={page} totalPages={totalPages} onGo={goToPage} />
          <div className="overflow-x-auto pb-1">
            <Pager
              page={page}
              totalPages={totalPages}
              hasPrev={hasPrev}
              hasNext={hasNext}
              onGo={goToPage}
            />
          </div>
        )}

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search threads..."
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
        />
      </div>


      <ul className="space-y-3">
        {threads.map((t) => {
          const isOwner = t.author_username === myName;
          const canDelete = isAdmin || isOwner;
          const isPatchNotes =
            normalize(t.title) === normalize(PATCH_NOTES_TITLE);

          return (
            <li
              key={t.id}
              className="rounded-2xl border border-white/70 bg-white/40 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur-md transition hover:bg-white/60 hover:shadow-md"
            >
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <Link
                    to={`/forum/${t.id}`}
                    className="text-base font-semibold leading-6 hover:underline sm:text-lg"
                  >
                    {stripMdHeading(t.title)}
                  </Link>

                  {canDelete && (
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        title="Edit thread"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingThread(t);
                          setEditingBody("");
                          (async () => {
                            try {
                              const data = await getForumThread(t.id);
                              setEditingBody(
                                data.posts?.[0]?.content_markdown ?? ""
                              );
                            } catch {
                              // silent; keep empty body if fetch fails
                            }
                          })();
                        }}
                        className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                      >
                        Edit
                      </button>

                      {!t.locked && (
                        <button
                          type="button"
                          title="Delete thread"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDeleteThread(t);
                          }}
                          disabled={deletingId === t.id}
                          className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            deletingId === t.id
                              ? "cursor-not-allowed border-slate-200 text-slate-400"
                              : "border-slate-200 text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                          }`}
                        >
                          {deletingId === t.id ? "Deleting..." : "Delete"}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-xs text-gray-500">
                    {t.post_count} posts - updated{" "}
                    {new Date(t.updated_at).toLocaleString()}
                    {t.author_username ? ` - by ${t.author_username}` : null}
                  </div>

                  {isPatchNotes && (
                    <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-700">
                      Pinned
                    </span>
                  )}

                  {t.locked && (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-800">
                      Locked
                    </span>
                  )}
                </div>

                {t.series_refs?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {t.series_refs.map((s) => (
                      <SeriesRefPill key={s.series_id} s={s} />
                    ))}
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {/* BOTTOM controls (pager) */}
      {totalPages > 1 && (
        <div className="mt-4">
          <Pager page={page} totalPages={totalPages} onGo={goToPage} />
        </div>
      )}

      {/* CREATE */}
      {showNew && (
        <NewThreadModal
          mode="create"
          onClose={() => setShowNew(false)}
          onCreated={(thread) => {
            setShowNew(false);
            setThreads((prev) => [thread, ...prev]);
            setMyThreadCount((c) => c + 1);
            notice.show({
              title: "Thread created",
              message: "Your thread is live.",
              variant: "success",
            });
          }}
          myThreadCount={myThreadCount}
          maxThreads={MAX_THREADS_PER_USER}
        />
      )}

      {/* EDIT */}
      {editingThread && (
        <NewThreadModal
          mode="edit"
          threadId={editingThread.id}
          initialTitle={editingThread.title}
          initialMd={editingBody}
          onClose={() => setEditingThread(null)}
          onSaved={async () => {
            await load();
            setEditingThread(null);
            notice.show({
              title: "Thread updated",
              message: "Changes have been saved.",
              variant: "success",
            });
          }}
          myThreadCount={myThreadCount}
          maxThreads={MAX_THREADS_PER_USER}
        />
      )}

      {confirmThread && (
        <ConfirmModal
          open={!!confirmThread}
          title="Delete thread?"
          message={
            <div>
              <div className="mb-2">
                This will remove the original post and all replies.
              </div>
              <div className="rounded bg-gray-50 p-2 text-sm">
                "{stripMdHeading(confirmThread.title)}"
              </div>
            </div>
          }
          confirmText="Delete"
          cancelText="Cancel"
          destructive
          busy={deletingId === confirmThread.id}
          onCancel={() => setConfirmThread(null)}
          onConfirm={async () => {
            if (!confirmThread) return;
            try {
              setDeletingId(confirmThread.id);
              await deleteForumThread(confirmThread.id);
              setThreads((prev) =>
                prev.filter((x) => x.id !== confirmThread.id)
              );
              if (confirmThread.author_username === myName) {
                setMyThreadCount((c) => Math.max(0, c - 1));
              }
              setConfirmThread(null);
              notice.show({
                title: "Thread deleted",
                message: "The thread and all replies were removed.",
                variant: "success",
              });
            } catch (err: unknown) {
              const e = err as {
                response?: { data?: { detail?: string } };
                message?: string;
              };
              const msg =
                e?.response?.data?.detail ||
                e?.message ||
                "Failed to delete thread.";
              notice.show({
                title: "Delete failed",
                message: msg,
                variant: "error",
              });
            } finally {
              setDeletingId(null);
            }
          }}
        />
      )}

      <NoticeModal
        open={notice.open}
        title={notice.title}
        message={notice.message}
        variant={notice.variant}
        onClose={notice.hide}
      />
    </div>
  );
}

/**
 * NewThreadModal now supports mode: "create" | "edit"
 */
function NewThreadModal({
  onClose,
  onCreated,
  onSaved,
  myThreadCount,
  maxThreads,
  mode = "create",
  initialTitle = "",
  initialMd = "",
  threadId,
}: {
  onClose: () => void;
  onCreated?: (t: ForumThread) => void;
  onSaved?: () => void;
  myThreadCount: number;
  maxThreads: number;
  mode?: "create" | "edit";
  initialTitle?: string;
  initialMd?: string;
  threadId?: number;
}) {
  const { user } = useUser();
  const notice = useNotice();

  const [title, setTitle] = useState(initialTitle);
  const [md, setMd] = useState(initialMd);

  // existing series picker state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ForumSeriesRef[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const remaining = Math.max(0, maxThreads - myThreadCount);

  // --- @mention support (body) ---
  const mdRef = useRef<HTMLTextAreaElement | null>(null);
  const mdMenuRef = useRef<HTMLDivElement | null>(null);
  const [mdMenuOpen, setMdMenuOpen] = useState(false);
  const [mdResults, setMdResults] = useState<ForumSeriesRef[]>([]);
  const [mdHighlight, setMdHighlight] = useState(0);
  const [mdMentionStart, setMdMentionStart] = useState<number | null>(null);
  const [mdMentionCount, setMdMentionCount] = useState(0);
  const [mdCapShown, setMdCapShown] = useState(false);

  const MAX_MENTIONS = MAX_SERIES_REFS;

  const extractIds = (text: string) =>
    Array.from(text.matchAll(/\(series:(\d+)\)/g)).map((m) => Number(m[1]));

  function detectAtToken(nextValue: string, caret: number) {
    if (caret < 0 || caret > nextValue.length) return null;
    const before = nextValue.slice(0, caret);
    const lastBoundary = Math.max(
      before.lastIndexOf(" "),
      before.lastIndexOf("\n"),
      before.lastIndexOf("\t"),
      before.lastIndexOf("("),
      before.lastIndexOf("[")
    );
    const tokenStart = lastBoundary + 1;
    const token = nextValue.slice(tokenStart, caret);
    if (!token.startsWith("@")) return null;
    const after = nextValue.slice(caret);
    const m = after.match(/^[^\s.,!?)]*/);
    const tokenEnd = caret + (m ? m[0].length : 0);
    const wholeToken = nextValue.slice(tokenStart, tokenEnd);
    const query = wholeToken.slice(1);
    return { tokenStart, tokenEnd, query };
  }

  async function runMdMentionSearch(q: string) {
    try {
      const r = await forumSeriesSearch(q);
      setMdResults(r);
      setMdHighlight(0);
      setMdMenuOpen(r.length > 0);
    } catch {
      setMdResults([]);
      setMdMenuOpen(false);
    }
  }

  function insertMdMention(
    chosen: ForumSeriesRef,
    tokenStart: number,
    tokenEnd: number
  ) {
    const uniqueIds = Array.from(new Set(extractIds(md)));
    if (
      !uniqueIds.includes(chosen.series_id) &&
      uniqueIds.length >= MAX_MENTIONS
    ) {
      notice.show({
        title: "Limit reached",
        message: `You can mention up to ${MAX_MENTIONS} series.`,
        variant: "warning",
      });
      setMdMenuOpen(false);
      return;
    }

    const before = md.slice(0, tokenStart);
    const after = md.slice(tokenEnd);
    const inserted = `[${chosen.title || `#${chosen.series_id}`}](series:${
      chosen.series_id
    })`;
    const next = `${before}${inserted}${after}`;
    setMd(next);

    setMdMenuOpen(false);
    setMdResults([]);
    setMdMentionStart(null);

    queueMicrotask(() => {
      mdRef.current?.focus();
      const newPos = before.length + inserted.length;
      mdRef.current?.setSelectionRange(newPos, newPos);
    });
  }

  const onMdChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    setMd(next);

    const caret = e.target.selectionStart ?? next.length;
    const hit = detectAtToken(next, caret);

    const currentCount = new Set(extractIds(next)).size;
    setMdMentionCount(currentCount);

    if (currentCount >= MAX_MENTIONS && !mdCapShown) {
      setMdCapShown(true);
      notice.show({
        title: "Mentions cap",
        message: `You've reached the limit of ${MAX_MENTIONS} series mentions in the post body.`,
        variant: "warning",
      });
    }
    if (currentCount < MAX_MENTIONS && mdCapShown) {
      setMdCapShown(false);
    }

    if (hit && hit.query.length >= 1 && currentCount < MAX_MENTIONS) {
      setMdMentionStart(hit.tokenStart);
      runMdMentionSearch(hit.query);
    } else {
      setMdMentionStart(null);
      setMdMenuOpen(false);
      setMdResults([]);
    }
  };

  const onMdKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!mdMenuOpen || mdResults.length === 0 || mdMentionStart === null)
      return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMdHighlight((h) => (h + 1) % mdResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setMdHighlight((h) => (h - 1 + mdResults.length) % mdResults.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const caret = mdRef.current?.selectionStart ?? md.length;
      const hit = detectAtToken(md, caret);
      const start = hit ? hit.tokenStart : mdMentionStart;
      const end = hit ? hit.tokenEnd : caret;
      insertMdMention(mdResults[mdHighlight], start, end);
    } else if (e.key === "Escape") {
      setMdMenuOpen(false);
      setMdResults([]);
      setMdMentionStart(null);
    }
  };

  useEffect(() => {
    const onDocClick = (ev: MouseEvent) => {
      const t = ev.target as Node;
      const clickedTextarea =
        mdRef.current === t || !!mdRef.current?.contains(t);
      const clickedMenu = !!mdMenuRef.current?.contains(t);
      if (!clickedTextarea && !clickedMenu) setMdMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // separate "Reference series" search
  useEffect(() => {
    let active = true;
    (async () => {
      if (!query) {
        setResults([]);
        return;
      }
      try {
        const r = await forumSeriesSearch(query);
        if (active) setResults(r);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      active = false;
    };
  }, [query]);

  const togglePick = (id: number) => {
    setPicked((p) => {
      if (p.includes(id)) return p.filter((x) => x !== id);
      if (p.length >= MAX_SERIES_REFS) {
        notice.show({
          title: "Limit reached",
          message: `You can reference up to ${MAX_SERIES_REFS} series only.`,
          variant: "warning",
        });
        return p;
      }
      return [...p, id];
    });
  };

  const create = async () => {
    if (!user) {
      notice.show({
        title: "Sign in required",
        message: "You need to be logged in to create a thread.",
        variant: "warning",
      });
      return;
    }
    if (myThreadCount >= maxThreads) {
      notice.show({
        title: "Thread limit reached",
        message: `You've reached the limit of ${maxThreads} threads. Delete one of your existing threads to create a new one.`,
        variant: "warning",
      });
      return;
    }
    if (!title.trim() || !md.trim()) {
      notice.show({
        title: "Missing info",
        message: "Title and content are required.",
        variant: "warning",
      });
      return;
    }

    const idsFromMentions = extractIds(md);
    const merged = Array.from(new Set([...picked, ...idsFromMentions]));
    const series_ids =
      merged.length > MAX_SERIES_REFS
        ? merged.slice(0, MAX_SERIES_REFS)
        : merged;

    const cleanTitle = stripMdHeading(title);
    try {
      const t = await createForumThread({
        title: cleanTitle,
        first_post_markdown: md,
        series_ids,
      });
      onCreated?.(t);
    } catch (e: unknown) {
      let msg = "Failed to create thread.";
      if (typeof e === "string") msg = e;
      else if (e instanceof Error) msg = e.message;
      else if (typeof e === "object" && e !== null) {
        const maybe = e as {
          message?: string;
          response?: { data?: { detail?: string | { message?: string } } };
        };
        msg =
          maybe.response?.data?.detail &&
          typeof maybe.response.data.detail === "string"
            ? maybe.response.data.detail
            : typeof maybe.response?.data?.detail === "object"
            ? maybe.response.data.detail?.message || msg
            : maybe.message || msg;
      }
      notice.show({ title: "Create failed", message: msg, variant: "error" });
    }
  };

  const save = async () => {
    if (mode !== "edit" || !threadId) {
      onClose();
      return;
    }
    if (!user) {
      notice.show({
        title: "Sign in required",
        message: "You need to be logged in to edit a thread.",
        variant: "warning",
      });
      return;
    }

    const cleanTitle = stripMdHeading(title);
    const body = md.trim();
    if (!cleanTitle || !body) {
      notice.show({
        title: "Missing info",
        message: "Title and content are required.",
        variant: "warning",
      });
      return;
    }

    const idsFromMentions = extractIds(body);
    const merged = Array.from(new Set([...picked, ...idsFromMentions]));
    const series_ids =
      merged.length > MAX_SERIES_REFS
        ? merged.slice(0, MAX_SERIES_REFS)
        : merged;

    try {
      await updateForumThread(threadId, {
        title: cleanTitle,
        first_post_markdown: body,
        ...(series_ids.length > 0 ? { series_ids } : {}),
      });
      onSaved?.();
      onClose();
    } catch (e) {
      const msg =
        typeof e === "string"
          ? e
          : e instanceof Error
          ? e.message
          : "Failed to save changes";
      notice.show({ title: "Save failed", message: msg, variant: "error" });
    }
  };

  useEffect(() => setTitle(initialTitle), [initialTitle]);
  useEffect(() => setMd(initialMd), [initialMd]);

  const headerText = mode === "edit" ? "Update Thread" : "New Thread";
  const primaryText = mode === "edit" ? "Save" : "Create";
  const primaryOnClick = mode === "edit" ? save : create;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[1.75rem] bg-white p-4 shadow-xl sm:max-h-[calc(100vh-2rem)] sm:max-w-2xl sm:rounded-xl sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{headerText}</h2>
          <button onClick={onClose} className="text-gray-500">
            x
          </button>
        </div>

        {mode === "create" ? (
          <div className="text-xs text-gray-500 mb-2">
            {user
              ? `You can create ${remaining} more ${
                  remaining === 1 ? "thread" : "threads"
                } (max ${maxThreads}).`
              : "You must be logged in to create threads."}
          </div>
        ) : (
          <div className="text-xs text-gray-500 mb-2">
            Editing thread details.
          </div>
        )}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Thread title"
          className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2.5"
        />

        {/* body with @-mention support */}
        <div className="relative">
          <textarea
            ref={mdRef}
            value={md}
            onChange={onMdChange}
            onKeyDown={onMdKeyDown}
            placeholder="Say something (Markdown supported)... Tip: type @ to mention a series"
            className="h-36 w-full rounded-xl border border-slate-200 px-3 py-2.5 sm:h-40"
          />

          {mdMenuOpen && mdResults.length > 0 && (
            <div
              ref={mdMenuRef}
              className="absolute left-0 right-0 mt-1 z-40 max-h-60 overflow-auto rounded border bg-white shadow"
            >
              {mdResults.map((r, i) => (
                <button
                  key={r.series_id}
                  type="button"
                  onClick={() => {
                    const caret = mdRef.current?.selectionStart ?? md.length;
                    const hit = detectAtToken(md, caret);
                    const start = hit
                      ? hit.tokenStart
                      : mdMentionStart ?? caret;
                    const end = hit ? hit.tokenEnd : caret;
                    insertMdMention(r, start, end);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left ${
                    i === mdHighlight ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                  title={r.title || `#${r.series_id}`}
                >
                  {r.cover_url ? (
                    <img
                      src={r.cover_url}
                      alt={r.title || `Series #${r.series_id}`}
                      className="w-6 h-8 object-cover rounded"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-6 h-8 rounded bg-gray-200" />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm truncate">{r.title}</div>
                    <div className="text-[11px] text-gray-500">
                      #{r.series_id}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-1 text-[11px] text-gray-500">
          Mentions: {mdMentionCount}/{MAX_MENTIONS}
          {mdMentionCount >= MAX_MENTIONS && (
            <span className="ml-1 text-amber-700">Limit reached</span>
          )}
        </div>

        {/* "Reference series" section */}
        <div className="mt-3">
          <label className="text-sm font-medium">Reference series</label>
          <div className="text-xs text-gray-500 mb-1">
            You can add up to {MAX_SERIES_REFS} series.
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search series..."
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"
          />
          {results.length > 0 && (
            <div className="mt-2 max-h-40 overflow-auto border rounded p-2 space-y-1">
              {results.map((r) => (
                <button
                  key={r.series_id}
                  onClick={() => togglePick(r.series_id)}
                  className={`w-full text-left px-2 py-1 rounded ${
                    picked.includes(r.series_id)
                      ? "bg-blue-100"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {r.title}{" "}
                  <span className="text-xs text-gray-500">#{r.series_id}</span>
                </button>
              ))}
            </div>
          )}
          {picked.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {picked.map((id) => (
                <span
                  key={id}
                  className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full"
                >
                  #{id}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 sm:w-auto"
          >
            Cancel
          </button>
          <button
            onClick={primaryOnClick}
            className="w-full rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white sm:w-auto"
          >
            {primaryText}
          </button>
        </div>
      </div>

      {/* local notice host in modal context */}
      <NoticeModal
        open={notice.open}
        title={notice.title}
        message={notice.message}
        variant={notice.variant}
        onClose={notice.hide}
      />
    </div>
  );
}

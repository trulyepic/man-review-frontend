import { useEffect, useState } from "react";
import {
  listForumThreads,
  createForumThread,
  type ForumThread,
  type ForumSeriesRef,
  forumSeriesSearch,
  deleteForumThread,
} from "../api/manApi";
import { Link } from "react-router-dom";
import { useUser } from "../login/useUser";
import { Helmet } from "react-helmet";
import { stripMdHeading } from "../util/strings";

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

export default function ForumPage() {
  const [q, setQ] = useState("");
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [myThreadCount, setMyThreadCount] = useState(0);
  const { user } = useUser();

  const myName = user?.username || "";
  const isAdmin = (user?.role || "").toUpperCase() === "ADMIN";

  const siteUrl = "https://toonranks.com";
  const isSearching = !!q.trim();
  const canonical = `${siteUrl}/forum`;
  const pageTitle = isSearching
    ? `Forum search “${q.trim()}” — Toon Ranks`
    : "Forum — Toon Ranks";

  const load = async () => {
    const data = await listForumThreads(q);
    setThreads(promotePatchNotes(data.slice()));

    if (user) {
      const all = await listForumThreads("", 1, 1000);
      setMyThreadCount(all.filter((t) => t.author_username === myName).length);
    } else {
      setMyThreadCount(0);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, user?.username]);

  const onClickNewThread = () => {
    if (!user) {
      alert("You need to be logged in to create a thread.");
      return;
    }
    if (myThreadCount >= MAX_THREADS_PER_USER) {
      alert(
        `You've reached the limit of ${MAX_THREADS_PER_USER} threads.\n\nDelete one of your existing threads to create a new one.`
      );
      return;
    }
    setShowNew(true);
  };

  const onDeleteThread = async (t: ForumThread) => {
    const isOwner = t.author_username === myName;
    if (!(isAdmin || isOwner) || deletingId) return;

    const ok = window.confirm(
      `Delete the thread:\n\n“${t.title}”?\n\nThis will remove the original post and all replies.`
    );
    if (!ok) return;

    try {
      setDeletingId(t.id);
      await deleteForumThread(t.id);
      setThreads((prev) => prev.filter((x) => x.id !== t.id));
      if (isOwner) setMyThreadCount((c) => Math.max(0, c - 1));
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { detail?: string } };
        message?: string;
      };
      const msg =
        e?.response?.data?.detail || e?.message || "Failed to delete thread.";
      alert(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 relative bg-[radial-gradient(900px_260px_at_50%_-100px,rgba(99,102,241,0.10),transparent)]">
      <Helmet>
        <title>{pageTitle}</title>
        <link rel="canonical" href={canonical} />
        <meta
          name="description"
          content={
            isSearching
              ? `Search results for “${q.trim()}” in the Toon Ranks forum.`
              : "Community forum on Toon Ranks."
          }
        />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content="Join community discussions." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <meta
          property="og:image"
          content="https://toonranks.com/android-chrome-512x512.png"
        />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">Forum</h1>
        <button
          onClick={onClickNewThread}
          className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          + New Thread
        </button>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search threads…"
        className="w-full mb-4 border rounded px-3 py-2"
      />

      <ul className="space-y-3">
        {threads.map((t) => {
          const isOwner = t.author_username === myName;
          const canDelete = isAdmin || isOwner;
          const isPatchNotes =
            normalize(t.title) === normalize(PATCH_NOTES_TITLE);

          return (
            <li
              key={t.id}
              className="relative rounded-2xl p-4 border border-white/70 ring-1 ring-black/5 bg-white/40 backdrop-blur-md shadow-sm hover:shadow-md hover:bg-white/60 transition"
            >
              <Link
                to={`/forum/${t.id}`}
                className="text-lg font-semibold hover:underline"
              >
                {stripMdHeading(t.title)}
              </Link>

              <div className="flex flex-wrap items-center gap-2 mt-1">
                <div className="text-xs text-gray-500">
                  {t.post_count} posts · updated{" "}
                  {new Date(t.updated_at).toLocaleString()}
                  {t.author_username ? ` · by ${t.author_username}` : null}
                </div>

                {isPatchNotes && (
                  <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700">
                    📌 Pinned
                  </span>
                )}

                {t.locked && (
                  <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                    🔒 Locked
                  </span>
                )}
              </div>

              {t.series_refs?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {t.series_refs.map((s) => (
                    <SeriesRefPill key={s.series_id} s={s} />
                  ))}
                </div>
              ) : null}

              {canDelete && (
                <button
                  type="button"
                  title="Delete thread"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDeleteThread(t);
                  }}
                  disabled={deletingId === t.id}
                  className={`absolute top-2 right-2 inline-flex items-center gap-1 rounded px-2 py-1 text-xs border ${
                    deletingId === t.id
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                  }`}
                >
                  {deletingId === t.id ? "Deleting…" : "Delete"}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {showNew && (
        <NewThreadModal
          onClose={() => setShowNew(false)}
          onCreated={(thread) => {
            setShowNew(false);
            setThreads((prev) => [thread, ...prev]);
            setMyThreadCount((c) => c + 1);
          }}
          myThreadCount={myThreadCount}
          maxThreads={MAX_THREADS_PER_USER}
        />
      )}
    </div>
  );
}

function NewThreadModal({
  onClose,
  onCreated,
  myThreadCount,
  maxThreads,
}: {
  onClose: () => void;
  onCreated: (t: ForumThread) => void;
  myThreadCount: number;
  maxThreads: number;
}) {
  const { user } = useUser();
  const [title, setTitle] = useState("");
  const [md, setMd] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ForumSeriesRef[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const remaining = Math.max(0, maxThreads - myThreadCount);

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
        alert(`You can reference up to ${MAX_SERIES_REFS} series only.`);
        return p;
      }
      return [...p, id];
    });
  };

  const create = async () => {
    if (!user) {
      alert("You need to be logged in to create a thread.");
      return;
    }
    if (myThreadCount >= maxThreads) {
      alert(
        `You've reached the limit of ${maxThreads} threads.\n\nDelete one of your existing threads to create a new one.`
      );
      return;
    }
    if (!title.trim() || !md.trim()) {
      alert("Title and content are required.");
      return;
    }

    const cleanTitle = stripMdHeading(title);
    try {
      const t = await createForumThread({
        title: cleanTitle,
        first_post_markdown: md,
        series_ids: picked,
      });
      onCreated(t);
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
      alert(msg);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">New Thread</h2>
          <button onClick={onClose} className="text-gray-500">
            ✕
          </button>
        </div>

        <div className="text-xs text-gray-500 mb-2">
          {user
            ? `You can create ${remaining} more ${
                remaining === 1 ? "thread" : "threads"
              } (max ${maxThreads}).`
            : "You must be logged in to create threads."}
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Thread title"
          className="w-full border rounded px-3 py-2 mb-3"
        />
        <textarea
          value={md}
          onChange={(e) => setMd(e.target.value)}
          placeholder="Say something (Markdown supported)…"
          className="w-full border rounded px-3 py-2 h-40"
        />

        <div className="mt-3">
          <label className="text-sm font-medium">Reference series</label>
          <div className="text-xs text-gray-500 mb-1">
            You can add up to {MAX_SERIES_REFS} series.
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search series…"
            className="w-full border rounded px-3 py-2 mt-1"
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

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded border">
            Cancel
          </button>
          <button
            onClick={create}
            className="px-3 py-1.5 rounded bg-blue-600 text-white"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

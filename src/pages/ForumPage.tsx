import { useEffect, useRef, useState } from "react";
import {
  listForumThreads,
  createForumThread,
  type ForumThread,
  type ForumSeriesRef,
  forumSeriesSearch,
  deleteForumThread,
  getForumThread,
  updateForumThread,
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
  const [editingThread, setEditingThread] = useState<ForumThread | null>(null); // <-- NEW
  const [editingBody, setEditingBody] = useState<string>("");
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
                <div className="absolute top-2 right-2 flex items-center gap-2">
                  <button
                    type="button"
                    title="Edit thread"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditingThread(t); // <-- OPEN EDIT MODE
                      setEditingBody("");
                      (async () => {
                        try {
                          const data = await getForumThread(t.id);
                          setEditingBody(
                            data.posts?.[0]?.content_markdown ?? ""
                          );
                        } catch {
                          // leave empty if fetch fails
                        }
                      })();
                    }}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs border hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    title="Delete thread"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDeleteThread(t);
                    }}
                    disabled={deletingId === t.id}
                    className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs border ${
                      deletingId === t.id
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                    }`}
                  >
                    {deletingId === t.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* CREATE */}
      {showNew && (
        <NewThreadModal
          mode="create"
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

      {/* EDIT (UI ONLY FOR NOW) */}
      {editingThread && (
        <NewThreadModal
          mode="edit"
          threadId={editingThread.id}
          initialTitle={editingThread.title}
          initialMd={editingBody}
          onClose={() => setEditingThread(null)}
          onSaved={async () => {
            {
              /* <-- refresh list after save */
            }
            await load();
            setEditingThread(null);
          }}
          myThreadCount={myThreadCount}
          maxThreads={MAX_THREADS_PER_USER}
        />
      )}
    </div>
  );
}

/**
 * NewThreadModal now supports mode: "create" | "edit"
 * - "create": title = "New Thread", primary = "Create" (calls createForumThread)
 * - "edit":   title = "Update Thread", primary = "Save" (closes modal for now)
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
  const [title, setTitle] = useState(initialTitle); // <-- seeded
  const [md, setMd] = useState(initialMd); // <-- seeded

  // existing series picker state (unchanged)
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

  const MAX_MENTIONS = MAX_SERIES_REFS; // 10

  // util: extract ids from "(series:123)"
  const extractIds = (text: string) =>
    Array.from(text.matchAll(/\(series:(\d+)\)/g)).map((m) => Number(m[1]));

  // util: detect @token around caret
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
    // only block if this is a *new* id and we’re already at the cap
    if (
      !uniqueIds.includes(chosen.series_id) &&
      uniqueIds.length >= MAX_MENTIONS
    ) {
      alert(`You can mention up to ${MAX_MENTIONS} series.`);
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
      const newPos = (before + inserted).length;
      mdRef.current?.setSelectionRange(newPos, newPos);
    });
  }

  const onMdChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    setMd(next);

    const caret = e.target.selectionStart ?? next.length;
    const hit = detectAtToken(next, caret);

    // NEW: keep a live unique count
    const currentCount = new Set(extractIds(next)).size;
    setMdMentionCount(currentCount);

    // NEW: one-time heads-up when the user reaches the cap
    if (currentCount >= MAX_MENTIONS && !mdCapShown) {
      setMdCapShown(true);
      alert(
        `You've reached the limit of ${MAX_MENTIONS} series mentions in the post body.`
      );
    }
    if (currentCount < MAX_MENTIONS && mdCapShown) {
      // allow another alert after the user drops below the cap and hits it again
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

  // close mention menu when clicking outside
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
  // --- end @mention support ---

  // existing search for the separate "Reference series" picker (unchanged)
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

  // CREATE handler (unchanged)
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

    // merge explicit picks + ids found in body mentions
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
      alert(msg);
    }
  };

  // EDIT handler
  const save = async () => {
    if (mode !== "edit" || !threadId) {
      onClose();
      return;
    }
    if (!user) {
      alert("You need to be logged in to edit a thread.");
      return;
    }

    const cleanTitle = stripMdHeading(title);
    const body = md.trim();
    if (!cleanTitle || !body) {
      alert("Title and content are required.");
      return;
    }

    // Collect series refs from body mentions + explicit picks
    const idsFromMentions = extractIds(body);
    const merged = Array.from(new Set([...picked, ...idsFromMentions]));
    const series_ids =
      merged.length > MAX_SERIES_REFS
        ? merged.slice(0, MAX_SERIES_REFS)
        : merged;

    try {
      // Only include series_ids if user referenced anything;
      // avoids wiping existing header refs when they didn’t touch them.
      await updateForumThread(threadId, {
        title: cleanTitle,
        first_post_markdown: body,
        ...(series_ids.length > 0 ? { series_ids } : {}),
      });

      onSaved?.(); // parent reloads list
      onClose();
    } catch (e) {
      const msg =
        typeof e === "string"
          ? e
          : e instanceof Error
          ? e.message
          : "Failed to save changes";
      alert(msg);
    }
  };

  // sync when props change (e.g., after getForumThread resolves)
  useEffect(() => setTitle(initialTitle), [initialTitle]);
  useEffect(() => setMd(initialMd), [initialMd]);

  const headerText = mode === "edit" ? "Update Thread" : "New Thread";
  const primaryText = mode === "edit" ? "Save" : "Create";
  const primaryOnClick = mode === "edit" ? save : create;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{headerText}</h2>
          <button onClick={onClose} className="text-gray-500">
            ✕
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
          className="w-full border rounded px-3 py-2 mb-3"
        />

        {/* body with @-mention support */}
        <div className="relative">
          <textarea
            ref={mdRef}
            value={md}
            onChange={onMdChange}
            onKeyDown={onMdKeyDown}
            placeholder="Say something (Markdown supported)…  Tip: type @ to mention a series"
            className="w-full border rounded px-3 py-2 h-40"
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
          {mode === "edit" && (
            <span className="ml-2 text-red-600 font-medium">
              {/* Heads-up: you’ll need to re-reference any series/titles in this
              post. */}
            </span>
          )}
        </div>

        {/* existing “Reference series” section (unchanged UI/logic) */}
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
            onClick={primaryOnClick}
            className="px-3 py-1.5 rounded bg-blue-600 text-white"
          >
            {primaryText}
          </button>
        </div>
      </div>
    </div>
  );
}

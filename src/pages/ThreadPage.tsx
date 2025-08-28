import { useEffect, useState, type CSSProperties } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import {
  getForumThread,
  createForumPost,
  deleteForumPost, // ⬅️ import
  type ForumPost,
  deleteMyForumPost,
  type ForumSeriesRef,
  type ForumThread,
  lockForumThread,
  updateForumThreadSettings,
} from "../api/manApi";
import { useUser } from "../login/useUser";

// Markdown renderer (safe wrapper defined below)
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { Helmet } from "react-helmet";
import { stripMdHeading } from "../util/strings";
import RichReplyEditor from "../components/RichReplyEditor";

// ---------- Small Markdown wrapper (fixes TS error) ----------
// function MarkdownProse({
//   children,
//   className,
//   size = "base",
// }: {
//   children: string;
//   className?: string;
//   size?: "base" | "sm";
// }) {
//   return (
//     <div
//       className={`${size === "sm" ? "prose prose-sm" : "prose"} max-w-none ${
//         className || ""
//       }`}
//     >
//       <ReactMarkdown
//         // pass only supported props; style via the surrounding <div>
//         remarkPlugins={[remarkGfm, remarkBreaks]}
//         components={{
//           a: ({ children, ...props }) => (
//             <a {...props} target="_blank" rel="noreferrer">
//               {children}
//             </a>
//           ),
//         }}
//       >
//         {children}
//       </ReactMarkdown>
//     </div>
//   );
// }

type AxiosLike = {
  message?: string;
  response?: { data?: { detail?: unknown } };
};

function getErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;

  if (err && typeof err === "object") {
    const e = err as AxiosLike;
    const detail = e.response?.data?.detail;

    if (typeof detail === "string") return detail;
    if (detail && typeof detail === "object" && "message" in detail) {
      const msg = (detail as { message?: string }).message;
      if (typeof msg === "string") return msg;
    }
    if (e.message) return e.message;
  }
  return "An error occurred.";
}

function MarkdownProse({
  children,
  className,
  size = "base",
}: {
  children: string;
  className?: string;
  size?: "base" | "sm";
}) {
  const headingBase =
    size === "sm" ? "mt-2 mb-1 font-semibold" : "mt-3 mb-2 font-semibold";
  const h1 = size === "sm" ? "text-lg" : "text-2xl";
  const h2 = size === "sm" ? "text-base" : "text-xl";
  const h3 = size === "sm" ? "text-sm" : "text-lg";

  return (
    <div
      className={`${size === "sm" ? "prose prose-sm" : "prose"} max-w-none ${
        className || ""
      }`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: (props) => <h1 className={`${headingBase} ${h1}`} {...props} />,
          h2: (props) => <h2 className={`${headingBase} ${h2}`} {...props} />,
          h3: (props) => <h3 className={`${headingBase} ${h3}`} {...props} />,
          a: ({ children, href, ...props }) => {
            if (href && href.startsWith("series:")) {
              const id = href.slice("series:".length);
              return (
                <Link
                  to={`/series/${id}`}
                  className="inline-flex items-center max-w-full gap-1 rounded-full px-2 py-0.5 text-xs bg-blue-50 text-blue-700 no-underline align-middle"
                  title={`Series #${id}`}
                >
                  <span className="truncate">{children}</span>
                  <span className="opacity-60">#{id}</span>
                </Link>
              );
            }
            return (
              <a {...props} href={href} target="_blank" rel="noreferrer">
                {children}
              </a>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export default function ThreadPage() {
  const { id } = useParams();
  const threadId = Number(id);
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const { user } = useUser();
  const isAdmin = (user?.role || "").toUpperCase() === "ADMIN"; // ⬅️ admin flag

  const loc = useLocation();
  const siteUrl = "https://toonranks.com";

  // Helpers for SEO
  const threadTitle = thread?.title
    ? `${thread.title} — Forum — Toon Ranks`
    : "Forum thread — Toon Ranks";

  // Canonical should be the clean path /forum/:id
  const canonical = `${siteUrl}${loc.pathname.replace(/\/+$/, "")}`;

  // Make a short description from the original post (strip newlines/markdown-ish chars)
  const raw = posts[0]?.content_markdown || "";
  const desc = raw
    .replace(/[#*_`>]+/g, "") // basic markdown chars
    .replace(/\s+/g, " ") // collapse whitespace
    .trim()
    .slice(0, 155); // SEO-friendly length

  const load = async () => {
    const data = await getForumThread(threadId);
    setThread(data.thread);
    setPosts(data.posts);
    console.log(data.posts.map((p) => ({ id: p.id, parent_id: p.parent_id })));
  };

  useEffect(() => {
    load();
  }, [threadId]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* SEO */}
      <Helmet>
        <title>{threadTitle}</title>
        <link rel="canonical" href={canonical} />
        <meta
          name="description"
          content={desc || "Read and reply to this Toon Ranks forum thread."}
        />
        <meta property="og:title" content={thread?.title || "Forum thread"} />
        <meta
          property="og:description"
          content={desc || "Join the discussion on Toon Ranks."}
        />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        <meta
          property="og:image"
          content="https://toonranks.com/android-chrome-512x512.png"
        />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      {thread && (
        <header className="mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              {stripMdHeading(thread.title)}
            </h1>

            {/* Visible to everyone */}
            {thread.locked && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                🔒 Locked
              </span>
            )}
            {thread.latest_first && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                ⬆️ Latest updates first
              </span>
            )}

            {/* Admin-only lock/unlock button */}
            {isAdmin && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const next = !thread.locked;
                    await lockForumThread(thread.id, next);
                    setThread((t) => (t ? { ...t, locked: next } : t));
                  } catch (err) {
                    const msg =
                      (err as { message?: string })?.message ||
                      "Failed to toggle lock.";
                    alert(msg);
                  }
                }}
                className={`text-xs rounded px-2 py-1 border ${
                  thread.locked
                    ? "bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800"
                    : "bg-gray-50 hover:bg-gray-100 border-gray-300 text-gray-700"
                }`}
                title={thread.locked ? "Unlock thread" : "Lock thread"}
              >
                {thread.locked ? "Unlock" : "Lock"}
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const next = !thread.latest_first;
                    await updateForumThreadSettings(thread.id, {
                      latest_first: next,
                    });
                    setThread((t) => (t ? { ...t, latest_first: next } : t));
                  } catch (err) {
                    const msg =
                      (err as { message?: string })?.message ||
                      "Failed to update ordering.";
                    alert(msg);
                  }
                }}
                className={`text-xs rounded px-2 py-1 border ${
                  thread.latest_first
                    ? "bg-indigo-50 hover:bg-indigo-100 border-indigo-300 text-indigo-800"
                    : "bg-gray-50 hover:bg-gray-100 border-gray-300 text-gray-700"
                }`}
                title={
                  thread.latest_first
                    ? "Show oldest updates first"
                    : "Show latest updates first"
                }
              >
                {thread.latest_first ? "Oldest first" : "Latest first"}
              </button>
            )}
          </div>

          {thread.series_refs?.length ? (
            <div className="mt-2 flex flex-wrap gap-3">
              {thread.series_refs.map((s) => (
                <Link
                  key={s.series_id}
                  to={`/series/${s.series_id}`}
                  className="w-16 text-center"
                  title={s.title || `#${s.series_id}`}
                >
                  {s.cover_url ? (
                    <img
                      src={s.cover_url}
                      alt={s.title || `Series #${s.series_id}`}
                      className="w-16 h-24 object-cover rounded shadow"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-16 h-24 bg-gray-200 rounded" />
                  )}
                  <div className="text-[10px] mt-1 truncate">
                    {s.title || `#${s.series_id}`}
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </header>
      )}

      <section className="space-y-4">
        {/* Original Post */}
        {posts[0] && (
          <article className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                Original post
              </span>
              <span>• {posts[0].author_username || "Anonymous"}</span>
              <span>• {new Date(posts[0].created_at).toLocaleString()}</span>
            </div>

            {/* ⬇️ Markdown viewer */}
            <MarkdownProse>{posts[0].content_markdown}</MarkdownProse>

            {posts[0].series_refs?.length ? (
              <div className="mt-3 flex flex-wrap gap-3">
                {posts[0].series_refs.map((s) => (
                  <Link
                    key={s.series_id}
                    to={`/series/${s.series_id}`}
                    className="w-20 text-center"
                    title={s.title || `#${s.series_id}`}
                  >
                    {s.cover_url ? (
                      <img
                        src={s.cover_url}
                        alt={s.title || `Series #${s.series_id}`}
                        className="w-20 h-28 object-cover rounded shadow"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-20 h-28 bg-gray-200 rounded" />
                    )}
                    <div className="text-[11px] mt-1 truncate">
                      {s.title || `#${s.series_id}`}
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}
          </article>
        )}

        {/* Replies */}
        {(() => {
          const byParent: Record<number, ForumPost[]> = {};
          posts.slice(1).forEach((p) => {
            const pid = p.parent_id && p.parent_id > 0 ? p.parent_id : 0;
            (byParent[pid] ||= []).push(p);
          });

          // const topLevel = (byParent[0] || []).sort(
          //   (a, b) =>
          //     new Date(a.created_at).getTime() -
          //     new Date(b.created_at).getTime()
          // );
          const topLevel = (byParent[0] || []).sort((a, b) => {
            const ta = new Date(a.created_at).getTime();
            const tb = new Date(b.created_at).getTime();
            // If latest_first is true, newest first (desc). Otherwise oldest first (asc).
            return thread?.latest_first ? tb - ta : ta - tb;
          });

          const reload = async () => {
            const data = await getForumThread(threadId);
            setThread(data.thread);
            setPosts(data.posts);
          };

          return (
            <>
              {topLevel.map((p, idx) => (
                <ReplyBranch
                  key={p.id}
                  post={p}
                  depth={0}
                  topIndex={idx + 1}
                  byParent={byParent}
                  threadId={threadId}
                  reload={reload}
                  isAdmin={isAdmin}
                  currentUsername={user?.username || null}
                  locked={!!thread?.locked}
                  isUpdatesMode={!!thread?.latest_first}
                />
              ))}
            </>
          );
        })()}
      </section>

      {/* Top-level reply uses the Rich editor */}
      <div className="mt-6 border rounded-lg p-4">
        <h3 className="font-semibold mb-2">
          {thread?.latest_first ? "Add Update" : "Reply"}
        </h3>

        {!thread?.locked || isAdmin ? (
          <RichReplyEditor
            compact={false}
            onSubmit={async (content, seriesIds) => {
              if (!user) {
                alert("You need to be logged in to post a reply.");
                return;
              }
              const trimmed = content.trim();
              if (!trimmed) {
                alert("Reply cannot be empty.");
                return;
              }
              try {
                const p = await createForumPost(threadId, {
                  content_markdown: trimmed,
                  series_ids: seriesIds,
                });
                setPosts((prev) => [...prev, p]);
              } catch (err: unknown) {
                alert(getErrorMessage(err) || "Failed to post reply.");
              }
            }}
          />
        ) : (
          <div className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded">
            🔒 This thread is locked. Only admins can add new replies.
          </div>
        )}
      </div>
    </div>
  );
}

function ReplyBranch({
  post,
  depth,
  topIndex,
  byParent,
  threadId,
  reload,
  isAdmin,
  currentUsername,
  locked,
  isUpdatesMode,
}: {
  post: ForumPost;
  depth: number;
  topIndex: number;
  byParent: Record<number, ForumPost[]>;
  threadId: number;
  reload: () => Promise<void>;
  isAdmin: boolean;
  currentUsername: string | null;
  locked: boolean;
  isUpdatesMode: boolean;
}) {
  const railColors = [
    "#3b82f6", // blue-500
    "#93c5fd", // blue-300
    "#a5b4fc", // indigo-300
    "#c4b5fd", // violet-300
    "#d8b4fe", // purple-300
    "#f0abfc", // fuchsia-300
  ];

  function lightenHex(hex: string, amount = 0.35) {
    const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!m) return hex;
    const toInt = (s: string) => parseInt(s, 16);
    const [, r, g, b] = m;
    const lr = Math.round(toInt(r) + (255 - toInt(r)) * amount);
    const lg = Math.round(toInt(g) + (255 - toInt(g)) * amount);
    const lb = Math.round(toInt(b) + (255 - toInt(b)) * amount);
    return `rgb(${lr}, ${lg}, ${lb})`;
  }

  const rail = railColors[Math.min(depth, railColors.length - 1)];
  const labelBg = lightenHex(rail, 0.73); // control reply label bg color lightness

  const labelStyle: CSSProperties = {
    backgroundColor: labelBg,
    color: "#0f172a", // slate-900 for readable text on light bg
  };

  const isTopLevel = depth === 0;
  const indentPx = Math.min(depth, 6) * 16;
  const labelText = isTopLevel
    ? isUpdatesMode
      ? `Update #${topIndex}`
      : `Reply #${topIndex}`
    : isUpdatesMode
    ? `↳ Comment on Update #${topIndex}`
    : `↳ Reply to ${
        post.author_username ? `@${post.author_username} ` : ""
      }#${topIndex}`;

  const children = (byParent[post.id] || []).sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const canDelete =
    isAdmin ||
    (!!currentUsername && currentUsername === (post.author_username || null));

  const handleDelete = async () => {
    if (!canDelete) return;
    if (!window.confirm("Delete this post (and its replies)?")) return;
    try {
      if (isAdmin) {
        await deleteForumPost(threadId, post.id); // admin endpoint
      } else {
        await deleteMyForumPost(threadId, post.id); // owner endpoint
      }
      await reload();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ||
        (err as Error)?.message ||
        "Failed to delete post.";
      alert(msg);
    }
  };

  return (
    <div>
      <article
        className={
          (isTopLevel
            ? "rounded-lg p-4 border border-gray-200 shadow-sm bg-gray-50"
            : "rounded-lg p-3 border border-gray-200 shadow-sm bg-white") + ""
        }
        style={{
          marginLeft: indentPx,
          marginTop: 6,
          borderLeftWidth: 4,
          borderLeftStyle: "solid",
          borderLeftColor: rail,
        }}
      >
        <div
          className={
            isTopLevel
              ? "flex flex-wrap items-center gap-2 text-xs text-gray-600 mb-2"
              : "flex flex-wrap items-center gap-2 text-[11px] text-gray-600 mb-1"
          }
        >
          <span
            className={
              isTopLevel
                ? "inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold"
                : "inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold"
            }
            style={labelStyle}
          >
            {labelText}
          </span>
          <span>• {post.author_username || "Anonymous"}</span>
          <span>• {new Date(post.created_at).toLocaleString()}</span>
        </div>

        {/* ⬇️ Markdown viewer for replies */}
        <MarkdownProse size={isTopLevel ? "base" : "sm"}>
          {post.content_markdown}
        </MarkdownProse>

        {post.series_refs?.length ? (
          <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3">
            {post.series_refs.map((s) => (
              <SeriesMiniCard key={s.series_id} s={s} />
            ))}
          </div>
        ) : null}

        {/* Actions */}
        <div className="mt-3 flex items-center gap-3">
          {/* In updates mode, no inline reply/comment UI at all */}
          {!isUpdatesMode ? (
            !locked || isAdmin ? (
              <details>
                <summary className="cursor-pointer text-xs text-blue-600 hover:underline">
                  Reply to this reply
                </summary>
                <div className="mt-2">
                  <RichReplyEditor
                    compact
                    onSubmit={async (content, seriesIds) => {
                      if (!content.trim()) {
                        alert("Reply cannot be empty.");
                        return;
                      }
                      try {
                        await createForumPost(threadId, {
                          content_markdown: content.trim(),
                          series_ids: seriesIds,
                          parent_id: post.id,
                        });
                        await reload();
                      } catch (err: unknown) {
                        alert(getErrorMessage(err) || "Failed to post reply.");
                      }
                    }}
                  />
                </div>
              </details>
            ) : (
              <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                🔒 Thread is locked — replies are disabled.
              </span>
            )
          ) : null}

          {canDelete && (
            <button
              onClick={handleDelete}
              className="text-xs text-red-600 hover:underline"
              title={isAdmin ? "Admin delete" : "Delete your post"}
            >
              Delete
            </button>
          )}
        </div>
      </article>

      {children.map((child) => (
        <ReplyBranch
          key={child.id}
          post={child}
          depth={depth + 1}
          topIndex={topIndex}
          byParent={byParent}
          threadId={threadId}
          reload={reload}
          isAdmin={isAdmin} // keep passing down
          currentUsername={currentUsername}
          locked={locked}
          isUpdatesMode={isUpdatesMode}
        />
      ))}
    </div>
  );
}

// /** -----------------------------------------------------------------------
//  * RichReplyEditor
//  * - Simple textarea with Bold/Italic buttons that wrap the current selection
//  * - Inline series autocomplete (search + toggle pick + chips)
//  * - Calls onSubmit(content, seriesIds)
//  * ---------------------------------------------------------------------- */
// function RichReplyEditor({
//   onSubmit,
//   compact = false,
//   initial = "",
// }: {
//   onSubmit: (content: string, seriesIds: number[]) => Promise<void> | void;
//   compact?: boolean;
//   initial?: string;
// }) {
//   const { user } = useUser();
//   const [value, setValue] = useState(initial);
//   const [query, setQuery] = useState("");
//   const [results, setResults] = useState<ForumSeriesRef[]>([]);
//   const [picked, setPicked] = useState<number[]>([]);
//   const taRef = useRef<HTMLTextAreaElement | null>(null);

//   // tiny helper: wrap current selection with tokens (e.g., **bold**)
//   const wrapSelection = (left: string, right = left) => {
//     const el = taRef.current;
//     if (!el) return;
//     const start = el.selectionStart ?? 0;
//     const end = el.selectionEnd ?? 0;
//     const before = value.slice(0, start);
//     const sel = value.slice(start, end);
//     const after = value.slice(end);
//     const next = `${before}${left}${sel}${right}${after}`;
//     setValue(next);
//     queueMicrotask(() => {
//       el.focus();
//       const cursorStart = start + left.length;
//       el.setSelectionRange(cursorStart, cursorStart + sel.length);
//     });
//   };

//   // inline series search
//   useEffect(() => {
//     let alive = true;
//     (async () => {
//       if (!query.trim()) {
//         setResults([]);
//         return;
//       }
//       try {
//         const r = await forumSeriesSearch(query.trim());
//         if (alive) setResults(r);
//       } catch {
//         /* ignore */
//       }
//     })();
//     return () => {
//       alive = false;
//     };
//   }, [query]);

//   const togglePick = (id: number) =>
//     setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

//   const handlePost = async () => {
//     if (!user) {
//       alert("You need to be logged in to post a reply.");
//       return;
//     }
//     await onSubmit(value, picked);
//     // clear after successful submit
//     setValue("");
//     setQuery("");
//     setResults([]);
//     setPicked([]);
//   };

//   return (
//     <div className={`rounded ${compact ? "bg-gray-50" : "bg-white"}`}>
//       {/* toolbar */}
//       <div className="flex items-center gap-2 mb-2 text-sm">
//         <button
//           type="button"
//           className="px-2 py-1 rounded border hover:bg-gray-50"
//           onClick={() => wrapSelection("**")}
//           title="Bold (**text**)"
//         >
//           B
//         </button>
//         <button
//           type="button"
//           className="px-2 py-1 rounded border hover:bg-gray-50 italic"
//           onClick={() => wrapSelection("*")}
//           title="Italic (*text*)"
//         >
//           I
//         </button>
//         <span className="ml-2 text-xs text-gray-500">
//           Markdown supported (bold, italic, links…)
//         </span>
//       </div>

//       <textarea
//         ref={taRef}
//         value={value}
//         onChange={(e) => setValue(e.target.value)}
//         placeholder="Write a reply…"
//         className="w-full border rounded px-3 py-2 h-28"
//       />

//       {/* inline series autocomplete */}
//       <div className="mt-2">
//         <input
//           value={query}
//           onChange={(e) => setQuery(e.target.value)}
//           placeholder="Search series to reference…"
//           className="w-full border rounded px-3 py-2"
//         />
//         {results.length > 0 && (
//           <div className="mt-2 max-h-36 overflow-auto border rounded p-2 space-y-1 bg-white">
//             {results.map((r) => (
//               <button
//                 key={r.series_id}
//                 onClick={() => togglePick(r.series_id)}
//                 className={`w-full text-left px-2 py-1 rounded ${
//                   picked.includes(r.series_id)
//                     ? "bg-blue-100"
//                     : "hover:bg-gray-100"
//                 }`}
//                 title={r.title || `#${r.series_id}`}
//               >
//                 {r.title}{" "}
//                 <span className="text-xs text-gray-500">#{r.series_id}</span>
//               </button>
//             ))}
//           </div>
//         )}
//         {picked.length > 0 && (
//           <div className="mt-2 flex flex-wrap gap-2">
//             {picked.map((id) => (
//               <span
//                 key={id}
//                 className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full"
//               >
//                 #{id}
//               </span>
//             ))}
//           </div>
//         )}
//       </div>

//       <div className="mt-3 flex justify-end">
//         <button
//           onClick={handlePost}
//           className="px-3 py-1.5 rounded bg-blue-600 text-white"
//         >
//           Post Reply
//         </button>
//       </div>
//     </div>
//   );
// }

function SeriesMiniCard({ s }: { s: ForumSeriesRef }) {
  // Optional: color coding for status
  const statusClasses: Record<string, string> = {
    ONGOING: "bg-emerald-100 text-emerald-700",
    COMPLETE: "bg-slate-200 text-slate-800",
    HIATUS: "bg-amber-100 text-amber-800",
    UNKNOWN: "bg-gray-100 text-gray-700",
  };
  const statusKey = (s.status || "").toUpperCase();
  const statusClass = statusClasses[statusKey] || "bg-gray-100 text-gray-700";

  return (
    <Link
      to={`/series/${s.series_id}`}
      className="group border rounded-lg p-2 flex items-start gap-3 bg-white hover:shadow w-full"
      title={s.title || `#${s.series_id}`}
    >
      {s.cover_url ? (
        <img
          src={s.cover_url}
          alt={s.title || `Series #${s.series_id}`}
          className="w-12 h-16 object-cover rounded bg-gray-200 shrink-0"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="w-12 h-16 rounded bg-gray-200 shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {s.title || `#${s.series_id}`}
        </div>

        {/* chips that never overflow */}
        <div className="mt-1 flex flex-wrap gap-1">
          {s.type && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
              {s.type}
            </span>
          )}
          {s.status && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded ${statusClass}`}
            >
              {s.status.charAt(0) + s.status.slice(1).toLowerCase()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
